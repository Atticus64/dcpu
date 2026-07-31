import { Router } from "@oak/oak";
import { cleanupCSession, compileCToExe, SESSION_TIMEOUT_MS } from "../sandbox/c.ts";
import { log } from "../lib/logger.ts";

const cSessionRouter = new Router();

const encoder = new TextEncoder();

interface SocketMsg {
  type: string;
  code?: string;
  data?: string;
}

cSessionRouter.get("/ws", (ctx) => {
  const socket = ctx.upgrade();

  let session: Awaited<ReturnType<typeof compileCToExe>> | null = null;
  let cleanedUp = false;
  let stdinWriter: WritableStreamDefaultWriter<Uint8Array> | null = null;
  let watchdog: ReturnType<typeof setTimeout> | null = null;
  const pipes: Promise<void>[] = [];

  const send = (msg: Record<string, unknown>) => {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify(msg));
    }
  };

  const cleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (watchdog) clearTimeout(watchdog);
    if (session) await cleanupCSession(session);
    stdinWriter = null;
    session = null;
  };

  const close = async (code = 1000) => {
    await cleanup();
    if (socket.readyState === socket.OPEN) {
      socket.close(code);
    }
  };

  const pipeOutput = (stream: ReadableStream<Uint8Array>, source: "stdout" | "stderr") => {
    pipes.push(
      stream
        .pipeThrough(new TextDecoderStream())
        .pipeTo(new WritableStream({
          write(chunk) {
            send({ type: "output", stream: source, data: chunk });
          },
        }))
        .catch(async () => {
          await cleanup();
        }),
    );
  };

  socket.onmessage = async (event: MessageEvent) => {
    if (typeof event.data !== "string") return;

    let msg: SocketMsg;
    try {
      msg = JSON.parse(event.data) as SocketMsg;
    } catch {
      return;
    }

    if (msg.type === "compile" && !session) {
      if (typeof msg.code !== "string") {
        send({ type: "error", message: "Missing 'code'" });
        await close(4000);
        return;
      }

      try {
        session = await compileCToExe(msg.code);
      } catch (err) {
        log.warn(`C session compile failed: ${err}`);
        send({ type: "error", message: err instanceof Error ? err.message : "Compilation failed" });
        await close(4000);
        return;
      }

      send({ type: "ready" });

      const proc = session.proc;
      pipeOutput(proc.stdout, "stdout");
      pipeOutput(proc.stderr, "stderr");

      stdinWriter = proc.stdin.getWriter();

      watchdog = setTimeout(() => {
        log.warn("C session watchdog: killing process after timeout");
        send({ type: "error", message: "Program timed out" });
        void close(4000);
      }, SESSION_TIMEOUT_MS);

      proc.status.then(async (status) => {
        if (watchdog) clearTimeout(watchdog);
        try {
          await stdinWriter?.close();
        } catch {
          // stdin may already be closed
        }
        await Promise.all(pipes).catch(() => {});
        send({ type: "exit", code: status.code });
        await close(1000);
      });
    } else if (msg.type === "input" && stdinWriter && typeof msg.data === "string") {
      try {
        await stdinWriter.ready;
        await stdinWriter.write(encoder.encode(msg.data));
      } catch {
        // process may have exited
      }
    }
  };

  socket.onerror = () => {
    void cleanup();
  };

  socket.onclose = () => {
    void cleanup();
  };
});

export { cSessionRouter };

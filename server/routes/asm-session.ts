import { Router } from "@oak/oak";
import {
  compileAndRunAsmCaptured,
  isAsmHeadlessAvailable,
  ASM_SESSION_TIMEOUT_MS,
} from "../sandbox/assembly.ts";
import { log } from "../lib/logger.ts";

const asmSessionRouter = new Router();

interface SocketMsg {
  type: string;
  code?: string;
  data?: string;
}

asmSessionRouter.get("/ws", (ctx) => {
  const socket = ctx.upgrade();
  let cleanedUp = false;

  const send = (msg: Record<string, unknown>) => {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify(msg));
    }
  };

  const cleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
  };

  const close = async (code = 1000) => {
    await cleanup();
    if (socket.readyState === socket.OPEN) {
      socket.close(code);
    }
  };

  socket.onmessage = async (event: MessageEvent) => {
    if (typeof event.data !== "string") return;
    let msg: SocketMsg;
    try {
      msg = JSON.parse(event.data) as SocketMsg;
    } catch {
      return;
    }

    const isRun = msg.type === "compile" || msg.type === "run";
    if (isRun) {
      if (typeof msg.code !== "string") {
        send({ type: "error", message: "Missing 'code'" });
        await close(4000);
        return;
      }
      // js-dos 100% cliente: indicar fallback inmediato para que el frontend use js-dos
      // Sin esperar DOSBox headless (evita timeout 10s). Si ENABLE_DOSBOX_HEADLESS=1 y headless disponible, usar captura.
      if (!isAsmHeadlessAvailable()) {
        send({
          type: "error",
          message: "ASM headless disabled - use client js-dos (POST /api/compile/run -> exeBase64)",
          fallback: true,
        });
        await close(4000);
        return;
      }

      log.debug("ASM headless enabled via ENABLE_DOSBOX_HEADLESS=1 - running DOSBox capture");
      send({ type: "ready" });

      const watchdog = setTimeout(() => {
        log.warn("ASM session watchdog: timeout");
        send({ type: "error", message: "Program timed out" });
        void close(4000);
      }, ASM_SESSION_TIMEOUT_MS + 2000);

      try {
        const result = await compileAndRunAsmCaptured(msg.code);
        clearTimeout(watchdog);

        if (!result.success) {
          const message = result.error || result.stderr || "Execution failed";
          const isFallback = message.includes("DOSBox not available");
          send({ type: "error", message, fallback: isFallback });
          await close(4000);
          return;
        }

        if (result.stdout) {
          send({ type: "output", stream: "stdout", data: result.stdout });
        }
        if (result.stderr) {
          send({ type: "output", stream: "stderr", data: result.stderr });
        }
        send({ type: "exit", code: result.exitCode ?? 0 });
        await close(1000);
      } catch (err) {
        clearTimeout(watchdog);
        const message = err instanceof Error ? err.message : "Internal error";
        log.warn(`ASM WS error: ${message}`);
        send({ type: "error", message });
        await close(4000);
      }
    } else if (msg.type === "input") {
      send({ type: "error", message: "Input not supported for ASM (output-only mode)" });
    }
  };

  socket.onerror = () => {
    void cleanup();
  };
  socket.onclose = () => {
    void cleanup();
  };
});

// POST fallback for non-WS clients (simple run, output-only)
// js-dos 100% cliente: por defecto retorna fallback:true para que cliente use /api/compile/run (exeBase64 + js-dos)
asmSessionRouter.post("/run", async (ctx) => {
  const body = ctx.request.body;
  let payload: { code?: string };
  try {
    payload = (await body.json()) as { code?: string };
  } catch {
    ctx.response.status = 400;
    ctx.response.body = { success: false, error: "Invalid JSON" };
    return;
  }
  const code = payload.code;
  if (!code) {
    ctx.response.status = 400;
    ctx.response.body = { success: false, error: "Missing 'code'" };
    return;
  }

  if (!isAsmHeadlessAvailable()) {
    ctx.response.status = 501;
    ctx.response.body = {
      success: false,
      stdout: "",
      stderr: "",
      exitCode: null,
      error: "ASM headless disabled - use client js-dos (POST /api/compile/run -> exeBase64).",
      fallback: true,
    };
    return;
  }

  try {
    const result = await compileAndRunAsmCaptured(code);
    ctx.response.body = {
      success: result.success,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      error: result.error,
    };
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      stdout: "",
      stderr: "",
      exitCode: null,
      error: err instanceof Error ? err.message : "Internal error",
    };
  }
});

asmSessionRouter.get("/capabilities", (ctx) => {
  ctx.response.body = {
    headless: isAsmHeadlessAvailable(),
    timeoutMs: ASM_SESSION_TIMEOUT_MS,
  };
});

export { asmSessionRouter };

export type AsmSessionMessage =
  | { type: "output"; stream: "stdout" | "stderr"; data: string }
  | { type: "ready" }
  | { type: "exit"; code: number }
  | { type: "error"; message: string; fallback?: boolean };

const API_BASE = import.meta.env.VITE_API ?? "http://localhost:3001/api";

export function startAsmSession(code: string): WebSocket {
  const wsUrl = API_BASE.replace(/^http/, "ws") + "/compile/asm/ws";
  const ws = new WebSocket(wsUrl);
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "run", code }));
  };
  return ws;
}

export async function tryStartAsmSession(
  code: string,
  timeoutMs = 1500,
): Promise<WebSocket | null> {
  return await new Promise<WebSocket | null>((resolve) => {
    let settled = false;
    let ws: WebSocket | null = null;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        try {
          ws?.close();
        } catch {
          // ignore
        }
        resolve(null);
      }
    }, timeoutMs);

    try {
      ws = startAsmSession(code);
    } catch {
      clearTimeout(timer);
      resolve(null);
      return;
    }

    const onEarlyMessage = (event: MessageEvent) => {
      let msg: AsmSessionMessage;
      try {
        msg = JSON.parse(String(event.data)) as AsmSessionMessage;
      } catch {
        return;
      }
      if (msg.type === "error" && (msg as { fallback?: boolean }).fallback) {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          ws?.removeEventListener("message", onEarlyMessage as EventListener);
          try {
            ws?.close();
          } catch {
            // ignore
          }
          resolve(null);
        }
      }
    };

    ws.addEventListener("message", onEarlyMessage as EventListener);

    ws.onopen = () => {
      ws!.send(JSON.stringify({ type: "run", code }));
    };

    // If connection succeeds without fallback error, return ws after ready or after timeout
    const readyHandler = (event: MessageEvent) => {
      try {
        const m = JSON.parse(String(event.data)) as { type: string };
        if (m.type === "ready" || m.type === "output" || m.type === "exit") {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            ws?.removeEventListener("message", readyHandler as EventListener);
            ws?.removeEventListener("message", onEarlyMessage as EventListener);
            resolve(ws);
          }
        }
      } catch {
        // ignore
      }
    };
    ws.addEventListener("message", readyHandler as EventListener);

    ws.onerror = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(null);
      }
    };
    ws.onclose = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(null);
      }
    };
  });
}

export async function runAsmCapturedPost(code: string): Promise<{
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error: string | null;
  fallback?: boolean;
}> {
  const resp = await fetch(`${API_BASE}/compile/asm/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const data = await resp.json();
  return data;
}

export async function getAsmCapabilities(): Promise<{ headless: boolean; timeoutMs: number }> {
  try {
    const resp = await fetch(`${API_BASE}/compile/asm/capabilities`);
    if (!resp.ok) return { headless: false, timeoutMs: 10000 };
    return await resp.json();
  } catch {
    return { headless: false, timeoutMs: 10000 };
  }
}

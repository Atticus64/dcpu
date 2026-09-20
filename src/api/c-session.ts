export type CSessionMessage =
  | { type: "output"; stream: "stdout" | "stderr"; data: string }
  | { type: "ready" }
  | { type: "exit"; code: number }
  | { type: "error"; message: string }

const API_BASE = import.meta.env.VITE_API ?? "http://localhost:3001/api"

export function startCSession(code: string): WebSocket {
  const wsUrl = API_BASE.replace(/^http/, "ws") + "/compile/c/ws"
  const ws = new WebSocket(wsUrl)
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "compile", code }))
  }
  return ws
}

export function sendCSessionInput(ws: WebSocket, data: string): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "input", data }))
  }
}

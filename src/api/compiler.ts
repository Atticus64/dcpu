import type { CompileRequest, CompileResponse, CompileRunResponse } from "@/types";

const API_BASE = import.meta.env.VITE_API ?? "http://localhost:3001/api";

function parseCode(code: string): string {
  let resultado = code;

  // Eliminar IDEAL
  resultado = resultado.replace(/^IDEAL\s*$/gm, "");
  resultado = resultado.replace(/^ideal\s*$/gm, "");

  // Convertir directivas
  resultado = resultado.replace(/^MODEL\s+/gm, ".MODEL ");
  resultado = resultado.replace(/^STACK\s+/gm, ".STACK ");
  resultado = resultado.replace(/^DATASEG\s*$/gm, ".DATA");
  resultado = resultado.replace(/^CODESEG\s*$/gm, ".CODE");
  resultado = resultado.replace(/^model\s+/gm, ".MODEL ");
  resultado = resultado.replace(/^stack\s+/gm, ".STACK ");
  resultado = resultado.replace(/^dataseg\s*$/gm, ".DATA");
  resultado = resultado.replace(/^codeseg\s*$/gm, ".CODE");

  // Convertir proc/endp de IDEAL a MASM
  resultado = resultado.replace(/^proc\s+(\w+)\s*(;.*)?$/gim, "$1 PROC$2")
  resultado = resultado.replace(/^endp\s+(\w+)\s*(;.*)?$/gim, "$1 ENDP$2")

  // Convertir offset a OFFSET
  resultado = resultado.replace(/\boffset\s+/g, "OFFSET ");

  // Limpiar líneas vacías
  resultado = resultado.replace(/\n\s*\n\s*\n/g, "\n\n");

  return resultado;
}

export async function compileCode(req: CompileRequest): Promise<CompileResponse> {
  const codeParsed = parseCode(req.code);

  req.code = codeParsed;

  const response = await fetch(`${API_BASE}/compile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!response.ok) {
    const text = await response.text();
    return { success: false, stdout: "", stderr: "", error: `HTTP ${response.status}: ${text}` };
  }
  return response.json();
}

export async function compileAndRun(code: string): Promise<CompileRunResponse> {
  const codeParsed = parseCode(code);

  const response = await fetch(`${API_BASE}/compile/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: codeParsed, language: "assembly" }),
  });
  if (!response.ok) {
    const text = await response.text();
    return { success: false, exeBase64: null, error: `HTTP ${response.status}: ${text}` };
  }
  return response.json();
}

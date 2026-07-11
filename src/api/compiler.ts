import type { CompileRequest, CompileResponse } from '@/types'

const API_BASE = 'http://localhost:3001/api'

export async function compileCode(req: CompileRequest): Promise<CompileResponse> {
  const response = await fetch(`${API_BASE}/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!response.ok) {
    const text = await response.text()
    return { success: false, stdout: '', stderr: '', error: `HTTP ${response.status}: ${text}` }
  }
  return response.json()
}

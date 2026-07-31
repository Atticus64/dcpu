import { join } from "@std/path";
import { log } from "../lib/logger.ts";

const TOOLS_DIR = join(import.meta.dirname!, "..", "..", "tools", "tcc", "tcc");
const TCC_PATH = join(TOOLS_DIR, "tcc.exe");
const SESSION_TIMEOUT_MS = 60_000;

export function prepareSource(code: string): { src: string; hasMain: boolean } {
  const hasMain = code.includes("int main") || code.includes("void main");
  if (hasMain) {
    return { src: code, hasMain: true };
  }
  return {
    src: `#include <stdio.h>\nint main() { ${code}; return 0; }\n`,
    hasMain: false,
  };
}

export async function compileC(code: string) {
  log.debug(`compileC: tmpDir created, code.length=${code.length}`);
  const tmpDir = await Deno.makeTempDir({ prefix: "dcpu-c-" });
  try {
    const srcFile = join(tmpDir, "input.c");
    const { src, hasMain } = prepareSource(code);
    await Deno.writeTextFile(srcFile, src);

    const cmd = new Deno.Command(TCC_PATH, {
      args: [
        "-I", join(TOOLS_DIR, "include"),
        "-L", join(TOOLS_DIR, "lib"),
        "-run",
        srcFile,
      ],
      cwd: tmpDir,
      stdout: "piped",
      stderr: "piped",
    });

    const start = Date.now();
    const proc = await cmd.output();
    const ms = Date.now() - start;
    const stdout = new TextDecoder().decode(proc.stdout);
    const stderr = new TextDecoder().decode(proc.stderr);

    log.debug(`compileC: exit_code=${proc.code}, hasMain=${hasMain}, duration=${ms}ms`);

    if (!proc.success) {
      return {
        success: false,
        stdout,
        stderr,
        error: stderr || "Compilation failed",
      };
    }

    return {
      success: true,
      stdout: stdout || "Compilation successful",
      stderr: "",
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      stdout: "",
      stderr: "",
      error: err instanceof Error ? err.message : "Unknown error running TCC",
    };
  } finally {
    try {
      await Deno.remove(tmpDir, { recursive: true });
    } catch {
      // ignore cleanup errors
    }
  }
}

export interface CSession {
  proc: Deno.ChildProcess;
  tmpDir: string;
}

export async function compileCToExe(code: string): Promise<CSession> {
  log.debug(`compileCToExe: tmpDir created, code.length=${code.length}`);
  const tmpDir = await Deno.makeTempDir({ prefix: "dcpu-c-session-" });
  const srcFile = join(tmpDir, "input.c");
  const exeFile = join(tmpDir, "program.exe");

  const { src } = prepareSource(code);
  await Deno.writeTextFile(srcFile, src);

  const cmd = new Deno.Command(TCC_PATH, {
    args: [
      "-I", join(TOOLS_DIR, "include"),
      "-L", join(TOOLS_DIR, "lib"),
      "-o", exeFile,
      srcFile,
    ],
    cwd: tmpDir,
    stdout: "piped",
    stderr: "piped",
  });

  const proc = await cmd.output();
  const stdout = new TextDecoder().decode(proc.stdout);
  const stderr = new TextDecoder().decode(proc.stderr);

  log.debug(`compileCToExe: exit_code=${proc.code}, duration=${Date.now()}ms`);

  if (!proc.success) {
    await Deno.remove(tmpDir, { recursive: true }).catch(() => {});
    const message = stderr || stdout || `Compilation failed with exit code ${proc.code}`;
    throw new Error(message.trim());
  }

  return { proc: new Deno.Command(exeFile, {
    cwd: tmpDir,
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  }).spawn(), tmpDir };
}

export function cleanupCSession(session: CSession): Promise<void> {
  try {
    session.proc.kill();
  } catch {
    // process may have already exited
  }
  return Deno.remove(session.tmpDir, { recursive: true }).catch(() => {});
}

export { SESSION_TIMEOUT_MS };

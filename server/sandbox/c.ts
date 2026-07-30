import { join } from "@std/path";
import { log } from "../lib/logger.ts";

const TOOLS_DIR = join(import.meta.dirname!, "..", "..", "tools", "tcc", "tcc");
const TCC_PATH = join(TOOLS_DIR, "tcc.exe");

export async function compileC(code: string) {
  log.debug(`compileC: tmpDir created, code.length=${code.length}`);
  const tmpDir = await Deno.makeTempDir({ prefix: "dcpu-c-" });
  try {
    const srcFile = join(tmpDir, "input.c");
    const hasMain = code.includes("int main") || code.includes("void main");

    await Deno.writeTextFile(srcFile, code);

    const args = ["-run"];
    if (hasMain) {
      args.push(srcFile);
    } else {
      const wrapped = `#include <stdio.h>\nint main() { ${code}; return 0; }\n`;
      await Deno.writeTextFile(srcFile, wrapped);
      args.push(srcFile);
    }

    const cmd = new Deno.Command(TCC_PATH, {
      args: [
        "-I", join(TOOLS_DIR, "include"),
        "-L", join(TOOLS_DIR, "lib"),
        ...args,
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

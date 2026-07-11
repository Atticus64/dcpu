import { join } from "@std/path";

const TOOLS_DIR = join(import.meta.dirname!, "..", "..", "tools", "tcc", "tcc");
const TCC_PATH = join(TOOLS_DIR, "tcc.exe");

export async function compileC(code: string) {
  const tmpDir = await Deno.makeTempDir({ prefix: "dcpu-c-" });
  try {
    const srcFile = join(tmpDir, "input.c");
    const hasMain = code.includes("int main") || code.includes("void main");

    await Deno.writeTextFile(srcFile, code);

    const args = ["-run"];
    // For programs with main(), we use -run for compile+execute
    if (hasMain) {
      args.push(srcFile);
    } else {
      // For simple expressions, we wrap in main and output result
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

    const proc = await cmd.output();
    const stdout = new TextDecoder().decode(proc.stdout);
    const stderr = new TextDecoder().decode(proc.stderr);

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

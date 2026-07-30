import { join } from "@std/path";

const TOOLS_DIR = join(import.meta.dirname!, "..", "..", "tools", "jwasm");
const JWASM_PATH = join(TOOLS_DIR, "JWasm.exe");

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
}

export async function compileAssembly(code: string) {
  const tmpDir = await Deno.makeTempDir({ prefix: "dcpu-asm-" });
  try {
    const srcFile = join(tmpDir, "input.asm");
    const objFile = join(tmpDir, "input.obj");
    await Deno.writeTextFile(srcFile, code);

    const cmd = new Deno.Command(JWASM_PATH, {
      args: [
        "-Fo", objFile,
        "-I", TOOLS_DIR,
        srcFile,
      ],
      cwd: tmpDir,
      stdout: "piped",
      stderr: "piped",
    });

    const proc = await cmd.output();
    const stdout = new TextDecoder().decode(proc.stdout);
    const stderr = new TextDecoder().decode(proc.stderr);

    const cleanedStdout = stripAnsi(stdout);
    const cleanedStderr = stripAnsi(stderr);

    if (!proc.success) {
      const hasErrors = cleanedStderr || cleanedStdout;
      return {
        success: false,
        stdout: cleanedStdout,
        stderr: cleanedStderr,
        error: hasErrors
          ? `Assembly failed:\n${cleanedStderr || cleanedStdout}`
          : `Assembly failed with exit code ${proc.code}`,
      };
    }

    return {
      success: true,
      stdout: cleanedStdout || "Assembly successful",
      stderr: "",
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      stdout: "",
      stderr: "",
      error: err instanceof Error ? err.message : "Unknown error running JWASM",
    };
  } finally {
    try {
      await Deno.remove(tmpDir, { recursive: true });
    } catch {
      // ignore cleanup errors
    }
  }
}

export async function compileAssemblyRun(code: string) {
  const tmpDir = await Deno.makeTempDir({ prefix: "dcpu-asm-run-" });
  try {
    const srcFile = join(tmpDir, "input.asm");
    const exeFile = join(tmpDir, "input.exe");
    await Deno.writeTextFile(srcFile, code);

    const cmd = new Deno.Command(JWASM_PATH, {
      args: [
        "-mz",
        "-Fo", exeFile,
        "-I", TOOLS_DIR,
        srcFile,
      ],
      cwd: tmpDir,
      stdout: "piped",
      stderr: "piped",
    });

    const proc = await cmd.output();
    const stdout = new TextDecoder().decode(proc.stdout);
    const stderr = new TextDecoder().decode(proc.stderr);

    const cleanedStdout = stripAnsi(stdout);
    const cleanedStderr = stripAnsi(stderr);

    if (!proc.success) {
      const hasErrors = cleanedStderr || cleanedStdout;
      return {
        success: false,
        exeBase64: null,
        error: hasErrors
          ? `Assembly failed:\n${cleanedStderr || cleanedStdout}`
          : `Assembly failed with exit code ${proc.code}`,
      };
    }

    const exeBytes = await Deno.readFile(exeFile);
    const exeBase64 = btoa(String.fromCharCode(...new Uint8Array(exeBytes)));

    return {
      success: true,
      exeBase64,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      exeBase64: null,
      error: err instanceof Error ? err.message : "Unknown error running JWASM",
    };
  } finally {
    try {
      await Deno.remove(tmpDir, { recursive: true });
    } catch {
      // ignore cleanup errors
    }
  }
}

import { join } from "@std/path";
import { log } from "../lib/logger.ts";

const TOOLS_DIR = join(import.meta.dirname!, "..", "..", "tools", "jwasm");
const JWASM_WIN = join(TOOLS_DIR, "JWasm.exe");
const JWASM_LOCAL = join(TOOLS_DIR, "jwasm");

function resolveAssembler(): string {
  if (Deno.build.os !== "linux") return JWASM_WIN;
  const fromEnv = Deno.env.get("JWASM_PATH");
  if (fromEnv) return fromEnv;
  const candidates = [
    "/usr/local/bin/jwasm",
    "/usr/bin/jwasm",
    JWASM_LOCAL,
  ];
  for (const p of candidates) {
    try {
      Deno.statSync(p);
      return p;
    } catch {
      // not found
    }
  }
  // fallback to PATH
  return "jwasm";
}

const ASSEMBLER = resolveAssembler();

type Config = {
  os: string;
  args: string[];
  source: string;
  obj: string;
  exe: string;
  tmpDir: string;
};

function getCommandASM(config: Config) {
  return new Deno.Command(ASSEMBLER, {
    args: [
      "-Fo", config.obj,
      "-I", TOOLS_DIR,
      config.source,
    ],
    cwd: config.tmpDir,
    stdout: "piped",
    stderr: "piped",
  });
}

function getExeCommand(config: Config) {
  return new Deno.Command(ASSEMBLER, {
    args: [
      "-mz",
      "-Fo", config.exe,
      "-I", TOOLS_DIR,
      config.source,
    ],
    cwd: config.tmpDir,
    stdout: "piped",
    stderr: "piped",
  });
}

export const ASM_SESSION_TIMEOUT_MS = 10_000;

function resolveDosbox(): string | null {
  const fromEnv = Deno.env.get("DOSBOX_PATH");
  if (fromEnv) {
    try {
      Deno.statSync(fromEnv);
      return fromEnv;
    } catch {
      // env path not found, continue
    }
  }
  const candidates = [
    "/usr/bin/dosbox",
    "/usr/bin/dosbox-staging",
  ];
  for (const p of candidates) {
    try {
      Deno.statSync(p);
      return p;
    } catch {
      continue;
    }
  }
  return null;
}

export function isAsmHeadlessAvailable(): boolean {
  // js-dos 100% cliente: el servidor solo compila (jwasm -mz) y retorna exeBase64.
  // Headless DOSBox desactivado por defecto para evitar timeout de 10s.
  // Activar solo con ENABLE_DOSBOX_HEADLESS=1 para debugging.
  if (Deno.env.get("ENABLE_DOSBOX_HEADLESS") !== "1") return false;
  const d = resolveDosbox();
  if (!d) return false;
  try {
    Deno.statSync(d);
    return true;
  } catch {
    return false;
  }
}

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
}

function parseAsmSource(code: string): string {
  let resultado = code;
  resultado = resultado.replace(/^IDEAL\s*$/gm, "");
  resultado = resultado.replace(/^ideal\s*$/gm, "");
  resultado = resultado.replace(/^MODEL\s+/gm, ".MODEL ");
  resultado = resultado.replace(/^STACK\s+/gm, ".STACK ");
  resultado = resultado.replace(/^DATASEG\s*$/gm, ".DATA");
  resultado = resultado.replace(/^CODESEG\s*$/gm, ".CODE");
  resultado = resultado.replace(/^model\s+/gm, ".MODEL ");
  resultado = resultado.replace(/^stack\s+/gm, ".STACK ");
  resultado = resultado.replace(/^dataseg\s*$/gm, ".DATA");
  resultado = resultado.replace(/^codeseg\s*$/gm, ".CODE");
  resultado = resultado.replace(/^proc\s+(\w+)\s*(;.*)?$/gim, "$1 PROC$2");
  resultado = resultado.replace(/^endp\s+(\w+)\s*(;.*)?$/gim, "$1 ENDP$2");
  resultado = resultado.replace(/\boffset\s+/g, "OFFSET ");
  resultado = resultado.replace(/\n\s*\n\s*\n/g, "\n\n");
  return resultado;
}

function formatAsmOutput(s: string): string {
  let out = stripAnsi(s);
  // Normalize line endings
  out = out.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // Filter common DOSBox banners and mount messages
  const ignorePatterns = [
    /mounting.*drive/i,
    /mounted.*drive/i,
    /^drive c.*mounted/i,
    /^c:\\>/i,
    /^z:\\>/i,
    /dosbox/i,
    /staging/i,
    /copyright/i,
    /^\s*$/,
  ];
  // Also split and filter lines that are pure banners
  const lines = out.split("\n");
  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true; // keep empty for spacing, but will join later
    for (const pat of ignorePatterns) {
      if (pat.test(trimmed)) return false;
    }
    // Filter mount commands echoed
    if (/^mount\s+/i.test(trimmed)) return false;
    return true;
  });
  out = filtered.join("\n");
  // Collapse 3+ blank lines
  out = out.replace(/\n{3,}/g, "\n\n");
  return out.trim();
}

export async function compileAssembly(code: string) {
  const parsed = parseAsmSource(code);
  log.debug(`compileAssembly: tmpDir created, code.length=${code.length} parsed=${parsed.length}`);
  const tmpDir = await Deno.makeTempDir({ prefix: "dcpu-asm-" });
  try {
    const srcFile = join(tmpDir, "input.asm");
    const objFile = join(tmpDir, "input.obj");
    await Deno.writeTextFile(srcFile, parsed);
    const config = {
      os: Deno.build.os,
      args: [],
      source: srcFile,
      tmpDir,
      obj: objFile,
      exe: "",
    };

    const cmd = getCommandASM(config);
    const start = Date.now();
    const proc = await cmd.output();
    const ms = Date.now() - start;
    const stdout = new TextDecoder().decode(proc.stdout);
    const stderr = new TextDecoder().decode(proc.stderr);

    log.debug(`compileAssembly: exit_code=${proc.code}, duration=${ms}ms`);

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
  const parsed = parseAsmSource(code);
  log.debug(`compileAssemblyRun: tmpDir created, code.length=${code.length} parsed=${parsed.length}`);
  const tmpDir = await Deno.makeTempDir({ prefix: "dcpu-asm-run-" });
  try {
    const srcFile = join(tmpDir, "input.asm");
    const exeFile = join(tmpDir, "input.exe");
    await Deno.writeTextFile(srcFile, parsed);
    const config = {
      os: Deno.build.os,
      args: [],
      source: srcFile,
      tmpDir,
      obj: "",
      exe: exeFile,
    };

    const cmd = getExeCommand(config);
    const start = Date.now();
    const proc = await cmd.output();
    const ms = Date.now() - start;
    const stdout = new TextDecoder().decode(proc.stdout);
    const stderr = new TextDecoder().decode(proc.stderr);

    log.debug(`compileAssemblyRun: exit_code=${proc.code}, duration=${ms}ms`);

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

export interface AsmRunResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error: string | null;
}

/**
 * Compile ASM and try to run it headless via DOSBox.
 * Used by POST /api/compile/asm/run and WS session.
 * If DOSBox is not available, caller should fallback to client-side js-dos.
 */
export async function compileAndRunAsmCaptured(code: string): Promise<AsmRunResult> {
  const parsed = parseAsmSource(code);
  const tmpDir = await Deno.makeTempDir({ prefix: "dcpu-asm-cap-" });
  try {
    const srcFile = join(tmpDir, "input.asm");
    const exeFile = join(tmpDir, "program.exe");
    await Deno.writeTextFile(srcFile, parsed);
    const config = {
      os: Deno.build.os,
      args: [],
      source: srcFile,
      tmpDir,
      obj: "",
      exe: exeFile,
    };
    const cmd = getExeCommand(config);
    const proc = await cmd.output();
    const stdout = new TextDecoder().decode(proc.stdout);
    const stderr = new TextDecoder().decode(proc.stderr);
    if (!proc.success) {
      const cleanedStdout = stripAnsi(stdout);
      const cleanedStderr = stripAnsi(stderr);
      const hasErrors = cleanedStderr || cleanedStdout;
      return {
        success: false,
        stdout: cleanedStdout,
        stderr: cleanedStderr,
        exitCode: proc.code,
        error: hasErrors
          ? `Assembly failed:\n${cleanedStderr || cleanedStdout}`
          : `Assembly failed with exit code ${proc.code}`,
      };
    }
    // Try DOSBox execution
    const dosbox = resolveDosbox();
    if (!dosbox) {
      return {
        success: false,
        stdout: "",
        stderr: "",
        exitCode: null,
        error: "DOSBox not available on server (install dosbox-staging or set DOSBOX_PATH). Use client-side fallback.",
      };
    }
    return await runDosboxCapture(dosbox, exeFile, tmpDir);
  } finally {
    try {
      await Deno.remove(tmpDir, { recursive: true });
    } catch {
      // ignore
    }
  }
}

async function runDosboxCapture(dosboxBin: string, exeFile: string, tmpDir: string): Promise<AsmRunResult> {
  const outFile = join(tmpDir, "out.txt");
  // Compatibilidad audio/video sin xorg: offscreen video + dummy audio funciona con staging (probado: offscreen initialised, no ABORT)
  // Quitamos -securemode para que mount c funcione (con securemode solo existe Z)
  const dosboxConfContent =
    `[sdl]\noutput=texture\n[dosbox]\nmemsize=16\n[autoexec]\n@echo off\nmount z ${tmpDir}\nz:\nprogram.exe > out.txt 2> err.txt\n exit\n`;
  const confFile = join(tmpDir, "dosbox.conf");
  await Deno.writeTextFile(confFile, dosboxConfContent);

  log.debug(`runDosboxCapture: bin=${dosboxBin}, tmpDir=${tmpDir}`);

  const env: Record<string, string> = {};
  // deno-lint-ignore no-explicit-any
  const origEnv = (Deno.env.toObject() as any) as Record<string, string>;
  for (const [k, v] of Object.entries(origEnv)) env[k] = v;
  // compatibilidad: offscreen evita ABORT OpenGL con dummy, dummy audio evita requerir ALSA/pulse
  env["SDL_VIDEODRIVER"] = "offscreen";
  // env["SDL_AUDIODRIVER"] = "dummy";
  // opcional: forzar render software para asegurar compatibilidad sin GL
  env["SDL_RENDER_DRIVER"] = "software";

  let stdout = "";
  let stderr = "";
  let exitCode: number | null = null;
  let timedOut = false;

  const bin = dosboxBin;
  const args = ["-conf", confFile, "-noconsole", "-nosound"];

  try {
    const cmd = new Deno.Command(bin, {
      args,
      cwd: tmpDir,
      stdout: "piped",
      stderr: "piped",
      env,
    });
    // Race with timeout
    const proc = cmd.spawn();
    const timeoutMs = ASM_SESSION_TIMEOUT_MS;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        timedOut = true;
        try { proc.kill("SIGTERM"); } catch { /* ignore */ }
        reject(new Error(`DOSBox timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    const outputPromise = proc.output();
    let result: Deno.CommandOutput;
    try {
      result = await Promise.race([outputPromise, timeoutPromise]) as Deno.CommandOutput;
    } finally {
      if (timeoutId !== null) clearTimeout(timeoutId);
    }

    stdout = new TextDecoder().decode(result.stdout);
    stderr = new TextDecoder().decode(result.stderr);
    exitCode = result.code;

    // Prefer captured out.txt if exists
    try {
      const captured = await Deno.readTextFile(outFile);
      if (captured.trim()) {
        stdout = captured;
      }
    } catch {
      // no out file, keep dosbox stdout
    }
    try {
      const errCaptured = await Deno.readTextFile(join(tmpDir, "err.txt"));
      if (errCaptured.trim()) stderr += (stderr ? "\n" : "") + errCaptured;
    } catch { /* ignore */ }

    const formattedStdout = formatAsmOutput(stdout);
    const formattedStderr = formatAsmOutput(stderr);

    if (timedOut) {
      return { success: false, stdout: formattedStdout, stderr: formattedStderr, exitCode, error: "Program timed out" };
    }

    return { success: true, stdout: formattedStdout, stderr: formattedStderr, exitCode, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // If binary not found or failed to spawn, surface friendly error for fallback
    if (msg.includes("Timed out")) {
      return { success: false, stdout: formatAsmOutput(stdout), stderr: formatAsmOutput(stderr), exitCode, error: msg };
    }
    return { success: false, stdout: formatAsmOutput(stdout), stderr: formatAsmOutput(stderr), exitCode, error: `DOSBox execution failed: ${msg}` };
  }
}

export { formatAsmOutput, resolveDosbox };

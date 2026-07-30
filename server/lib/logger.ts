const LOG_LEVEL = Deno.env.get("LOG_LEVEL") || "";
const ENABLED = LOG_LEVEL.toLowerCase() === "debug";

function timestamp(): string {
  return new Date().toISOString();
}

export const log = {
  debug: (...args: unknown[]) => {
    if (ENABLED) console.log(`[${timestamp()}] [DEBUG]`, ...args);
  },
  info: (...args: unknown[]) => {
    if (ENABLED) console.log(`[${timestamp()}] [INFO]`, ...args);
  },
  warn: (...args: unknown[]) => {
    if (ENABLED) console.warn(`[${timestamp()}] [WARN]`, ...args);
  },
  error: (...args: unknown[]) => {
    if (ENABLED) console.error(`[${timestamp()}] [ERROR]`, ...args);
  },
};

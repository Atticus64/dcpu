import { Router } from "@oak/oak";
import { compileAssembly, compileAssemblyRun } from "../sandbox/assembly.ts";
import { compileC } from "../sandbox/c.ts";
import { log } from "../lib/logger.ts";

const compileRouter = new Router();

compileRouter.post("/", async (ctx) => {
  const body = ctx.request.body;
  const { code, language } = await body.json() as { code: string; language: string };

  if (!code || !language) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Missing 'code' or 'language'" };
    return;
  }

  log.debug(`Compile request: language=${language}, code.length=${code.length}`);

  try {
    const start = Date.now();
    let result;
    if (language === "assembly") {
      result = await compileAssembly(code);
    } else if (language === "c") {
      result = await compileC(code);
    } else {
      ctx.response.status = 400;
      ctx.response.body = { error: `Unsupported language: ${language}` };
      return;
    }

    const ms = Date.now() - start;
    log.debug(`Compile result: language=${language}, success=${result.success}, duration=${ms}ms`);
    if (!result.success) {
      log.warn(`Compilation failed: language=${language}`, (result as { error: string }).error);
    }

    ctx.response.body = result;
  } catch (err) {
    log.error(`Compile error: language=${language}`, err);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: err instanceof Error ? err.message : "Internal server error",
    };
  }
});

compileRouter.post("/run", async (ctx) => {
  const body = ctx.request.body;
  const { code, language } = await body.json() as { code: string; language: string };

  if (!code || !language) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Missing 'code' or 'language'" };
    return;
  }

  log.debug(`Compile+run request: language=${language}, code.length=${code.length}`);

  try {
    const start = Date.now();
    let result;
    if (language === "assembly") {
      result = await compileAssemblyRun(code);
    } else {
      ctx.response.status = 400;
      ctx.response.body = { error: `Unsupported language: ${language}` };
      return;
    }

    const ms = Date.now() - start;
    log.debug(`Compile+run result: language=${language}, success=${result.success}, duration=${ms}ms`);
    if (!result.success) {
      log.warn(`Compile+run failed: language=${language}`, (result as { error: string }).error);
    }

    ctx.response.body = result;
  } catch (err) {
    log.error(`Compile+run error: language=${language}`, err);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      exeBase64: null,
      error: err instanceof Error ? err.message : "Internal server error",
    };
  }
});

export { compileRouter };

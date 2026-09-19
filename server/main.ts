import { Application, Router } from "@oak/oak";
import { compileRouter } from "./routes/compile.ts";
import { cSessionRouter } from "./routes/c-session.ts";
import { asmSessionRouter } from "./routes/asm-session.ts";
import { isAsmHeadlessAvailable } from "./sandbox/assembly.ts";
import { log } from "./lib/logger.ts";

const router = new Router();

router.use("/api/compile", compileRouter.routes(), compileRouter.allowedMethods());
router.use("/api/compile/c", cSessionRouter.routes(), cSessionRouter.allowedMethods());
router.use("/api/compile/asm", asmSessionRouter.routes(), asmSessionRouter.allowedMethods());

router.get("/api/health", (ctx) => {
  ctx.response.body = { status: "ok", capabilities: { asmHeadless: isAsmHeadlessAvailable() } };
});

const app = new Application();

app.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 204;
    return;
  }
  await next();
});

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  log.info(`${ctx.request.method} ${ctx.request.url.pathname} ${ctx.response.status} ${ms}ms`);
});

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = Number(Deno.env.get("PORT") || "3001");
log.info(`Starting server on port ${PORT}`);
log.debug(`Tools dir: ${import.meta.dirname}`);
await app.listen({ port: PORT });

import { Application, Router } from "@oak/oak";
import { compileRouter } from "./routes/compile.ts";

const router = new Router();

router.use("/api/compile", compileRouter.routes(), compileRouter.allowedMethods());

router.get("/api/health", (ctx) => {
  ctx.response.body = { status: "ok" };
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

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = 3001;
console.log(`Server running on http://localhost:${PORT}`);
await app.listen({ port: PORT });

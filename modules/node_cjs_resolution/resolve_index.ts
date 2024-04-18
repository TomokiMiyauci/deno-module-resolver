import { type Context } from "./context.ts";
import { join } from "./deps.ts";

export default async function resolveIndex(
  X: string,
  ctx: Context,
): Promise<string | undefined> {
  const indexJs = join(X, "index.js");

  // 1. If X/index.js is a file, load X/index.js as JavaScript text. STOP
  if (await ctx.existFile(indexJs)) return indexJs;

  const indexJson = join(X, "index.json");
  // 2. If X/index.json is a file, parse X/index.json to a JavaScript object. STOP
  if (await ctx.existFile(indexJson)) return indexJson;

  const indexNode = join(X, "index.node");
  // 3. If X/index.node is a file, load X/index.node as binary addon. STOP
  if (await ctx.existFile(indexNode)) return indexNode;
}

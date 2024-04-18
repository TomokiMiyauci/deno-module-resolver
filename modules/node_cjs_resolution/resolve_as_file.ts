import { type Context } from "./context.ts";

export default async function resolveAsFile(
  X: string,
  ctx: Context,
): Promise<string | undefined> {
  // 1. If X is a file, load X as its file extension format. STOP
  if (await ctx.existFile(X)) return X;

  const withJs = X + ".js";
  // 2. If X.js is a file, load X.js as JavaScript text. STOP
  if (await ctx.existFile(withJs)) return withJs;

  const withJson = X + ".json";
  // 3. If X.json is a file, parse X.json to a JavaScript Object. STOP
  if (await ctx.existFile(withJson)) return withJson;

  const withNode = X + ".node";
  // 4. If X.node is a file, load X.node as binary addon. STOP
  if (await ctx.existFile(withNode)) return withNode;
}

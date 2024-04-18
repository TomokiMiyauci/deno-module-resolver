import { Context } from "./context.ts";
import { join } from "./deps.ts";
import resolveAsFile from "./resolve_as_file.ts";
import resolveIndex from "./resolve_index.ts";

export default async function RESOLVE_AS_DIRECTORY(
  X: string,
  ctx: Context,
): Promise<string | undefined> {
  const pjsonPath = join(X, "package.json");
  const file = await ctx.readFile(pjsonPath);
  // 1. If X/package.json is a file,
  if (typeof file === "string") {
    //    a. Parse X/package.json, and look for "main" field.
    const pjson = JSON.parse(file);
    const main = pjson.main;

    //    b. If "main" is a falsy value, GOTO 2.
    if (!main) return resolveIndex(X, ctx);

    //    c. let M = X + (json main field)
    const M = join(X, main);

    //    d. LOAD_AS_FILE(M)
    const filePath = await resolveAsFile(M, ctx);
    if (typeof filePath === "string") return filePath;

    //    e. LOAD_INDEX(M)
    const indexPath = await resolveIndex(M, ctx);
    if (typeof indexPath === "string") return indexPath;

    //    f. LOAD_INDEX(X) DEPRECATED

    //    g. THROW "not found"
    throw new Error(`Cannot find module '${X}'`);
  }

  // 2. LOAD_INDEX(X)
  return resolveIndex(X, ctx);
}

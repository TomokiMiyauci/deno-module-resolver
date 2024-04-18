import { ModuleEntryNpm, SourceFileInfo } from "../modules/deno/info.ts";
import { toFileUrl } from "jsr:@std/path";
import { join, normalize } from "jsr:@std/url";
import { Context } from "./context.ts";
import { DenoDir } from "jsr:@deno/cache-dir@0.8.0";
import { resolveNpmModule } from "./npm/cjs/resolve.ts";

export async function npmResolve(
  module: ModuleEntryNpm,
  source: SourceFileInfo,
  ctx: Context,
): Promise<URL> {
  ctx.npm ??= { type: "global", denoDir: new DenoDir().root };

  const npm = source.npmPackages[module.npmPackage];

  if (!npm) throw new Error("npm not found");

  const { name, version } = npm;
  const npmSpecifier = `npm:/${name}@${version}`;
  const subpath = module.specifier.slice(npmSpecifier.length);
  const packageSubpath = `.${subpath}` as const;

  const resolve = resolveNpmModule;

  if (ctx.npm.type === "global") {
    const baseURL = join(
      toFileUrl(ctx.npm.denoDir),
      "npm",
      "registry.npmjs.org",
    );
    const packageURL = join(baseURL, name, version);

    const result = await resolve(packageURL, packageSubpath, ctx);

    if (result) return result;

    throw new Error("Cannot find module");
  }

  if (ctx.npm.type === "local") {
    let parentURL = ctx.npm.baseURL;

    // 11. While parentURL is not the file system root,
    while (!isFileSystemRoot(parentURL)) {
      // 1. Let packageURL be the URL resolution of "node_modules/" concatenated with packageSpecifier, relative to parentURL.
      // @remarks: Maybe not `packageSpecifier`, but packageName
      const packageURL = new URL("node_modules/" + name, parentURL);

      // 2. Set parentURL to the parent folder URL of parentURL.
      parentURL = getParentURL(parentURL);

      const result = await resolve(packageURL, packageSubpath, ctx);

      if (!result) continue;

      return result;
    }
  }

  throw new Error("Module not found");
}

export function isFileSystemRoot(url: URL | string): boolean {
  return new URL(url).pathname === "/";
}

export function getParentURL(url: URL | string): URL {
  return normalize(join(url, "..", "/"));
}

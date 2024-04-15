import { ModuleEntryNpm, SourceFileInfo } from "../modules/deno/info.ts";
import { toFileUrl } from "jsr:@std/path";
import { join, normalize } from "jsr:@std/url";
import { packageExportsResolve, readPackageJson } from "../deps.ts";
import { Context } from "./context.ts";
import { DenoDir } from "jsr:@deno/cache-dir@0.8.0";

export async function npmResolve(
  module: ModuleEntryNpm,
  source: SourceFileInfo,
  ctx: Context,
): Promise<URL> {
  ctx.npm ??= { type: "global", denoDir: new DenoDir().root };

  const npm = source.npmPackages[module.npmPackage];

  if (!npm) throw new Error("npm not found");

  const { name, version } = npm;
  const packageSubpath = ".";

  if (ctx.npm.type === "global") {
    const baseURL = join(
      toFileUrl(ctx.npm.denoDir),
      "npm",
      "registry.npmjs.org",
    );
    const packageURL = join(baseURL, name, version);

    if (await ctx.existDir(packageURL)) {
      // 4. Let pjson be the result of READ_PACKAGE_JSON(packageURL).
      const pjson = await readPackageJson(packageURL, ctx);

      // 5. If pjson is not null and pjson.exports is not null or undefined, then
      if (
        pjson !== null &&
        (pjson.exports !== null && pjson.exports !== undefined)
      ) {
        // 1. Return the result of PACKAGE_EXPORTS_RESOLVE(packageURL, packageSubpath, pjson.exports, defaultConditions).
        return packageExportsResolve(
          packageURL,
          packageSubpath,
          pjson.exports,
          ctx.conditions,
          ctx,
        );

        // 6. Otherwise, if packageSubpath is equal to ".", then
      } else if (packageSubpath === ".") {
        // 1. If pjson.main is a string, then
        if (pjson !== null && typeof pjson.main === "string") {
          // 1. Return the URL resolution of main in packageURL.
          return join(packageURL, pjson.main);
        }
      }

      // 7. Otherwise,
      // 1. Return the URL resolution of packageSubpath in packageURL.
      return join(packageURL, packageSubpath);
    }
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

      // 3. If the folder at packageURL does not exist, then
      if (!await ctx.existDir(packageURL)) {
        // 1. Continue the next loop iteration.
        continue;
      }

      // 4. Let pjson be the result of READ_PACKAGE_JSON(packageURL).
      const pjson = await readPackageJson(packageURL, ctx);

      // 5. If pjson is not null and pjson.exports is not null or undefined, then
      if (
        pjson !== null &&
        (pjson.exports !== null && pjson.exports !== undefined)
      ) {
        // 1. Return the result of PACKAGE_EXPORTS_RESOLVE(packageURL, packageSubpath, pjson.exports, defaultConditions).
        return packageExportsResolve(
          packageURL,
          packageSubpath,
          pjson.exports,
          ctx.conditions,
          ctx,
        );

        // 6. Otherwise, if packageSubpath is equal to ".", then
      } else if (packageSubpath === ".") {
        // 1. If pjson.main is a string, then
        if (pjson !== null && typeof pjson.main === "string") {
          // 1. Return the URL resolution of main in packageURL.
          return join(packageURL, pjson.main);
        }
      }

      // 7. Otherwise,
      // 1. Return the URL resolution of packageSubpath in packageURL.
      return join(packageURL, packageSubpath);
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

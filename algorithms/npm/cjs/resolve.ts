import { Context } from "../../context.ts";
import { join } from "jsr:@std/url";
import { fromFileUrl, toFileUrl } from "jsr:@std/path";
import { packageExportsResolve, readPackageJson } from "./deps.ts";
import { resolveAsDirectory, resolveAsFile } from "../../../deps.ts";

export async function resolveNpmModule(
  packageURL: URL,
  subpath: `.${string}`,
  ctx: Context,
): Promise<URL | undefined> {
  const exportsPath = await resolvePackageExports(packageURL, subpath, ctx);
  if (exportsPath) return exportsPath;

  const base = fromFileUrl(join(packageURL, subpath));

  // b. LOAD_AS_FILE(DIR/X)
  const filePath = await resolveAsFile(base, {
    conditions: ctx.conditions,
    existDir: (path) => {
      const url = toFileUrl(path);

      return ctx.existDir(url);
    },
    existFile: (path) => {
      const url = toFileUrl(path);

      return ctx.existFile(url);
    },
    readFile: (path) => {
      const url = toFileUrl(path);

      return ctx.readFile(url);
    },
  });
  if (typeof filePath === "string") return toFileUrl(filePath);

  // c. LOAD_AS_DIRECTORY(DIR/X)
  const dirPath = await resolveAsDirectory(base, {
    conditions: ctx.conditions,
    existDir: (path) => {
      const url = toFileUrl(path);

      return ctx.existDir(url);
    },
    existFile: (path) => {
      const url = toFileUrl(path);

      return ctx.existFile(url);
    },
    readFile: (path) => {
      const url = toFileUrl(path);

      return ctx.readFile(url);
    },
  });
  if (typeof dirPath === "string") return toFileUrl(dirPath);
}

async function resolvePackageExports(
  packageURL: URL,
  subpath: `.${string}`,
  ctx: Context,
) {
  const pjson = await readPackageJson(packageURL, ctx);

  const exports = pjson?.exports;

  if (!pjson || exports === null || exports === undefined) return;

  return packageExportsResolve(
    packageURL,
    subpath,
    exports,
    ctx.conditions,
    ctx,
  );
}

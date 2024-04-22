import type { ResolveOptions } from "../types.ts";
import {
  fromFileUrl,
  join,
  packageExportsResolve,
  readPackageJson,
  resolveAsDirectory,
  resolveAsFile,
  toFileUrl,
} from "../../deps.ts";

export async function resolveCjs(
  packageURL: URL,
  subpath: `.${string}`,
  options: ResolveOptions,
): Promise<URL | undefined> {
  const exportsPath = await resolvePackageExports(packageURL, subpath, options);
  if (exportsPath) return exportsPath;

  const base = fromFileUrl(join(packageURL, subpath));

  // b. LOAD_AS_FILE(DIR/X)
  const filePath = await resolveAsFile(base, {
    conditions: options.conditions,
    existDir: (path) => {
      const url = toFileUrl(path);

      return options.existDir(url);
    },
    existFile: (path) => {
      const url = toFileUrl(path);

      return options.existFile(url);
    },
    readFile: (path) => {
      const url = toFileUrl(path);

      return options.readFile(url);
    },
  });
  if (typeof filePath === "string") return toFileUrl(filePath);

  // c. LOAD_AS_DIRECTORY(DIR/X)
  const dirPath = await resolveAsDirectory(base, {
    conditions: options.conditions,
    existDir: (path) => {
      const url = toFileUrl(path);

      return options.existDir(url);
    },
    existFile: (path) => {
      const url = toFileUrl(path);

      return options.existFile(url);
    },
    readFile: (path) => {
      const url = toFileUrl(path);

      return options.readFile(url);
    },
  });
  if (typeof dirPath === "string") return toFileUrl(dirPath);
}

async function resolvePackageExports(
  packageURL: URL,
  subpath: `.${string}`,
  options: ResolveOptions,
): Promise<URL | undefined> {
  const pjson = await readPackageJson(packageURL, options);

  const exports = pjson?.exports;

  if (!pjson || exports === null || exports === undefined) return;

  return packageExportsResolve(
    packageURL,
    subpath,
    exports,
    options.conditions,
    options,
  );
}

import { join, packageExportsResolve, readPackageJson } from "../../deps.ts";
import { type ResolveOptions } from "../types.ts";

export async function resolveEsm(
  packageURL: URL | string,
  subpath: `.${string}`,
  options: ResolveOptions,
): Promise<URL> {
  // 4. Let pjson be the result of READ_PACKAGE_JSON(packageURL).
  const pjson = await readPackageJson(packageURL, options);

  // 5. If pjson is not null and pjson.exports is not null or undefined, then
  if (
    pjson !== null && (pjson.exports !== null && pjson.exports !== undefined)
  ) {
    // 1. Return the result of PACKAGE_EXPORTS_RESOLVE(packageURL, packageSubpath, pjson.exports, defaultConditions).
    return packageExportsResolve(
      packageURL,
      subpath,
      pjson.exports,
      options.conditions,
      options,
    );

    // 6. Otherwise, if packageSubpath is equal to ".", then
  } else if (subpath === ".") {
    // 1. If pjson.main is a string, then
    if (pjson !== null && typeof pjson.main === "string") {
      // 1. Return the URL resolution of main in packageURL.
      return join(packageURL, pjson.main);
    }
  }

  // 7. Otherwise,
  // 1. Return the URL resolution of packageSubpath in packageURL.
  return join(packageURL, subpath);
}

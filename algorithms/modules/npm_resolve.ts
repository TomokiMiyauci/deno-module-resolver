import {
  esmFileFormat,
  type Format,
  join,
  normalize,
  NpmModule,
  readPackageJson,
  Source,
  toFileUrl,
} from "../../deps.ts";
import type { ResolveOptions, ResolveResult } from "../types.ts";
import { resolveCjs } from "../npm/cjs_resolve.ts";
import { resolveEsm } from "../npm/esm_resolve.ts";
import { MediaType } from "../../deps.ts";

export async function npmResolve(
  module: NpmModule,
  source: Source,
  options: ResolveOptions,
): Promise<ResolveResult> {
  const npm = source.npmPackages[module.npmPackage];

  if (!npm) throw new Error("npm not found");

  const { name, version } = npm;
  const npmSpecifier = `npm:/${name}@${version}`;
  const subpath = module.specifier.slice(npmSpecifier.length);
  const packageSubpath = `.${subpath}` as const;

  if (options.npm.type === "global") {
    const packageURL = createPackageURL(options.npm.denoDir, name, version);

    const pjson = await readPackageJson(packageURL, options);
    const isEsModule = pjson?.type === "module";
    const resolve = isEsModule ? resolveEsm : resolveCjs;

    const url = await resolve(packageURL, packageSubpath, options);

    if (!url) {
      throw new Error("Cannot find module");
    }

    const format = await esmFileFormat(url, options);
    const mediaType = (format && formatToMediaType(format)) ?? "Unknown";

    return { url, mediaType };
  }

  if (options.npm.type === "local") {
    let parentURL = options.npm.baseURL;

    // 11. While parentURL is not the file system root,
    while (!isFileSystemRoot(parentURL)) {
      // 1. Let packageURL be the URL resolution of "node_modules/" concatenated with packageSpecifier, relative to parentURL.
      const packageURL = new URL("node_modules/" + name, parentURL);

      // 2. Set parentURL to the parent folder URL of parentURL.
      parentURL = getParentURL(parentURL);
      const resolve = resolveEsm;

      const url = await resolve(packageURL, packageSubpath, options);

      if (!url) continue;

      const format = await esmFileFormat(url, options);
      const mediaType = (format && formatToMediaType(format)) ?? "Unknown";

      return { url, mediaType };
    }
  }

  throw new Error("Module not found");
}

export function isFileSystemRoot(url: URL | string): boolean {
  return new URL(url).pathname === "/";
}

export function getParentURL(url: URL | string): URL {
  return normalize(join(url, ".."));
}

function createPackageURL(
  denoDir: string,
  name: string,
  version: string,
): URL {
  const denoDirURL = toFileUrl(denoDir);
  const baseURL = join(denoDirURL, "npm", "registry.npmjs.org");

  const packageURL = join(baseURL, name, version);

  return packageURL;
}

function formatToMediaType(format: Format): MediaType {
  switch (format) {
    case "module":
      return "JavaScript";

    case "commonjs":
      return "Cjs";

    case "json":
      return "Json";

    case "wasm":
      return "Wasm";
  }
}

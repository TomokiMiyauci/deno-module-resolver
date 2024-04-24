import {
  type ModuleResolveResult,
  type ResolveOptions,
  type ResolveResult,
} from "./types.ts";
import { urlResolve } from "./url_resolve.ts";
import {
  fromFileUrl,
  resolveAsDirectory,
  resolveAsFile,
  toFileUrl,
} from "../deps.ts";
import { mediaTypeFromExt, resolveModuleLike } from "./utils.ts";

async function localRelativeResolve(
  specifier: string,
  referer: URL | string,
  options: ResolveOptions,
): Promise<ResolveResult | ModuleResolveResult> {
  const url = new URL(specifier, referer);

  if (url.protocol === "file:") {
    if (await options.existFile(url)) {
      const mediaType = mediaTypeFromExt(url);

      return { url, mediaType, local: fromFileUrl(url) };
    }

    throw new Error("Module not found");
  }

  return urlResolve(url, options);
}

export function localResolve(
  specifier: string,
  referrerURL: URL | string,
  options: ResolveOptions,
): Promise<ResolveResult | ModuleResolveResult> {
  if (!options.context) {
    return localRelativeResolve(specifier, referrerURL, options);
  }

  if (options.context.module.kind === "esm") {
    const dependency = options.context.module.dependencies?.find((dep) =>
      dep.specifier === specifier
    );

    if (!dependency) throw new Error("Dependency not found");

    if ("error" in dependency.code) throw new Error(dependency.code.error);

    const normalized = dependency.code.specifier;
    const moduleEntry = options.context.source.modules.find((module) =>
      module.specifier === normalized
    );

    return resolveModuleLike(moduleEntry, options.context.source, options);
  }

  if (options.module === "cjs") {
    return localCjsResolve(specifier, referrerURL, options);
  }

  return localRelativeResolve(specifier, referrerURL, options);
}

async function localCjsResolve(
  specifier: string,
  referrerURL: URL | string,
  options: ResolveOptions,
): Promise<ResolveResult> {
  // a. LOAD_AS_FILE(Y + X)
  const Y = new URL(specifier, referrerURL);
  const context = {
    conditions: options.conditions,
    readFile: (path: string) => {
      const url = toFileUrl(path);

      return options.readFile(url);
    },
    existDir: (path: string) => {
      const url = toFileUrl(path);

      return options.existDir(url);
    },
    existFile: (path: string) => {
      const url = toFileUrl(path);

      return options.existFile(url);
    },
  };
  const filePath = await resolveAsFile(fromFileUrl(Y), context);

  if (typeof filePath === "string") {
    const url = toFileUrl(filePath);
    const mediaType = mediaTypeFromExt(url);

    return { url: toFileUrl(filePath), mediaType, local: filePath };
  }

  // b. LOAD_AS_DIRECTORY(Y + X)
  const dirPath = await resolveAsDirectory(fromFileUrl(Y), context);

  if (typeof dirPath === "string") {
    const url = toFileUrl(dirPath);
    const mediaType = mediaTypeFromExt(url);

    return { url, mediaType, local: dirPath };
  }

  // c. THROW "not found"
  throw new Error(`Cannot find module '${specifier}'`);
}

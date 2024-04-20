import {
  type ModuleResolveResult,
  type ResolveOptions,
  type ResolveResult,
} from "./types.ts";
import { moduleResolve } from "./module_resolve.ts";
import {
  fromFileUrl,
  resolveAsDirectory,
  resolveAsFile,
  toFileUrl,
} from "../deps.ts";
import { mediaTypeFromExt } from "./utils.ts";

async function localRelativeResolve(
  specifier: string,
  referer: URL | string,
  options: ResolveOptions,
): Promise<ResolveResult> {
  const url = new URL(specifier, referer);

  if (await options.existFile(url)) {
    const mediaType = mediaTypeFromExt(url);

    return { url, mediaType };
  }

  throw new Error("Module not found");
}

export async function localResolve(
  specifier: string,
  referrerURL: URL | string,
  options: ResolveOptions,
): Promise<ResolveResult | ModuleResolveResult> {
  if (!options.context) {
    return localRelativeResolve(specifier, referrerURL, options);
  }

  if (options.context.module.kind === "esm") {
    const deps = new Map(
      options.context.module.dependencies?.map((dep) => [dep.specifier, dep]),
    );
    const dependency = deps.get(specifier);

    if (!dependency) throw new Error("Dependency not found");

    if (dependency.npmPackage) throw new Error("not supported");

    const modules = new Map(
      options.context.source.modules.map((
        module,
      ) => [module.specifier, module]),
    );

    if ("error" in dependency.code) throw new Error(dependency.code.error);

    const module = modules.get(dependency.code.specifier);

    if (!module) throw new Error("Module not found");
    if ("error" in module) throw new Error(module.error);

    const result = await moduleResolve(module, options.context.source, options);

    return {
      url: result.url,
      mediaType: result.mediaType,
      context: {
        module,
        source: options.context.source,
      },
    };
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

    return { url: toFileUrl(filePath), mediaType };
  }

  // b. LOAD_AS_DIRECTORY(Y + X)
  const dirPath = await resolveAsDirectory(fromFileUrl(Y), context);

  if (typeof dirPath === "string") {
    const url = toFileUrl(dirPath);
    const mediaType = mediaTypeFromExt(url);

    return { url, mediaType };
  }

  // c. THROW "not found"
  throw new Error(`Cannot find module '${specifier}'`);
}

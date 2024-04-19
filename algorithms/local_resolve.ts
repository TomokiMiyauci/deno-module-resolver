import { type Context, type ResolveResult } from "./types.ts";
import { moduleResolve } from "./module_resolve.ts";
import {
  fromFileUrl,
  resolveAsDirectory,
  resolveAsFile,
  toFileUrl,
} from "../deps.ts";
import { urlResolve } from "./url_resolve.ts";
import { mediaTypeFromExt } from "./utils.ts";

function localRelativeResolve(
  specifier: string,
  referer: URL | string,
  ctx: Context,
) {
  const url = new URL(specifier, referer);

  return urlResolve(url, ctx);
}

export async function localResolve(
  specifier: string,
  referrerURL: URL | string,
  ctx: Context,
): Promise<ResolveResult> {
  if (!ctx.info) {
    return localRelativeResolve(specifier, referrerURL, ctx);
  }

  if (ctx.info.module.kind === "esm") {
    const deps = new Map(
      ctx.info.module.dependencies?.map((dep) => [dep.specifier, dep]),
    );
    const dependency = deps.get(specifier);

    if (!dependency) throw new Error("Dependency not found");

    if (dependency.npmPackage) throw new Error("not supported");

    const modules = new Map(
      ctx.info.source.modules.map((module) => [module.specifier, module]),
    );

    if ("error" in dependency.code) throw new Error(dependency.code.error);

    const module = modules.get(dependency.code.specifier);

    if (!module) throw new Error("Module not found");
    if ("error" in module) throw new Error(module.error);

    const result = await moduleResolve(module, ctx.info.source, ctx);

    return { url: result.url, mediaType: result.mediaType };
  }

  if (ctx.module === "cjs") {
    return localCjsResolve(specifier, referrerURL, ctx);
  }

  const url = new URL(specifier, referrerURL);
  const mediaType = mediaTypeFromExt(url);

  return { url, mediaType };
}

async function localCjsResolve(
  specifier: string,
  referrerURL: URL | string,
  ctx: Context,
): Promise<ResolveResult> {
  // a. LOAD_AS_FILE(Y + X)
  const Y = new URL(specifier, referrerURL);
  const context = {
    conditions: ctx.conditions,
    readFile: (path: string) => {
      const url = toFileUrl(path);

      return ctx.readFile(url);
    },
    existDir: (path: string) => {
      const url = toFileUrl(path);

      return ctx.existDir(url);
    },
    existFile: (path: string) => {
      const url = toFileUrl(path);

      return ctx.existFile(url);
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

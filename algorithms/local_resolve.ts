import {
  type ModuleResolveResult,
  type ResolveOptions,
  type ResolveResult,
} from "./types.ts";
import { urlResolve } from "./url_resolve.ts";
import {
  esmFileFormat,
  format,
  fromFileUrl,
  resolveAsDirectory,
  resolveAsFile,
  toFileUrl,
} from "../deps.ts";
import {
  formatToMediaType,
  mediaTypeFromExt,
  resolveModuleLike,
} from "./utils.ts";
import { Msg } from "./constants.ts";

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

export async function localResolve(
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

  if (
    new URL(referrerURL).protocol === "file:" &&
    options.context.module.kind === "npm"
  ) {
    const format = await esmFileFormat(referrerURL, options);

    if (format === "commonjs") {
      return localCjsResolve(specifier, referrerURL, options);
    }
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
    conditions: options.conditions.cjs,
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
    const format = await esmFileFormat(url, options);
    const mediaType = (format && formatToMediaType(format)) ?? "Unknown";

    return { url: toFileUrl(filePath), mediaType, local: filePath };
  }

  // b. LOAD_AS_DIRECTORY(Y + X)
  const dirPath = await resolveAsDirectory(fromFileUrl(Y), context);

  if (typeof dirPath === "string") {
    const url = toFileUrl(dirPath);
    const format = await esmFileFormat(url, options);
    const mediaType = (format && formatToMediaType(format)) ?? "Unknown";

    return { url, mediaType, local: dirPath };
  }

  const message = format(Msg.ModuleNotFound, { specifier });
  // c. THROW "not found"
  throw new Error(message);
}

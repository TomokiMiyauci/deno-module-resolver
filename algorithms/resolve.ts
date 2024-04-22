import { type Context, type ResolveOptions } from "./types.ts";
import {
  DenoDir,
  exists,
  fromFileUrl,
  type MediaType,
  toFileUrl,
} from "../deps.ts";
import { urlResolve } from "./url_resolve.ts";
import { packageResolve } from "./package_resolve.ts";
import { localResolve } from "./local_resolve.ts";
import { info } from "../modules/deno/info.ts";

const defaults = {
  async readFile(url) {
    try {
      return await Deno.readTextFile(url);
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) return null;
      if (e instanceof Deno.errors.IsADirectory) return null;

      throw e;
    }
  },
  existDir(url) {
    return exists(url, { isDirectory: true });
  },
  existFile(url) {
    return exists(url, { isFile: true });
  },
  async realUrl(url) {
    try {
      const path = fromFileUrl(url);
      const realPath = await Deno.realPath(path);

      return toFileUrl(realPath);
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) return null;

      throw e;
    }
  },
  inspect: info,
} satisfies Omit<ResolveOptions, "conditions" | "npm">;

interface ResolveResult {
  url: URL;
  mediaType: MediaType;
  context?: Context;
}

function resolveOptions(options: Partial<ResolveOptions>): ResolveOptions {
  const module = options.module ?? "esm";

  return {
    readFile: options.readFile?.bind(options) ?? defaults.readFile,
    existDir: options.existDir?.bind(options) ?? defaults.existDir,
    existFile: options.existDir?.bind(options) ?? defaults.existFile,
    realUrl: options.realUrl?.bind(options) ?? defaults.realUrl,
    inspect: options.inspect?.bind(options) ?? defaults.inspect,
    conditions: options.conditions ?? resolveConditions(module),
    npm: { type: "global", denoDir: new DenoDir().root },
    module,
    context: options.context,
  };
}

function resolveConditions(module: "esm" | "cjs"): string[] {
  switch (module) {
    case "esm":
      return ["deno", "node", "import"];
    case "cjs":
      return ["node", "require"];
  }
}

export async function resolve(
  specifier: string,
  referrerURL: URL | string,
  options: Partial<ResolveOptions> = {},
): Promise<ResolveResult> {
  const opt = resolveOptions(options);
  // 1. Let resolved be undefined.
  let resolved: URL;
  let mediaType: MediaType;
  let context: Context | undefined = opt.context;

  if (URL.canParse(specifier)) {
    const result = await urlResolve(specifier, opt);

    resolved = result.url;
    mediaType = result.mediaType;
    context = result.context;
  } else if (
    ["/", "./", "../"].some((value) => specifier.startsWith(value))
  ) {
    const result = await localResolve(specifier, referrerURL, opt);

    resolved = result.url;
    mediaType = result.mediaType;
    if ("context" in result) context = result.context;
  } else if (specifier.startsWith("#")) {
    throw new Error("imports field is not supported in npm module");
    // 1. Set resolved to the result of PACKAGE_IMPORTS_RESOLVE(specifier, parentURL, defaultConditions).
    // resolved = await PACKAGE_IMPORTS_RESOLVE(
    //   specifier as `#${string}`,
    //   referrerURL,
    //   options.conditions,
    //   options,
    // );
  } // 5. Otherwise,
  else {
    // 1. Note: specifier is now a bare specifier.
    // 2. Set resolved the result of PACKAGE_RESOLVE(specifier, parentURL).

    if (!opt.context) throw new Error("outside of package");

    const result = await packageResolve(specifier, {
      ...opt,
      context: opt.context,
    });

    resolved = result.url;
    mediaType = result.mediaType;

    if ("context" in result) context = result.context;
  }

  const realURL = resolved.protocol === "file:"
    ? await opt.realUrl(resolved) ?? resolved
    : resolved;

  return { url: realURL, context, mediaType };
}

import { type Context, type Info } from "./types.ts";
import { moduleResolve } from "./module_resolve.ts";
import {
  extname,
  fromFileUrl,
  isBuiltin,
  type MediaType,
  resolveAsDirectory,
  resolveAsFile,
  toFileUrl,
} from "../deps.ts";
import { urlResolve } from "./url_resolve.ts";

interface ResolveResult {
  url: URL;
  mediaType: MediaType;
  info?: Info;
}

export async function resolve(
  specifier: string,
  referrerURL: URL | string,
  ctx: Context,
): Promise<ResolveResult> {
  // 1. Let resolved be undefined.
  let resolved: URL;
  let mediaType: MediaType | undefined;
  let info: Info | undefined = ctx.info;

  if (URL.canParse(specifier)) {
    const result = await urlResolve(specifier, ctx);

    resolved = result.url;
    info = result.info;
    mediaType = result.mediaType;
  } else if (
    ["/", "./", "../"].some((value) => specifier.startsWith(value))
  ) {
    if (ctx.info) {
      if (ctx.info.module.kind !== "esm") {
        if (ctx.info.module.kind !== "npm") {
          throw new Error();
        }
        if (ctx.module === "cjs") {
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
            resolved = toFileUrl(filePath);
          } else {
            // b. LOAD_AS_DIRECTORY(Y + X)
            const dirPath = await resolveAsDirectory(fromFileUrl(Y), context);

            if (typeof dirPath === "string") {
              resolved = toFileUrl(dirPath);
            } else {
              // c. THROW "not found"
              throw new Error(`Cannot find module '${specifier}'`);
            }
          }
        } else {
          resolved = new URL(specifier, referrerURL);
        }
      } else {
        const deps = new Map(
          ctx.info.module.dependencies?.map((dep) => [dep.specifier, dep]),
        );
        const dependency = deps.get(specifier);

        if (!dependency) throw new Error("Dependency not found");

        if (dependency.npmPackage) {
          throw new Error("not supported");
        }

        const modules = new Map(
          ctx.info.source.modules.map((module) => [module.specifier, module]),
        );

        const module = modules.get(dependency.code.specifier);

        if (!module) throw new Error("Module not found");
        if ("error" in module) throw new Error(module.error);

        const result = await moduleResolve(module, ctx.info.source, ctx);

        resolved = result.url;
        mediaType = result.mediaType;
        info = { module, source: ctx.info.source };
      }
    } else {
      if (ctx.module === "cjs") {
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
          resolved = toFileUrl(filePath);
        } else {
          // b. LOAD_AS_DIRECTORY(Y + X)
          const dirPath = await resolveAsDirectory(fromFileUrl(Y), context);

          if (typeof dirPath === "string") {
            resolved = toFileUrl(dirPath);
          } else {
            // c. THROW "not found"
            throw new Error(`Cannot find module '${specifier}'`);
          }
        }
      } else {
        resolved = new URL(specifier, referrerURL);
      }
    }
  } else if (specifier.startsWith("#")) {
    throw new Error("imports field is not supported in npm module");
    // 1. Set resolved to the result of PACKAGE_IMPORTS_RESOLVE(specifier, parentURL, defaultConditions).
    // resolved = await PACKAGE_IMPORTS_RESOLVE(
    //   specifier as `#${string}`,
    //   referrerURL,
    //   ctx.conditions,
    //   ctx,
    // );
  } // 5. Otherwise,
  else {
    // 1. Note: specifier is now a bare specifier.
    // 2. Set resolved the result of PACKAGE_RESOLVE(specifier, parentURL).
    if (isBuiltin(specifier)) {
      resolved = new URL(`node:${specifier}`);
    } else {
      if (!ctx.info) throw new Error("f");

      if (ctx.info.module.kind !== "npm") throw new Error();

      const npm = ctx.info.source.npmPackages[ctx.info.module.npmPackage];

      if (!npm) throw new Error();

      const { name, subpath } = parseNpmPkg(specifier);

      let pkg: string;
      if (npm.name === name) {
        pkg = `npm:/${npm.name}@${npm.version}${subpath.slice(1)}`;
      } else {
        const depsMap = new Map<string, string>(
          npm.dependencies.map((nameWithVersion) => {
            const name = extractName(nameWithVersion);
            return [name, nameWithVersion];
          }),
        );

        const nameWithVer = depsMap.get(name);

        if (!nameWithVer) {
          console.log("no name with version", specifier);

          pkg = `npm:/${specifier}${subpath.slice(1)}`;
        } else {
          const dep = ctx.info.source.npmPackages[nameWithVer];

          pkg = `npm:/${dep.name}@${dep.version}${subpath.slice(1)}`;
        }
      }

      const result = await urlResolve(pkg, ctx);
      resolved = result.url;
      mediaType = result.mediaType;
      info = result.info;
    }
  }

  let realURL = resolved;

  if (resolved.protocol === "file:") {
    realURL = await ctx.realUrl(resolved);

    if (!mediaType) {
      mediaType = mediaTypeFromExt(realURL);
    }
  }

  return { url: realURL, info, mediaType: mediaType ?? "Unknown" };
}

function parseNpmPkg(specifier: string) {
  const index = specifier.startsWith("@")
    ? secondIndexOf(specifier, "/")
    : specifier.indexOf("/");

  const name = index === -1 ? specifier : specifier.slice(0, index);

  return {
    name,
    subpath: `.${specifier.slice(name.length)}`,
  };
}

export function secondIndexOf(input: string, searchString: string): number {
  const firstIndex = input.indexOf(searchString);

  if (firstIndex === -1) return -1;

  return input.indexOf(searchString, firstIndex + 1);
}

function extractName(input: string): string {
  const at = input.startsWith("@")
    ? secondIndexOf(input, "@")
    : input.indexOf("@");
  return at === -1 ? input : input.slice(0, at);
}

function mediaTypeFromExt(url: URL): MediaType {
  const ext = extname(url);

  switch (ext) {
    case ".js":
      return "JavaScript";
    case ".ts":
      return "TypeScript";

    case ".tsx":
      return "TSX";

    case ".jsx":
      return "JSX";

    case ".mjs":
      return "Mjs";

    case ".cjs":
      return "Cjs";

    case ".json":
      return "Json";

    case ".wasm":
      return "Wasm";

    case ".tsbuildinfo":
      return "TsBuildInfo";

    case ".map":
      return "SourceMap";

    default:
      return "Unknown";
  }
}

import { type Context } from "./types.ts";
import { moduleResolve } from "./module_resolve.ts";
import {
  fromFileUrl,
  resolveAsDirectory,
  resolveAsFile,
  toFileUrl,
} from "../deps.ts";

export async function localResolve(
  specifier: string,
  referrerURL: URL | string,
  ctx: Context,
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

        if (typeof filePath === "string") return { url: toFileUrl(filePath) };

        // b. LOAD_AS_DIRECTORY(Y + X)
        const dirPath = await resolveAsDirectory(fromFileUrl(Y), context);

        if (typeof dirPath === "string") {
          return { url: toFileUrl(dirPath) };
        }

        // c. THROW "not found"
        throw new Error(`Cannot find module '${specifier}'`);
      }

      return { url: new URL(specifier, referrerURL) };
    } else {
      const deps = new Map(
        ctx.info.module.dependencies?.map((dep) => [dep.specifier, dep]),
      );
      const dependency = deps.get(specifier);

      if (!dependency) throw new Error("Dependency not found");

      if (dependency.npmPackage) throw new Error("not supported");

      const modules = new Map(
        ctx.info.source.modules.map((module) => [module.specifier, module]),
      );

      const module = modules.get(dependency.code.specifier);

      if (!module) throw new Error("Module not found");
      if ("error" in module) throw new Error(module.error);

      const result = await moduleResolve(module, ctx.info.source, ctx);

      return {
        url: result.url,
        mediaType: result.mediaType,
        info: {
          module,
          source: ctx.info.source,
        },
      };
    }
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

    if (typeof filePath === "string") return { url: toFileUrl(filePath) };

    // b. LOAD_AS_DIRECTORY(Y + X)
    const dirPath = await resolveAsDirectory(fromFileUrl(Y), context);

    if (typeof dirPath === "string") {
      return { url: toFileUrl(dirPath) };
    }

    // c. THROW "not found"
    throw new Error(`Cannot find module '${specifier}'`);
  }

  return { url: new URL(specifier, referrerURL) };
}

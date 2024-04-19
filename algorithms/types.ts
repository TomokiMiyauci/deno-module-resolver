import { MediaType, Module, SourceFileInfo } from "../deps.ts";

export interface Context {
  readFile(url: URL): Promise<string | null>;
  conditions: Iterable<string>;
  existDir(url: URL): Promise<boolean>;
  existFile(url: URL): Promise<boolean>;
  realUrl(url: URL): Promise<URL | null | undefined> | URL | null | undefined;

  getInfo(specifier: string): Promise<SourceFileInfo>;

  info?: Info;
  npm?: NpmOptions;

  /**
   * @default esm
   */
  module?: "esm" | "cjs";
}

export interface Info {
  source: SourceFileInfo;
  module: Module;
}

interface NpmGlobalOptions {
  type: "global";
  denoDir: string;
}

interface NpmLocalOptions {
  type: "local";
  baseURL: URL;
}

export type NpmOptions = NpmGlobalOptions | NpmLocalOptions;

export interface ResolveResult {
  url: URL;
  mediaType: MediaType;
}

import { ModuleEntry, SourceFileInfo } from "../modules/deno/info.ts";

export interface Context {
  readFile(url: URL): Promise<string | null>;
  conditions: Iterable<string>;
  existDir(url: URL): Promise<boolean>;
  existFile(url: URL): Promise<boolean>;
  realUrl(url: URL): Promise<URL>;

  info?: Info;
  npm?: NpmOptions;
}

export interface Info {
  source: SourceFileInfo;
  module: ModuleEntry;
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

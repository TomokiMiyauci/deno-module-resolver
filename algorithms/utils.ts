import { extname, type MediaType } from "../deps.ts";

export function mediaTypeFromExt(url: URL): MediaType {
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

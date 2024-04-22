# deno-module-resolver

Deno module resolution algorithms

Reimplement Deno's module resolution and resolve specifier to `file:`, `data:`
or `node:` URL.

## Usage

In Default, use the global cache to resolve modules.

```ts
import { resolve } from "jsr:@miyauci/deno-module-resolver";
import { assertEquals } from "jsr:@std/assert";

const result = await resolve("npm:react@^18", import.meta.url);

assertEquals(
  result.url,
  new URL(
    "file:///path/to/deno_dir/npm/registry.npm.js.org/react/18.2.0/index.js",
  ),
);

const child = await resolve("loose-envify", result.url, {
  context: result.context,
});

assertEquals(
  child.url,
  new URL(
    "file:///path/to/deno_dir/npm/registry.npm.js.org/loose-envify/1.4.0/index.js",
  ),
);
```

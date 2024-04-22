# [1.0.0-beta.2](https://github.com/TomokiMiyauci/deno-module-resolver/compare/1.0.0-beta.1...1.0.0-beta.2) (2024-04-22)


### Features

* use external deps from single file ([ba9731f](https://github.com/TomokiMiyauci/deno-module-resolver/commit/ba9731fdbfe3650c5d2161aa48e35eeb2b61a2fb))

# 1.0.0-beta.1 (2024-04-22)


### Bug Fixes

* **algorithms:** fix to return module from local resolver ([2f20ed7](https://github.com/TomokiMiyauci/deno-module-resolver/commit/2f20ed7de3d801888bee87f63a3c629f92b9b97a))


### Features

* **algorithms:** rename interface, rename field name ([d7e6be8](https://github.com/TomokiMiyauci/deno-module-resolver/commit/d7e6be89efc1f78ed42bcf45a1f1cf61f828313c))
* **npm_resolve:** add parsing for subpath ([d0cbc85](https://github.com/TomokiMiyauci/deno-module-resolver/commit/d0cbc850f674391e016a82eb8fa87d7296de1477))
* **resolve:** add detecting media type ([a7a578b](https://github.com/TomokiMiyauci/deno-module-resolver/commit/a7a578b35de40813595e10c66eb4b29d686d2380))
* **resolve:** change return value of info interface ([0361651](https://github.com/TomokiMiyauci/deno-module-resolver/commit/03616514485eece103f54c5fa49d09b2ef2cd999))


### Performance Improvements

* **package_resolve:** improve performance to avoid calling inspect if the specifier in npm module ([8f703ac](https://github.com/TomokiMiyauci/deno-module-resolver/commit/8f703ace642ac0ca9ec63e9aecf6df3132cb9a9a))

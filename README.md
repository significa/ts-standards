# @significa/ts-standards

Significa's shared [Biome](https://biomejs.dev) config and tsconfig presets, in one package with one version.

## Setup

```sh
pnpm add -D -E @significa/ts-standards @biomejs/biome@2.6 typescript@6.0
```

`biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.6.6/schema.json",
  "extends": ["@significa/ts-standards/biome"]
}
```

`tsconfig.json`, with the [preset](#tsconfig-presets) for your stack:

```json
{
  "extends": "@significa/ts-standards/tsconfig/react",
  "include": ["src"]
}
```

That is the whole setup. Fix with `pnpm exec biome check --write .` and verify with `pnpm exec biome ci .` and `pnpm exec tsc`.

## What Biome enforces

Biome's recommended rules, plus the ones below. React, test and Tailwind rules turn on by themselves when those packages are in your `package.json`.

Errors fail CI:

- No floating promises (`noFloatingPromises`). An unawaited promise swallows its errors.
- No `console.log` (`noConsole`). `console.error` and `console.warn` are allowed, and so is anything in a `scripts/` folder.
- No `any` (`noExplicitAny`). Use `unknown` and narrow.
- No non-null assertions (`noNonNullAssertion`). Guard or narrow instead of using `!`.
- Throw only `Error` objects (`useThrowOnlyError`), so you keep the stack trace.
- Kebab-case file names (`useFilenamingConvention`), `.astro` files included. `routes/` folders are exempt, for file-based routers.
- File extensions on relative imports (`useImportExtensions`). See [Imports](#imports).

Warnings never fail CI. They flag code worth a second look:

- Misused promises (`noMisusedPromises`), non-exhaustive switches (`useExhaustiveSwitchCases`) and useless type assertions (`noUselessTypeAssertion`).
- Import cycles (`noImportCycles`) and deprecated imports (`noDeprecatedImports`).
- Barrel files (`noBarrelFile`, `noReExportAll`).
- Overly complex functions (`noExcessiveCognitiveComplexity`, threshold 25).

Turned off:

- Array index as a React key (`noArrayIndexKey`).
- Label without a control (`noLabelWithoutControl`). Biome lints source, so it can't see that a component like `<Checkbox />` renders an input, or label text passed through props. In component code its errors are mostly false positives, and an accessibility check on the rendered page (e.g. axe in Playwright) covers label association properly.

Formatting: double quotes, semicolons, trailing commas, 2-space indent, line width 100, sorted imports. Markdown and YAML are formatted too.

In `.astro` files the unused-import and unused-variable checks are off, because Biome only reads their frontmatter.

Build output, `node_modules`, `coverage` and generated route trees are already ignored. Tailwind v4 CSS parses without extra config.

### Good to know

- **Update Biome together with this package.** The preset is tested against one Biome minor (2.6), because some of its rules are still experimental and can be renamed in a minor release.
- **Ignoring more files:** your `files.includes` is added after the preset's list, so add exclusions only, e.g. `["!drizzle"]`. Don't start the list with `"**"`.
- **Monorepos:** put one `biome.json` at the root. A nested `biome.json` must contain `{ "extends": "//" }`.
- **Leaving Markdown alone:** `"markdown": { "formatter": { "enabled": false } }`.
- **Coding agents:** `biome ci --reporter=concise` gives compact output.

### Tailwind class sorting

Opt in per project, because Biome needs the path to the CSS file with your `@theme` to sort custom classes. `cn`, `clsx`, `cva` and `tv` are recognised by default.

```json
{
  "tailwind": { "stylesheet": "./src/styles.css" },
  "linter": {
    "rules": {
      "nursery": { "useTailwindSortedClasses": { "level": "error", "fix": "safe" } }
    }
  }
}
```

### Editor

Install the Biome extension for [VS Code](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) or Zed and enable format on save.

## tsconfig presets

All are strict and type-check only (`noEmit`). Beyond `strict`, they set `noUncheckedIndexedAccess`, `noImplicitReturns`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly` and `allowImportingTsExtensions`.

| Preset  | For                            | Notes                                                                      |
| ------- | ------------------------------ | -------------------------------------------------------------------------- |
| `react` | Vite React, TanStack Start     | Includes DOM and `vite/client` types. Needs `vite` installed.              |
| `astro` | Astro                          | Already includes the project and `.astro/types.d.ts`; no `include` needed. |
| `node`  | Node services, CLIs, scripts   | Node ≥ 24 (26 recommended). Needs `@types/node`.                           |
| `base`  | Runtime-agnostic code, Workers | No runtime globals, not even `console`. Add your runtime's types.          |

Use it as `"extends": "@significa/ts-standards/tsconfig/<preset>"`.

### Good to know

- **`types` replaces, it doesn't merge.** If you set `types` in your tsconfig, re-list the preset's, e.g. `["vite/client", "node"]`.
- **Astro with React islands:** add `"jsx": "react-jsx"` and `"jsxImportSource": "react"` to `compilerOptions`.
- **Node runs TypeScript directly**, which shapes the `node` preset:
  - `"type": "module"` in `package.json`.
  - `#/` imports need Node ≥ 24.14.
  - JSON imports need an attribute: `import data from "./data.json" with { type: "json" };`.
  - A service that compiles with `tsc` to `dist` must set `"rewriteRelativeImportExtensions": true` in its emitting tsconfig, otherwise TS5096. That only rewrites relative imports, so `#/` imports stay `.ts` in the output: use relative imports in code you compile with `tsc`.

## Imports

Every relative and `#/` import names the real file, extension included:

```ts
import { format } from "./format.ts";
import { Button } from "#/ui/button/button.tsx";
```

Aliases are [subpath imports](https://nodejs.org/api/packages.html#subpath-imports) in `package.json`, set exactly like this:

```json
{ "imports": { "#/*": "./src/*" } }
```

Not `"./src/*.ts"`, which breaks `.tsx` files, and not an array, which breaks Vite. No tsconfig `paths` needed. TypeScript, Vite, esbuild and Node all read this field, but only Vite resolves a `#/` import without its extension.

Biome flags a relative import without an extension and its safe fix adds it, including `./dir` to `./dir/index.ts` and `./format.js` to `./format.ts`. It fixes tsconfig `paths` aliases (`@/a` to `@/a.ts`) and `.astro` frontmatter too. It skips `#/` imports, because it doesn't read `package.json` `imports`, so `tsc` catches those.

To make VS Code auto-imports write `.ts` and `.tsx`, set `"typescript.preferences.importModuleSpecifierEnding": "js"`. The `node` preset doesn't need it.

## TypeScript versions

The presets support TypeScript 6 and 7. Use 6.0.x for now. We'll revisit when TypeScript 7.1 is stable and Astro's tooling supports it.

## Versioning

The package stays in `0.x`, and a minor version may change lint rules or compiler options. Pin the exact version. The [release notes](https://github.com/significa/ts-standards/releases) are the changelog and carry the upgrade steps.

`@significa/biome-config` and `@significa/tsconfig` are deprecated. Replace them with this package.

## Development

`pnpm check` lints the repo. `pnpm test` type-checks every preset with TypeScript 6 and 7 and runs the Biome preset against fixtures.

To release, [create a GitHub release](https://github.com/significa/ts-standards/releases/new) with a `v*` tag and a matching title. CI publishes to npm.

## License

MIT. See [LICENSE](./LICENSE).

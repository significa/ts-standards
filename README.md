# @significa/ts-standards

Significa's shared [Biome](https://biomejs.dev) config and tsconfig presets, in one package with one version.

## Install

```sh
pnpm add -D -E @significa/ts-standards @biomejs/biome typescript@6
```

Needs Biome 2.6 and TypeScript 6 or 7. Both are optional peers, so skip the one you don't use.

## Biome

Create `biome.json` at the project root:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.6.6/schema.json",
  "extends": ["@significa/ts-standards/biome"]
}
```

Fix with `pnpm exec biome check --write .` and verify with `pnpm exec biome ci .`. Use `biome ci --reporter=concise` for compact output that's easier for coding agents to read.

The preset is tested against one Biome minor (2.6) and enables nursery rules that can change in a minor release. Update Biome together with ts-standards.

CI fails on errors only. Warnings flag rules with known false positives or code worth a second look, and never block a merge.

### What it enforces

Biome's recommended rules are on. React, test and Tailwind rules turn on by themselves when those packages are in your `package.json`.

Errors (fail CI):

- No floating promises (`noFloatingPromises`). An unawaited promise swallows its errors.
- No `console.log` (`noConsole`). `console.error` and `console.warn` are allowed, and `scripts/` is exempt (at any depth).
- No `any` (`noExplicitAny`). Use `unknown` and narrow.
- No non-null assertions (`noNonNullAssertion`). Guard or narrow instead of using `!`.
- Throw only `Error` objects (`useThrowOnlyError`), so you keep the stack trace.
- No statements that do nothing (`noUnusedExpressions`).
- Kebab-case file names (`useFilenamingConvention`). `routes/` is exempt for file-based routers (at any depth). This also applies to `.astro` files; see [Astro](#astro).

Warnings:

- Misused promises (`noMisusedPromises`), non-exhaustive switches (`useExhaustiveSwitchCases`) and useless type assertions (`noUselessTypeAssertion`).
- Import cycles (`noImportCycles`) and deprecated imports (`noDeprecatedImports`).
- Barrel files (`noBarrelFile`, `noReExportAll`).
- Overly complex functions (`noExcessiveCognitiveComplexity`, threshold 25).

Turned off:

- Array index as React key (`noArrayIndexKey`). Static lists and skeletons key by index legitimately.

Some custom label components trip `noLabelWithoutControl`. Suppress that line with a one-line reason.

Formatting: double quotes, semicolons, trailing commas, 2-space indent, line width 100, sorted imports. Markdown and YAML are formatted too; to leave Markdown alone, add `"markdown": { "formatter": { "enabled": false } }`.

Tip: write exhaustiveness checks as `void (x satisfies never);`. A bare `x satisfies never;` fails `noUnusedExpressions`.

### Ignoring files

The preset already ignores build output (`dist`, `build`, `.next`, `.astro`, `.wrangler`, …), `node_modules`, `coverage` and `routeTree.gen.ts`. Your `files.includes` is added after the preset's list, so only add exclusions:

```json
{ "files": { "includes": ["!drizzle", "!src/lib/db/migrations"] } }
```

Don't start the list with `"**"`: it re-includes everything the preset ignores.

### Monorepos

Put one `biome.json` at the repo root that extends the preset. Each nested `biome.json` must inherit from it, or Biome errors with "Found a nested root configuration":

```json
{ "extends": "//" }
```

### Astro

Biome only sees the frontmatter of `.astro` files, so it flags variables used only in the template. Turn those rules off for Astro files:

```json
{
  "overrides": [
    {
      "includes": ["**/*.astro"],
      "linter": {
        "rules": { "correctness": { "noUnusedVariables": "off", "noUnusedImports": "off" } }
      }
    }
  ]
}
```

Astro projects often use PascalCase components, which the kebab-case rule rejects. To allow both in `.astro` files:

```json
{
  "overrides": [
    {
      "includes": ["**/*.astro"],
      "linter": {
        "rules": {
          "style": {
            "useFilenamingConvention": {
              "level": "error",
              "options": { "filenameCases": ["kebab-case", "PascalCase"] }
            }
          }
        }
      }
    }
  ]
}
```

(Merge this into the same `overrides` array as above.)

### Tailwind class sorting

Opt in per project. Point `stylesheet` at the CSS file with your `@theme`, so custom classes sort correctly. The file must exist, or Biome fails to load the config. `cn`, `clsx`, `cva` and `tv` are recognised by default.

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

### Editor setup

Install the Biome extension for [VS Code](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) or Zed. For VS Code, in `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "source.organizeImports.biome": "explicit",
    "source.fixAll.biome": "explicit"
  }
}
```

## tsconfig presets

Pick one by stack. All are strict and type-check only (`noEmit`).

| Preset  | For                            |
| ------- | ------------------------------ |
| `react` | Vite React, TanStack Start     |
| `astro` | Astro                          |
| `node`  | Node services, CLIs, scripts   |
| `base`  | Runtime-agnostic code, Workers |

Setting `types` in your tsconfig replaces the preset's list instead of merging, so re-list them (e.g. `["vite/client", "node"]`).

### react

```json
{
  "extends": "@significa/ts-standards/tsconfig/react",
  "include": ["src", "vite.config.ts"]
}
```

Includes `vite/client` types, so `import.meta.env` and `import "./styles.css"` type-check. Needs `vite` installed.

### astro

```json
{
  "extends": "@significa/ts-standards/tsconfig/astro"
}
```

Already includes the project and `.astro/types.d.ts`. With React islands, add `"jsx": "react-jsx"` and `"jsxImportSource": "react"` to `compilerOptions`.

### node

```json
{
  "extends": "@significa/ts-standards/tsconfig/node",
  "include": ["src"]
}
```

Supports Node ≥ 24. Node 26 is recommended for new projects. Also needs:

- `@types/node` installed.
- JSON imports need an import attribute: `import data from "./data.json" with { type: "json" };`.
- `"type": "module"` in `package.json`.
- Local imports with the `.ts` extension.
- [Subpath imports](https://nodejs.org/api/packages.html#subpath-imports) for aliases, since Node doesn't read `paths`: `"imports": { "#/*": "./src/*" }`, then `import { x } from "#/x.ts"`.

### base

```json
{
  "extends": "@significa/ts-standards/tsconfig/base",
  "include": ["src"]
}
```

Has no runtime globals, not even `console` or `fetch`. Add your runtime's types, e.g. `"types": ["@cloudflare/workers-types"]`.

## TypeScript versions

The presets support TypeScript 6 and 7. Use 6.0.x for now. We'll revisit when TypeScript 7.1 is stable and Astro's tooling supports it.

## Upgrading from 0.1.0

1. Bump Biome to ≥ 2.6 and run `pnpm exec biome migrate --write`.
2. Run `pnpm exec biome format --write .` and commit the formatting changes on their own.
3. Run `pnpm exec biome ci .` and fix the new errors listed above, or turn a rule down in your `biome.json` with a reason.
4. Remove settings the preset now covers: Tailwind directives parsing, ignores for `.wrangler`, `.tanstack` and `routeTree.gen.ts`, and `noArrayIndexKey: "off"`.
5. `base` and `node` no longer include DOM types. Under `base`, add a `types` entry for your runtime.
6. `exactOptionalPropertyTypes` is off. Set it back to `true` in your tsconfig if you relied on it.
7. In `react`, remove `allowImportingTsExtensions`; the preset has it. Remove `types` only if it is exactly `["vite/client"]`. If it lists other types too, keep `vite/client` in it, because your list replaces the preset's.

Still on `@significa/biome-config` or `@significa/tsconfig`? Both are deprecated. Replace them with this package and follow the steps above.

## Versioning

The package stays in `0.x`, and a minor version may change lint rules or compiler options. Pin the exact version.

## Development

`pnpm check` lints the repo. `pnpm test` type-checks every preset with TypeScript 6 and 7 and runs the Biome preset against fixtures.

To release, [create a GitHub release](https://github.com/significa/ts-standards/releases/new) with a `v*` tag and a matching title. CI publishes to npm. The release notes are the changelog.

## License

MIT. See [LICENSE](./LICENSE).

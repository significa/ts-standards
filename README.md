# @significa/ts-standards

Significa's shared TypeScript / JavaScript standards: the [Biome](https://biomejs.dev) config and the tsconfig presets, in one package with one version.

CI (Biome + tsc + Knip in GitHub Actions) lives in [`significa/actions`](https://github.com/significa/actions): see its [`typescript-quality.yaml`](https://github.com/significa/actions/blob/main/.github/workflows/typescript-quality.yaml) reusable workflow. Knip config is per project.

## Install

```sh
pnpm add -D -E @significa/ts-standards @biomejs/biome typescript@6
```

Requires Biome ≥ 2.6 and TypeScript 6 or 7 (see [TypeScript versions](#typescript-versions)). Both are optional peers: skip the one you don't use.

## Biome

`biome.json` at the project root:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.6.6/schema.json",
  "extends": ["@significa/ts-standards/biome"]
}
```

Run `pnpm exec biome check --write .` to fix, `pnpm exec biome ci .` to verify. **`biome ci` fails only on errors; warnings never fail CI.** So errors are rules we want enforced, and warnings are only for rules with known false positives or architecture smells worth a look. Agents: add `--reporter=concise` for one line per diagnostic.

### Errors

- Biome's `recommended` preset, plus the `project` domain (import/module-graph rules). Other domains (`react`, `test`, `tailwind`, …) turn on by themselves from your `package.json` dependencies, so a Node service doesn't get React rules.
- `nursery.noFloatingPromises`: an un-awaited promise loses its errors (a common AI-generated bug).
- `suspicious.noConsole` (allows `console.error` / `console.warn`): stray `console.log` shouldn't ship. Off under `**/scripts/**`.
- `suspicious.noExplicitAny`: use `unknown` and narrow.
- `style.noNonNullAssertion`: `!` hides the `undefined` that `noUncheckedIndexedAccess` surfaces; guard or narrow instead.
- `style.useThrowOnlyError`: throwing strings/objects loses the stack trace.
- `suspicious.noUnusedExpressions`: a statement that does nothing is usually a bug. Exhaustiveness checks are written `void (value satisfies never);`, not `value satisfies never;`.
- `style.useFilenamingConvention`: `kebab-case`, ASCII only. Off under `**/routes/**` (TanStack file routes: `$postId.tsx`, `-components.tsx`, `api.users.$id.ts`). `[...path].astro`, `[slug].ts`, `*.preview.tsx`, `*.d.ts` and `vite.config.ts` already pass.

### Warnings

- `nursery.noMisusedPromises`: false positive on `if (promiseOrNull)`.
- `nursery.useExhaustiveSwitchCases`, `nursery.noUselessTypeAssertion`: young type-aware rules.
- `suspicious.noImportCycles`, `suspicious.noDeprecatedImports`: worth fixing, not worth blocking a deploy.
- `performance.noBarrelFile`, `performance.noReExportAll`: barrels slow bundlers and tests, but some (e.g. a Drizzle `schema/index.ts`) are fine.
- `complexity.noExcessiveCognitiveComplexity` (threshold 25): flags god-functions without being pedantic.

### Off

- `suspicious.noArrayIndexKey`: static lists and skeletons legitimately key by index.
- `a11y.noLabelWithoutControl` stays on (default options). Its `inputComponents` option can't fix the known false positive (Foundations' `Field.Label` renders a `<label htmlFor>` whose text comes through `{...props}`), and `labelComponents` doesn't support `Field.Label`-style names. Suppress that one line with a reason.

### Formatting and files

- Double quotes (JS and JSX), semicolons always, trailing commas everywhere, 2-space indent, line width 100.
- `organizeImports` on.
- `css.parser.tailwindDirectives` on (harmless without Tailwind).
- Ignored: `.astro`, `.output`, `.vite`, `.next`, `.tanstack`, `.wrangler`, `dist`, `build`, `coverage`, `node_modules`, `routeTree.gen.ts`, `.claude/settings.local.json`.
- No VCS integration: `vcs.useIgnoreFile` errors when the folder holding `biome.json` has no `.gitignore`. Turn it on in your own config if you want `.gitignore` respected.

### Overriding

Your `biome.json` merges on top of the preset. Rules and options override; **`files.includes` is appended after the preset's list, not replaced.** So:

- Add only exclusions: `"includes": ["!drizzle", "!src/lib/db/migrations"]`. The preset's ignores still apply; don't re-list them.
- Never start your list with `"**"`: it comes after the preset's exclusions and re-includes all of them (Biome flags this with `noBiomeFirstException`).
- A positive pattern like `"src/**"` doesn't narrow anything, because the preset already included `"**"`. Pass paths on the command line instead.

Monorepos: one `biome.json` at the repo root extends the preset. Nested `biome.json` files must set `"extends": "//"` (inherit the root) or `"root": false`, otherwise Biome errors with "Found a nested root configuration".

Astro: Biome lints only the frontmatter of `.astro` files and can't see template usage, so it warns on variables and imports used only in the template. To silence:

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

### Tailwind class sorting

Opt in per project (nursery rule; the stylesheet path is project-specific). `cn`/`clsx` and `cva`/`tv` are recognised by default (`tailwind.mergeFunctions`, `tailwind.variantFunctions`); add your own there if they're named differently.

```json
{
  "$schema": "https://biomejs.dev/schemas/2.6.6/schema.json",
  "extends": ["@significa/ts-standards/biome"],
  "tailwind": {
    "stylesheet": "./src/styles.css"
  },
  "linter": {
    "rules": {
      "nursery": {
        "useTailwindSortedClasses": { "level": "error", "fix": "safe" }
      }
    }
  }
}
```

`stylesheet` points at the CSS file with your `@theme` / `@utility`, so custom classes sort correctly.

### Editor setup

VSCode: install the [Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome), then in `.vscode/settings.json`:

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

Zed: install the `biome` extension, then in your settings:

```json
{
  "code_actions_on_format": {
    "source.organizeImports.biome": true,
    "source.fixAll.biome": true
  },
  "lsp": {
    "biome": {
      "settings": { "require_config_file": true }
    }
  }
}
```

## tsconfig presets

All strict, all `noEmit` (tsc only type-checks), all allow `.ts` import specifiers. No default: pick by stack. Only `astro` sets `include`; the others leave it to you.

| Preset  | For                            | `lib`       | `types`       | `jsx`       | `module`   |
| ------- | ------------------------------ | ----------- | ------------- | ----------- | ---------- |
| `react` | Vite React, TanStack Start     | ES2023, DOM | `vite/client` | `react-jsx` | `preserve` |
| `astro` | Astro                          | ES2023, DOM | none          | `preserve`  | `preserve` |
| `node`  | Node services, CLIs, scripts   | ES2025      | `node`        | none        | `NodeNext` |
| `base`  | Runtime-agnostic code, Workers | ES2023      | none          | none        | `preserve` |

Shared options: `strict`, `noUncheckedIndexedAccess`, `noImplicitReturns`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `isolatedModules`, `moduleDetection: force`, `resolveJsonModule`, `allowImportingTsExtensions`, `skipLibCheck`.

`types` replaces, it doesn't merge: since TS 6 it defaults to `[]`, so any `@types/*` globals you need (e.g. `node`, `vitest/globals`) must be listed, and a `types` in your tsconfig must re-list the preset's (e.g. `["vite/client", "node"]`).

### `react`

```json
{
  "extends": "@significa/ts-standards/tsconfig/react",
  "include": ["src", "vite.config.ts"]
}
```

`vite/client` types `import.meta.env` and side-effect imports like `import "./styles.css"` (without it, TS 6's `noUncheckedSideEffectImports` rejects them). Requires `vite` installed.

### `astro`

Pre-includes `${configDir}/.astro/types.d.ts` and `${configDir}/**/*`, excludes `${configDir}/dist`.

```json
{
  "extends": "@significa/ts-standards/tsconfig/astro",
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

With React islands, add `"jsx": "react-jsx"` and `"jsxImportSource": "react"` to `compilerOptions`.

### `node`

```json
{
  "extends": "@significa/ts-standards/tsconfig/node",
  "include": ["src", "scripts"]
}
```

Requires Node ≥ 24 (native type stripping), `@types/node`, and `"type": "module"` in `package.json`. Import local files with their `.ts` extension. For aliases use [subpath imports](https://nodejs.org/api/packages.html#subpath-imports) (`"imports": { "#/*": "./src/*" }` in `package.json`, then `import { x } from "#/x.ts"`), not `paths`: Node doesn't read `paths`.

### `base`

```json
{
  "extends": "@significa/ts-standards/tsconfig/base",
  "include": ["src"]
}
```

Declares no runtime globals at all: not `document`, not `console`, `setTimeout` or `URL`. Add your runtime's types, e.g. `"types": ["@cloudflare/workers-types"]`. Most projects want `react`, `astro` or `node` instead.

## TypeScript versions

The presets support TypeScript `^6.0.0 || ^7.0.0`, and CI checks every preset on both. **Use TypeScript 6.0.x for now**, Astro and non-Astro projects alike, until TS 7.1 is stable and Astro's tooling (`@astrojs/check`, the language server) supports TS 7. Revisit when TS 7.1 ships.

## Upgrading from 0.1.0

1. Bump `@biomejs/biome` to ≥ 2.6 and run `pnpm exec biome migrate --write`.
2. Run `pnpm exec biome ci .`. New errors: `noConsole` (`log`/`info`/`debug`), `noExplicitAny`, `noNonNullAssertion`, `useThrowOnlyError`, `noUnusedExpressions` (rewrite `x satisfies never;` as `void (x satisfies never);`), `useFilenamingConvention` (rename to kebab-case). Fix them, or turn a rule down in your `biome.json` with a reason.
3. Delete what the preset now covers: `css.parser.tailwindDirectives`, ignores for `.wrangler` / `.tanstack` / `routeTree.gen.ts`, `noArrayIndexKey: "off"`, and the `suppressions/unused` warnings Biome now reports.
4. `base` and `node` no longer include the DOM lib. Code that used `document`/`window` there was wrong; code that used `console`, `fetch` or `URL` under `base` needs a `types` entry for its runtime.
5. `exactOptionalPropertyTypes` is off. Some `"key" in obj` narrowing on object-literal unions gets weaker without it (TS fills the missing optional keys with `undefined`); narrow on a discriminant, or set it back to `true` in your tsconfig.
6. In `react`, `vite/client` is now in the preset, and `allowImportingTsExtensions` is on everywhere: drop them from your tsconfig unless you re-list `types`.

Still on `@significa/biome-config` or `@significa/tsconfig`? Both are deprecated: remove them, install this package, switch `extends` to `@significa/ts-standards/biome` and `@significa/ts-standards/tsconfig/<preset>`, then follow the steps above.

## Development

`pnpm check` runs Biome on the repo. `pnpm test` type-checks `fixtures/{base,react,astro,node}` with TS 6 and TS 7 (expected errors are marked `@ts-expect-error`) and lints `fixtures/biome`, asserting exactly the errors listed in `scripts/test.mjs`.

## Versioning

One version covers both configs. It stays in `0.x` with **no semver guarantees**: a minor bump may change lint behaviour or compiler options. Pin exactly (`pnpm add -E`). We bump when Biome or TypeScript ship something worth adopting, or to roll a config change out to every project.

## Releasing

[Create a release on GitHub](https://github.com/significa/ts-standards/releases/new) with a `v*` tag and a matching title (e.g. `v0.3.0`). Publishing it triggers CI, which stamps the version from the tag and publishes to npm via the [`npm-library.yaml`](https://github.com/significa/actions/blob/main/.github/workflows/npm-library.yaml) reusable workflow.

The GitHub release notes are the changelog. `package.json`'s `version` stays at `0.0.1-development`; never bump it by hand.

## License

MIT. See [LICENSE](./LICENSE).

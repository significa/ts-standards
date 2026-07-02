# @significa/ts-standards

Significa's shared TypeScript / JavaScript standards: the [Biome](https://biomejs.dev) config and the tsconfig presets, in one package with one version.

The CI side (running Biome + tsc + Knip in GitHub Actions) is shipped by [`significa/actions`](https://github.com/significa/actions) — see its [`typescript-quality.yaml`](https://github.com/significa/actions/blob/main/.github/workflows/typescript-quality.yaml) reusable workflow. Knip configuration is per-project; see Knip's docs.

## Install

```sh
pnpm add -D -E @significa/ts-standards @biomejs/biome typescript
```

## Biome config

Create `biome.json` at your project root:

```json
{
  "extends": ["@significa/ts-standards/biome"]
}
```

Add overrides as needed — they merge on top of the shared config. What it sets:

- Recommended rules across the `project`, `react`, and `test` domains.
- Double quotes (JS and JSX), semicolons always, trailing commas everywhere.
- Space indent, line width 100.
- `organizeImports` on (alphabetical, named-imports sorted, preserves blank-line groups).
- `console.*` warns (not error — so it doesn't fail CI; bump per-project if you want).
- `noFloatingPromises` errors — catches unhandled async calls (a common AI-generated bug).
- `noExcessiveCognitiveComplexity` warns at threshold 25 — catches god-functions without being pedantic.
- Build/cache directories ignored: `.astro`, `.output`, `.vite`, `.next`, `dist`, `build`, `coverage`, `node_modules`, plus `.claude/settings.local.json`.

### Editor setup

VSCode — install the [Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome), then in `.vscode/settings.json`:

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

Zed — install the `biome` extension (`cmd-shift-p` → "zed: extensions"), then in your settings:

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

`require_config_file: true` prevents Biome from running on projects that don't have a `biome.json`.

### Tailwind class sorting

Not enabled by default (it's a nursery rule and the `functions` array is project-specific). To opt in:

```json
{
  "extends": ["@significa/ts-standards/biome"],
  "linter": {
    "rules": {
      "nursery": {
        "useSortedClasses": {
          "level": "warn",
          "fix": "safe",
          "options": { "functions": ["cn", "cva"] }
        }
      }
    }
  }
}
```

## tsconfig presets

Four variants, all strict, all `noEmit` (Biome handles syntax; tsc handles type-checking only). There is no default — pick the one matching your stack.

### `tsconfig/base` — neutral foundation

Strict mode, `target: ES2023`, `module: preserve`, `noEmit`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`. **No DOM lib, no JSX, no `allowImportingTsExtensions`.** Pick this only if your code is truly runtime-agnostic (rare). Most projects extend `react`, `astro`, or `node` directly.

```json
{
  "extends": "@significa/ts-standards/tsconfig/base",
  "include": ["src"]
}
```

### `tsconfig/react` — TanStack Start, Vite React

Extends `base`. Adds DOM lib, `jsx: react-jsx`, `allowImportingTsExtensions`.

```json
{
  "extends": "@significa/ts-standards/tsconfig/react",
  "include": ["src", "vite.config.ts"]
}
```

### `tsconfig/astro` — Astro projects

Extends `base`. Adds DOM lib, `jsx: preserve`, `allowImportingTsExtensions`. Pre-includes `${configDir}/.astro/types.d.ts` and `${configDir}/**/*`, excludes `dist`.

```json
{
  "extends": "@significa/ts-standards/tsconfig/astro",
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### `tsconfig/node` — Drizzle scripts, CLIs, tsx-run code, API-only services

Extends `base`. Swaps to `module: NodeNext` + `moduleResolution: NodeNext`, adds `types: ["node"]`. No DOM lib (the `base` default is fine for Node).

```json
{
  "extends": "@significa/ts-standards/tsconfig/node",
  "include": ["src", "scripts"]
}
```

## Versioning

One version covers both configs — "the Significa standards vX". It stays in `0.x` indefinitely with **no semver guarantees** — minor bumps may change lint behavior or flip compiler options. Pin exactly (`pnpm add -E`) if you want reproducibility. We bump when Biome or TypeScript releases new versions or when we want a config change to roll out to all consumers.

This package supersedes `@significa/biome-config` and `@significa/tsconfig`, which are deprecated on npm.

## Releasing

Like every other Significa library: [create a release on GitHub](https://github.com/significa/ts-standards/releases/new) with a `v*` tag and a matching title (e.g. `v0.3.0`), and publishing it triggers CI, which stamps the version from the tag and publishes via the [`npm-library.yaml`](https://github.com/significa/actions/blob/main/.github/workflows/npm-library.yaml) reusable workflow.

The GitHub release notes are the changelog. The `version` field in `package.json` stays at `0.0.1-development` — never bump it manually.

## License

MIT. See [LICENSE](./LICENSE).

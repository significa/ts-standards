# @significa/biome-config

Significa's shared [Biome](https://biomejs.dev) configuration.

- Recommended rules across the `project`, `react`, and `test` domains.
- Double quotes (JS and JSX), semicolons always, trailing commas everywhere.
- Space indent, line width 100.
- `organizeImports` on (alphabetical, named-imports sorted, preserves blank-line groups).
- `console.*` warns (not error — so it doesn't fail CI; bump per-project if you want).
- `noFloatingPromises` errors — catches unhandled async calls (a common AI-generated bug).
- `noExcessiveCognitiveComplexity` warns at threshold 25 — catches god-functions without being pedantic.
- Build/cache directories ignored: `.astro`, `.output`, `.vite`, `.next`, `dist`, `build`, `coverage`, `node_modules`.

## Install

```sh
pnpm add -D -E @significa/biome-config @biomejs/biome
```

## Use

Create `biome.json` at your project root:

```json
{
  "extends": ["@significa/biome-config"]
}
```

That's it. Add overrides as needed — they merge on top of the shared config.

## Editor setup

### VSCode

Install the [Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome), then in `.vscode/settings.json`:

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

### Zed

Install the `biome` extension (`cmd-shift-p` → "zed: extensions"), then in your settings:

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

## Tailwind class sorting

Not enabled by default (it's a nursery rule and the `functions` array is project-specific). To opt in:

```json
{
  "extends": ["@significa/biome-config"],
  "linter": {
    "rules": {
      "nursery": {
        "useSortedClasses": {
          "level": "warn",
          "fix": "safe",
          "options": {
            "functions": ["cn", "cva"]
          }
        }
      }
    }
  }
}
```

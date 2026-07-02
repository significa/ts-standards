# Changelog

## 0.2.0 — 2026-07-02

- `base`: add `noImplicitReturns`, `exactOptionalPropertyTypes`, and `noPropertyAccessFromIndexSignature`. All variants inherit these. `exactOptionalPropertyTypes` may surface new errors in consuming projects when assigning explicit `undefined` to optional properties.

## 0.1.0 — 2026-05-25

- Initial release. Four variants: `base` (strict, neutral foundation — no DOM, no JSX), `react` (extends base, adds DOM + `jsx: react-jsx`), `astro` (extends base, adds DOM + `jsx: preserve` + Astro includes), `node` (extends base, NodeNext + node types).

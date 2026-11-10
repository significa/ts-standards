// Runs every fixture as a consumer would. tsc fixtures assert expected errors with
// `@ts-expect-error`, so a clean exit means both the passes and the failures held.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";

const fixtures = join(import.meta.dirname, "..", "fixtures");
const bin = (path) => join(fixtures, "node_modules", path);

const compilers = [
  { name: "TS 6", tsc: bin("typescript/bin/tsc") },
  { name: "TS 7", tsc: bin("typescript7/bin/tsc") },
];
const biome = bin("@biomejs/biome/bin/biome");
const tsconfigFixtures = ["base", "react", "astro", "node"];

// Every error biome must report in each Biome fixture. Anything else fails, warnings included.
const biomeFixtures = {
  biome: [
    "fail/PascalCase.astro lint/style/useFilenamingConvention",
    "fail/PascalCase.ts lint/style/useFilenamingConvention",
    "fail/barrel.ts lint/performance/noBarrelFile",
    "fail/console-log.ts lint/suspicious/noConsole",
    "fail/explicit-any.ts lint/suspicious/noExplicitAny",
    "fail/extensionless-import.ts lint/correctness/useImportExtensions",
    "fail/floating-promise.ts lint/nursery/noFloatingPromises",
    "fail/non-null.ts lint/style/noNonNullAssertion",
    "fail/re-export-all.ts lint/performance/noBarrelFile",
    "fail/re-export-all.ts lint/performance/noReExportAll",
    "fail/throw-string.ts lint/style/useThrowOnlyError",
  ],
  "biome-astro": [
    "fail/extensionless-import.astro lint/correctness/useImportExtensions",
    "fail/unsorted-class.astro lint/nursery/useTailwindSortedClasses",
    "fail/unused-import.astro lint/correctness/noUnusedImports",
    "fail/unused-variable.astro lint/correctness/noUnusedVariables",
  ],
};

let failures = 0;

function report(ok, label, details = "") {
  console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
  if (!ok) {
    failures++;
    if (details) console.log(details.replace(/^/gm, "     "));
  }
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.error) return { status: null, output: result.error.message };
  return { status: result.status, output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim() };
}

for (const { name, tsc } of compilers) {
  const version = run(process.execPath, [tsc, "--version"], fixtures).output;
  for (const fixture of tsconfigFixtures) {
    const { status, output } = run(process.execPath, [tsc, "-p", "."], join(fixtures, fixture));
    report(status === 0, `${name} (${version}) tsconfig/${fixture}`, output);
  }
}

// The installed Biome must be the minor the preset targets: its $schema URL and the peer range.
// Only major.minor is compared, so patch bumps pass while a new minor fails until the preset moves.
const root = join(import.meta.dirname, "..");
const readJson = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const parseVersion = (text) => (text?.match(/(\d+)\.(\d+)\.(\d+)/) ?? []).slice(1, 4).map(Number);
const compareVersions = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
const installedBiome = parseVersion(run(process.execPath, [biome, "--version"], fixtures).output);
const schemaBiome = parseVersion(readJson("biome/biome.json").$schema);
const [peerMin, peerMax] = readJson("package.json")
  .peerDependencies["@biomejs/biome"].split(" ")
  .map(parseVersion);
const sameMinor = installedBiome[0] === schemaBiome[0] && installedBiome[1] === schemaBiome[1];
const inPeerRange =
  compareVersions(installedBiome, peerMin) >= 0 && compareVersions(installedBiome, peerMax) < 0;
report(
  sameMinor && inPeerRange,
  `biome ${installedBiome.join(".")} matches the preset $schema and peer range`,
  `$schema: ${schemaBiome.join(".")}, peer range: >=${peerMin.join(".")} <${peerMax.join(".")}`,
);

for (const [fixture, expectedErrors] of Object.entries(biomeFixtures)) {
  const dir = join(fixtures, fixture);
  const { status, output } = run(process.execPath, [biome, "ci", ".", "--reporter=github"], dir);
  // A warning keeps its prefix, so it can never stand in for an expected error.
  const actualErrors = [...output.matchAll(/^::(error|warning) title=([^,]+),file=([^,]+),/gm)].map(
    ([, severity, rule, file]) => {
      const diagnostic = `${relative(dir, file).replaceAll("\\", "/")} ${rule}`;
      return severity === "error" ? diagnostic : `warning: ${diagnostic}`;
    },
  );
  const missing = expectedErrors.filter((error) => !actualErrors.includes(error));
  const unexpected = actualErrors.filter((error) => !expectedErrors.includes(error));
  report(
    status === 1 && missing.length === 0 && unexpected.length === 0,
    `${fixture} fixture (${expectedErrors.length} expected errors, pass/ clean)`,
    [...missing.map((e) => `missing:    ${e}`), ...unexpected.map((e) => `unexpected: ${e}`)].join(
      "\n",
    ) || output,
  );
}

console.log(failures ? `\n${failures} failed` : "\nall passed");
process.exit(failures ? 1 : 0);

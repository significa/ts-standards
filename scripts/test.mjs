// Runs every fixture as a consumer would. tsc fixtures assert expected errors with
// `@ts-expect-error`, so a clean exit means both the passes and the failures held.
import { spawnSync } from "node:child_process";
import { join, relative } from "node:path";

const fixtures = join(import.meta.dirname, "..", "fixtures");
const bin = (path) => join(fixtures, "node_modules", path);

const compilers = [
  { name: "TS 6", tsc: bin("typescript/bin/tsc") },
  { name: "TS 7", tsc: bin("typescript7/bin/tsc") },
];
const biome = bin("@biomejs/biome/bin/biome");
const tsconfigFixtures = ["base", "react", "astro", "node"];

// Every error biome must report in fixtures/biome. Anything else fails, warnings included.
const expectedBiomeErrors = [
  "fail/PascalCase.astro lint/style/useFilenamingConvention",
  "fail/PascalCase.ts lint/style/useFilenamingConvention",
  "fail/console-log.ts lint/suspicious/noConsole",
  "fail/explicit-any.ts lint/suspicious/noExplicitAny",
  "fail/floating-promise.ts lint/nursery/noFloatingPromises",
  "fail/non-null.ts lint/style/noNonNullAssertion",
  "fail/throw-string.ts lint/style/useThrowOnlyError",
];

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

const biomeDir = join(fixtures, "biome");
const { status, output } = run(process.execPath, [biome, "ci", ".", "--reporter=github"], biomeDir);
// A warning keeps its prefix, so it can never stand in for an expected error.
const actualBiomeErrors = [
  ...output.matchAll(/^::(error|warning) title=([^,]+),file=([^,]+),/gm),
].map(([, severity, rule, file]) => {
  const diagnostic = `${relative(biomeDir, file).replaceAll("\\", "/")} ${rule}`;
  return severity === "error" ? diagnostic : `warning: ${diagnostic}`;
});
const missing = expectedBiomeErrors.filter((error) => !actualBiomeErrors.includes(error));
const unexpected = actualBiomeErrors.filter((error) => !expectedBiomeErrors.includes(error));
report(
  status === 1 && missing.length === 0 && unexpected.length === 0,
  `biome fixture (${expectedBiomeErrors.length} expected errors, pass/ clean)`,
  [...missing.map((e) => `missing:    ${e}`), ...unexpected.map((e) => `unexpected: ${e}`)].join(
    "\n",
  ) || output,
);

console.log(failures ? `\n${failures} failed` : "\nall passed");
process.exit(failures ? 1 : 0);

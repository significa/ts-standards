import { readFile } from "node:fs/promises";
import { double } from "#/math.ts";
import { triple } from "./math.ts";

// @ts-expect-error -- node has no DOM lib
document.title = "x";

const union = new Set([1]).union(new Set([2]));
const raw = await readFile(new URL(import.meta.url), "utf8");

const sizes: number[] = [];
// @ts-expect-error -- noUncheckedIndexedAccess: sizes[0] is number | undefined
const firstSize: number = sizes[0];

export const result = double(union.size) + triple(raw.length) + firstSize;

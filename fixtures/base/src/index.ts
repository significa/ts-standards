// @ts-expect-error -- `#/` imports must name the file; tsc doesn't add extensions
import { greet as greetExtensionless } from "#/greet";
import { greet as greetAlias } from "#/greet.ts";
import { badge } from "#/ui/badge.ts";
import data from "./data.json";
import { greet } from "./greet.ts";

// @ts-expect-error -- base has no DOM lib
document.title = greet(data.name);

const list: string[] = [];
// @ts-expect-error -- noUncheckedIndexedAccess: list[0] is string | undefined
const first: string = list[0];

export { first };
export const labels = [badge(greetAlias("alias")), greetExtensionless];

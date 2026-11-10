// Biome skips `#/` imports (tsc catches them). If this fails, update the README's Imports section.
import { sides } from "#/exhaustive";

export const circle = sides({ kind: "circle" });

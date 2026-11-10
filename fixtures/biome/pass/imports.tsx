import { join } from "node:path";
import { sides } from "./exhaustive.ts";
import { List } from "./list.tsx";

export function Sides() {
  return <List items={[join("shapes", String(sides({ kind: "square" })))]} />;
}

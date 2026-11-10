import { helper as helperAlias } from "#/helper.ts";
import { card } from "#/ui/card.tsx";
import { helper } from "./helper.ts";

const title: string = document.title;
helper(title);
document.body.innerHTML = card(String(helperAlias(title)));

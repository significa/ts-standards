import "./styles.css";
import { shout } from "#/format.ts";
import { Button } from "#/ui/button.tsx";

type AppProps = { label?: string };

function App({ label }: AppProps) {
  const links: string[] = [];
  for (const link of document.querySelectorAll("a")) {
    links.push(link.href);
  }
  // @ts-expect-error -- noUncheckedIndexedAccess: links[0] is string | undefined
  const firstLink: string = links[0];
  return (
    <a href={firstLink}>
      {label ?? import.meta.env.MODE} {[...new URLSearchParams("a=1").keys()].join()}
      <Button label={shout("go")} />
    </a>
  );
}

export { App };

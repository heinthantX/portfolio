export type AmbientVariant = "sheets" | "field" | "graph" | "packets";

const under = (p: string, root: string) => p === root || p.startsWith(`${root}/`);

export function variantForPath(pathname: string): AmbientVariant | null {
  if (under(pathname, "/work")) return "sheets";
  if (under(pathname, "/notes")) return "field";
  if (under(pathname, "/resume") || under(pathname, "/uses")) return "graph";
  if (under(pathname, "/contact")) return "packets";
  return null;
}

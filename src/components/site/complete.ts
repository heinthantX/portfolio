/**
 * Shell-style tab completion. `matches` are the candidates that extend `input` (case-insensitive);
 * `common` is their longest shared prefix, which a first Tab fills in before cycling.
 */
export function complete(input: string, candidates: readonly string[]) {
  const stem = input.toLowerCase();
  if (!stem) return { matches: [] as string[], common: input };
  const matches = candidates.filter(
    (c) => c.length > stem.length && c.toLowerCase().startsWith(stem),
  );
  if (matches.length === 0) return { matches, common: input };
  let common = matches[0];
  for (const m of matches) {
    let k = 0;
    while (k < common.length && k < m.length && common[k].toLowerCase() === m[k].toLowerCase()) k++;
    common = common.slice(0, k);
  }
  return { matches, common: common.length > input.length ? common : input };
}

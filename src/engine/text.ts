export function formatNumber(v: number): string {
  if (!Number.isFinite(v)) return String(v);
  return String(Math.round(v * 100) / 100);
}

/** Replace {key} with vars[key]. Numbers go through `format`; unknown keys stay literal. */
export function interpolate(
  template: string,
  vars: Record<string, string | number>,
  format: (key: string, v: number) => string = (_k, v) => formatNumber(v),
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (!(key in vars)) return match;
    const v = vars[key];
    return typeof v === "number" ? format(key, v) : v;
  });
}

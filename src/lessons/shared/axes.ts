export type Range = [number, number];

export function niceStep(span: number, count: number): number {
  const raw = span / Math.max(1, count);
  const pow = 10 ** Math.floor(Math.log10(raw));
  const m = raw / pow;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * pow;
}

/** A tidy domain that contains `values`, with round tick marks. */
export function niceDomain(values: number[], count = 5): { domain: Range; ticks: number[] } {
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const step = niceStep(hi - lo, count);
  const domain: Range = [Math.floor(lo / step) * step, Math.ceil(hi / step) * step];
  if (domain[0] === lo && lo !== 0) domain[0] -= step;
  if (domain[1] === hi) domain[1] += step;
  const ticks: number[] = [];
  for (let v = domain[0]; v <= domain[1] + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return { domain, ticks };
}

/**
 * The part of y = slope·x + intercept inside the box (y padded by 5 %), in data units.
 * Clipping keeps the true angle; clamping each end separately would bend a steep line.
 */
export function clipLine(
  line: { slope: number; intercept: number },
  [x0, x1]: Range,
  [y0, y1]: Range,
): [[number, number], [number, number]] | null {
  if (!Number.isFinite(line.slope) || !Number.isFinite(line.intercept)) return null;
  const pad = (y1 - y0) * 0.05;
  const lo = y0 - pad;
  const hi = y1 + pad;
  const f = (x: number) => line.slope * x + line.intercept;
  let a = x0;
  let b = x1;
  if (line.slope !== 0) {
    const xa = (lo - line.intercept) / line.slope;
    const xb = (hi - line.intercept) / line.slope;
    a = Math.max(x0, Math.min(xa, xb));
    b = Math.min(x1, Math.max(xa, xb));
  } else if (line.intercept < lo || line.intercept > hi) {
    return null;
  }
  if (!(a < b)) return null;
  return [
    [a, f(a)],
    [b, f(b)],
  ];
}

export type RGB = [number, number, number];

export const hex = (h: string): RGB => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerpRgb = (a: RGB, b: RGB, t: number): RGB =>
  [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const rgba = (c: RGB | string, a: number) => {
  const [r, g, b] = typeof c === 'string' ? hex(c) : c;
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
};
export const deg = (rad: number) => ((rad * 180) / Math.PI).toFixed(1);

// SVG 圆弧（屏幕坐标系，角度顺时针增大）
export const arcPath = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} ${sweep} ${x1} ${y1}`;
};

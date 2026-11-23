// 真实折射计算：光程 t(x) = n1·|AP| + n2·|PB|，P 为分界面上的点
export const OPTICS = {
  A: {x: 380, y: 240},
  B: {x: 1460, y: 820},
  surfaceY: 600,
  n1: 1.0,
  n2: 1.33,
  xMin: 200,
  xMax: 1720,
  count: 61,
  edgePhase: 64, // 最外侧路径相对最优路径的相位差（弧度），控制螺线圈数
} as const;

export type Candidate = {i: number; x: number; dt: number; phase: number; coherence: number};

const travel = (x: number) => {
  const {A, B, surfaceY, n1, n2} = OPTICS;
  return n1 * Math.hypot(x - A.x, surfaceY - A.y) + n2 * Math.hypot(B.x - x, B.y - surfaceY);
};

const argmin = (f: (x: number) => number, lo: number, hi: number) => {
  const g = (Math.sqrt(5) - 1) / 2;
  let a = lo, b = hi;
  for (let k = 0; k < 90; k++) {
    const c = b - g * (b - a), d = a + g * (b - a);
    if (f(c) < f(d)) b = d; else a = c;
  }
  return (a + b) / 2;
};

const solve = () => {
  const {A, B, surfaceY, xMin, xMax, count, edgePhase} = OPTICS;
  const xOpt = argmin(travel, xMin, xMax);
  const tMin = travel(xOpt);
  const xs = Array.from({length: count}, (_, i) => xMin + ((xMax - xMin) * i) / (count - 1));
  const dts = xs.map((x) => travel(x) - tMin);
  const k = edgePhase / Math.max(...dts);
  const candidates: Candidate[] = xs.map((x, i) => {
    const phase = k * dts[i];
    return {i, x, dt: dts[i], phase, coherence: Math.exp(-Math.pow(phase / Math.PI, 2))};
  });
  const theta1 = Math.atan2(Math.abs(xOpt - A.x), surfaceY - A.y);
  const theta2 = Math.atan2(Math.abs(B.x - xOpt), B.y - surfaceY);
  return {xOpt, tMin, k, candidates, theta1, theta2};
};

export const SOLVED = solve(); // 模块级计算一次，确定性

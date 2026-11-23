import {random} from 'remotion';
import {noise2D} from '@remotion/noise';

export const STORM = {O: {x: 260, y: 470}, T: {x: 1660, y: 470}, steps: 42, floor: 868, drawDur: 12} as const;

const TAGS = [
  'PLAN v03', 'PLAN v17', 'PLAN v36_FINAL',
  'DRAFT_02', 'DRAFT_08', 'REWRITE #3', 'DRAFT_14',
  'commit "fix"', 'commit "fix again"', 'debug #48', 'v37_final_final', 'commit "really fix"',
];

export type Attempt = {j: number; start: number; pts: {x: number; y: number}[]; tag?: string};

// 一组尝试：越往后越密（加速）
const burst = (at: number, n: number, spread: number) =>
  Array.from({length: n}, (_, k) => at + Math.round(spread * Math.pow(k / Math.max(1, n), 0.75)));

export const makeAttempts = (c: {plan: number; content: number; code: number; tried: number}): Attempt[] => {
  const starts = [...burst(c.plan, 3, 40), ...burst(c.content, 9, 50), ...burst(c.code, 24, 50), ...burst(c.tried, 110, 45)];
  return starts.map((start, j) => {
    const missR = 90 + random(`S01-miss-r-${j}`) * 230;
    const ang = random(`S01-miss-a-${j}`) * Math.PI * 2;
    const end = {x: STORM.T.x + Math.cos(ang) * missR, y: STORM.T.y + Math.sin(ang) * missR * 0.8};
    const amp = (random(`S01-amp-${j}`) * 2 - 1) * 260;
    const dx = end.x - STORM.O.x, dy = end.y - STORM.O.y, len = Math.hypot(dx, dy);
    const nx = -dy / len, ny = dx / len;
    const pts = Array.from({length: STORM.steps + 1}, (_, i) => {
      const s = i / STORM.steps, env = Math.sin(Math.PI * s);
      const off = amp * env + 90 * noise2D(`S01-walk-${j}`, s * 3.5, 0) * env;
      return {x: STORM.O.x + dx * s + nx * off, y: STORM.O.y + dy * s + ny * off};
    });
    return {j, start, pts, tag: j < TAGS.length ? TAGS[j] : undefined};
  });
};

export type Ash = {x0: number; y0: number; vx: number; vy0: number; floor: number; delay: number; tLand: number; glint: boolean};
const G = 0.55;

export const makeAsh = (attempts: Attempt[]): Ash[] =>
  attempts.flatMap((a) =>
    a.pts.filter((_, i) => i % 2 === 0).map((p, i) => {
      const id = `${a.j}-${i}`;
      const vy0 = -random(`S01-ash-vy-${id}`) * 2;
      // 落点散布到大半个屏幕（500–940），吸附到网格时满屏可见
      const floor = Math.max(500 + random(`S01-ash-f-${id}`) * 440, p.y + 30);
      const h = Math.max(0, floor - p.y);
      const tLand = (-vy0 + Math.sqrt(vy0 * vy0 + 2 * G * h)) / G;
      return {
        x0: p.x, y0: p.y, vx: (random(`S01-ash-vx-${id}`) - 0.5) * 1.2, vy0, floor,
        delay: Math.round(random(`S01-ash-d-${id}`) * 10), tLand,
        glint: random(`S01-ash-g-${id}`) < 0.02, // 少数伏笔火星
      };
    }),
  );

// 闭式解：位置是帧的纯函数，逐帧可复现
export const ashAt = (a: Ash, t: number) => {
  if (t <= 0) return {x: a.x0, y: a.y0};
  const tt = Math.min(t, a.tLand);
  return {x: a.x0 + a.vx * tt, y: Math.min(a.floor, a.y0 + a.vy0 * tt + 0.5 * G * tt * tt)};
};

import {random} from 'remotion';

// 冷开场几何：A→B 一条直线（用户反馈：开场不用折射、不做水体分区）
export const HERO = {count: 320, samples: 64, maxAmp: 380, comets: 40} as const;
export const HERO_A = {x: 420, y: 470};
export const HERO_B = {x: 1480, y: 620};

const abLen = Math.hypot(HERO_B.x - HERO_A.x, HERO_B.y - HERO_A.y);

// 沿最优光路（直线）按弧长参数 s∈[0,1] 取点
export const optimalAt = (s: number) => ({
  x: HERO_A.x + (HERO_B.x - HERO_A.x) * s,
  y: HERO_A.y + (HERO_B.y - HERO_A.y) * s,
});

export const NORMAL = {x: -(HERO_B.y - HERO_A.y) / abLen, y: (HERO_B.x - HERO_A.x) / abLen};

export type HeroPath = {
  i: number; amp: number; seed: string; tint: number; delay: number; comet: boolean; cometPhase: number;
};

export const HERO_PATHS: HeroPath[] = Array.from({length: HERO.count}, (_, i) => {
  const r = random(`S01-hero-amp-${i}`) * 2 - 1;
  const amp = Math.sign(r) * Math.pow(Math.abs(r), 0.8) * HERO.maxAmp;
  return {
    i,
    amp,
    seed: `S01-hero-noise-${i}`,
    tint: random(`S01-hero-tint-${i}`),
    delay: Math.round((Math.abs(amp) / HERO.maxAmp) * 9), // 由内向外错峰坍缩，像拉链合上
    comet: i % Math.round(HERO.count / HERO.comets) === 0,
    cometPhase: random(`S01-hero-comet-${i}`),
  };
});

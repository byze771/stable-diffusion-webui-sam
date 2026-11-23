import type {CSSProperties} from 'react';
import {Easing} from 'remotion';

export const CANVAS = {width: 1920, height: 1080, fps: 30} as const;

export const COLOR = {
  ink: '#06070A',     // 背景墨黑
  core: '#FFF4E0',    // 光核暖白
  amber: '#FFB54A',   // 主光：最优路径 / 主线 / 高手 / 终点
  cyan: '#7FE7FF',    // 辅光：子波 / 支线 / 存档 / AI
  reject: '#5B6B7C',  // 淘汰：被抵消 / 作废
  alert: '#C8553D',   // 警示：错误路径，全片 ≤ 6 次
  water: '#0C1A24',   // 水体，仅 S01–S02
  white: '#FFFFFF',
} as const;

export const OPACITY = {
  text: 0.92,
  label: 0.6,
  footnote: 0.5,
  reject: 0.25,
  grid: 0.04,
  grain: 0.07,     // overlay 混合下视觉约等于 3%
  vignette: 0.35,  // 边缘压暗
} as const;

export const FONT = {
  serif: '"Noto Serif SC", "Source Han Serif SC", serif',
  sans: '"Noto Sans SC", "Source Han Sans SC", sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
} as const;

// 规则：英文标注在源码里直接写大写，不使用 textTransform（避免 θ 被转成 Θ）
export const TYPE = {
  gold:      {fontFamily: FONT.serif, fontWeight: 900, fontSize: 112, letterSpacing: '0.04em', lineHeight: 1.3},
  title:     {fontFamily: FONT.serif, fontWeight: 900, fontSize: 200, letterSpacing: '0.06em', lineHeight: 1},
  subtitle:  {fontFamily: FONT.sans,  fontWeight: 500, fontSize: 52,  letterSpacing: '0.02em', lineHeight: 1},
  label:     {fontFamily: FONT.mono,  fontWeight: 400, fontSize: 22,  letterSpacing: '0.12em'},
  labelSm:   {fontFamily: FONT.mono,  fontWeight: 400, fontSize: 16,  letterSpacing: '0.12em'},
  data:      {fontFamily: FONT.mono,  fontWeight: 500, fontSize: 40,  letterSpacing: '0.02em'},
  chapterNo: {fontFamily: FONT.serif, fontWeight: 900, fontSize: 28},
  chapter:   {fontFamily: FONT.sans,  fontWeight: 500, fontSize: 24,  letterSpacing: '0.08em'},
  footnote:  {fontFamily: FONT.sans,  fontWeight: 500, fontSize: 18,  letterSpacing: '0.02em'},
} satisfies Record<string, CSSProperties>;

export const LAYOUT = {
  safeX: 120,
  safeY: 80,
  chapter: {x: 80, y: 72},
  subtitleBaseline: 968,
  subtitleZone: {top: 900, bottom: 1010}, // 此区域禁止放主图形
  grid: 40,
} as const;

export const MOTION = {
  easeIn: Easing.bezier(0.16, 1, 0.3, 1),   // 入场：快进慢停
  easeOut: Easing.bezier(0.7, 0, 0.84, 0),  // 出场
  spring: {damping: 18, stiffness: 120},
  dur: {small: 10, main: 20, camera: 45, subtitleIn: 6, subtitleOut: 4, goldSweep: 18},
  phaseSpeed: 0.12, // 相位箭头的角速度（弧度/帧）
} as const;

import React, {useLayoutEffect, useRef} from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {CANVAS, COLOR, MOTION} from '../../design/tokens';
import {clamp01, hex, lerpRgb, rgba} from '../../design/utils';
import {HERO, HERO_A, HERO_B, HERO_PATHS, NORMAL, optimalAt} from './heroPaths';

const cReject = hex(COLOR.reject), cCyan = hex(COLOR.cyan), cAmber = hex(COLOR.amber);
const OPT = Array.from({length: HERO.samples + 1}, (_, k) => optimalAt(k / HERO.samples));
const ENV = OPT.map((_, k) => Math.sin((Math.PI * k) / HERO.samples)); // 两端固定在 A、B

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const HeroField: React.FC<{collapseAt: number}> = ({collapseAt}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const {width: W, height: H} = CANVAS;

  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drift = frame * 0.008;
    const charge = 1 + 0.7 * clamp01((frame - (collapseAt - 30)) / 30); // 坍缩前蓄力变亮

    for (const p of HERO_PATHS) {
      const k = interpolate(frame, [collapseAt + p.delay, collapseAt + p.delay + 14], [0, 1], {easing: MOTION.easeIn, ...clampOpt});
      if (k >= 1) continue; // 已并入光束
      const outer = Math.abs(p.amp) / HERO.maxAmp;
      const base = lerpRgb(cReject, cCyan, p.tint * (1 - outer * 0.6));
      const col = lerpRgb(base, cAmber, k);
      const alpha = Math.min(0.9, (0.05 + 0.17 * (1 - outer)) * charge * (1 - k) + 0.35 * Math.sin(Math.PI * k));

      const pts = OPT.map((o, j) => {
        const off = (p.amp + 70 * noise2D(p.seed, j * 0.05, drift)) * ENV[j] * (1 - k);
        return {x: o.x + NORMAL.x * off, y: o.y + NORMAL.y * off};
      });

      ctx.strokeStyle = rgba(col, alpha);
      ctx.lineWidth = 0.8 + 1.2 * (1 - outer) + 1.5 * k;
      ctx.shadowColor = rgba(col, 0.8);
      ctx.shadowBlur = 6 + 14 * k;
      ctx.beginPath();
      pts.forEach((pt, j) => (j ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
      ctx.stroke();

      // 流光点：让第 0 帧就有运动
      if (p.comet) {
        const s = (p.cometPhase + frame * 0.011) % 1;
        const pt = pts[Math.round(s * HERO.samples)];
        ctx.fillStyle = rgba(COLOR.core, 0.9 * (1 - k));
        ctx.shadowColor = rgba(cCyan, 1);
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 最优光束：外层辉光 / 琥珀中层 / 暖白光核（全片统一参数）
    const beam = clamp01((frame - collapseAt - 8) / 8);
    if (beam > 0) {
      const stroke = (w: number, color: string, blur: number) => {
        ctx.lineWidth = w; ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = blur;
        ctx.beginPath();
        ctx.moveTo(HERO_A.x, HERO_A.y);
        ctx.lineTo(HERO_B.x, HERO_B.y);
        ctx.stroke();
      };
      stroke(16, rgba(cAmber, 0.1 * beam), 40);
      stroke(5, rgba(cAmber, 0.55 * beam), 18);
      stroke(1.6, rgba(COLOR.core, 0.95 * beam), 6);
    }

    // 命中光环：B 点和入射点各一圈
    const f = frame - collapseAt - 14;
    if (f >= 0 && f < 26) {
      const t = f / 26;
      for (const c of [HERO_B, HERO_A]) {
        ctx.strokeStyle = rgba(cAmber, 0.55 * (1 - t));
        ctx.lineWidth = 2 * (1 - t) + 0.5;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 30 + Math.pow(t, 0.6) * 520, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
  }, [frame, collapseAt, W, H]);

  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}} />;
};

import React, {useLayoutEffect, useRef} from 'react';
import {useCurrentFrame} from 'remotion';
import {CANVAS, COLOR, MOTION} from '../../design/tokens';
import {clamp01, hex, lerp, lerpRgb, rgba} from '../../design/utils';
import {OPTICS, SOLVED} from './optics';

const drawArrow = (ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, len: number, color: string) => {
  const dx = Math.cos(ang) * len * 0.5, dy = Math.sin(ang) * len * 0.5;
  const ex = x + dx, ey = y + dy;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - dx, y - dy); ctx.lineTo(ex, ey);
  for (const s of [1, -1]) {
    const a = ang + s * (Math.PI * 0.82);
    ctx.moveTo(ex, ey); ctx.lineTo(ex + Math.cos(a) * 5, ey + Math.sin(a) * 5);
  }
  ctx.stroke();
};

// progress ∈ [0,1]：0 表示所有路径一起试，1 表示收敛成一条
export const FanCanvas: React.FC<{progress: number}> = ({progress}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const {width: W, height: H} = CANVAS;

  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    const {A, B, surfaceY} = OPTICS;
    const {candidates, xOpt} = SOLVED;
    const cReject = hex(COLOR.reject), cCyan = hex(COLOR.cyan), cAmber = hex(COLOR.amber);

    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'lighter'; // 光的叠加用加色混合

    for (const c of candidates) {
      const coh = c.coherence;
      const a = lerp(0.26, 0.035 + 0.62 * coh, progress);
      const tCyan = clamp01(coh * 1.6) * progress;
      const tAmber = clamp01((coh - 0.55) / 0.45) * progress;
      const col = lerpRgb(lerpRgb(cReject, cCyan, tCyan), cAmber, tAmber);

      ctx.strokeStyle = rgba(col, a);
      ctx.lineWidth = 1 + 1.4 * coh * progress;
      ctx.shadowColor = rgba(col, 0.9);
      ctx.shadowBlur = 14 * coh * progress;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y); ctx.lineTo(c.x, surfaceY); ctx.lineTo(B.x, B.y);
      ctx.stroke();

      // 相位箭头：位于入射段 58% 处，角度 = 相位 + 公共角速度
      const f = 0.58;
      drawArrow(ctx, A.x + (c.x - A.x) * f, A.y + (surfaceY - A.y) * f, c.phase + frame * MOTION.phaseSpeed, 15, rgba(col, Math.min(1, a * 1.8)));
    }

    // 最优光束：宽辉光 / 琥珀中层 / 暖白光核
    const beam = clamp01((progress - 0.45) / 0.55);
    if (beam > 0) {
      const stroke = (w: number, color: string, blur: number) => {
        ctx.lineWidth = w; ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = blur;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(xOpt, surfaceY); ctx.lineTo(B.x, B.y); ctx.stroke();
      };
      stroke(16, rgba(cAmber, 0.1 * beam), 40);
      stroke(5, rgba(cAmber, 0.55 * beam), 18);
      stroke(1.6, rgba(COLOR.core, 0.95 * beam), 6);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
  }, [frame, progress, W, H]);

  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}} />;
};

import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {useCurrentFrame} from 'remotion';
import {CANVAS, COLOR, FONT, MOTION} from '../../design/tokens';
import {clamp01, hex, lerp, lerpRgb, rgba} from '../../design/utils';
import {Attempt, STORM, ashAt, makeAsh} from './attempts';

const cReject = hex(COLOR.reject), cCyan = hex(COLOR.cyan);

// 作废段：先变灰（6 帧）→ 灰线保持可见并逐渐碎裂（20 帧），灰烬错峰下落
export const AttemptStorm: React.FC<{attempts: Attempt[]; voidAt: number; glintAt: number; snapAt?: number; dotOutAt?: number}> = ({attempts, voidAt, glintAt, snapAt, dotOutAt}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const ash = useMemo(() => makeAsh(attempts), [attempts]);
  const {width: W, height: H} = CANVAS;

  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 蓝点与虚线目标圈：安静段（犯嘀咕）开始时就地消失
    const dotA = dotOutAt === undefined ? 1 : 1 - clamp01((frame - dotOutAt) / 18);
    if (dotA > 0) {
      // 目标：远处的虚线圈，始终没被打中
      ctx.setLineDash([4, 8]);
      ctx.strokeStyle = rgba(COLOR.white, 0.22 * dotA);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(STORM.T.x, STORM.T.y, 30, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);

      // 你：小青点
      ctx.fillStyle = rgba(cCyan, dotA); ctx.shadowColor = COLOR.cyan; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(STORM.O.x, STORM.O.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    const voidK = clamp01((frame - voidAt) / 6);
    const ashStart = voidAt + 8;
    // 灰线碎裂淡出：作废后继续保持 8 帧，再 20 帧内碎掉
    const lineFade = frame < ashStart ? 1 : 1 - clamp01((frame - ashStart) / 20);

    if (lineFade > 0) {
      ctx.globalCompositeOperation = 'lighter';
      for (const a of attempts) {
        if (frame < a.start) continue;
        const drawn = MOTION.easeIn(clamp01((frame - a.start) / STORM.drawDur));
        const fade = clamp01((frame - a.start - STORM.drawDur) / 24);
        const gray = Math.max(fade * 0.85, voidK);
        const col = lerpRgb(cCyan, cReject, gray);
        const dense = a.j > 36 ? 0.55 : 1;
        const alpha = (0.75 - 0.5 * fade) * dense * lineFade;
        const n = Math.max(1, Math.floor(drawn * (a.pts.length - 1)));

        ctx.strokeStyle = rgba(col, alpha);
        ctx.lineWidth = a.j > 36 ? 0.9 : 1.4;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) (i ? ctx.lineTo(a.pts[i].x, a.pts[i].y) : ctx.moveTo(a.pts[i].x, a.pts[i].y));
        ctx.stroke();

        const head = a.pts[n];
        if (drawn < 1) {
          ctx.fillStyle = rgba(COLOR.core, 0.9 * lineFade); ctx.shadowColor = COLOR.cyan; ctx.shadowBlur = 12;
          ctx.beginPath(); ctx.arc(head.x, head.y, 2, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        } else if (a.j < 36) {
          ctx.strokeStyle = rgba(cReject, 0.7 * (1 - voidK) * lineFade); ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(head.x - 5, head.y - 5); ctx.lineTo(head.x + 5, head.y + 5);
          ctx.moveTo(head.x + 5, head.y - 5); ctx.lineTo(head.x - 5, head.y + 5);
          ctx.stroke();
        }
        if (a.tag && drawn >= 1) {
          ctx.globalCompositeOperation = 'source-over';
          ctx.font = `400 14px ${FONT.mono}`;
          ctx.fillStyle = rgba(COLOR.white, 0.55 * (1 - fade * 0.5) * (1 - voidK) * lineFade);
          ctx.fillText(a.tag, head.x + 10, head.y - 8);
          ctx.globalCompositeOperation = 'lighter';
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    if (frame >= ashStart) {
      // 灰烬：重力下落，积成一层（834–868 之间的厚层）
      // 下落中的颗粒更大更亮，落定后压暗
      const t = frame - ashStart;
      const snapK = snapAt ? MOTION.easeIn(clamp01((frame - snapAt) / 22)) : 0;
      const cFall = lerpRgb(cReject, hex(COLOR.white), 0.22);
      for (const a of ash) {
        const ta = t - a.delay;
        const p = ashAt(a, ta);
        let x = p.x, y = p.y;
        if (snapK > 0) {
          // 被网格吸住：竖向对齐到网格线，从乱到有序（x 保持连续，密度不丢）
          y = lerp(y, Math.round(y / 40) * 40, snapK);
        }
        const falling = ta > 0 && ta < a.tLand;
        ctx.fillStyle = falling ? rgba(cFall, 0.9) : rgba(cReject, 0.62);
        const s = falling ? 3.4 : 3.0;
        ctx.fillRect(x, y, s, s);
      }
      // 伏笔：少数颗粒闪出冷青色微光
      if (frame >= glintAt) {
        const g = frame - glintAt;
        const pulse = Math.max(0, Math.sin((g / 18) * Math.PI)) * (g < 36 ? 1 : 0.35);
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = rgba(cCyan, 0.25 + 0.75 * pulse);
        ctx.shadowColor = COLOR.cyan; ctx.shadowBlur = 12 * pulse + 2;
        for (const a of ash) {
          if (!a.glint) continue;
          const p = ashAt(a, t - a.delay);
          let x = p.x, y = p.y;
          if (snapK > 0) {
            y = lerp(y, Math.round(y / 40) * 40, snapK);
          }
          ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  }, [frame, attempts, ash, voidAt, glintAt, snapAt, W, H]);

  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />;
};

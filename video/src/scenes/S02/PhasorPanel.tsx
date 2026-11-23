import React, {useMemo} from 'react';
import {CANVAS, COLOR} from '../../design/tokens';
import {clamp01, hex, lerp, lerpRgb, rgba} from '../../design/utils';
import {Annotation} from '../../components/Typography';
import {CornerMarks} from '../../components/Marks';
import {SOLVED} from './optics';

export const PANEL = {x: 1340, y: 96, w: 460, h: 320, pad: 28, header: 44, footer: 46} as const;

// 费曼"相位小箭头"首尾相接 → 考纽螺线；合成矢量来自驻相区
export const PhasorPanel: React.FC<{progress: number}> = ({progress}) => {
  const {width: W, height: H} = CANVAS;
  const {candidates} = SOLVED;

  const pts = useMemo(() => {
    const raw: [number, number][] = [[0, 0]];
    let x = 0, y = 0;
    for (const c of candidates) { x += Math.cos(c.phase); y += Math.sin(c.phase); raw.push([x, y]); }
    const ang = -Math.atan2(y, x); // 旋转，让合成矢量保持水平
    const rot = raw.map(([px, py]) => [px * Math.cos(ang) - py * Math.sin(ang), px * Math.sin(ang) + py * Math.cos(ang)] as [number, number]);
    const xs = rot.map((p) => p[0]), ys = rot.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const iw = PANEL.w - PANEL.pad * 2, ih = PANEL.h - PANEL.header - PANEL.footer;
    const s = Math.min(iw / (maxX - minX), ih / (maxY - minY));
    const ox = PANEL.x + PANEL.pad + (iw - (maxX - minX) * s) / 2 - minX * s;
    const oy = PANEL.y + PANEL.header + (ih - (maxY - minY) * s) / 2 - minY * s;
    return rot.map(([px, py]) => [ox + px * s, oy + py * s] as [number, number]);
  }, [candidates]);

  const cReject = hex(COLOR.reject), cCyan = hex(COLOR.cyan), cAmber = hex(COLOR.amber);
  const first = pts[0], last = pts[pts.length - 1];
  const legend = [
    {c: COLOR.amber, t: 'STATIONARY'},
    {c: COLOR.cyan, t: 'COHERENT'},
    {c: COLOR.reject, t: 'CANCELLED'},
  ];

  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <marker id="phasor-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0 0 L10 5 L0 10 z" fill={COLOR.core} />
          </marker>
        </defs>
        <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} fill={rgba(COLOR.white, 0.02)} stroke={rgba(COLOR.white, 0.08)} />
        <CornerMarks x={PANEL.x - 6} y={PANEL.y - 6} w={PANEL.w + 12} h={PANEL.h + 12} />
        <line x1={PANEL.x} x2={PANEL.x + PANEL.w} y1={PANEL.y + PANEL.header - 8} y2={PANEL.y + PANEL.header - 8} stroke={rgba(COLOR.white, 0.06)} />

        {candidates.map((c, i) => {
          const coh = c.coherence;
          const col = lerpRgb(lerpRgb(cReject, cCyan, clamp01(coh * 1.6) * progress), cAmber, clamp01((coh - 0.55) / 0.45) * progress);
          const a = lerp(0.5, 0.22 + 0.78 * coh, progress);
          return (
            <line key={i} x1={pts[i][0]} y1={pts[i][1]} x2={pts[i + 1][0]} y2={pts[i + 1][1]}
              stroke={rgba(col, a)} strokeWidth={1 + 1.6 * coh * progress} strokeLinecap="round" />
          );
        })}

        <line x1={first[0]} y1={first[1]} x2={last[0]} y2={last[1]} stroke={COLOR.core} strokeWidth={1.4}
          strokeDasharray="2 5" markerEnd="url(#phasor-head)" opacity={0.4 + 0.6 * progress} />

        {legend.map((l, i) => {
          const lx = PANEL.x + PANEL.pad + i * 140, ly = PANEL.y + PANEL.h - 22;
          return <line key={l.t} x1={lx} x2={lx + 18} y1={ly} y2={ly} stroke={l.c} strokeWidth={2} />;
        })}
      </svg>

      <Annotation x={PANEL.x + PANEL.pad} y={PANEL.y + 20} size="sm">FIG.02-B — PHASOR SUM</Annotation>
      <Annotation x={PANEL.x + PANEL.w - PANEL.pad} y={PANEL.y + 20} size="sm" align="right" color={COLOR.amber} opacity={0.8}>Σ e^(iφ)</Annotation>
      {legend.map((l, i) => (
        <Annotation key={l.t} x={PANEL.x + PANEL.pad + i * 140 + 26} y={PANEL.y + PANEL.h - 22} size="sm" opacity={0.5} style={{fontSize: 12}}>
          {l.t}
        </Annotation>
      ))}
    </>
  );
};

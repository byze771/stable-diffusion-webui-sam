import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CANVAS, COLOR} from '../../design/tokens';
import {arcPath, clamp01, deg, rgba} from '../../design/utils';
import {Annotation, DataLabel} from '../../components/Typography';
import {LightSource, TargetMark} from '../../components/Marks';
import {OPTICS, SOLVED} from './optics';

export const OpticsOverlay: React.FC<{progress: number}> = ({progress}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = CANVAS;
  const {A, B, surfaceY} = OPTICS;
  const {xOpt, theta1, theta2} = SOLVED;
  const P = {x: xOpt, y: surfaceY};
  const show = clamp01((progress - 0.6) / 0.4);
  const breath = 1 + 0.06 * Math.sin((frame / 90) * Math.PI * 2); // 3 秒一次呼吸

  const R = 64;
  const upA0 = -Math.PI / 2, upA1 = Math.atan2(A.y - P.y, A.x - P.x);
  const dnA0 = Math.PI / 2, dnA1 = Math.atan2(B.y - P.y, B.x - P.x);
  const upMid = (upA0 + upA1) / 2, dnMid = (dnA0 + dnA1) / 2;

  // 沿入射段放置数据标签
  const len = Math.hypot(P.x - A.x, P.y - A.y);
  const d = {x: (P.x - A.x) / len, y: (P.y - A.y) / len};
  const nrm = {x: d.y, y: -d.x};
  const mid = {x: (A.x + P.x) / 2 + nrm.x * 38, y: (A.y + P.y) / 2 + nrm.y * 38};

  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <g opacity={show}>
          <line x1={P.x} x2={P.x} y1={P.y - 220} y2={P.y + 220} stroke={rgba(COLOR.core, 0.3)} strokeWidth={1} strokeDasharray="4 8" />
          <path d={arcPath(P.x, P.y, R, upA0, upA1)} fill="none" stroke={rgba(COLOR.amber, 0.7)} strokeWidth={1.2} />
          <path d={arcPath(P.x, P.y, R, dnA0, dnA1)} fill="none" stroke={rgba(COLOR.cyan, 0.7)} strokeWidth={1.2} />
          <circle cx={P.x} cy={P.y} r={10} fill="none" stroke={rgba(COLOR.core, 0.45)} strokeWidth={1} />
          <circle cx={P.x} cy={P.y} r={3.5} fill={COLOR.core} />
        </g>
        <LightSource id="src-a" x={A.x} y={A.y} breath={breath} />
        <TargetMark x={B.x} y={B.y} lit={0.4 + 0.6 * show} />
      </svg>

      <Annotation x={A.x + 30} y={A.y - 28}>A · SOURCE</Annotation>
      <Annotation x={B.x + 48} y={B.y}>B · TARGET</Annotation>

      <Annotation x={1800} y={surfaceY - 22} align="right" size="sm">n₁ = 1.00 · AIR</Annotation>
      <Annotation x={1800} y={surfaceY + 22} align="right" size="sm" color={COLOR.cyan}>n₂ = 1.33 · WATER</Annotation>

      <Annotation x={P.x + (R + 34) * Math.cos(upMid)} y={P.y + (R + 34) * Math.sin(upMid)} align="center" size="sm" color={COLOR.amber} opacity={0.85 * show}>
        θ₁ {deg(theta1)}°
      </Annotation>
      <Annotation x={P.x + (R + 34) * Math.cos(dnMid)} y={P.y + (R + 34) * Math.sin(dnMid)} align="center" size="sm" color={COLOR.cyan} opacity={0.85 * show}>
        θ₂ {deg(theta2)}°
      </Annotation>
      <Annotation x={P.x - 120} y={P.y + 150} align="right" size="sm" opacity={0.5 * show}>
        n₁ sin θ₁ = n₂ sin θ₂
      </Annotation>

      <DataLabel x={mid.x} y={mid.y} rotate={Math.atan2(d.y, d.x)} opacity={show}>t = min</DataLabel>
    </AbsoluteFill>
  );
};

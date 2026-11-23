import React from 'react';
import {COLOR} from '../design/tokens';
import {rgba} from '../design/utils';

// 光源：暖白光核 + 琥珀辉光，breath 控制呼吸缩放
export const LightSource: React.FC<{x: number; y: number; breath?: number; id: string}> = ({x, y, breath = 1, id}) => (
  <g>
    <defs>
      <radialGradient id={`${id}-halo`}>
        <stop offset="0" stopColor={COLOR.amber} stopOpacity={0.45} />
        <stop offset="0.35" stopColor={COLOR.amber} stopOpacity={0.12} />
        <stop offset="1" stopColor={COLOR.amber} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={80 * breath} fill={`url(#${id}-halo)`} />
    <circle cx={x} cy={y} r={6} fill={COLOR.core} style={{filter: `drop-shadow(0 0 8px ${COLOR.amber})`}} />
  </g>
);

// 终点准星
export const TargetMark: React.FC<{x: number; y: number; lit?: number}> = ({x, y, lit = 1}) => {
  const ticks = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  return (
    <g style={{filter: `drop-shadow(0 0 ${10 * lit}px ${rgba(COLOR.amber, 0.8)})`}}>
      <circle cx={x} cy={y} r={34} fill="none" stroke={rgba(COLOR.amber, 0.22)} strokeWidth={1} />
      <circle cx={x} cy={y} r={18} fill="none" stroke={COLOR.amber} strokeWidth={1.5} />
      <circle cx={x} cy={y} r={3} fill={COLOR.core} />
      {ticks.map((a, i) => (
        <line key={i} x1={x + 24 * Math.cos(a)} y1={y + 24 * Math.sin(a)} x2={x + 31 * Math.cos(a)} y2={y + 31 * Math.sin(a)}
          stroke={rgba(COLOR.amber, 0.7)} strokeWidth={1.2} />
      ))}
    </g>
  );
};

// 杂志式套准角标
export const CornerMarks: React.FC<{x: number; y: number; w: number; h: number; len?: number; opacity?: number}> = ({x, y, w, h, len = 10, opacity = 0.35}) => {
  const s = rgba(COLOR.white, opacity);
  const L = (x1: number, y1: number, x2: number, y2: number, k: string) => <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={s} strokeWidth={1} />;
  return (
    <g>
      {L(x, y, x + len, y, 'a')}{L(x, y, x, y + len, 'b')}
      {L(x + w, y, x + w - len, y, 'c')}{L(x + w, y, x + w, y + len, 'd')}
      {L(x, y + h, x + len, y + h, 'e')}{L(x, y + h, x, y + h - len, 'f')}
      {L(x + w, y + h, x + w - len, y + h, 'g')}{L(x + w, y + h, x + w, y + h - len, 'h')}
    </g>
  );
};

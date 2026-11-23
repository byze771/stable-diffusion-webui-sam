import React from 'react';
import {useCurrentFrame} from 'remotion';
import {CANVAS, COLOR} from '../../design/tokens';
import {rgba} from '../../design/utils';
import {OPTICS} from './optics';

export const Water: React.FC = () => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = CANVAS;
  const {surfaceY} = OPTICS;

  const waves = [0, 1, 2, 3, 4, 5].map((i) => {
    const y0 = surfaceY + 26 + i * 36;
    const amp = 2.2 - i * 0.25;
    const wl = 220 + i * 44;
    const ph = frame * 0.04 * (1 + i * 0.15) + i;
    let d = '';
    for (let x = 0; x <= W; x += 16) {
      const y = y0 + amp * Math.sin((x / wl) * Math.PI * 2 + ph);
      d += `${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(2)} `;
    }
    return <path key={i} d={d} fill="none" stroke={rgba(COLOR.cyan, 0.085 - i * 0.012)} strokeWidth={1} />;
  });

  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="water-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.water} stopOpacity={0.95} />
          <stop offset="1" stopColor={COLOR.ink} stopOpacity={1} />
        </linearGradient>
      </defs>
      <rect x={0} y={surfaceY} width={W} height={H - surfaceY} fill="url(#water-grad)" />
      {waves}
      <line x1={0} x2={W} y1={surfaceY} y2={surfaceY} stroke={rgba(COLOR.core, 0.28)} strokeWidth={1} />
    </svg>
  );
};

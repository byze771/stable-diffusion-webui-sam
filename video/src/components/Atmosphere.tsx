import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {COLOR, LAYOUT, OPACITY} from '../design/tokens';

export const Background: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: COLOR.ink,
      backgroundImage: [
        'radial-gradient(ellipse 60% 50% at 52% 55%, rgba(255,181,74,0.045) 0%, transparent 70%)',
        'radial-gradient(ellipse 80% 40% at 50% 100%, rgba(127,231,255,0.025) 0%, transparent 70%)',
      ].join(','),
    }}
  />
);

export const Grid: React.FC<{opacity?: number}> = ({opacity = OPACITY.grid}) => (
  <AbsoluteFill
    style={{
      opacity,
      backgroundImage: `linear-gradient(${COLOR.white} 1px, transparent 1px), linear-gradient(90deg, ${COLOR.white} 1px, transparent 1px)`,
      backgroundSize: `${LAYOUT.grid}px ${LAYOUT.grid}px`,
    }}
  />
);

export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: `radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(0,0,0,${OPACITY.vignette}) 100%)`,
    }}
  />
);

// 胶片颗粒：每帧换一个 seed，颗粒会"活"起来
export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: OPACITY.grain, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <svg width="100%" height="100%">
        <filter id="film-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 997} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#film-grain)" />
      </svg>
    </AbsoluteFill>
  );
};

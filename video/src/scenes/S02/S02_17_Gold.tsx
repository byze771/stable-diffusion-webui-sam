import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CANVAS, COLOR, MOTION} from '../../design/tokens';
import {rgba} from '../../design/utils';
import {Background, Grain, Vignette} from '../../components/Atmosphere';
import {GoldLine} from '../../components/Typography';
import {Water} from './Water';
import {OPTICS, SOLVED} from './optics';

export const S02_17_Gold: React.FC<{sweep?: number}> = ({sweep}) => {
  const frame = useCurrentFrame();
  const s = sweep ?? interpolate(frame, [20, 20 + MOTION.dur.goldSweep], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const {width: W, height: H} = CANVAS;
  const {A, B, surfaceY} = OPTICS;
  const d = `M ${A.x} ${A.y} L ${SOLVED.xOpt} ${surfaceY} L ${B.x} ${B.y}`;

  return (
    <AbsoluteFill style={{backgroundColor: COLOR.ink, overflow: 'hidden'}}>
      <Background />
      {/* 金句前的"黑场呼吸"：画面只留一道弯折的光，整体下移让出文字区 */}
      <AbsoluteFill style={{transform: 'translateY(170px)', opacity: 0.6}}>
        <Water />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <defs>
            <filter id="beam-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="7" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <path d={d} fill="none" stroke={rgba(COLOR.amber, 0.6)} strokeWidth={4} filter="url(#beam-glow)" strokeLinejoin="round" />
          <path d={d} fill="none" stroke={COLOR.core} strokeWidth={1.4} strokeLinejoin="round" />
        </svg>
      </AbsoluteFill>
      <GoldLine lines={['最短的时间', '常常藏在一条弯路里']} top={150} sweep={s} />
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

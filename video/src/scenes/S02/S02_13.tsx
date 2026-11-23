import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {COLOR, MOTION} from '../../design/tokens';
import {Background, Grain, Grid, Vignette} from '../../components/Atmosphere';
import {Annotation, ChapterLabel, Footnote, Subtitle} from '../../components/Typography';
import {Water} from './Water';
import {FanCanvas} from './FanCanvas';
import {OpticsOverlay} from './OpticsOverlay';
import {PANEL, PhasorPanel} from './PhasorPanel';

export type S02_13Props = {progress?: number};

// 字幕原话：最后只剩下走得通的那一条
// 正片中 progress 由 cue("走得通") 卡拍后驱动；这里用固定区间演示
export const S02_13: React.FC<S02_13Props> = ({progress}) => {
  const frame = useCurrentFrame();
  const isStill = progress !== undefined;
  const p = progress ?? interpolate(frame, [10, 80], [0, 1], {easing: MOTION.easeIn, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: COLOR.ink, overflow: 'hidden'}}>
      <Background />
      <Water />
      <Grid />
      <FanCanvas progress={p} />
      <OpticsOverlay progress={p} />
      <PhasorPanel progress={p} />

      <ChapterLabel no="02" title="光怎么找路" />
      <Annotation x={80} y={124} size="sm" opacity={0.45}>FIG.02 — PATH INTERFERENCE · N = 61</Annotation>
      <Footnote x={PANEL.x + PANEL.w} y={PANEL.y + PANEL.h + 30} align="right">
        严格表述：光程取驻值，多数情况为最小值
      </Footnote>

      <Subtitle text="最后只剩下走得通的那一条" enterAt={isStill ? -999 : 40} />
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

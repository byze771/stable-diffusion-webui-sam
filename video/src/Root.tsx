import React from 'react';
import {Composition} from 'remotion';
import './design/fonts';
import {CANVAS} from './design/tokens';
import {S01_Full} from './scenes/S01/S01_Full';
import {S02_13} from './scenes/S02/S02_13';
import {S02_17_Gold} from './scenes/S02/S02_17_Gold';
import {FILM_END, Main} from './Main';

export const RemotionRoot: React.FC = () => (
  <>
    {/* 全片（片头 2s 无声片名卡 + 人声 471s + 片尾） */}
    <Composition id="Full" component={Main} durationInFrames={FILM_END} fps={CANVAS.fps} width={CANVAS.width} height={CANVAS.height} />
    {/* S01 全段（0–33.5s）：冷开场 → 灰烬 → 1662 → 金句 → 片名卡 */}
    <Composition id="S01-Full" component={S01_Full} durationInFrames={1005} fps={CANVAS.fps} width={CANVAS.width} height={CANVAS.height} />
    {/* 关键帧示意 */}
    <Composition id="Style-S02-13" component={S02_13} durationInFrames={120} fps={CANVAS.fps} width={CANVAS.width} height={CANVAS.height} defaultProps={{progress: 0.92}} />
    <Composition id="Style-S02-17-Gold" component={S02_17_Gold} durationInFrames={60} fps={CANVAS.fps} width={CANVAS.width} height={CANVAS.height} defaultProps={{sweep: 0.55}} />
    {/* 4 秒收敛动效预览 */}
    <Composition id="Motion-S02-13" component={S02_13} durationInFrames={120} fps={CANVAS.fps} width={CANVAS.width} height={CANVAS.height} defaultProps={{}} />
  </>
);

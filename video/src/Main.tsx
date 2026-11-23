// 全片总装：片名卡 → S01–S12 → 片尾
// 时间轴：片头 2s（60 帧）无声片名卡，人声从第 60 帧起
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {COLOR} from './design/tokens';
import {GOLD_WINDOWS, OFFSET, SUBTITLES} from './cues';
import {Subtitle} from './components/Typography';
import {TitleCard} from './scenes/TitleCard';
import {S01_Full} from './scenes/S01/S01_Full';
import {S02} from './scenes/S02/S02';
import {S03} from './scenes/S03/S03';
import {S04} from './scenes/S04/S04';
import {S05} from './scenes/S05/S05';
import {S06} from './scenes/S06/S06';
import {S07} from './scenes/S07/S07';
import {S08} from './scenes/S08/S08';
import {S09} from './scenes/S09/S09';
import {S10} from './scenes/S10/S10';
import {S11} from './scenes/S11/S11';
import {S12} from './scenes/S12/S12';

export const FILM_END = 14360; // 人声止 14132 + 片头 60 + 片尾余量

const SubtitleTrack: React.FC = () => {
  const frame = useCurrentFrame();
  const sub = [...SUBTITLES].reverse().find((s) => frame >= s.s - 2 && frame <= s.e);
  if (!sub) return null;
  if (GOLD_WINDOWS.some(([a, b]) => sub.s >= a - 24 && sub.s <= b)) return null;
  return <Subtitle text={sub.t} enterAt={sub.s - 2} />;
};

export const Main: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: COLOR.ink}}>
    <Sequence from={OFFSET}>
      <Audio src={staticFile('voice.wav')} />
    </Sequence>
    <TitleCard />
    <Sequence from={OFFSET} durationInFrames={1005}>
      <S01_Full titleCard={false} voice={false} />
    </Sequence>
    <S02 />
    <S03 />
    <S04 />
    <S05 />
    <S06 />
    <S07 />
    <S08 />
    <S09 />
    <S10 />
    <S11 />
    <S12 />
    <SubtitleTrack />
  </AbsoluteFill>
);

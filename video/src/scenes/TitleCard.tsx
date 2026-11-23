// 片头 2s 无声片名卡：光扫 → 整屏收缩成光点 → 匹配剪辑成 S01 光场的 A 点
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {COLOR, FONT, MOTION, TYPE} from '../design/tokens';
import {clamp01, hex, rgba} from '../design/utils';
import {Annotation} from '../components/Typography';
import {LightSource} from '../components/Marks';
import {HERO_A} from './S01/heroPaths';

const cAmber = hex(COLOR.amber);

export const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame > 78) return null;
  const fadeIn = clamp01(frame / 10);
  const sweep = clamp01((frame - 8) / MOTION.dur.goldSweep);
  const collapse = 1 - clamp01((frame - 44) / 20) * 0.999;
  const collapsing = frame >= 44;
  const dotIn = clamp01((frame - 58) / 10);
  const out = 1 - clamp01((frame - 70) / 8);

  return (
    <AbsoluteFill style={{backgroundColor: COLOR.ink, opacity: out}}>
      <AbsoluteFill style={{
        opacity: fadeIn,
        transform: `scale(${Math.max(0.001, collapse)})`,
        transformOrigin: `${HERO_A.x}px ${HERO_A.y}px`,
      }}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 400, textAlign: 'center'}}>
          <div style={{position: 'relative', display: 'inline-block'}}>
            <span style={{...TYPE.title, color: COLOR.core, textShadow: `0 0 40px ${rgba(cAmber, 0.3)}`}}>光路</span>
            <span aria-hidden style={{
              ...TYPE.title, position: 'absolute', inset: 0, color: 'transparent',
              backgroundImage: 'linear-gradient(105deg, transparent 42%, rgba(255,255,255,0.95) 50%, transparent 58%)',
              backgroundSize: '300% 100%', backgroundPosition: `${(1 - sweep) * 100}% 0`,
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
            }}>光路</span>
          </div>
          <div style={{marginTop: 36, fontFamily: FONT.sans, fontSize: 36, fontWeight: 500, color: COLOR.white, opacity: 0.75}}>
            费马原理，与高手的路径选择
          </div>
        </div>
        <Annotation x={960} y={960} align="center" size="sm" opacity={0.5}>FERMAT&apos;S PRINCIPLE · 1662</Annotation>
      </AbsoluteFill>
      {collapsing && dotIn > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <LightSource id="title-dot" x={HERO_A.x} y={HERO_A.y} breath={dotIn} />
        </svg>
      )}
    </AbsoluteFill>
  );
};

import React, {CSSProperties} from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLOR, LAYOUT, MOTION, OPACITY, TYPE} from '../design/tokens';
import {clamp01, rgba} from '../design/utils';

export const ChapterLabel: React.FC<{no: string; title: string}> = ({no, title}) => (
  <div style={{position: 'absolute', left: LAYOUT.chapter.x, top: LAYOUT.chapter.y, display: 'flex', alignItems: 'baseline', gap: 14}}>
    <span style={{...TYPE.chapterNo, color: COLOR.amber}}>{no}</span>
    <span style={{...TYPE.labelSm, color: COLOR.white, opacity: 0.3}}>/</span>
    <span style={{...TYPE.chapter, color: COLOR.white, opacity: 0.8}}>{title}</span>
  </div>
);

type Align = 'left' | 'center' | 'right';
const tx = (a: Align) => (a === 'left' ? '0' : a === 'center' ? '-50%' : '-100%');
const origin = (a: Align) => (a === 'left' ? 'left center' : a === 'right' ? 'right center' : 'center');

// (x, y) 是锚点：y 为文字的垂直中心
export const Annotation: React.FC<{
  x: number; y: number; children: React.ReactNode;
  align?: Align; size?: 'md' | 'sm'; color?: string; opacity?: number; rotate?: number; style?: CSSProperties;
}> = ({x, y, children, align = 'left', size = 'md', color = COLOR.white, opacity = OPACITY.label, rotate = 0, style}) => (
  <div
    style={{
      position: 'absolute', left: x, top: y, whiteSpace: 'nowrap', color, opacity,
      transform: `translate(${tx(align)}, -50%) rotate(${rotate}rad)`, transformOrigin: origin(align),
      ...(size === 'md' ? TYPE.label : TYPE.labelSm), ...style,
    }}
  >
    {children}
  </div>
);

export const DataLabel: React.FC<{x: number; y: number; children: React.ReactNode; rotate?: number; opacity?: number}> = ({x, y, children, rotate = 0, opacity = 1}) => (
  <Annotation x={x} y={y} align="center" rotate={rotate} opacity={opacity} color={COLOR.amber}
    style={{...TYPE.data, textShadow: `0 0 18px ${rgba(COLOR.amber, 0.45)}`}}>
    {children}
  </Annotation>
);

export const Footnote: React.FC<{x: number; y: number; align?: Align; children: React.ReactNode}> = ({x, y, align = 'left', children}) => (
  <Annotation x={x} y={y} align={align} opacity={OPACITY.footnote} style={TYPE.footnote}>{children}</Annotation>
);

// 字幕：不卡拍，比人声早 2 帧出现（由上游 cue 计算 enterAt）
export const Subtitle: React.FC<{text: string; enterAt: number}> = ({text, enterAt}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - enterAt, [0, MOTION.dur.subtitleIn], [0, 1], {
    easing: MOTION.easeIn, extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const capTop = LAYOUT.subtitleBaseline - TYPE.subtitle.fontSize * 0.88; // CJK 基线约在 0.88em 处
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: 860, bottom: 0, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.4))'}} />
      <div
        style={{
          position: 'absolute', left: 0, right: 0, top: capTop, textAlign: 'center',
          ...TYPE.subtitle, color: COLOR.white, opacity: OPACITY.text * t,
          transform: `translateY(${(1 - t) * 8}px)`, textShadow: '0 2px 14px rgba(0,0,0,0.6)',
        }}
      >
        {text}
      </div>
    </>
  );
};

// 金句：宋体大字 + 45° 光扫。sweep ∈ [0,1] 表示光带从左扫到右
export const GoldLine: React.FC<{lines: string[]; top: number; sweep: number; reveal?: number}> = ({lines, top, sweep, reveal = 1}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center'}}>
    {lines.map((line, i) => {
      const o = clamp01(reveal * lines.length - i);
      const base: CSSProperties = {...TYPE.gold, display: 'block', whiteSpace: 'nowrap'};
      return (
        <div key={i} style={{position: 'relative', opacity: o, transform: `translateY(${(1 - o) * 12}px)`}}>
          <span style={{...base, color: COLOR.core, textShadow: `0 0 28px ${rgba(COLOR.amber, 0.28)}`}}>{line}</span>
          <span
            aria-hidden
            style={{
              ...base, position: 'absolute', inset: 0, color: 'transparent',
              backgroundImage: 'linear-gradient(105deg, transparent 42%, rgba(255,255,255,0.95) 50%, transparent 58%)',
              backgroundSize: '300% 100%', backgroundPosition: `${(1 - sweep) * 100}% 0`,
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
            }}
          >
            {line}
          </span>
        </div>
      );
    })}
  </div>
);

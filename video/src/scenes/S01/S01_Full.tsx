// S01 完整场景（0:00–0:33.5）：冷开场 → 尝试风暴 → 灰烬 → 对照 → 1662 → 直线vs折线 → 金句 → 片名卡
// 全部 cue 取真实逐字时间（秒×30），正片阶段再过 snap() 卡拍
import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CANVAS, COLOR, FONT, MOTION, TYPE} from '../../design/tokens';
import {clamp01, hex, rgba} from '../../design/utils';
import {Background, Grain, Grid, Vignette} from '../../components/Atmosphere';
import {Annotation, GoldLine, Subtitle} from '../../components/Typography';
import {LightSource, TargetMark} from '../../components/Marks';
import {HeroField} from './HeroField';
import {HERO_A, HERO_B} from './heroPaths';
import {AttemptStorm} from './AttemptStorm';
import {makeAttempts} from './attempts';

const F = {
  need: 19, found: 58, you: 99,                    // 需求 / 找对 / 你呢
  plan: 128, content: 168, code: 233, tried: 274,  // 改 / 重写 / 调 / 试
  void: 327,                                       // 作废
  wonder: 363,                                     // 犯嘀咕（镜头下摇贴近灰烬）
  glint: 478,                                      // 白费（伏笔火星）
  envy: 516, hitFlash: 574,                        // 谁不羡慕 / 出结果（准星闪）
  y1662: 622, gridIn: 636, snap: 648,              // 有个三百多年前 / 网格淡入 / 颗粒归位
  ab: 722, straight: 730, bent: 761,               // 它能回答 / 直线 / 折线（反常识）
  breath: 800, gold1: 819, gold2: 865, goldOut: 926,
  title: 945, titleSweep: 958, collapse: 988, end: 1005,
} as const;

const SUBS: {t: string; s: number; e: number}[] = [
  {t: '同一个需求', s: 3, e: 38},
  {t: '有人一眼就找对了路', s: 34, e: 81},
  {t: '你呢？', s: 97, e: 115},
  {t: '方案改了几十版', s: 116, e: 155},
  {t: '内容重写了一遍又一遍', s: 157, e: 223},
  {t: '代码调了又调', s: 224, e: 259},
  {t: '方向试了一大堆', s: 262, e: 307},
  {t: '最后大多都作废了', s: 303, e: 345},
  {t: '你可能会犯嘀咕', s: 363, e: 408},
  {t: '是我思路不行吗？', s: 406, e: 446},
  {t: '这些功夫，全白费了吗？', s: 450, e: 501},
  {t: '谁不羡慕那种一步到位', s: 515, e: 563},
  {t: '直接出结果的人', s: 565, e: 606},
  {t: '有个三百多年前的物理原理', s: 622, e: 679},
  {t: '对我触动很深', s: 680, e: 714},
  {t: '它能回答这个问题', s: 720, e: 758},
  {t: '听起来还有点反常识', s: 759, e: 803},
];

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const whip = Easing.bezier(0.65, 0, 0.35, 1);

// A/B 对比段坐标
const A2 = {x: 600, y: 430};
const B2 = {x: 1320, y: 430};
const BENT = `M ${A2.x} ${A2.y} L 830 655 L 1150 640 L ${B2.x} ${B2.y}`;

const cAmber = hex(COLOR.amber);

// 三层光（全片统一参数）；drawK∈[0,1] 控制沿路径绘制
const Beam3: React.FC<{d: string; opacity?: number; drawK?: number}> = ({d, opacity = 1, drawK = 1}) => (
  <g opacity={opacity}>
    <path d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - drawK} fill="none" stroke={rgba(cAmber, 0.1)} strokeWidth={16} strokeLinejoin="round" strokeLinecap="round" style={{filter: 'blur(6px)'}} />
    <path d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - drawK} fill="none" stroke={rgba(cAmber, 0.55)} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" style={{filter: 'blur(3px)'}} />
    <path d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - drawK} fill="none" stroke={COLOR.core} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
  </g>
);

export const S01_Full: React.FC<{titleCard?: boolean; voice?: boolean}> = ({titleCard = true, voice = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const attempts = useMemo(() => makeAttempts(F), []);
  const {width: W, height: H} = CANVAS;

  // —— 镜头一：光场 ——
  const heroPush = interpolate(frame, [0, F.you], [1, 1.06], clampOpt);
  const kick = interpolate(frame, [F.found + 14, F.found + 18, F.found + 34], [0, 0.03, 0.01], clampOpt);
  const flash = interpolate(frame, [F.found + 14, F.found + 16, F.found + 34], [0, 0.22, 0], clampOpt);
  const targetIn = spring({frame: frame - F.need, fps, config: MOTION.spring});
  const collapsed = frame >= F.found + 14;

  // —— 甩镜 ——
  const pan = interpolate(frame, [F.you - 2, F.you + 10], [0, 1], {easing: whip, ...clampOpt});
  const panBlur = Math.sin(pan * Math.PI) * 8;

  // —— 镜头二：尝试风暴 + 灰烬段明显下摇贴近，进 1662 段时回正 ——
  const stormScale = interpolate(frame, [F.plan, F.tried, F.tried + 36], [1, 1.05, 0.84], {easing: MOTION.easeIn, ...clampOpt});
  const tilt = interpolate(frame, [F.wonder, F.wonder + 140, F.y1662, F.y1662 + 38], [0, 1, 1, 0], {easing: MOTION.easeIn, ...clampOpt});
  const started = attempts.filter((a) => a.start <= frame).length;
  const counterOn = interpolate(frame, [F.plan - 4, F.plan + 6], [0, 1], clampOpt) * (1 - clamp01((frame - F.breath) / 10));

  // —— 对照段：光束重现（1662 段开始前退场，形成镜头切换）——
  const beamIn = clamp01((frame - F.envy) / 15) * (1 - clamp01((frame - 600) / 20));
  const ringFlash = Math.sin(clamp01((frame - F.hitFlash) / 10) * Math.PI);

  // —— 1662 / 网格 / 颗粒归位 ——
  const typed = Math.max(0, Math.min(4, Math.floor((frame - F.y1662) / 2) + 1));
  const gridIn = clamp01((frame - F.gridIn) / 20);

  // —— 直线 vs 折线 ——
  const straightK = clamp01((frame - F.straight) / 15);
  const bentK = clamp01((frame - F.bent) / 15);
  const abIn = spring({frame: frame - F.ab, fps, config: MOTION.spring});

  // —— 金句（黑场呼吸压暗其它层；折线图形下移，避让宋体大字）——
  const dim = interpolate(frame, [F.breath, F.breath + 16, F.goldOut, F.goldOut + 16], [0, 0.62, 0.62, 0], clampOpt);
  const goldBeamY = interpolate(frame, [F.breath, F.breath + 14], [0, 260], {easing: MOTION.easeIn, ...clampOpt});
  const goldReveal = clamp01((frame - F.gold1) / 12) + clamp01((frame - F.gold2) / 12);
  const goldSweep = clamp01((frame - F.gold2) / MOTION.dur.goldSweep);

  // —— 片名卡 ——
  const titleIn = clamp01((frame - F.title) / 13);
  const titleSweep = clamp01((frame - F.titleSweep) / MOTION.dur.goldSweep);
  const titleCollapse = interpolate(frame, [F.collapse, F.collapse + 14], [1, 0.001], {easing: MOTION.easeOut, ...clampOpt});
  const dotIn = clamp01((frame - F.collapse - 8) / 8);

  const sub = frame < F.breath ? [...SUBS].reverse().find((s) => frame >= s.s && frame <= s.e) : undefined;

  return (
    <AbsoluteFill style={{backgroundColor: COLOR.ink, overflow: 'hidden'}}>
      {voice && <Audio src={staticFile('voice.wav')} endAt={926} volume={(f) => (f > 913 ? Math.max(0, 1 - (f - 913) / 12) : 1)} />}
      <Background />

      {/* 镜头一：320 光路 → 坍缩 */}
      {pan < 1 && (
        <AbsoluteFill style={{
          transform: `translateX(${-pan * W * 0.6}px) scale(${heroPush + kick})`,
          opacity: 1 - pan, filter: `blur(${panBlur}px)`,
        }}>
          <Grid opacity={0.03} />
          <HeroField collapseAt={F.found} />
          <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
            <LightSource id="s01-a" x={HERO_A.x} y={HERO_A.y} breath={1 + 0.06 * Math.sin(frame / 14)} />
            <g transform={`translate(${HERO_B.x} ${HERO_B.y}) scale(${targetIn}) translate(${-HERO_B.x} ${-HERO_B.y})`}>
              <TargetMark x={HERO_B.x} y={HERO_B.y} lit={collapsed ? 1 : 0.5} />
            </g>
          </svg>
          <AbsoluteFill style={{
            background: `radial-gradient(circle at ${HERO_B.x}px ${HERO_B.y}px, ${rgba(COLOR.core, flash)} 0%, transparent 55%)`,
            mixBlendMode: 'screen',
          }} />
          <Annotation x={80} y={80} size="sm" opacity={0.5}>
            {collapsed ? 'FIG.00 — 1 PATH' : 'FIG.00 — 320 PATHS'}
          </Annotation>
        </AbsoluteFill>
      )}

      {/* 镜头二：尝试风暴 → 灰烬层（灰烬段落缓慢贴近） */}
      {pan > 0 && (
        <AbsoluteFill style={{
          transform: `translateX(${(1 - pan) * W * 0.6}px) scale(${stormScale * (1 + tilt * 0.22)})`,
          transformOrigin: '960px 700px',
          opacity: pan * (1 - clamp01((frame - F.goldOut - 10) / 20)), filter: `blur(${panBlur}px)`,
        }}>
          <AttemptStorm attempts={attempts} voidAt={F.void} glintAt={F.glint} snapAt={F.snap} dotOutAt={F.wonder + 27} />
        </AbsoluteFill>
      )}

      {frame >= F.plan - 4 && counterOn > 0 && (
        <Annotation x={1800} y={80} size="sm" align="right" opacity={0.6 * counterOn}>
          ATTEMPTS {String(started).padStart(3, '0')} · HIT 000
        </Annotation>
      )}

      {/* 对照：上方光束重现，下方灰烬 */}
      {beamIn > 0 && (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: beamIn}}>
          <g transform="translate(0 -150)">
            <Beam3 d={`M ${HERO_A.x} ${HERO_A.y} L ${HERO_B.x} ${HERO_B.y}`} />
            <g transform={`translate(${HERO_B.x} ${HERO_B.y}) scale(${1 + ringFlash * 0.3})`}>
              <TargetMark x={0} y={0} lit={0.6 + 0.4 * ringFlash} />
            </g>
          </g>
        </svg>
      )}

      {/* 1662 打字 + 网格淡入 */}
      {frame >= F.y1662 && frame < F.breath + 16 && (
        <div style={{position: 'absolute', left: 960, top: 190, transform: 'translateX(-50%)', fontFamily: FONT.mono, fontSize: 64, fontWeight: 500, color: COLOR.amber, letterSpacing: '0.12em', opacity: 0.9 * (1 - clamp01((frame - F.breath) / 16))}}>
          {'1662'.slice(0, typed)}
          {typed < 4 && <span style={{opacity: 0.5}}>▌</span>}
        </div>
      )}
      {gridIn > 0 && <Grid opacity={0.12 * gridIn * (1 - dim * 0.8) * (1 - clamp01((frame - F.goldOut) / 15))} />}

      {/* A、B 两点：直线 vs 折线（金句段整体快速下移避让，而不是复制一条） */}
      {frame >= F.ab && (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: (1 - dim * 0.5) * (1 - clamp01((frame - F.goldOut) / 15)), transform: `translateY(${goldBeamY}px)`}}>
          <g opacity={clamp01(abIn)}>
            {/* 灰色直线 */}
            <line x1={A2.x} y1={A2.y} x2={A2.x + (B2.x - A2.x) * straightK} y2={A2.y + (B2.y - A2.y) * straightK}
              stroke={rgba(COLOR.reject, 0.85)} strokeWidth={1.6} strokeDasharray="6 8" />
            {/* 琥珀折线（更长，却更亮） */}
            {bentK > 0 && <Beam3 d={BENT} drawK={bentK} />}
            <LightSource id="s01-a2" x={A2.x} y={A2.y} breath={1} />
            <TargetMark x={B2.x} y={B2.y} lit={0.4 + 0.6 * bentK} />
          </g>
        </svg>
      )}
      {frame >= F.breath + 12 && frame < F.goldOut + 10 && (
        <div style={{transform: `translateY(${goldBeamY}px)`}}>
          <Annotation x={1010} y={400} size="md" color={COLOR.reject} opacity={0.8}>d = min</Annotation>
          <Annotation x={1060} y={700} size="md" color={COLOR.amber} opacity={0.9}>t = min</Annotation>
        </div>
      )}

      {/* 金句：黑场呼吸 */}
      {dim > 0 && <AbsoluteFill style={{backgroundColor: COLOR.ink, opacity: dim}} />}
      {frame >= F.gold1 - 6 && frame < F.goldOut + 16 && (
        <GoldLine lines={['距离最短的那条路', '花的时间，未必最短']} top={170} sweep={goldSweep} reveal={goldReveal} />
      )}

      {/* 片名卡（正片里由全局片头 TitleCard 接管） */}
      {titleCard && frame >= F.title && (
        <AbsoluteFill style={{opacity: titleIn, transform: `scale(${titleCollapse})`, transformOrigin: '760px 540px'}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 400, textAlign: 'center'}}>
            <div style={{position: 'relative', display: 'inline-block'}}>
              <span style={{...TYPE.title, color: COLOR.core, textShadow: `0 0 40px ${rgba(cAmber, 0.3)}`}}>光路</span>
              <span aria-hidden style={{
                ...TYPE.title, position: 'absolute', inset: 0, color: 'transparent',
                backgroundImage: 'linear-gradient(105deg, transparent 42%, rgba(255,255,255,0.95) 50%, transparent 58%)',
                backgroundSize: '300% 100%', backgroundPosition: `${(1 - titleSweep) * 100}% 0`,
                WebkitBackgroundClip: 'text', backgroundClip: 'text',
              }}>光路</span>
            </div>
            <div style={{marginTop: 36, fontFamily: FONT.sans, fontSize: 36, fontWeight: 500, color: COLOR.white, opacity: 0.75}}>
              费马原理，与高手的路径选择
            </div>
          </div>
          <Annotation x={960} y={960} align="center" size="sm" opacity={0.5}>FERMAT&apos;S PRINCIPLE · 1662</Annotation>
        </AbsoluteFill>
      )}
      {titleCard && dotIn > 0 && (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <LightSource id="s01-dot" x={760} y={540} breath={dotIn} />
        </svg>
      )}

      {sub && <Subtitle text={sub.t} enterAt={sub.s} />}
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

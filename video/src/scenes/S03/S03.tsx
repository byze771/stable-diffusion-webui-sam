// S03 · 关键前提（人声 87.7–101.3s，正片帧 2690–3099）
// A 点（S02 收束留下）→ START/END? + 筛网 → 没有终点，子波瞎散 → 【金】B 图钉砸下，波前弯向 B
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig, random} from 'remotion';
import {CANVAS, COLOR, FONT, MOTION} from '../../design/tokens';
import {clamp01, hex, lerp, rgba} from '../../design/utils';
import {Background, Grain, Grid, Vignette} from '../../components/Atmosphere';
import {Annotation, ChapterLabel, GoldLine} from '../../components/Typography';
import {LightSource, TargetMark} from '../../components/Marks';
import {useBeats} from '../../cues';

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const A = {x: 520, y: 540};
const B = {x: 1440, y: 540};
const cAmber = hex(COLOR.amber), cCyan = hex(COLOR.cyan);

// 无终点的瞎扩散波前：振幅逐次衰减，被暗角吞掉；有了 B 后弯向 B 凝成光路
const Waves: React.FC<{birth: number; dieAt: number; bendAt: number}> = ({birth, dieAt, bendAt}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const {width: W, height: H} = CANVAS;
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    const t = frame - birth;
    if (t < 0) return;
    const bendK = clamp01((frame - bendAt) / 18);
    const dirAB = Math.atan2(B.y - A.y, B.x - A.x);
    ctx.globalCompositeOperation = 'lighter';
    const n = Math.min(9, Math.floor(t / 26) + 1);
    for (let i = 0; i < n; i++) {
      const age = t - i * 26;
      if (age < 0) continue;
      const r = 26 + age * 8;
      // 每圈振幅（亮度）逐次降低；dieAt 后整体衰减
      const decay = Math.max(0, 0.62 - i * 0.075) * (1 - clamp01((frame - dieAt) / 26));
      const alpha = Math.max(decay, bendK * 0.5 * (1 - i * 0.09));
      if (alpha < 0.015) continue;
      for (let s = 0; s < 24; s++) {
        const a0 = (s / 24) * Math.PI * 2, a1 = ((s + 1) / 24) * Math.PI * 2;
        const mid = (a0 + a1) / 2;
        const dd = Math.abs(((mid - dirAB + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        const toward = clamp01(1 - dd / 0.8);
        const grey = (1 - toward) * bendK;
        const a = alpha * (1 - grey * 0.92);
        if (a < 0.015) continue;
        const col = bendK > 0.1 ? lerp3(cCyan, cAmber, toward * bendK) : cCyan;
        ctx.strokeStyle = rgba(col, a);
        ctx.lineWidth = 1.5 + toward * bendK * 1.6;
        ctx.beginPath();
        ctx.arc(A.x, A.y, r, a0, a1);
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }, [frame, birth, dieAt, bendAt, W, H]);
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}} />;
};
const lerp3 = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] =>
  [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export const S03: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const KB = useBeats('S03');
  const b01 = KB['01'], b02 = KB['02'], b03 = KB['03'], b04 = KB['04'], b05 = KB['05'];

  const START = b01.at - 16, END = b05.end + 70;
  

  // #01 A 点呼吸
  const aBreath = 1 + 0.5 * Math.sin(clamp01((frame - b01.a.premise) / 14) * Math.PI) * 0.6;
  // #02 START / END? / 筛网
  const startIn = spring({frame: frame - b02.a.start, fps, config: MOTION.spring});
  const endIn = spring({frame: frame - b02.a.end, fps, config: MOTION.spring});
  const sieveIn = clamp01((frame - b02.a.sieve) / 18);
  // #03 终点消失（8 帧溶解）
  const endOut = 1 - clamp01((frame - b03.a.noend) / 8);
  // #05 金句：B 图钉砸下 + 震屏
  const pinIn = clamp01((frame - b05.a.pin) / 6);
  // #04 瞎扩散 → 散掉（图钉落下时黑暗被震开）
  const wavesBirth = b04.a.spread - 20;
  const dark = clamp01((frame - b04.a.gone) / 30) * 0.86 * (1 - pinIn);
  const shake = pinIn > 0 && pinIn < 1 ? Math.sin(pinIn * Math.PI * 3) * 2 * (1 - pinIn) : 0;
  const beamK = clamp01((frame - (b05.a.pin + 8)) / 20);
  const goldReveal = clamp01((frame - b05.a.gold) / 12) + clamp01((frame - (b05.a.gold + 18)) / 12);
  const goldSweep = clamp01((frame - b05.a.gold) / MOTION.dur.goldSweep);
  const sceneOut = 1 - clamp01((frame - (b05.end + 44)) / 20);

  const endVis = endIn * endOut;

  if (frame < START || frame > END) return null;
const fadeIn = clamp01((frame - START) / 10);

  return (
    <AbsoluteFill style={{backgroundColor: COLOR.ink, overflow: 'hidden', opacity: fadeIn * sceneOut, transform: `translateY(${shake}px)`}}>
      <Background />
      <Grid opacity={0.1} />

      {/* 筛网：A 与 END 之间的细网格落下，随终点一起消失 */}
      {sieveIn > 0 && endVis > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: sieveIn * endVis, transform: `translateY(${(1 - sieveIn) * -50}px)`}}>
          {Array.from({length: 15}, (_, i) => (
            <line key={`v${i}`} x1={A.x + 130 + i * 52} x2={A.x + 130 + i * 52} y1={330} y2={750} stroke={rgba(COLOR.white, 0.2)} strokeWidth={1} />
          ))}
          {Array.from({length: 9}, (_, i) => (
            <line key={`h${i}`} x1={A.x + 104} x2={B.x - 60} y1={342 + i * 52} y2={342 + i * 52} stroke={rgba(COLOR.white, 0.2)} strokeWidth={1} />
          ))}
        </svg>
      )}

      {/* 子波 */}
      <Waves birth={wavesBirth} dieAt={b04.a.scatter} bendAt={b05.a.pin} />

      {/* A 点 + START */}
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(${A.x} ${A.y}) scale(${aBreath})`}>
          <LightSource id="s03-a" x={0} y={0} breath={1} />
        </g>
        {startIn > 0 && (
          <g opacity={startIn}>
            <circle cx={A.x} cy={A.y + 60} r={1.5} fill={rgba(COLOR.white, 0.5)} />
          </g>
        )}
        {/* END ? 虚线圈 */}
        {endVis > 0 && (
          <g opacity={endVis}>
            <circle cx={B.x} cy={B.y} r={40} fill="none" stroke={rgba(COLOR.white, 0.4)} strokeWidth={1.4} strokeDasharray="6 8" />
          </g>
        )}
        {/* B 图钉砸下 */}
        {pinIn > 0 && (
          <g transform={`translate(${B.x} ${B.y}) scale(${0.2 + pinIn * 0.8})`} opacity={pinIn}>
            <TargetMark x={0} y={0} lit={pinIn} />
            <circle r={5} fill={COLOR.amber} />
          </g>
        )}
        {/* 凝成的琥珀光路 */}
        {beamK > 0 && (
          <g>
            <path d={`M ${A.x} ${A.y} Q ${(A.x + B.x) / 2} ${A.y + 120} ${B.x} ${B.y}`} fill="none"
              stroke={rgba(cAmber, 0.12)} strokeWidth={15} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - beamK} style={{filter: 'blur(6px)'}} />
            <path d={`M ${A.x} ${A.y} Q ${(A.x + B.x) / 2} ${A.y + 120} ${B.x} ${B.y}`} fill="none"
              stroke={rgba(cAmber, 0.85)} strokeWidth={2.6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - beamK} strokeLinecap="round"
              style={{filter: `drop-shadow(0 0 9px ${rgba(cAmber, 0.7)})`}} />
          </g>
        )}
      </svg>
      {startIn > 0 && <Annotation x={A.x} y={A.y + 92} align="center" opacity={0.7 * startIn}>START</Annotation>}
      {endVis > 0 && <Annotation x={B.x} y={B.y + 92} align="center" opacity={0.7 * endVis}>END ?</Annotation>}

      {/* 全黑压暗（没有终点段） */}
      {dark > 0 && <AbsoluteFill style={{backgroundColor: COLOR.ink, opacity: dark}} />}

      {frame >= b05.a.gold - 6 && frame < b05.end + 50 && (
        <GoldLine lines={['先有终点', '才有最优']} top={150} sweep={goldSweep} reveal={goldReveal} />
      )}

      <ChapterLabel no="03" title="终点" />
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

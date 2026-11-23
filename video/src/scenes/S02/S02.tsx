// S02 · 费马原理与费曼的解释（人声 31.0–86.6s，正片帧 990–2659，含 +60 片头偏移）
// 三幕：救生员（最短时间）→ 相位箭头（光怎么试）→ 子波（筛选）
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CANVAS, COLOR, FONT, MOTION, TYPE} from '../../design/tokens';
import {clamp01, hex, lerp, rgba} from '../../design/utils';
import {Background, Grain, Grid, Vignette} from '../../components/Atmosphere';
import {Annotation, ChapterLabel, DataLabel, Footnote, GoldLine} from '../../components/Typography';
import {LightSource, TargetMark} from '../../components/Marks';
import {useBeats} from '../../cues';
import {OPTICS, SOLVED} from './optics';
import {FanCanvas} from './FanCanvas';
import {PhasorPanel} from './PhasorPanel';

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const {A, B, surfaceY} = OPTICS;
const {xOpt} = SOLVED;
const P = {x: xOpt, y: surfaceY};
const cAmber = hex(COLOR.amber), cCyan = hex(COLOR.cyan), cReject = hex(COLOR.reject);

// 救生员段路径
const straightLen = Math.hypot(B.x - A.x, B.y - A.y);
const optD = `M ${A.x} ${A.y} L ${P.x} ${P.y} L ${B.x} ${B.y}`;
const straightD = `M ${A.x} ${A.y} L ${B.x} ${B.y}`;

// —— 沙滩/海 俯视背景；morphK=1 时沙滩退成空气、海变成水 ——
const BeachSea: React.FC<{frame: number; morphK: number; coastK: number}> = ({frame, morphK, coastK}) => {
  const {width: W, height: H} = CANVAS;
  const sandDots = useMemo(
    () => Array.from({length: 340}, (_, i) => ({
      x: random(`s02-sand-x-${i}`) * W,
      y: random(`s02-sand-y-${i}`) * (surfaceY - 8),
      r: 0.8 + random(`s02-sand-r-${i}`) * 1.6,
      o: 0.05 + random(`s02-sand-o-${i}`) * 0.1,
    })),
    [W],
  );
  const waves = [0, 1, 2, 3, 4].map((i) => {
    const y0 = surfaceY + 40 + i * 62;
    const amp = 2.4 - i * 0.3;
    const wl = 240 + i * 50;
    const ph = frame * 0.045 * (1 + i * 0.15) + i;
    let d = '';
    for (let x = 0; x <= W; x += 16) d += `${x === 0 ? 'M' : 'L'}${x} ${(y0 + amp * Math.sin((x / wl) * Math.PI * 2 + ph)).toFixed(2)} `;
    return d;
  });
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      {/* 沙滩（暖色细点），morph 后变淡 */}
      <rect x={0} y={0} width={W} height={surfaceY} fill={rgba(COLOR.amber, 0.025 * (1 - morphK))} />
      {sandDots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={rgba(cAmber, d.o * (1 - morphK * 0.85))} />
      ))}
      {/* 海 */}
      <rect x={0} y={surfaceY} width={W} height={H - surfaceY} fill={COLOR.water} opacity={0.92} />
      {waves.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={rgba(cCyan, (0.09 - i * 0.013) * (1 + morphK * 0.6))} strokeWidth={1} />
      ))}
      {/* 海岸线：从左往右画出 */}
      <line x1={0} x2={W * coastK} y1={surfaceY} y2={surfaceY} stroke={rgba(COLOR.core, 0.35)} strokeWidth={1.4} />
    </svg>
  );
};

// —— 问号碎成粒子 ——
const ShatterQ: React.FC<{k: number}> = ({k}) => {
  const pts = useMemo(
    () => Array.from({length: 42}, (_, i) => ({
      a: random(`s02-q-a-${i}`) * Math.PI * 2,
      v: 2 + random(`s02-q-v-${i}`) * 9,
      x: 960 + (random(`s02-q-x-${i}`) - 0.5) * 90,
      y: 480 + (random(`s02-q-y-${i}`) - 0.5) * 140,
    })), [],
  );
  if (k <= 0) return null;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      {pts.map((p, i) => (
        <circle key={i} cx={p.x + Math.cos(p.a) * p.v * k * 12} cy={p.y + Math.sin(p.a) * p.v * k * 12 + k * k * 40}
          r={2.2 * (1 - k) + 0.4} fill={rgba(COLOR.white, 0.75 * (1 - k))} />
      ))}
    </svg>
  );
};

// —— 惠更斯子波：每 24 帧一圈，朝 B 方向的共振变亮，其余变灰消失 ——
const WaveletsCanvas: React.FC<{birth: number; resonanceAt: number; fadeAt: number; goneAt: number}> = ({birth, resonanceAt, fadeAt, goneAt}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const {width: W, height: H} = CANVAS;
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    const t = frame - birth;
    if (t < 0) return;
    const dirAB = Math.atan2(B.y - A.y, B.x - A.x);
    const resonK = clamp01((frame - resonanceAt) / 25);
    const goneK = clamp01((frame - fadeAt) / Math.max(1, goneAt - fadeAt));
    ctx.globalCompositeOperation = 'lighter';
    const n = Math.min(14, Math.floor(t / 22) + 1);
    for (let i = 0; i < n; i++) {
      const age = t - i * 22;
      if (age < 0) continue;
      const r = 34 + age * 7.2;
      const baseA = Math.max(0, 0.8 - age * 0.0026);
      if (baseA <= 0.02) continue;
      // 每圈按角度分段：朝 B 的扇区共振
      for (let s = 0; s < 28; s++) {
        const a0 = (s / 28) * Math.PI * 2, a1 = ((s + 1) / 28) * Math.PI * 2;
        const mid = (a0 + a1) / 2;
        let dd = Math.abs(((mid - dirAB + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        const toward = clamp01(1 - dd / 0.9);
        const grey = goneK * (1 - toward * resonK);
        const alpha = baseA * (1 - grey * 0.96);
        if (alpha < 0.015) continue;
        const glow = toward * resonK * (1 - goneK * 0.4);
        const col = glow > 0.15 ? lerp3(cCyan, cAmber, glow) : cCyan;
        ctx.strokeStyle = rgba(col, alpha * (0.75 + glow));
        ctx.lineWidth = 1.6 + glow * 2;
        ctx.beginPath();
        ctx.arc(A.x, A.y, r, a0, a1);
        ctx.stroke();
        // 波前上的小的子波源
        if (i % 2 === 0 && s % 4 === 0) {
          const sx = A.x + Math.cos(mid) * r, sy = A.y + Math.sin(mid) * r;
          ctx.strokeStyle = rgba(col, alpha * 0.7);
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.arc(sx, sy, 7 + ((age * 3.5) % 16), 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }, [frame, birth, resonanceAt, fadeAt, goneAt, W, H]);
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}} />;
};
const lerp3 = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] =>
  [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export const S02: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const KB = useBeats('S02');
  const b01 = KB['01'], b02 = KB['02'], b03 = KB['03'], b04 = KB['04'], b05 = KB['05'], b06 = KB['06'],
    b07 = KB['07'], b08 = KB['08'], b09 = KB['09'], b10 = KB['10'], b11 = KB['11'], b12 = KB['12'],
    b13 = KB['13'], b14 = KB['14'], b15 = KB['15'], b16 = KB['16'], b17 = KB['17'];

  const START = b01.at - 10, END = b17.end + 60;
  

  // —— 分幕后边界 ——
  const cutLifeguard = b03.at;            // 切到救生员俯视
  const fanStart = b11.at;                // 扇面开始
  const waveStart = b15.at;               // 子波开始
  const goldAt = b17.at;

  // —— #01 杂志排版：1662 打字滚动 + 签名线 ——
  const digitsIn = spring({frame: frame - b01.a.digits, fps, config: MOTION.spring});
  const sigK = clamp01((frame - b01.a.sig) / 20);
  const magOut = clamp01((frame - (cutLifeguard - 6)) / 10);
  // #02 排版退到左上
  const magShrink = clamp01((frame - b02.at) / 24, );

  // —— #02 A/B + 计时器 ——
  const abIn = spring({frame: frame - b02.a.ab, fps, config: MOTION.spring});
  const pathK = clamp01((frame - b02.a.path) / 20);
  const timerStop = b02.a.stop;
  const timerVal = frame < timerStop
    ? (Math.floor((frame * 7) % 97) + Math.floor((frame * 13) % 89) / 100)
    : 0;
  const timerFlash = Math.sin(clamp01((frame - timerStop) / 8) * Math.PI);

  // —— #03–#07 救生员 → 光学变形 ——
  const coastK = clamp01((frame - (b03.at + 6)) / 24);
  const lifIn = spring({frame: frame - b04.a.lifeguard, fps, config: MOTION.spring});
  const vicIn = spring({frame: frame - b04.a.victim, fps, config: MOTION.spring});
  const sonar = (frame - b04.a.victim) % 36;
  const straightK = clamp01((frame - b05.a.straight) / 18);
  const slowK = clamp01((frame - b05.a.slow) / 10);
  const optK = clamp01((frame - b06.a.run) / 22);
  const bendK = clamp01((frame - b06.a.bend) / 16);
  const tRoll = interpolate(frame, [b06.a.run, b06.a.faster + 8], [48, 39], {...clampOpt, easing: MOTION.easeIn});
  const straightGrey = clamp01((frame - b06.a.faster) / 14);
  const morphK = clamp01((frame - b07.a.morph) / 20);
  const formulaIn = clamp01((frame - b07.a.formula) / 16);

  // —— #08–#09 推镜 + 眼睛 + 问号 ——
  const pushK = interpolate(frame, [b08.at, b08.at + MOTION.dur.camera, b09.at + 20], [0, 1, 0], {...clampOpt, easing: MOTION.easeIn});
  const eyeIn = clamp01((frame - b08.a.eye) / 10);
  const eyeSlash = clamp01((frame - (b08.a.eye + 12)) / 8);
  const qIn = spring({frame: frame - b08.a.how, fps, config: MOTION.spring});
  const qOut = clamp01((frame - b09.a.noplan) / 12);

  // —— #10–#14 费曼 + 扇面 + 相位 ——
  const typeChars = Math.max(0, Math.min(26, Math.floor((frame - b10.at) / 1.6)));
  const fanK = clamp01((frame - b11.a.spread) / 20) * 0.3
    + clamp01((frame - b12.a.interfere) / 40) * 0.45
    + clamp01((frame - b13.a.converge) / 30) * 0.25;
  const fanOut = 1 - clamp01((frame - waveStart) / 30);
  const panelIn = clamp01((frame - b12.a.interfere) / 16) * fanOut;
  const tagTry = clamp01((frame - b14.a.try) / 8);
  const tagFilter = clamp01((frame - b14.a.filter) / 8);
  const tagNoPlan = clamp01((frame - b14.a.noplan) / 10);

  // —— #15–#16 子波 ——
  const waveOut = 1 - clamp01((frame - (goldAt - 10)) / 16);

  // —— #17 金句 ——
  const dim = interpolate(frame, [goldAt - 4, goldAt + 12, b17.end + 20, b17.end + 40], [0, 0.72, 0.72, 0], clampOpt);
  const goldReveal = clamp01((frame - b17.a.gold) / 12) + clamp01((frame - b17.a.gold2) / 12);
  const goldSweep = clamp01((frame - b17.a.gold2) / MOTION.dur.goldSweep);

  // —— 转场：光束反向收回 ——
  const retract = 1 - clamp01((frame - (b17.end + 30)) / 22);

  const cam = 1 + pushK * 0.16;

  if (frame < START || frame > END) return null;
const fadeIn = clamp01((frame - START) / 10);

  return (
    <AbsoluteFill style={{backgroundColor: COLOR.ink, overflow: 'hidden', opacity: fadeIn}}>
      <Background />

      {/* ===== 第一幕：杂志排版 1662 ===== */}
      {frame < cutLifeguard && (
        <AbsoluteFill style={{opacity: 1 - magOut}}>
          <div style={{
            position: 'absolute', left: lerp(200, 120, magShrink), top: lerp(300, 96, magShrink),
            transform: `scale(${lerp(1, 0.36, magShrink)})`, transformOrigin: 'left top', opacity: 1 - magShrink * 0.4,
          }}>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 42, transform: `translateY(${(1 - digitsIn) * 30}px)`, opacity: digitsIn}}>
              <span style={{fontFamily: FONT.serif, fontWeight: 900, fontSize: 160, color: COLOR.core, letterSpacing: '0.02em'}}>1662</span>
              <span style={{...TYPE.label, color: COLOR.white, opacity: 0.55}}>PIERRE DE FERMAT</span>
            </div>
            <svg width={560} height={60} style={{marginTop: 6, overflow: 'visible'}}>
              <path d="M 6 34 C 90 10, 150 52, 240 30 S 420 16, 540 34" fill="none"
                stroke={rgba(cAmber, 0.85)} strokeWidth={2.2} strokeLinecap="round"
                pathLength={1} strokeDasharray={1} strokeDashoffset={1 - sigK} />
            </svg>
          </div>
          {/* #02 网格 + A/B + 路径 + 计时器 */}
          {frame >= b02.at && (
            <>
              <Grid opacity={0.1 * clamp01((frame - b02.at) / 16)} />
              <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
                <g opacity={abIn}>
                  <path d={`M ${A.x} ${A.y + 140} Q ${(A.x + B.x) / 2} ${A.y - 60} ${B.x} ${B.y - 60}`} fill="none"
                    stroke={rgba(cAmber, 0.9)} strokeWidth={2.4} strokeLinecap="round"
                    pathLength={1} strokeDasharray={1} strokeDashoffset={1 - pathK}
                    style={{filter: `drop-shadow(0 0 10px ${rgba(cAmber, 0.6)})`}} />
                  <LightSource id="s02-a0" x={A.x} y={A.y + 140} breath={1} />
                  <TargetMark x={B.x} y={B.y - 60} lit={pathK} />
                </g>
              </svg>
              <DataLabel x={960} y={210} opacity={abIn}>
                {frame < timerStop ? `t = ${timerVal.toFixed(2)}` : 't = min'}
              </DataLabel>
              {timerFlash > 0 && (
                <AbsoluteFill style={{background: `radial-gradient(circle at 960px 210px, ${rgba(COLOR.core, timerFlash * 0.16)} 0%, transparent 45%)`, mixBlendMode: 'screen'}} />
              )}
            </>
          )}
          <ChapterLabel no="01" title="最短时间" />
        </AbsoluteFill>
      )}

      {/* ===== 第二幕：救生员 → 折射 ===== */}
      {frame >= cutLifeguard && frame < fanStart + 40 && (
        <AbsoluteFill style={{
          transform: `scale(${cam})`, transformOrigin: `${P.x}px ${P.y}px`,
          opacity: 1 - clamp01((frame - fanStart) / 30),
        }}>
          <BeachSea frame={frame} morphK={morphK} coastK={coastK} />
          <Grid opacity={0.08 * morphK} />
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
            {/* 砖红直线（距离最短） */}
            {straightK > 0 && (
              <g opacity={1 - straightGrey * 0.75}>
                <path d={straightD} fill="none" stroke={rgba(hex(COLOR.alert), 0.85)} strokeWidth={1.8}
                  strokeDasharray="8 9" pathLength={1} strokeDashoffset={1 - straightK} />
                {straightK >= 1 && (
                  <Annotation x={(A.x + B.x) / 2 + 60} y={(A.y + B.y) / 2 - 120} color={COLOR.alert} opacity={0.9}>
                    t = 48s
                  </Annotation>
                )}
                {slowK > 0 && (
                  <Annotation x={1100} y={720} size="sm" color={COLOR.alert} opacity={0.4 + 0.4 * Math.abs(Math.sin(frame / 6))}>
                    v = 2 m/s
                  </Annotation>
                )}
              </g>
            )}
            {/* 琥珀最优路径 */}
            {optK > 0 && (
              <g>
                <path d={optD} fill="none" stroke={rgba(cAmber, 0.14)} strokeWidth={14} strokeLinejoin="round"
                  pathLength={1} strokeDasharray={1} strokeDashoffset={1 - optK} style={{filter: 'blur(5px)'}} />
                <path d={optD} fill="none" stroke={rgba(cAmber, 0.9)} strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round"
                  pathLength={1} strokeDasharray={1} strokeDashoffset={1 - optK}
                  style={{filter: `drop-shadow(0 0 8px ${rgba(cAmber, 0.7)})`}} />
                {optK > 0.4 && optK < 1 && (
                  <Annotation x={lerp(A.x, P.x, 0.5) - 30} y={lerp(A.y, P.y, 0.5) - 40} size="sm" color={COLOR.amber} opacity={0.85}>
                    v = 7 m/s
                  </Annotation>
                )}
                {bendK > 0 && (
                  <circle cx={P.x} cy={P.y} r={10 + bendK * 46} fill="none" stroke={rgba(cCyan, 0.5 * (1 - bendK))} strokeWidth={1.4} />
                )}
                {optK >= 1 && (
                  <DataLabel x={960} y={150} opacity={1 - morphK}>{`t = ${tRoll.toFixed(0)}s`}</DataLabel>
                )}
              </g>
            )}
            {/* L / S 两点：morph 后变成光源与准星 */}
            <g opacity={1 - morphK}>
              <g transform={`translate(${A.x} ${A.y}) scale(${lifIn})`}>
                <circle r={9} fill={COLOR.amber} style={{filter: `drop-shadow(0 0 10px ${COLOR.amber})`}} />
              </g>
              <g transform={`translate(${B.x} ${B.y}) scale(${vicIn})`}>
                <circle r={8} fill={COLOR.cyan} style={{filter: `drop-shadow(0 0 10px ${COLOR.cyan})`}} />
                {frame > b04.a.victim && (
                  <circle r={14 + sonar * 1.6} fill="none" stroke={rgba(cCyan, Math.max(0, 0.6 - sonar * 0.016))} strokeWidth={1.4} />
                )}
              </g>
              {lifIn > 0.5 && <Annotation x={A.x + 26} y={A.y - 22} size="sm" color={COLOR.amber}>L · 救生员</Annotation>}
              {vicIn > 0.5 && <Annotation x={B.x - 26} y={B.y + 30} size="sm" align="right" color={COLOR.cyan}>S · 溺水者</Annotation>}
              <Annotation x={120} y={130} size="sm" opacity={0.55}>FIG.01 — LIFEGUARD</Annotation>
            </g>
            <g opacity={morphK}>
              <LightSource id="s02-a" x={A.x} y={A.y} breath={1 + 0.05 * Math.sin(frame / 14)} />
              <TargetMark x={B.x} y={B.y} lit={0.5 + 0.5 * formulaIn} />
              <Annotation x={A.x + 30} y={A.y - 26} size="sm">A · SOURCE</Annotation>
              <Annotation x={B.x + 44} y={B.y} size="sm">B · TARGET</Annotation>
              <Annotation x={1800} y={surfaceY - 24} align="right" size="sm" opacity={0.6}>n₁ = 1.00 · AIR</Annotation>
              <Annotation x={1800} y={surfaceY + 26} align="right" size="sm" color={COLOR.cyan} opacity={0.6}>n₂ = 1.33 · WATER</Annotation>
            </g>
          </svg>
          {/* 公式 */}
          {formulaIn > 0 && (
            <Annotation x={1810} y={960} align="right" size="md" opacity={0.6 * formulaIn}>
              n₁ sin θ₁ = n₂ sin θ₂
            </Annotation>
          )}
          {/* #08 眼睛 + 问号 */}
          {eyeIn > 0 && (
            <g>
              <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: eyeIn * (1 - qOut)}}>
                <g transform={`translate(${P.x + 190} ${P.y - 190})`}>
                  <ellipse rx={46} ry={26} fill="none" stroke={rgba(COLOR.white, 0.7)} strokeWidth={2} />
                  <circle r={12} fill="none" stroke={rgba(COLOR.white, 0.7)} strokeWidth={2} />
                  {eyeSlash > 0 && (
                    <line x1={-56} y1={34} x2={-56 + 112 * eyeSlash} y2={34 - 76 * eyeSlash} stroke={COLOR.alert} strokeWidth={4} strokeLinecap="round" />
                  )}
                </g>
              </svg>
              <div style={{
                position: 'absolute', left: 960, top: 430, transform: `translate(-50%, -50%) scale(${qIn}) translateY(${(1 - qIn) * 26}px)`,
                fontFamily: FONT.serif, fontWeight: 900, fontSize: 220, color: COLOR.core, opacity: (1 - qOut) * 0.95,
                textShadow: `0 0 44px ${rgba(cAmber, 0.4)}`,
              }}>?</div>
              <ShatterQ k={qOut} />
            </g>
          )}
          <ChapterLabel no="01" title="最短时间" />
        </AbsoluteFill>
      )}

      {/* ===== 第三幕：费曼扇面 + 相位 ===== */}
      {frame >= b10.at - 30 && frame < waveStart + 40 && (
        <AbsoluteFill style={{opacity: fanOut}}>
          <Grid opacity={0.1} />
          <FanCanvas progress={clamp01(fanK) * (1 - clamp01((frame - (waveStart - 20)) / 30))} />
          {panelIn > 0 && (
            <div style={{opacity: panelIn}}>
              <PhasorPanel progress={clamp01(fanK)} />
            </div>
          )}
          <LightSourceWrap />
          {/* 打字：费曼 */}
          <div style={{position: 'absolute', left: 120, top: 120, ...TYPE.label, color: COLOR.white, opacity: 0.8}}>
            {'RICHARD FEYNMAN · QED, 1985'.slice(0, typeChars)}
            {typeChars < 26 && <span style={{opacity: 0.5}}>▌</span>}
          </div>
          {/* TRY / FILTER / NO PLAN */}
          <Annotation x={800} y={150} size="md" color={COLOR.amber} opacity={0.9 * tagTry}>TRY</Annotation>
          <Annotation x={980} y={150} size="md" color={COLOR.amber} opacity={0.9 * tagFilter}>FILTER</Annotation>
          {tagNoPlan > 0 && (
            <>
              <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: tagNoPlan}}>
                <rect x={A.x - 52} y={A.y - 44} width={150} height={84} fill="none" stroke={rgba(COLOR.white, 0.4)} strokeWidth={1} strokeDasharray="5 6" />
              </svg>
              <Annotation x={A.x + 24} y={A.y + 66} size="sm" align="center" opacity={0.7 * tagNoPlan}>NO PLAN</Annotation>
            </>
          )}
          <ChapterLabel no="02" title="光怎么找路" />
          {frame >= b11.at && (
            <Footnote x={1810} y={1020} align="right">严格表述：光程取驻值，多数情况为最小值</Footnote>
          )}
        </AbsoluteFill>
      )}

      {/* ===== 第四幕：惠更斯子波 ===== */}
      {frame >= waveStart - 4 && frame < goldAt + 30 && (
        <AbsoluteFill style={{opacity: waveOut}}>
          <Grid opacity={0.08} />
          <WaveletsCanvas birth={waveStart} resonanceAt={b16.a.resonance} fadeAt={b16.a.fade} goneAt={b16.a.gone} />
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
            <LightSource id="s02-w" x={A.x} y={A.y} breath={1} />
            <TargetMark x={B.x} y={B.y} lit={clamp01((frame - b16.a.resonance) / 20)} />
          </svg>
          <ChapterLabel no="02" title="光怎么找路" />
        </AbsoluteFill>
      )}

      {/* ===== #17 金句 ===== */}
      {dim > 0 && <AbsoluteFill style={{backgroundColor: COLOR.ink, opacity: dim}} />}
      {frame >= goldAt - 4 && (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: retract}}>
          <path d={optD} fill="none" stroke={rgba(cAmber, 0.1)} strokeWidth={16} strokeLinejoin="round" style={{filter: 'blur(6px)'}}
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - retract} />
          <path d={optD} fill="none" stroke={rgba(cAmber, 0.55)} strokeWidth={5} strokeLinejoin="round" style={{filter: 'blur(3px)'}}
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - retract} />
          <path d={optD} fill="none" stroke={COLOR.core} strokeWidth={1.6} strokeLinejoin="round"
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - retract} />
          {retract > 0.9 && <LightSource id="s02-g" x={A.x} y={A.y} breath={1} />}
        </svg>
      )}
      {frame >= b17.a.gold - 6 && frame < b17.end + 46 && (
        <GoldLine lines={['最短的时间', '常常藏在一条弯路里']} top={150} sweep={goldSweep} reveal={goldReveal} />
      )}

      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

const LightSourceWrap: React.FC = () => (
  <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
    <LightSource id="s02-f" x={A.x} y={A.y} breath={1} />
    <TargetMark x={B.x} y={B.y} lit={0.7} />
  </svg>
);

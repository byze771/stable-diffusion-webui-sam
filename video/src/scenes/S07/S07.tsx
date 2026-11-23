// S07 · 沉睡的子波（人声 225.0–267.6s，正片帧 6811–8127）
// 台面/后台两层空间：支线变细下沉 → 暗青正弦波 → 共振光柱 → 离群子波与剪刀 → 熄灭与机制 → 星空 → 金句
import React, {useEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {COLOR, FONT, MOTION} from '../../design/tokens';
import {clamp01, hex, lerp, rgba} from '../../design/utils';
import {Background, Grain, Vignette} from '../../components/Atmosphere';
import {Annotation, ChapterLabel, GoldLine} from '../../components/Typography';
import {useBeats} from '../../cues';

const cAmber = hex(COLOR.amber), cCyan = hex(COLOR.cyan), cReject = hex(COLOR.reject);

const DIV_Y = 450;          // 分隔线（世界坐标）
const MAIN_Y = 300;         // 琥珀主线
const WAVE_Y = [560, 630, 705, 780, 850];   // 五条后台波
const WAVE_F = [3.2, 4.1, 2.7, 3.8, 4.6];   // 各自频率
const WAVE_P = [0.032, -0.024, 0.036, -0.03, 0.027]; // 相速度
const GLOW = 2;             // 会共振的那条
const MAIN_F = 2.0, MAIN_P = 0.02;

const wavePath = (y: number, amp: number, freq: number, phase: number, x0 = 180, x1 = 1740) => {
  const n = 48;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const yy = y + Math.sin((i / n) * freq * Math.PI * 2 + phase) * amp;
    d += (i ? ' L ' : 'M ') + x.toFixed(1) + ' ' + yy.toFixed(1);
  }
  return d;
};

// 后台底层星空（canvas，260 颗）
const StarField: React.FC<{cam: number; lightK: number; dim?: number}> = ({cam, lightK, dim = 1}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stars = useMemo(() => Array.from({length: 260}, (_, i) => ({
    x: 110 + random(`s07-sx-${i}`) * 1700,
    y: 800 + random(`s07-sy-${i}`) * 260,
    r: 0.8 + random(`s07-sr-${i}`) * 1.7,
    d: random(`s07-sd-${i}`),
    b: 0.35 + random(`s07-sb-${i}`) * 0.65,
  })), []);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 1920, 1080);
    for (const s of stars) {
      const sy = s.y - cam * 0.6;
      if (sy < -10 || sy > 1090) continue;
      const lit = clamp01(lightK * 1.6 - s.d * 0.9);
      const a = (0.05 + s.b * 0.55 * lit) * dim;
      ctx.beginPath();
      ctx.fillStyle = `rgba(127,231,255,${a.toFixed(3)})`;
      if (lit > 0.55) { ctx.shadowColor = 'rgba(127,231,255,0.8)'; ctx.shadowBlur = 8 * lit; } else ctx.shadowBlur = 0;
      ctx.arc(s.x, sy, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  });
  return <canvas ref={ref} width={1920} height={1080} style={{position: 'absolute', inset: 0}} />;
};

export const S07: React.FC = () => {
  const frame = useCurrentFrame();
  const KB = useBeats('S07');
  const b01 = KB['01'], b02 = KB['02'], b03 = KB['03'], b04 = KB['04'], b05 = KB['05'], b06 = KB['06'],
    b07 = KB['07'], b08 = KB['08'], b09 = KB['09'], b10 = KB['10'], b11 = KB['11'], b12 = KB['12'];

  const START = b01.at - 16, END = b12.end + 40;
  

  // ===== 镜头下沉（世界坐标 → 屏幕坐标：screen = world - cam × depth） =====
  const cam =
    lerp(0, 200, clamp01((frame - b02.a.thin) / 70)) +
    lerp(0, 140, clamp01((frame - (b05.a.dot - 14)) / 44)) +
    lerp(0, 120, clamp01((frame - (b11.a.stars - 40)) / 50)) -
    lerp(0, 460, clamp01((frame - (b12.a.gold - 22)) / 18)); // 金句前快速回到 0

  // #01 分层
  const splitK = clamp01((frame - b01.a.split) / 18);
  // #02 支线变细、下沉、变成波
  const thinK = clamp01((frame - b02.a.thin) / 22);
  const sinkK = clamp01((frame - b02.a.sink) / 40);
  const sleepK = clamp01((frame - b02.a.sleep) / 20);
  // #03–#04 杂乱 → 频率对齐 → 共振
  const hintK = clamp01((frame - b03.a.hint) / 26);
  const alignK = clamp01((frame - b04.a.align) / (b04.a.flash - b04.a.align));
  const flashK = clamp01((frame - b04.a.flash) / 3);
  const flashDecay = 1 - clamp01((frame - b04.a.flash - 3) / 10);
  const beamK = clamp01((frame - b04.a.flash) / 5) * (1 - clamp01((frame - b04.a.flash - 26) / 22));
  // #05–#06 离群子波
  const dotK = clamp01((frame - b05.a.dot) / 12);
  const outlierK = clamp01((frame - b06.a.outlier) / 10);
  // #07 剪刀 + 预演
  const scisK = clamp01((frame - b07.a.scissors) / 26);
  const scisOut = 1 - clamp01((frame - b08.a.curve) / 12);
  const previewK = clamp01((frame - b07.a.preview) / 16) * (1 - clamp01((frame - b09.a.flatten) / 14));
  // #08 后劲曲线
  const curveK = clamp01((frame - b08.a.curve) / 24);
  const curveOut = 1 - clamp01((frame - b09.a.flatten) / 16);
  // #09 熄灭
  const flatK = clamp01((frame - b09.a.flatten) / 26);
  // #10 机制
  const mechK = clamp01((frame - b10.a.fail) / 14) * (1 - clamp01((frame - (b11.a.stars - 10)) / 16));
  const lab1 = clamp01((frame - b10.a.fail) / 8);
  const lab2 = clamp01((frame - b10.a.part) / 8);
  const lab3 = clamp01((frame - b10.a.label3) / 8);
  // #11 星空
  const starsK = clamp01((frame - b11.a.stars) / 40);
  // #12 金句
  const dimK = clamp01((frame - b12.a.gold) / 16) * 0.62;
  const goldReveal = clamp01((frame - b12.a.gold) / 12) + clamp01((frame - b12.a.gold2) / 12);
  const goldSweep = clamp01((frame - b12.a.gold2) / MOTION.dur.goldSweep);
  const inGold = frame >= b12.a.gold - 6;

  // 波的当前形态
  const waves = WAVE_Y.map((wy, i) => {
    const isGlow = i === GLOW;
    const freq = isGlow ? lerp(WAVE_F[i], MAIN_F, alignK) : WAVE_F[i];
    const phase = frame * (isGlow ? lerp(WAVE_P[i], MAIN_P, alignK) : WAVE_P[i]);
    const amp = lerp(7, 0.6, flatK);
    const baseOp = sleepK * (isGlow ? 0.45 + hintK * 0.5 : 0.5);
    const op = baseOp * (1 - flatK * (isGlow ? 0.35 : 0.85));
    return {wy, freq, phase, amp, op, isGlow};
  });
  const mainPhase = frame * MAIN_P;

  // 下沉的 4 条支线（世界坐标）
  const branches = [0, 1, 2, 3].map((i) => {
    const y0 = 200 + i * 48;
    const targetW = [0, 1, 3, 4][i];
    const p = clamp01((frame - b02.a.sink - i * 8) / 34);
    const y = lerp(y0, WAVE_Y[targetW], p * p);
    const w = lerp(2.2, 0.8, thinK);
    const op = (1 - clamp01((p - 0.6) / 0.35)) * (1 - flatK);
    return {y0, y, w, op, p};
  });

  const dot = {x: 1500, y: 950};

  if (frame < START || frame > END) return null;
const fadeIn = clamp01((frame - START) / 10);

  return (
    <AbsoluteFill style={{opacity: fadeIn}}>
      <Background />
      {/* ===== 相机层 ===== */}
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${(-cam).toFixed(1)}px)`}}>
        {/* 后台层（毛玻璃暗青） */}
        <div style={{
          position: 'absolute', left: 60, right: 60, top: DIV_Y + 24, height: 620,
          background: `linear-gradient(180deg, ${rgba(cCyan, 0.05)}, ${rgba(cCyan, 0.015)} 60%, rgba(0,0,0,0.25))`,
          border: `1px solid ${rgba(cCyan, 0.10 * splitK)}`,
          opacity: splitK,
        }} />
        {/* 琥珀主线（微正弦） */}
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <path d={wavePath(MAIN_Y, 6, MAIN_F, mainPhase)} fill="none"
            stroke={rgba(cAmber, 0.85)} strokeWidth={3}
            style={{filter: `drop-shadow(0 0 10px ${rgba(cAmber, 0.45)})`}} />
          {/* 分隔线 */}
          {splitK > 0 && (
            <line x1={80} y1={DIV_Y} x2={1840} y2={DIV_Y}
              stroke={rgba(COLOR.white, 0.3)} strokeWidth={1}
              pathLength={1} strokeDasharray={1} strokeDashoffset={1 - splitK} />
          )}
          {/* 后台正弦波 */}
          {waves.map((w, i) => w.op > 0.01 && (
            <path key={i} d={wavePath(w.wy, w.amp, w.freq, w.phase)} fill="none"
              stroke={rgba(w.isGlow && hintK > 0.4 ? cCyan : cReject, w.op)}
              strokeWidth={w.isGlow ? 1.8 : 1.4}
              style={w.isGlow && hintK > 0.4 ? {filter: `drop-shadow(0 0 8px ${rgba(cCyan, 0.6 * hintK)})`} : undefined} />
          ))}
          {/* 下沉中的支线 */}
          {branches.map((br, i) => br.op > 0.01 && (
            <line key={i} x1={520} y1={br.y} x2={1420} y2={br.y}
              stroke={rgba(cCyan, 0.6 * br.op)} strokeWidth={br.w} />
          ))}
          {/* 共振光柱 */}
          {beamK > 0 && (
            <rect x={946} y={MAIN_Y} width={14} height={WAVE_Y[GLOW] - MAIN_Y}
              fill={`url(#s07beam)`} opacity={beamK} />
          )}
          <defs>
            <linearGradient id="s07beam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={rgba(cAmber, 0.9)} />
              <stop offset="1" stopColor={rgba(cCyan, 0.9)} />
            </linearGradient>
          </defs>
          {/* #08 后劲时间轴 */}
          {curveK > 0 && curveOut > 0 && (
            <g opacity={curveK * curveOut}>
              <line x1={260} y1={1000} x2={1660} y2={1000} stroke={rgba(COLOR.white, 0.3)} strokeWidth={1} />
              <path d="M 260 990 L 900 990 L 1100 982 L 1400 940 L 1660 860" fill="none"
                stroke={rgba(cCyan, 0.85)} strokeWidth={2.2}
                pathLength={1} strokeDasharray={1} strokeDashoffset={1 - curveK}
                style={{filter: `drop-shadow(0 0 6px ${rgba(cCyan, 0.5)})`}} />
              <circle cx={1660} cy={860} r={5} fill={COLOR.core}
                style={{filter: `drop-shadow(0 0 10px ${COLOR.cyan})`}} opacity={curveK} />
              <Annotation x={1660} y={1022} align="right" size="sm" opacity={0.6}>PAYOFF →</Annotation>
            </g>
          )}
        </svg>
        {/* 层标签 + 「支线」 */}
        {splitK > 0 && (
          <>
            <Annotation x={92} y={150} size="sm" opacity={0.55 * splitK}>FRONT</Annotation>
            <Annotation x={92} y={DIV_Y + 44} size="sm" color={COLOR.cyan} opacity={0.55 * splitK}>BACKSTAGE</Annotation>
            <Annotation x={430} y={DIV_Y - 26} color={COLOR.cyan} opacity={0.92 * splitK}
              style={{fontFamily: FONT.serif, fontWeight: 900, fontSize: 56, textShadow: `0 0 18px ${rgba(cCyan, 0.4)}`}}>支线</Annotation>
          </>
        )}
        {/* 离群子波 */}
        {dotK > 0 && (
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}} opacity={dotK}>
            <circle cx={dot.x} cy={dot.y} r={6} fill={COLOR.core}
              style={{filter: `drop-shadow(0 0 12px ${COLOR.cyan}) drop-shadow(0 0 30px ${rgba(cCyan, 0.5)})`}} />
          </svg>
        )}
        {outlierK > 0 && (
          <>
            <Annotation x={dot.x + 34} y={dot.y - 8} size="sm" color={COLOR.cyan} opacity={0.9 * outlierK}>OUTLIER</Annotation>
            <Annotation x={dot.x} y={dot.y - 72} align="center" size="sm" opacity={0.8 * outlierK}
              style={{border: `1px solid ${rgba(COLOR.white, 0.25)}`, padding: '4px 12px'}}>ROI = 0</Annotation>
          </>
        )}
        {/* 剪刀 */}
        {scisK > 0 && scisOut > 0 && (
          <Annotation x={lerp(1330, 1452, clamp01(scisK * 1.15))} y={dot.y - 6} opacity={scisK * scisOut}
            style={{fontSize: 40, transform: 'rotate(-25deg)'}}>✂️</Annotation>
        )}
        {/* #07 未来预演（右下角半透明） */}
        {previewK > 0 && (
          <div style={{
            position: 'absolute', left: 1150, top: 730, width: 600, height: 260,
            border: `1px solid ${rgba(cCyan, 0.3)}`, background: rgba(COLOR.ink, 0.55),
            opacity: previewK, padding: 18,
          }}>
            <Annotation x={90} y={16} size="sm" color={COLOR.cyan} opacity={0.7}>FUTURE · T+?</Annotation>
            <svg width={560} height={190} style={{position: 'absolute', left: 20, top: 52}}>
              <line x1={10} y1={150} x2={550} y2={150} stroke={rgba(COLOR.white, 0.25)} strokeWidth={1} strokeDasharray="4 6" />
              <path d="M 10 148 L 320 148 L 420 120 L 500 40" fill="none" stroke={rgba(cCyan, 0.8)} strokeWidth={2} />
              <circle cx={500} cy={40} r={7} fill={COLOR.core} style={{filter: `drop-shadow(0 0 14px ${COLOR.cyan})`}} />
            </svg>
          </div>
        )}
        {/* #10 机制小窗 */}
        {mechK > 0 && (
          <div style={{
            position: 'absolute', left: 1240, top: 520, width: 520, height: 240,
            border: `1px solid ${rgba(COLOR.white, 0.22)}`, background: rgba(COLOR.ink, 0.6), opacity: mechK,
          }}>
            <Annotation x={136} y={14} size="sm" opacity={0.6}>Σ PHASE · 求和机制</Annotation>
            <svg width={520} height={140} style={{position: 'absolute', left: 0, top: 44}}>
              {/* 相位小箭头：多数抵消 */}
              {[0.3, 2.4, -1.8, 0.9, -2.9, 1.4].map((a, i) => {
                const x0 = 60 + i * 44, y0 = 70 + Math.sin(i * 2.1) * 22;
                return <line key={i} x1={x0} y1={y0} x2={x0 + Math.cos(a) * 34} y2={y0 + Math.sin(a) * 34}
                  stroke={rgba(cReject, 0.8)} strokeWidth={2} markerEnd="url(#s07arr)" />;
              })}
              {/* 齿轮：熄灭的波是一个齿 */}
              <g transform="translate(400 70)">
                <circle r={34} fill="none" stroke={rgba(COLOR.white, 0.4)} strokeWidth={2} />
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                  const a = (i / 8) * Math.PI * 2;
                  const hot = i === 2;
                  return <line key={i} x1={Math.cos(a) * 34} y1={Math.sin(a) * 34}
                    x2={Math.cos(a) * 46} y2={Math.sin(a) * 46}
                    stroke={hot ? rgba(cCyan, 0.9) : rgba(COLOR.white, 0.4)} strokeWidth={hot ? 4 : 3} />;
                })}
                <path d="M -16 -42 L -8 -50 L 0 -42 L 8 -50 L 16 -42" fill="none" stroke={rgba(cCyan, 0.7)} strokeWidth={1.6} />
              </g>
              <defs>
                <marker id="s07arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M 0 0 L 6 3 L 0 6 Z" fill={rgba(cReject, 0.8)} />
                </marker>
              </defs>
            </svg>
            {/* 三个等宽标签 */}
            <div style={{position: 'absolute', left: 0, right: 0, bottom: -52, display: 'flex', gap: 12, justifyContent: 'center'}}>
              {[[lab1, 'FAIL'], [lab2, '= PART OF'], [lab3, 'SYSTEM']].map(([k, t], i) => (
                <div key={i} style={{
                  width: 150, textAlign: 'center', opacity: k as number,
                  transform: `scale(${0.85 + 0.15 * (k as number)})`,
                  border: `1px solid ${rgba(i === 0 ? COLOR.alert : COLOR.cyan, 0.5)}`,
                  fontFamily: FONT.mono, fontSize: 18, letterSpacing: '0.12em',
                  color: i === 0 ? COLOR.alert : COLOR.cyan, padding: '8px 0',
                }}>{t}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 星空（视差 0.6，挂在相机外，用 cam 手动换算） */}
      <StarField cam={cam} lightK={starsK} />
      {/* 共振整屏闪光 */}
      {flashK > 0 && flashDecay > 0 && (
        <AbsoluteFill style={{background: `radial-gradient(circle at 953px 480px, ${rgba(cCyan, 0.5)}, transparent 55%)`, opacity: flashK * flashDecay * 0.7}} />
      )}

      {/* #12 金句 */}
      {dimK > 0 && <AbsoluteFill style={{backgroundColor: COLOR.ink, opacity: dimK}} />}
      {inGold && (
        <>
          <GoldLine lines={['主线定方向']} top={330} sweep={goldSweep} reveal={clamp01(goldReveal)} />
          <GoldLine lines={['支线藏惊喜']} top={640} sweep={goldSweep} reveal={clamp01(goldReveal - 1)} />
        </>
      )}

      <ChapterLabel no="04" title="两种模式" />
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

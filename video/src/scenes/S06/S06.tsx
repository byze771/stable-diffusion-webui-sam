// S06 · 探索模式（人声 172.0–224.2s，正片帧 5219–6787）
// 琥珀主线 + 冷青支线生长 → 台面五格 → 沉积层 → 八竿子打不着的兴趣 → 曲折路径走出来 → 20 条曲线 18 沉 2 升
import React, {useMemo} from 'react';
import {AbsoluteFill, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CANVAS, COLOR, FONT, MOTION, TYPE} from '../../design/tokens';
import {clamp01, hex, lerp, rgba} from '../../design/utils';
import {Background, Grain, Vignette} from '../../components/Atmosphere';
import {Annotation, ChapterLabel} from '../../components/Typography';
import {useBeats} from '../../cues';

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const cAmber = hex(COLOR.amber), cCyan = hex(COLOR.cyan), cReject = hex(COLOR.reject);
const LY = 560, LX0 = 170, LX1 = 1750;

// 递归生长一条支线（种子固定）
const growBranch = (seed: string, x0: number, y0: number, ang: number, len: number, depth: number): string => {
  let d = `M ${x0.toFixed(1)} ${y0.toFixed(1)}`;
  let x = x0, y = y0, a = ang;
  const steps = 7;
  for (let i = 0; i < steps; i++) {
    a += (random(`${seed}-a-${i}`) - 0.5) * 0.9;
    const l = (len / steps) * (0.75 + random(`${seed}-l-${i}`) * 0.5);
    const nx = x + Math.cos(a) * l, ny = y + Math.sin(a) * l;
    const cx = x + Math.cos(a) * l * 0.5, cy = y + Math.sin(a) * l * 0.5;
    d += ` Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${nx.toFixed(1)} ${ny.toFixed(1)}`;
    x = nx; y = ny;
  }
  return d;
};

const branchEnd = (seed: string, x0: number, y0: number, ang: number, len: number) => {
  let x = x0, y = y0, a = ang;
  for (let i = 0; i < 7; i++) {
    a += (random(`${seed}-a-${i}`) - 0.5) * 0.9;
    const l = (len / 7) * (0.75 + random(`${seed}-l-${i}`) * 0.5);
    x += Math.cos(a) * l; y += Math.sin(a) * l;
  }
  return {x, y};
};

// 台面段的 20 条探索曲线
const curvePath = (seed: string, x0: number, y0: number, hi: boolean) => {
  let d = `M ${x0} ${y0}`;
  let x = x0, y = y0;
  const n = hi ? 6 : 5;
  for (let i = 0; i < n; i++) {
    const nx = x + 90 + random(`${seed}-x-${i}`) * 120;
    const ny = hi
      ? y - 40 - random(`${seed}-y-${i}`) * 70
      : y + (random(`${seed}-y-${i}`) - 0.5) * 130;
    d += ` L ${nx.toFixed(0)} ${ny.toFixed(0)}`;
    x = nx; y = ny;
  }
  return {d, end: {x, y}};
};

export const S06: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const KB = useBeats('S06');
  const b01 = KB['01'], b02 = KB['02'], b03 = KB['03'], b04 = KB['04'], b05 = KB['05'], b06 = KB['06'],
    b07 = KB['07'], b08 = KB['08'], b09 = KB['09'], b10 = KB['10'], b11 = KB['11'], b12 = KB['12'],
    b13 = KB['13'], b14 = KB['14'];

  const START = b01.at - 16, END = b14.end + 40;
  

  // #01–#04 主线加粗 + 支线生长 + 开花
  const labelK = clamp01((frame - b01.a.label) / 10);
  const mainK = clamp01((frame - b02.a.main) / 16);
  const growK = clamp01((frame - b03.a.branch) / 40);
  const flowerK = clamp01((frame - b04.a.flower) / 12);
  const branches = useMemo(() => [0, 1, 2, 3].map((i) => {
    const x0 = 560 + i * 230, y0 = LY;
    const ang = -Math.PI / 2 + (i - 1.5) * 0.5;
    return {d: growBranch(`s06-br-${i}`, x0, y0, ang, 300 + i * 30, 3), end: branchEnd(`s06-br-${i}`, x0, y0, ang, 300 + i * 30)};
  }), []);
  const gardenOut = 1 - clamp01((frame - b05.a.table) / 24);

  // #05–#08 台面俯视图
  const tableK = clamp01((frame - b05.a.table) / 26);
  const slotsK = clamp01((frame - b05.a.slots) / 14);
  const occupyK = clamp01((frame - b06.a.occupy) / 20);
  const icon1K = clamp01((frame - b07.a.job) / 12);
  const icon2K = clamp01((frame - b07.a.skill) / 12);
  const stackK = clamp01((frame - b08.a.stack) / 60);
  const stackGlow = clamp01((frame - b08.a.glow) / 18);
  const tableOut = 1 - clamp01((frame - (b11.at - 10)) / 22);

  // #09–#10 台面边缘的青色细线 + 兴趣图标
  const sideK = clamp01((frame - b09.a.side) / 22);
  const hobbyK = clamp01((frame - b10.a.icons) / 14);

  // #11–#12 侧视曲折路径
  const sideViewK = clamp01((frame - b11.at) / 22);
  const riseK = clamp01((frame - b11.a.rise) / 60);
  const twistK = [b12.a.twist1, b12.a.twist2, b12.a.twist3, b12.a.twist4].map((t) => clamp01((frame - t) / 10));
  const arriveK = clamp01((frame - b12.a.arrive) / 14);
  const heroCurve = useMemo(() => {
    // 固定形状：四个转折点，从低到高
    const pts = [
      {x: 260, y: 830}, {x: 520, y: 720}, {x: 700, y: 800}, {x: 920, y: 640},
      {x: 1130, y: 700}, {x: 1330, y: 480}, {x: 1560, y: 380},
    ];
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i], q = pts[i - 1];
      d += ` Q ${((q.x + p.x) / 2).toFixed(0)} ${q.y} ${((q.x + p.x) / 2).toFixed(0)} ${((q.y + p.y) / 2).toFixed(0)} T ${p.x} ${p.y}`;
    }
    return {d, pts};
  }, []);
  const sideOut = 1 - clamp01((frame - b13.at) / 20);

  // #13–#14 20 条曲线：18 沉 2 升
  const revealK = clamp01((frame - b13.a.reveal) / 24);
  const sinkK = clamp01((frame - b14.a.sink) / 30);
  const rise2K = clamp01((frame - b14.a.rise) / 24);
  const curves = useMemo(() => Array.from({length: 20}, (_, i) => {
    const hi = i === 4 || i === 13;
    const y0 = 620 + (i % 5) * 60 + random(`s06-c-y-${i}`) * 30;
    const {d, end} = curvePath(`s06-c-${i}`, 240 + random(`s06-c-x-${i}`) * 60, y0, hi);
    return {d, end, hi, delay: random(`s06-c-d-${i}`) * 20};
  }), []);
  const sceneOut = 1 - clamp01((frame - (b14.end + 20)) / 18);

  if (frame < START || frame > END) return null;
const fadeIn = clamp01((frame - START) / 10);

  return (
    <AbsoluteFill style={{backgroundColor: '#07090D', overflow: 'hidden', opacity: fadeIn * sceneOut}}>
      <Background />

      {/* ===== 生长园：主线 + 支线 + 花 ===== */}
      {gardenOut > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: gardenOut}}>
          {/* 地基保留 */}
          <rect x={480} y={LY + 40} width={760} height={110} fill={rgba(COLOR.white, 0.04)} stroke={rgba(COLOR.white, 0.1)} />
          {/* 主线变琥珀加粗 */}
          <line x1={LX0} x2={LX1} y1={LY} y2={LY} stroke={rgba(cAmber, 0.5 + mainK * 0.5)} strokeWidth={2.6 + mainK * 3.4}
            style={{filter: `drop-shadow(0 0 ${4 + mainK * 8}px ${rgba(cAmber, 0.55)})`}} />
          {/* 支线 */}
          {branches.map((b, i) => {
            const k = clamp01(growK * 1.25 - i * 0.06);
            return (
              <g key={i}>
                <path d={b.d} fill="none" stroke={rgba(cCyan, 0.75)} strokeWidth={1.8}
                  pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} strokeLinecap="round" />
                {k >= 1 && flowerK > 0 && (
                  <circle cx={b.end.x} cy={b.end.y} r={3 + flowerK * 4} fill={COLOR.core}
                    style={{filter: `drop-shadow(0 0 ${6 + flowerK * 8}px ${COLOR.cyan})`}} opacity={flowerK} />
                )}
              </g>
            );
          })}
        </svg>
      )}
      {labelK > 0 && gardenOut > 0 && (
        <Annotation x={130} y={96} size="md" color={COLOR.cyan} opacity={0.85 * gardenOut}>MODE B — 探索模式</Annotation>
      )}

      {/* ===== 台面俯视（CSS 3D） ===== */}
      {tableK > 0 && tableOut > 0 && (
        <div style={{
          position: 'absolute', inset: 0, perspective: 1600, opacity: Math.min(tableK, tableOut),
        }}>
          <div style={{
            position: 'absolute', left: 260, top: 150, width: 1400, height: 760,
            transform: 'rotateX(55deg)', transformStyle: 'preserve-3d',
            background: `linear-gradient(160deg, ${rgba(COLOR.white, 0.10)}, ${rgba(COLOR.white, 0.03)})`,
            border: `1px solid ${rgba(COLOR.white, 0.24)}`,
            boxShadow: `0 0 90px ${rgba(cAmber, 0.12)}, inset 0 0 120px rgba(0,0,0,0.45)`,
          }}>
            {/* 五格 */}
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                position: 'absolute', left: 60 + i * 262, top: 240, width: 232, height: 300,
                border: `1px solid ${rgba(COLOR.white, 0.30 * slotsK)}`,
                background: i >= 1 && i <= 3 ? rgba(cAmber, 0.16 * occupyK) : rgba(COLOR.white, 0.02),
              }} />
            ))}
            {/* 琥珀主线占中间三格 */}
            {occupyK > 0 && (
              <div style={{
                position: 'absolute', left: -80, top: 378, width: 560 + 980 * occupyK, height: 14,
                background: rgba(cAmber, 0.75), boxShadow: `0 0 18px ${rgba(cAmber, 0.5)}`,
              }} />
            )}
            {/* 沉积层 */}
            {stackK > 0 && Array.from({length: 9}, (_, i) => {
              const k = clamp01(stackK * 9 - i);
              return (
                <div key={i} style={{
                  position: 'absolute', left: 330, top: 410 + i * 22, width: 740, height: 8,
                  background: rgba(cw(cReject, cAmber, i / 8 * stackGlow), 0.26 + k * 0.26 + (i === 8 ? stackGlow * 0.35 : 0)),
                  opacity: k,
                }} />
              );
            })}
            {/* 边缘青色细线 */}
            {[0, 1, 2].map((i) => (
              <svg key={i} width={1400} height={760} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
                <path d={growBranch(`s06-edge-${i}`, 90 + i * 40, 620 - i * 60, -0.4 + i * 0.5, 300, 2)} fill="none"
                  stroke={rgba(cCyan, 0.55 * sideK)} strokeWidth={1.6} pathLength={1}
                  strokeDasharray={1} strokeDashoffset={1 - sideK} />
              </svg>
            ))}
          </div>
        </div>
      )}
      {tableK > 0 && tableOut > 0 && (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <Annotation key={i} x={430 + i * 262} y={950} align="center" size="sm" opacity={slotsK * tableOut * (i === 4 ? 0.95 : 0.75)}>
              {`SLOT ${i + 1}`}
            </Annotation>
          ))}
          {icon1K > 0 && (
            <Annotation x={700} y={330} align="center" opacity={icon1K * tableOut * 0.85} style={{fontFamily: FONT.sans, fontSize: 24}}>💼 主业</Annotation>
          )}
          {icon2K > 0 && (
            <Annotation x={1120} y={330} align="center" opacity={icon2K * tableOut * 0.85} style={{fontFamily: FONT.sans, fontSize: 24}}>🎯 核心技能</Annotation>
          )}
          {hobbyK > 0 && (
            <Annotation x={240} y={880} align="center" opacity={hobbyK * tableOut * 0.7} style={{fontFamily: FONT.sans, fontSize: 22}}>
              📷 🎸 📖 🔭 📝
            </Annotation>
          )}
        </>
      )}

      {/* ===== 侧视：曲折路径走出来 ===== */}
      {sideViewK > 0 && sideOut > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: Math.min(sideViewK, sideOut)}}>
          {/* 虚线直线对比 */}
          <line x1={260} y1={830} x2={1560} y2={380} stroke={rgba(cReject, 0.65)} strokeWidth={1.6} strokeDasharray="7 9" />
          <path d={heroCurve.d} fill="none" stroke={rgba(cCyan, 0.9)} strokeWidth={2.6} strokeLinecap="round"
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - riseK}
            style={{filter: `drop-shadow(0 0 8px ${rgba(cCyan, 0.5)})`}} />
          {heroCurve.pts.slice(1, 5).map((p, i) => twistK[i] > 0 && (
            <circle key={i} cx={p.x} cy={p.y} r={5 + twistK[i] * 3} fill={COLOR.core}
              style={{filter: `drop-shadow(0 0 10px ${COLOR.cyan})`}} opacity={twistK[i]} />
          ))}
          {arriveK > 0 && (
            <circle cx={1560} cy={380} r={10 + arriveK * 16} fill="none" stroke={rgba(cAmber, 0.9)} strokeWidth={2}
              style={{filter: `drop-shadow(0 0 14px ${COLOR.amber})`}} opacity={arriveK} />
          )}
        </svg>
      )}

      {/* ===== 20 条曲线：18 沉 2 升 ===== */}
      {revealK > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          {curves.map((c, i) => {
            const k = clamp01(revealK * 1.3 - c.delay / 30);
            const sink = c.hi ? 0 : sinkK;
            const rise = c.hi ? rise2K : 0;
            const ty = sink * 190 - rise * 210;
            const col = c.hi ? cCyan : cw(cCyan, cReject, sink);
            return (
              <path key={i} d={c.d} fill="none" strokeWidth={c.hi ? 2.2 : 1.6}
                stroke={rgba(col, (0.7 - sink * 0.55 + rise * 0.3) * k)}
                transform={`translate(0 ${ty})`}
                pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k}
                style={c.hi ? {filter: `drop-shadow(0 0 6px ${rgba(cCyan, 0.6)})`} : undefined} />
            );
          })}
        </svg>
      )}

      <ChapterLabel no="04" title="两种模式" />
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};
const cw = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] =>
  [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

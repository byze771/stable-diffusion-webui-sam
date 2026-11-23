// S10 · 存档被唤醒（人声 360.4–397.5s，正片帧 10872–12024）
// 卡片故事：散出 → 盖戳/图标 → 收进 ARCHIVE 盒 → 新目标/筛网变形 → 两张卡穿网 → 嵌入主线 → 倒放回 2019 → 金句
import React, {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {COLOR, FONT, MOTION} from '../../design/tokens';
import {clamp01, hex, lerp, rgba} from '../../design/utils';
import {Background, Grain, Vignette} from '../../components/Atmosphere';
import {Annotation, ChapterLabel, GoldLine} from '../../components/Typography';
import {TargetMark} from '../../components/Marks';
import {useBeats} from '../../cues';

const cAmber = hex(COLOR.amber), cCyan = hex(COLOR.cyan), cAlert = hex(COLOR.alert), cReject = hex(COLOR.reject);
const CX = 960, CY = 480;
const BOX = {x: 810, y: 720, w: 300, h: 150};

const Card: React.FC<{x: number; y: number; rot?: number; scale?: number; opacity?: number; glow?: number; children?: React.ReactNode}> =
  ({x, y, rot = 0, scale = 1, opacity = 1, glow = 0, children}) => (
    <div style={{
      position: 'absolute', left: x - 55, top: y - 75, width: 110, height: 150,
      border: `1px solid ${rgba(COLOR.white, 0.3)}`, borderRadius: 8,
      background: rgba(COLOR.white, 0.05), opacity,
      transform: `rotate(${rot}deg) scale(${scale})`,
      boxShadow: glow > 0 ? `0 0 ${18 * glow}px ${rgba(cCyan, 0.5 * glow)}` : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{children}</div>
  );

export const S10: React.FC = () => {
  const frame = useCurrentFrame();
  const KB = useBeats('S10');
  const b01 = KB['01'], b02 = KB['02'], b03 = KB['03'], b04 = KB['04'], b05 = KB['05'], b06 = KB['06'],
    b07 = KB['07'], b08 = KB['08'], b09 = KB['09'], b10 = KB['10'], b11 = KB['11'];

  const START = b01.at - 16, END = b11.end + 40;
  

  // 14 张卡片的椭圆落位
  const spots = useMemo(() => Array.from({length: 14}, (_, i) => {
    const a = (i / 14) * Math.PI * 2 - Math.PI / 2;
    return {a, x: CX + Math.cos(a) * 430, y: CY + Math.sin(a) * 250, rot: (random(`s10-r-${i}`) - 0.5) * 16};
  }), []);

  const burstK = clamp01((frame - b01.a.burst) / 30);
  const stamp1K = clamp01((frame - b02.a.stamp1) / 8);
  const stamp2K = clamp01((frame - b02.a.stamp2) / 8);
  const icon1K = clamp01((frame - b03.a.icons) / 8);
  const icon2K = clamp01((frame - b03.a.icons2) / 8);
  // #04 收进盒子
  const boxK = clamp01((frame - b04.a.box) / 26);
  const lidK = clamp01((frame - b04.a.box - 20) / 10);
  // #05 新目标 + 筛网变形
  const newtK = clamp01((frame - b05.a.newtarget) / 12);
  const morphK = clamp01((frame - b05.a.morph) / 22);
  // #06 弹盖 + 两张卡穿网
  const openK = clamp01((frame - b06.a.lift) / 10);
  const liftK = clamp01((frame - b06.a.lift) / 30);
  const fitK = clamp01((frame - b06.a.fit) / 14);
  // #07 嵌入主线
  const embedK = clamp01((frame - b07.a.embed) / 16);
  const brightK = clamp01((frame - b07.a.bright) / 12);
  // #08 旁人
  const onlK = clamp01((frame - b08.a.onlookers) / 14);
  const exclK = clamp01((frame - b08.a.exclaim) / 8);
  // #09 倒放
  const rewindK = clamp01((frame - b09.a.rewind) / 26);
  // #10 2019 虚线圈
  const pastK = clamp01((frame - b10.a.circle2019) / 12);
  const blink = Math.max(
    1 - clamp01(Math.abs(frame - b10.a.circle2019 - 12) / 4),
    1 - clamp01(Math.abs(frame - b10.a.circle2019 - 26) / 4));
  // #11 金句
  const dimK = clamp01((frame - b11.a.gold) / 16) * 0.55;
  const ringK = clamp01((frame - b11.a.ring) / 12);
  const goldReveal = clamp01((frame - b11.a.gold) / 12);
  const goldSweep = clamp01((frame - b11.a.ring) / MOTION.dur.goldSweep);

  // 卡片位置：散出 → 收盒
  const cardPos = (i: number) => {
    const s = spots[i];
    const bx = CX + Math.cos(s.a) * lerp(60, 430, burstK);
    const by = CY + Math.sin(s.a) * lerp(40, 250, burstK);
    const intoBox = clamp01(boxK * 1.3 - i * 0.045);
    const x = lerp(bx, BOX.x + BOX.w / 2, intoBox);
    const y = lerp(by, BOX.y + 60, intoBox);
    return {x, y, rot: s.rot * (1 - intoBox), scale: lerp(1, 0.45, intoBox), op: burstK * (1 - intoBox * 0.25)};
  };

  // 两张主角卡：idx 5（LOGIC）与 idx 11（树叶）
  const heroPath = (i: number, phase: number) => {
    // phase: 0 盒里 → 1 穿网后空中
    const sx = BOX.x + BOX.w / 2 + (i === 0 ? -40 : 40);
    const sy = BOX.y + 40;
    const tx = 1360 + i * 130, ty = 660;
    const ex = CX - 70 + i * 140, ey = 420;
    // 盒→网→主线 三段
    if (phase < 0.5) {
      const t = phase * 2;
      return {x: lerp(sx, tx, t), y: lerp(sy, ty, t * t)};
    }
    const t = phase * 2 - 1;
    return {x: lerp(tx, ex, t), y: lerp(ty, ey, t)};
  };
  const heroPhase = clamp01(liftK * 1.15) * (1 - rewindK);
  const heroEmbed = clamp01(embedK * 1.2);
  const heroVisible = openK > 0.2 || liftK > 0;

  const year = Math.round(lerp(2026, 2019, rewindK));

  if (frame < START || frame > END) return null;
const fadeIn = clamp01((frame - START) / 40);

  return (
    <AbsoluteFill style={{opacity: fadeIn}}>
      <Background />
      {/* 中心光点 */}
      {burstK < 1 && (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <circle cx={CX} cy={CY} r={8} fill={COLOR.core} opacity={1 - burstK}
            style={{filter: `drop-shadow(0 0 14px ${COLOR.cyan})`}} />
        </svg>
      )}
      {/* 琥珀主线（#07 出现） */}
      {embedK > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <line x1={260} y1={420} x2={1660} y2={420} stroke={rgba(cAmber, 0.7 + brightK * 0.3)}
            strokeWidth={2.5 + brightK * 1.5} opacity={embedK * (1 - rewindK)}
            style={{filter: `drop-shadow(0 0 ${8 + brightK * 10}px ${rgba(cAmber, 0.5)})`}} />
        </svg>
      )}

      {/* 14 张发散卡（主角卡 5/11 在升段由 hero 接管） */}
      {spots.map((s, i) => {
        if ((i === 5 || i === 11) && heroVisible) return null;
        const p = cardPos(i);
        if (p.op < 0.02) return null;
        return (
          <Card key={i} x={p.x} y={p.y} rot={p.rot} scale={p.scale} opacity={p.op * (1 - rewindK * 0.6)}>
            {i === 2 && stamp1K > 0 && (
              <span style={{fontFamily: FONT.mono, fontSize: 14, color: COLOR.alert, border: `1.5px solid ${rgba(cAlert, 0.8)}`,
                padding: '3px 7px', transform: `rotate(-9deg) scale(${0.7 + stamp1K * 0.3})`, opacity: stamp1K}}>AUDIENCE ✕</span>
            )}
            {i === 5 && stamp2K > 0 && !heroVisible && (
              <span style={{fontFamily: FONT.mono, fontSize: 14, color: COLOR.alert, border: `1.5px solid ${rgba(cAlert, 0.8)}`,
                padding: '3px 7px', transform: `rotate(7deg)`, opacity: stamp2K}}>LOGIC: DRAFT</span>
            )}
            {i === 8 && icon1K > 0 && <span style={{fontSize: 40, opacity: icon1K * 0.85}}>🎸</span>}
            {i === 11 && icon2K > 0 && !heroVisible && <span style={{fontSize: 40, opacity: icon2K * 0.85}}>🍃</span>}
          </Card>
        );
      })}

      {/* 两张主角卡 */}
      {heroVisible && [0, 1].map((i) => {
        const p = heroPath(i, heroPhase);
        const embedded = heroEmbed * (1 - rewindK);
        const x = lerp(p.x, CX - 70 + i * 140, embedded);
        const y = lerp(p.y, 420, embedded);
        const glow = Math.max(fitK * (1 - rewindK), brightK * (1 - rewindK), pastK * 0.3 + ringK);
        return (
          <Card key={i} x={x} y={y} scale={lerp(0.5, 0.75, liftK) - embedded * 0.25} opacity={openK} glow={glow}>
            <span style={{fontSize: 30, opacity: 0.9}}>{i === 0 ? '📐' : '🍃'}</span>
          </Card>
        );
      })}

      {/* 档案盒 */}
      <div style={{position: 'absolute', left: BOX.x, top: BOX.y, width: BOX.w, height: BOX.h, opacity: clamp01((frame - b04.a.box + 10) / 10)}}>
        <div style={{
          position: 'absolute', inset: 0, border: `1.5px solid ${rgba(COLOR.white, 0.4)}`,
          background: rgba(COLOR.white, 0.04), borderRadius: 6,
        }} />
        {/* 盒盖 */}
        <div style={{
          position: 'absolute', left: -6, right: -6, top: -16, height: 18,
          border: `1.5px solid ${rgba(COLOR.white, 0.45)}`, background: rgba(COLOR.white, 0.07), borderRadius: 4,
          transformOrigin: 'left center',
          transform: `rotate(${lerp(lerp(-38, 0, lidK), -38, openK)}deg)`,
        }} />
        <Annotation x={BOX.x + BOX.w / 2} y={BOX.y + BOX.h - 38} align="center" size="sm" opacity={0.75}>ARCHIVE</Annotation>
        {/* 侧面日期（倒放 2026→2019） */}
        <Annotation x={BOX.x + BOX.w + 18} y={BOX.y + BOX.h - 60} size="sm" color={COLOR.cyan}
          opacity={rewindK > 0 ? 0.9 : 0.4} style={{fontSize: 26}}>{year}</Annotation>
      </div>

      {/* 新目标 + 筛网 */}
      {newtK > 0 && (
        <>
          <div style={{opacity: newtK * (1 - rewindK)}}><TargetMark x={1620} y={420} lit={newtK} /></div>
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: newtK * (1 - rewindK * 0.5)}}>
            <rect x={1290} y={580} width={300} height={190} fill="none" stroke={rgba(COLOR.white, 0.3)} strokeWidth={1} />
            {/* 方格网（淡出） */}
            <g opacity={1 - morphK} stroke={rgba(cCyan, 0.4)} strokeWidth={1}>
              {[0, 1, 2, 3].map((i) => <line key={`v${i}`} x1={1330 + i * 70} y1={590} x2={1330 + i * 70} y2={760} />)}
              {[0, 1, 2].map((i) => <line key={`h${i}`} x1={1300} y1={620 + i * 50} x2={1580} y2={620 + i * 50} />)}
            </g>
            {/* 六边形网（淡入） */}
            <g opacity={morphK} stroke={rgba(cAmber, 0.55)} strokeWidth={1.2} fill="none">
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const hx = 1340 + (i % 3) * 90 + (Math.floor(i / 3) % 2) * 45, hy = 630 + Math.floor(i / 3) * 70;
                const pts = Array.from({length: 6}, (_, k) => {
                  const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
                  return `${hx + Math.cos(a) * 34},${hy + Math.sin(a) * 34}`;
                }).join(' ');
                return <polygon key={i} points={pts} />;
              })}
            </g>
          </svg>
        </>
      )}

      {/* #08 旁人剪影 + 感叹号 */}
      {onlK > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: onlK * (1 - rewindK)}}>
          {[140, 300, 1620, 1780].map((x, i) => (
            <g key={i} opacity={0.6}>
              <circle cx={x} cy={900} r={16} fill={rgba(cReject, 0.8)} />
              <path d={`M ${x - 20} 924 L ${x + 20} 924 L ${x + 28} 980 L ${x - 28} 980 Z`} fill={rgba(cReject, 0.7)} />
              {exclK > 0 && (
                <text x={x + 18} y={872} fill={COLOR.amber} fontSize={34} fontWeight={900} opacity={exclK}
                  fontFamily={FONT.serif}>!</text>
              )}
            </g>
          ))}
        </svg>
      )}

      {/* #10 2019：虚线空目标圈（闪两下） */}
      {pastK > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <circle cx={CX + 260} cy={420} r={52} fill="none"
            stroke={ringK > 0 ? rgba(cAmber, 0.95) : rgba(COLOR.white, 0.55)}
            strokeWidth={ringK > 0 ? 3 : 1.6}
            strokeDasharray={ringK > 0 ? undefined : '8 8'}
            opacity={pastK * (ringK > 0 ? 1 : 0.35 + blink * 0.65)}
            style={ringK > 0 ? {filter: `drop-shadow(0 0 16px ${rgba(cAmber, 0.7)})`} : undefined} />
        </svg>
      )}

      {/* #11 金句 */}
      {dimK > 0 && <AbsoluteFill style={{backgroundColor: COLOR.ink, opacity: dimK}} />}
      {frame >= b11.a.gold - 6 && (
        <GoldLine lines={['好点子早就在了', '只差一个对得上的终点']} top={300} sweep={goldSweep} reveal={goldReveal} />
      )}

      <ChapterLabel no="05" title="一眼命中" />
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

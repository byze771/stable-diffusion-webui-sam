// S04 · 从光到人（人声 102.1–120.4s，正片帧 3123–3673）
// 三步槽位（一起试/互相筛/收敛）→ 人形剪影 → 灰卡被筛网接住 → 抖动过筛 → 【金】被毙掉的方案也是筛选的一部分
import React, {useMemo} from 'react';
import {AbsoluteFill, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CANVAS, COLOR, FONT, MOTION, TYPE} from '../../design/tokens';
import {clamp01, hex, lerp, rgba} from '../../design/utils';
import {Background, Grain, Grid, Vignette} from '../../components/Atmosphere';
import {Annotation, ChapterLabel, GoldLine} from '../../components/Typography';
import {useBeats} from '../../cues';

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const cAmber = hex(COLOR.amber), cCyan = hex(COLOR.cyan), cReject = hex(COLOR.reject);
const LINE_Y = 640;
const SLOTS = [560, 960, 1360].map((x) => ({x, y: 400, r: 74}));

// 三个图标：扇形（一起试）/ 筛网（互相筛）/ 漏斗收敛
const SlotIcon: React.FC<{kind: number; x: number; y: number; k: number}> = ({kind, x, y, k}) => {
  const stroke = rgba(cAmber, 0.9);
  if (kind === 0)
    return (
      <g transform={`translate(${x} ${y})`} opacity={k}>
        {[-0.5, 0, 0.5].map((a, i) => (
          <line key={i} x1={0} y1={22} x2={Math.sin(a) * 34 * k} y2={22 - Math.cos(a) * 34 * k} stroke={stroke} strokeWidth={2.4} strokeLinecap="round" />
        ))}
        <circle cy={22} r={4} fill={COLOR.core} />
      </g>
    );
  if (kind === 1)
    return (
      <g transform={`translate(${x} ${y})`} opacity={k}>
        {[-18, 0, 18].map((dy) => (
          <line key={`h${dy}`} x1={-30} x2={-30 + 60 * k} y1={dy} y2={dy} stroke={stroke} strokeWidth={2} />
        ))}
        {[-18, 0, 18].map((dx) => (
          <line key={`v${dx}`} x1={dx} x2={dx} y1={-30} y2={-30 + 60 * k} stroke={stroke} strokeWidth={2} />
        ))}
      </g>
    );
  return (
    <g transform={`translate(${x} ${y})`} opacity={k}>
      <path d={`M ${-30 * k} -26 L 0 6 L ${30 * k} -26`} fill="none" stroke={stroke} strokeWidth={2.4} strokeLinecap="round" />
      <line x1={0} y1={6} x2={0} y2={6 + 26 * k} stroke={stroke} strokeWidth={2.4} strokeLinecap="round" />
      <circle cy={36} r={3.6} fill={COLOR.core} opacity={k} />
    </g>
  );
};

// 极简人形剪影
const HumanFigure: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => (
  <g transform={`translate(${x} ${y}) scale(${k})`} opacity={k}>
    <circle cy={-58} r={17} fill="none" stroke={rgba(COLOR.core, 0.9)} strokeWidth={2.4} />
    <path d="M 0 -38 L 0 26 M -26 -12 L 0 -22 L 26 -12 M 0 26 L -18 66 M 0 26 L 18 66" fill="none"
      stroke={rgba(COLOR.core, 0.9)} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

const CARD_W = 150, CARD_H = 96;

export const S04: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const KB = useBeats('S04');
  const b01 = KB['01'], b02 = KB['02'], b03 = KB['03'], b04 = KB['04'], b05 = KB['05'], b06 = KB['06'];

  const START = b01.at - 20, END = b06.end + 40;
  

  // 横线（S03 光路拉远而来）
  const lineIn = clamp01((frame - START) / 20);
  // #01 三个空槽
  const slotsIn = spring({frame: frame - b01.a.slots, fps, config: MOTION.spring});
  // #02 依次填入
  const fill = [b02.a.try, b02.a.filter, b02.a.converge].map((t) => clamp01((frame - t) / 14));
  // #03 图标收成光点 → 人形剪影；色温升高
  const mergeK = clamp01((frame - b03.a.merge) / 22);
  const humanK = spring({frame: frame - b03.a.human, fps, config: MOTION.spring});
  const warm = clamp01((frame - b03.a.merge) / 30);
  // #04 灰卡飘出 + 筛网接住
  const cardsIn = clamp01((frame - b04.a.cards) / 18);
  const sieveIn = clamp01((frame - b04.a.catch) / 16);
  // #05 筛网抖 3 次：漏下灰卡，一张变亮
  const shakes = [0, 14, 28].map((d) => {
    const k = clamp01((frame - b05.a.shake - d) / 10);
    return Math.sin(k * Math.PI) * 10;
  });
  const shakeY = shakes.reduce((a, b) => a + b, 0);
  const fallK = [0, 1, 2].map((i) => clamp01((frame - b05.a.shake - 14 * i - 6) / 16));
  const brightK = clamp01((frame - (b05.a.shake + 34)) / 16);
  // #06 金句
  const goldAt = b06.a.gold;
  const dimK = clamp01((frame - goldAt) / 14) * 0.55;
  const dashLineK = clamp01((frame - goldAt) / 24);
  const goldReveal = clamp01((frame - goldAt) / 12) + clamp01((frame - (goldAt + 16)) / 12);
  const goldSweep = clamp01((frame - goldAt) / MOTION.dur.goldSweep);
  const sceneOut = 1 - clamp01((frame - (b06.end + 20)) / 18);

  // 三张灰卡（方案 v7·否 等）
  const cards = useMemo(() => [
    {tag: '方案 v7 · 否', x: 700, y0: 300, dx: -14},
    {tag: '方向 #12 · 否', x: 960, y0: 260, dx: 10},
    {tag: '草稿 #31 · 否', x: 1220, y0: 310, dx: -8},
  ], []);

  if (frame < START || frame > END) return null;
const fadeIn = clamp01((frame - START) / 10);

  return (
    <AbsoluteFill style={{backgroundColor: COLOR.ink, overflow: 'hidden', opacity: fadeIn * sceneOut}}>
      <Background />
      <Grid opacity={0.1 * (1 - mergeK)} />
      {/* 色温升高 */}
      {warm > 0 && <AbsoluteFill style={{background: rgba(COLOR.amber, 0.045 * warm), mixBlendMode: 'screen'}} />}

      {/* 横贯细线 */}
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <line x1={200} x2={200 + 1520 * lineIn} y1={LINE_Y} y2={LINE_Y} stroke={rgba(cAmber, 0.75)} strokeWidth={2}
          style={{filter: `drop-shadow(0 0 6px ${rgba(cAmber, 0.6)})`}} />

        {/* 槽位 + 图标（merge 后淡出） */}
        <g opacity={1 - mergeK}>
          {SLOTS.map((s, i) => (
            <g key={i}>
              <circle cx={s.x} cy={s.y} r={s.r} fill="none" stroke={rgba(COLOR.white, 0.28)} strokeWidth={1.4}
                strokeDasharray={fill[i] >= 1 ? 'none' : '4 7'} opacity={slotsIn} />
              <SlotIcon kind={i} x={s.x} y={s.y} k={fill[i]} />
            </g>
          ))}
        </g>
        {/* 三图标收成的光点 → 人形 */}
        {mergeK > 0 && (
          <circle cx={960} cy={400} r={7 * mergeK * (1 - humanK)} fill={COLOR.core}
            style={{filter: `drop-shadow(0 0 12px ${COLOR.amber})`}} opacity={1 - humanK} />
        )}
        {humanK > 0 && <HumanFigure x={960} y={470} k={humanK} />}

        {/* 灰卡飘出：被筛网接住 */}
        {cards.map((c, i) => {
          const caught = sieveIn;
          const fall = fallK[i];
          const y = c.y0 + caught * (LINE_Y - 190 - c.y0) + fall * 300;
          const bright = i === 1 ? brightK : 0;
          const col = bright > 0 ? lerp3(cReject, cAmber, bright) : cReject;
          return (
            <g key={i} transform={`translate(${c.x + c.dx * caught} ${y}) rotate(${c.dx * 0.4})`} opacity={cardsIn * (1 - fall * 0.55)}>
              <rect x={-CARD_W / 2} y={-CARD_H / 2} width={CARD_W} height={CARD_H} rx={8}
                fill={rgba(col, 0.1 + bright * 0.14)} stroke={rgba(col, 0.55 + bright * 0.4)} strokeWidth={1.2} />
            </g>
          );
        })}
        {/* 筛网（接住卡片，抖动过筛） */}
        {sieveIn > 0 && (
          <g transform={`translate(0 ${shakeY})`} opacity={sieveIn}>
            {Array.from({length: 11}, (_, i) => (
              <line key={`sv${i}`} x1={560 + i * 80} x2={560 + i * 80} y1={LINE_Y - 210} y2={LINE_Y - 130} stroke={rgba(COLOR.white, 0.18)} strokeWidth={1} />
            ))}
            <line x1={540} x2={1380} y1={LINE_Y - 130} y2={LINE_Y - 130} stroke={rgba(COLOR.white, 0.3)} strokeWidth={1.6} />
          </g>
        )}
      </svg>

      {/* 卡片标签（HTML 层，跟随卡片） */}
      {cards.map((c, i) => {
        const caught = sieveIn;
        const fall = fallK[i];
        const y = c.y0 + caught * (LINE_Y - 190 - c.y0) + fall * 300;
        const bright = i === 1 ? brightK : 0;
        return (
          <Annotation key={i} x={c.x + c.dx * caught} y={y} align="center" size="sm"
            color={bright > 0.5 ? COLOR.amber : COLOR.white}
            opacity={cardsIn * (1 - fall * 0.55) * (0.55 + bright * 0.45)}>
            {c.tag}
          </Annotation>
        );
      })}
      {/* 槽位文字 */}
      {['一起试', '互相筛', '收敛'].map((t, i) => (
        <Annotation key={t} x={SLOTS[i].x} y={SLOTS[i].y + 108} align="center"
          opacity={fill[i] * (1 - mergeK) * 0.85} style={{fontFamily: FONT.sans, fontSize: 26}}>
          {t}
        </Annotation>
      ))}

      {/* #06 金句 */}
      {dimK > 0 && <AbsoluteFill style={{backgroundColor: COLOR.ink, opacity: dimK}} />}
      {dashLineK > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: dashLineK}}>
          <line x1={620} y1={830} x2={620 + 680 * dashLineK} y2={830} stroke={rgba(cReject, 0.8)} strokeWidth={2} strokeDasharray="7 9" />
          <rect x={1300 - CARD_W / 2} y={830 - CARD_H / 2} width={CARD_W} height={CARD_H} rx={8}
            fill={rgba(cAmber, 0.14)} stroke={rgba(cAmber, 0.9)} strokeWidth={1.6}
            style={{filter: `drop-shadow(0 0 10px ${rgba(cAmber, 0.5)})`}} />
        </svg>
      )}
      {frame >= goldAt - 6 && frame < b06.end + 30 && (
        <GoldLine lines={['被毙掉的方案', '也是筛选的一部分']} top={170} sweep={goldSweep} reveal={goldReveal} />
      )}

      <ChapterLabel no="03" title="终点" />
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};
const lerp3 = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] =>
  [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

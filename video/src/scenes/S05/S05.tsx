// S05 · 直线模式（人声 121.3–171.2s，正片帧 3699–5197）
// 规整冷调：模式二选一 → 贯穿白线 → 节点/工位/轨道/地基/打磨/框架/灯泡/砖/墙 →【金】直线能走得稳，却很难走出新路
import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CANVAS, COLOR, FONT, MOTION, TYPE} from '../../design/tokens';
import {clamp01, hex, lerp, rgba} from '../../design/utils';
import {Background, Grain, Vignette} from '../../components/Atmosphere';
import {Annotation, ChapterLabel, GoldLine} from '../../components/Typography';
import {useBeats} from '../../cues';

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const cAmber = hex(COLOR.amber), cCyan = hex(COLOR.cyan), cReject = hex(COLOR.reject);
const LY = 560;          // 主线高度
const LX0 = 170, LX1 = 1750;

const cw = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] =>
  [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export const S05: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const KB = useBeats('S05');
  const b01 = KB['01'], b02 = KB['02'], b03 = KB['03'], b04 = KB['04'], b05 = KB['05'], b06 = KB['06'],
    b07 = KB['07'], b08 = KB['08'], b09 = KB['09'], b10 = KB['10'], b11 = KB['11'], b12 = KB['12'],
    b13 = KB['13'], b14 = KB['14'];

  const START = b01.at - 20, END = b14.end + 46;
  

  // #01–#02 两个模式框
  const boxesIn = spring({frame: frame - b01.a.boxes, fps, config: MOTION.spring});
  const modeAIn = clamp01((frame - b02.a.modeA) / 12);
  const modeBIn = clamp01((frame - b02.a.modeB) / 12);
  // #03 左框放大占屏，变成白线（推镜 30 帧）
  const zoomK = clamp01((frame - b03.a.zoom) / 30);
  const lineK = clamp01((frame - (b03.a.zoom + 14)) / 22);
  // #04 光点匀速爬行（到墙前停）
  const crawlStart = b04.a.crawl;
  const wallHit = b13.a.wall;
  const crawlX = Math.min(
    LX0 + ((frame - crawlStart) * 9),
    LX1 - 210,
  );
  const crawlOn = frame >= crawlStart ? 1 : 0;
  // #05 三节点
  const nodes = [b05.a.n1, b05.a.n2, b05.a.n3].map((t) => clamp01((frame - t) / 12));
  const nodeX = [560, 960, 1360];
  const nodeCards = ['TASK: SINGLE', 'DELIVERY: STABLE', 'PROCESS: CONTROLLED'];
  const nodeCn = ['任务单一', '交付稳定', '过程可控'];
  // #06 工位剪影 + 任务卡
  const deskIn = clamp01((frame - b06.a.desk) / 16);
  const orderK = clamp01((frame - b06.a.order) / 14);
  const passK = clamp01((frame - b06.a.pass) / 14);
  // #07 轨道 + 效率表
  const railK = clamp01((frame - b07.a.rail) / 16);
  const gaugeK = clamp01((frame - b07.a.gauge) / 22);
  // #08 地基
  const baseK = clamp01((frame - b08.a.base) / 20);
  const riskK = clamp01((frame - b08.a.risk) / 12);
  // #09 砂轮打磨
  const grindIn = clamp01((frame - b09.at) / 16);
  const shineK = clamp01((frame - b09.a.shine) / 30);
  const grindX = 700 + Math.sin((frame - b09.a.grind) * 0.14) * 220;
  // #10 迭代图标 + 大框
  const iterK = clamp01((frame - b10.a.iter) / 14);
  const iconsK = clamp01((frame - b10.a.icons) / 14);
  const frameK = clamp01((frame - b10.a.frame) / 16);
  // #11 灯泡
  const bulbIn = clamp01((frame - b11.a.bulb) / 10);
  const bulbDie = clamp01((frame - (b11.a.bulb + 16)) / 14);
  // #12 三块砖
  const bricks = [b12.a.b1, b12.a.b2, b12.a.b3].map((t) => clamp01((frame - t) / 14));
  // #13 墙
  const wallIn = clamp01((frame - (wallHit - 26)) / 16);
  const gapLightK = clamp01((frame - wallHit) / 20);
  // #14 金句
  const goldAt = b14.a.gold;
  const dimK = clamp01((frame - goldAt) / 16) * 0.6;
  const goldReveal = clamp01((frame - b14.a.gold) / 12) + clamp01((frame - b14.a.gold2) / 12);
  const goldSweep = clamp01((frame - b14.a.gold2) / MOTION.dur.goldSweep);
  const sceneOut = 1 - clamp01((frame - (b14.end + 26)) / 18);

  const wallX = LX1 - 190;

  if (frame < START || frame > END) return null;
const fadeIn = clamp01((frame - START) / 10);

  return (
    <AbsoluteFill style={{backgroundColor: '#07090D', overflow: 'hidden', opacity: fadeIn * sceneOut}}>
      <Background />

      {/* #01–#03 模式框 */}
      {zoomK < 1 && (
        <AbsoluteFill style={{opacity: 1 - zoomK}}>
          {[
            {x: 500, in: modeAIn, label: 'MODE A — 直线模式', zh: '直线模式', icon: 'line'},
            {x: 1420, in: modeBIn, label: 'MODE B — 探索模式', zh: '探索模式', icon: 'fork'},
          ].map((m, i) => (
            <div key={i} style={{
              position: 'absolute', left: m.x - 230, top: 380, width: 460, height: 300,
              border: `1px solid ${rgba(COLOR.white, 0.22)}`, opacity: boxesIn * (0.35 + m.in * 0.65),
              transform: `scale(${0.9 + boxesIn * 0.1})`,
            }}>
              {m.in > 0 && (
                <>
                  <svg width={460} height={150} style={{marginTop: 40}}>
                    {m.icon === 'line'
                      ? <line x1={110} y1={75} x2={350} y2={75} stroke={rgba(COLOR.white, 0.85)} strokeWidth={2.4} />
                      : (
                        <g stroke={rgba(cCyan, 0.85)} strokeWidth={2.2} fill="none">
                          <path d="M 120 105 L 230 105 L 300 45" />
                          <path d="M 230 105 L 310 105" />
                          <path d="M 230 105 L 300 165" />
                        </g>
                      )}
                  </svg>
                  <div style={{textAlign: 'center', ...TYPE.label, color: COLOR.white, opacity: 0.85}}>{m.label}</div>
                  <div style={{textAlign: 'center', marginTop: 14, fontFamily: FONT.sans, fontSize: 26, color: COLOR.white, opacity: 0.6}}>{m.zh}</div>
                </>
              )}
            </div>
          ))}
        </AbsoluteFill>
      )}

      {/* 贯穿白线 + 沿途一切 */}
      {lineK > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          {/* 轨道栏杆 */}
          {railK > 0 && (
            <g opacity={railK * 0.5}>
              <line x1={LX0} x2={LX1} y1={LY - 16} y2={LY - 16} stroke={rgba(COLOR.white, 0.3)} strokeWidth={1} />
              <line x1={LX0} x2={LX1} y1={LY + 16} y2={LY + 16} stroke={rgba(COLOR.white, 0.3)} strokeWidth={1} />
            </g>
          )}
          {/* 主线：打磨后越来越亮 */}
          <line x1={LX0} x2={LX0 + (LX1 - LX0) * lineK} y1={LY} y2={LY}
            stroke={rgba(cw(hex(COLOR.white), cAmber, shineK * 0.35), 0.9)} strokeWidth={2.6 + shineK}
            style={{filter: `drop-shadow(0 0 ${4 + shineK * 8}px ${rgba(COLOR.white, 0.4 + shineK * 0.3)})`}} />
          {/* 三节点 */}
          {nodeX.map((x, i) => nodes[i] > 0 && (
            <g key={i}>
              <circle cx={x} cy={LY} r={6} fill={COLOR.core} opacity={nodes[i]}
                style={{filter: `drop-shadow(0 0 8px ${COLOR.white})`}} />
            </g>
          ))}
          {/* 爬行的光点 */}
          {crawlOn > 0 && frame < wallHit + 8 && (
            <circle cx={crawlX} cy={LY} r={5} fill={COLOR.core}
              style={{filter: `drop-shadow(0 0 10px ${COLOR.amber})`}} />
          )}
          {/* 工位剪影 + 指令卡 */}
          {deskIn > 0 && (
            <g opacity={deskIn}>
              <rect x={730} y={LY - 116} width={180} height={12} fill={rgba(COLOR.white, 0.35)} />
              <rect x={746} y={LY - 104} width={10} height={104} fill={rgba(COLOR.white, 0.28)} />
              <rect x={884} y={LY - 104} width={10} height={104} fill={rgba(COLOR.white, 0.28)} />
              <circle cx={820} cy={LY - 150} r={14} fill="none" stroke={rgba(COLOR.white, 0.6)} strokeWidth={2} />
              <path d="M 820 -136" />
              <line x1={820} y1={LY - 136} x2={820} y2={LY - 116} stroke={rgba(COLOR.white, 0.6)} strokeWidth={2} />
              {/* 指令框 */}
              <rect x={250} y={LY - 210} width={120} height={70} fill="none" stroke={rgba(COLOR.white, 0.3)} strokeDasharray="5 6" />
              {/* 落下的任务卡 */}
              {orderK > 0 && (
                <rect x={285} y={LY - 190 + orderK * 60} width={52} height={34} fill={rgba(cCyan, 0.25)} stroke={rgba(cCyan, 0.6)} />
              )}
              {/* 递出的卡 */}
              {passK > 0 && (
                <rect x={860 + passK * 120} y={LY - 128} width={52} height={34} fill={rgba(cAmber, 0.25)} stroke={rgba(cAmber, 0.6)} />
              )}
            </g>
          )}
          {/* 效率仪表 */}
          {gaugeK > 0 && (
            <g transform={`translate(1620 ${LY - 160})`} opacity={gaugeK}>
              <path d="M -70 0 A 70 70 0 0 1 70 0" fill="none" stroke={rgba(COLOR.white, 0.2)} strokeWidth={6} />
              <path d="M -70 0 A 70 70 0 0 1 70 0" fill="none" stroke={rgba(cAmber, 0.9)} strokeWidth={6}
                pathLength={1} strokeDasharray={1} strokeDashoffset={1 - gaugeK * 0.8} strokeLinecap="round" />
              <line x1={0} y1={0} x2={-70 + 140 * gaugeK * 0.8} y2={-14} stroke={COLOR.core} strokeWidth={2.4} />
            </g>
          )}
          {/* 地基 */}
          {baseK > 0 && (
            <g opacity={baseK} transform={`translate(0 ${(1 - baseK) * 60})`}>
              <rect x={480} y={LY + 40} width={760} height={120} fill={rgba(COLOR.white, 0.05)} stroke={rgba(COLOR.white, 0.14)} />
              {Array.from({length: 26}, (_, i) => (
                <line key={i} x1={500 + i * 28} x2={512 + i * 28} y1={LY + 48} y2={LY + 152} stroke={rgba(COLOR.white, 0.05)} strokeWidth={1} />
              ))}
            </g>
          )}
          {/* 砂轮 */}
          {grindIn > 0 && frame < b10.at && (
            <g transform={`translate(${grindX} ${LY - 6})`} opacity={grindIn}>
              <circle r={13} fill="none" stroke={rgba(COLOR.white, 0.55)} strokeWidth={3} strokeDasharray="4 5"
                transform={`rotate(${(frame - b09.a.grind) * 22})`} />
            </g>
          )}
          {/* 迭代图标 */}
          {iterK > 0 && (
            <g opacity={iterK}>
              {['v1.0', 'v1.1', 'v1.2'].map((v, i) => (
                <g key={v} transform={`translate(${640 + i * 130} ${LY - 150})`}>
                  <rect x={-44} y={-26} width={88} height={52} fill="none" stroke={rgba(COLOR.white, 0.4)} />
                </g>
              ))}
            </g>
          )}
          {iconsK > 0 && (
            <g opacity={iconsK} stroke={rgba(COLOR.white, 0.45)} fill="none" strokeWidth={1.8}>
              <rect x={1070} y={LY - 180} width={90} height={60} />
              <line x1={1070} y1={LY - 160} x2={1160} y2={LY - 160} />
              <circle cx={1260} cy={LY - 150} r={26} strokeDasharray="7 6" />
              <circle cx={1260} cy={LY - 150} r={8} />
            </g>
          )}
          {/* 大框架 */}
          {frameK > 0 && (
            <rect x={560} y={LY - 230} width={820} height={330} fill="none"
              stroke={rgba(COLOR.white, 0.35 * frameK)} strokeWidth={1.6} />
          )}
          {/* 灯泡：出现→被弹回→变暗 */}
          {bulbIn > 0 && (
            <g transform={`translate(${960 - bulbDie * 60} ${LY - 290 - bulbIn * 20})`} opacity={bulbIn * (1 - bulbDie * 0.75)}>
              <circle r={17} fill="none" stroke={rgba(cAmber, 0.8)} strokeWidth={2} />
              <path d="M -6 20 L 6 20 M -4 26 L 4 26" stroke={rgba(cAmber, 0.8)} strokeWidth={2} />
            </g>
          )}
          {/* 三块砖 */}
          {bricks.map((k, i) => k > 0 && (
            <g key={i} transform={`translate(${700 + i * 220} ${LY - 96 - (1 - k) * 50})`} opacity={k * 0.9}>
              <rect x={-96} y={-40} width={192} height={80} fill={rgba(cReject, 0.3)} stroke={rgba(COLOR.white, 0.3)} />
            </g>
          ))}
          {/* 墙 + 缝隙光 */}
          {wallIn > 0 && (
            <g opacity={wallIn}>
              <rect x={wallX} y={LY - 260} width={46} height={520} fill={rgba(COLOR.white, 0.09)} stroke={rgba(COLOR.white, 0.25)} />
              {gapLightK > 0 && (
                <>
                  <line x1={wallX + 23} x2={wallX + 23} y1={LY - 120} y2={LY + 120} stroke={rgba(COLOR.core, 0.9 * gapLightK)} strokeWidth={2.4}
                    style={{filter: `drop-shadow(0 0 12px ${COLOR.amber})`}} />
                  <path d={`M ${wallX + 23} ${LY} L ${wallX + 150 * gapLightK} ${LY - 60} M ${wallX + 23} ${LY} L ${wallX + 150 * gapLightK} ${LY + 60}`}
                    stroke={rgba(cAmber, 0.35 * gapLightK)} strokeWidth={1.4} fill="none" />
                </>
              )}
            </g>
          )}
        </svg>
      )}

      {/* 文本标注层 */}
      {nodeX.map((x, i) => nodes[i] > 0 && (
        <React.Fragment key={i}>
          <Annotation x={x} y={LY - 190} align="center" size="sm" opacity={0.85 * nodes[i]}>{nodeCards[i]}</Annotation>
          <Annotation x={x} y={LY - 156} align="center" opacity={0.6 * nodes[i]} style={{fontFamily: FONT.sans, fontSize: 22}}>{nodeCn[i]}</Annotation>
        </React.Fragment>
      ))}
      {gaugeK > 0 && <Annotation x={1620} y={LY - 40} align="center" size="sm" color={COLOR.amber} opacity={0.8 * gaugeK}>EFFICIENCY 80%</Annotation>}
      {baseK > 0 && <Annotation x={860} y={LY + 104} align="center" opacity={0.7 * baseK} style={{fontFamily: FONT.serif, fontWeight: 900, fontSize: 34}}>生存底盘</Annotation>}
      {riskK > 0 && <Annotation x={1330} y={LY + 70} size="sm" color={COLOR.cyan} opacity={0.8 * riskK}>RISK ↓</Annotation>}
      {iterK > 0 && ['v1.0', 'v1.1', 'v1.2'].map((v, i) => (
        <Annotation key={v} x={640 + i * 130} y={LY - 150} align="center" size="sm" opacity={0.8 * iterK}>{v}</Annotation>
      ))}
      {bricks.map((k, i) => k > 0 && (
        <Annotation key={i} x={700 + i * 220} y={LY - 96} align="center" opacity={k * 0.85}
          style={{fontFamily: FONT.sans, fontSize: 24}}>
          {['组织成本', '路径依赖', 'ROI'][i]}
        </Annotation>
      ))}
      {deskIn > 0 && <Annotation x={310} y={LY - 240} align="center" size="sm" opacity={0.5 * deskIn}>指令</Annotation>}

      {/* #14 金句：墙前墙后 */}
      {dimK > 0 && <AbsoluteFill style={{backgroundColor: COLOR.ink, opacity: dimK}} />}
      {frame >= b14.a.gold - 6 && frame < b14.end + 40 && (
        <>
          <GoldLine lines={['直线能走得稳']} top={210} sweep={goldSweep} reveal={clamp01(goldReveal)} />
          <GoldLine lines={['却很难走出新路']} top={680} sweep={goldSweep} reveal={clamp01(goldReveal - 1)} />
        </>
      )}

      <ChapterLabel no="04" title="两种模式" />
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

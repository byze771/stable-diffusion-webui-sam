// S11 · 通用方法与 AI（人声 398.0–441.4s，正片帧 11999–13343）
// 五步收敛轨道 → 变形 AI 节点树（AGENT→GOAL）→ 三联屏匹配剪辑 → 长期刻度 → 聚光灯回照 发散/试错/存档
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {COLOR, FONT, MOTION} from '../../design/tokens';
import {clamp01, hex, lerp, rgba} from '../../design/utils';
import {Background, Grain, Vignette} from '../../components/Atmosphere';
import {Annotation, ChapterLabel} from '../../components/Typography';
import {useBeats} from '../../cues';

const cAmber = hex(COLOR.amber), cCyan = hex(COLOR.cyan), cAlert = hex(COLOR.alert), cReject = hex(COLOR.reject);
const NODE_X = [420, 690, 960, 1230, 1500], NODE_Y = 540;
const AG = {x: 360, y: 560}, GO = {x: 1560, y: 560};
const BRANCH_Y = [400, 500, 640, 730];

const NodeIcon: React.FC<{kind: number; on: number}> = ({kind, on}) => {
  const s = 44, col = on > 0.5 ? COLOR.core : rgba(COLOR.white, 0.4);
  const common = {stroke: col, strokeWidth: 2.2, fill: 'none' as const, strokeLinecap: 'round' as const};
  return (
    <svg width={s} height={s} viewBox="0 0 44 44" style={{opacity: 0.35 + on * 0.65}}>
      {kind === 0 && (<>
        <circle cx="22" cy="16" r="7" {...common} />
        <line x1="22" y1="23" x2="22" y2="38" {...common} />
        <line x1="14" y1="38" x2="30" y2="38" {...common} />
      </>)}
      {kind === 1 && (<>
        {[8, 14, 20].map((r, i) => <path key={i} d={`M 22 36 A ${r + 10} ${r + 10} 0 0 1 ${22 + (r + 10) * Math.cos(-Math.PI / 2 + (i - 1) * 0.5)} ${36 + (r + 10) * Math.sin(-Math.PI / 2 + (i - 1) * 0.5)}`} {...common} />)}
        <circle cx="22" cy="36" r="2.6" fill={col} />
      </>)}
      {kind === 2 && (<>
        <path d="M 6 22 Q 13 12 22 22 Q 31 32 38 22" {...common} />
        <path d="M 6 30 Q 13 20 22 30 Q 31 40 38 30" {...common} opacity={0.6} />
      </>)}
      {kind === 3 && (<>
        <line x1="12" y1="12" x2="32" y2="32" stroke={rgba(cAlert, 0.9)} strokeWidth={2.6} strokeLinecap="round" />
        <line x1="32" y1="12" x2="12" y2="32" stroke={rgba(cAlert, 0.9)} strokeWidth={2.6} strokeLinecap="round" />
      </>)}
      {kind === 4 && (<>
        <path d="M 8 10 L 36 10 L 26 24 L 26 34 L 18 34 L 18 24 Z" {...common} />
      </>)}
    </svg>
  );
};

export const S11: React.FC = () => {
  const frame = useCurrentFrame();
  const KB = useBeats('S11');
  const b01 = KB['01'], b02 = KB['02'], b03 = KB['03'], b04 = KB['04'], b05 = KB['05'], b06 = KB['06'],
    b07 = KB['07'], b08 = KB['08'], b09 = KB['09'], b10 = KB['10'], b11 = KB['11'], b12 = KB['12'];

  const START = b01.at - 16, END = b12.end + 40;
  

  // #01–#02
  const dotK = clamp01((frame - b01.a.dot) / 10);
  const breathe = 1 + Math.sin((frame - b01.a.dot) * 0.18) * 0.18 * (1 - clamp01((frame - b01.a.dot - 30) / 20));
  const iconsK = clamp01((frame - b02.a.icons) / 14);
  const iconsOut = 1 - clamp01((frame - b03.a.track) / 10);
  // #03–#04 轨道与五节点
  const trackK = clamp01((frame - b03.a.track) / 16);
  const nodeK = [b04.a.n1, b04.a.n3, b04.a.n4, b04.a.n5, b04.a.n6].map((t) => clamp01((frame - t) / 10));
  const sieveK = clamp01((frame - b04.a.n2) / 10);
  const trackOut = 1 - clamp01((frame - b05.a.agent) / 20);
  // #05–#08 AI 节点树
  const agentK = clamp01((frame - b05.a.agent) / 20);
  const taskK = clamp01((frame - b06.a.task) / 12);
  const goalK = clamp01((frame - b06.a.goal) / 12);
  const branchK = clamp01((frame - b07.a.branch) / 22);
  const pruneK = clamp01((frame - b08.a.prune) / 12);
  const mergeK = clamp01((frame - b08.a.merge) / 16);
  const treeOut = 1 - clamp01((frame - b09.a.p1 + 14) / 22);
  // #09 三联屏
  const panK = [b09.a.p1, b09.a.p2, b09.a.p3].map((t) => clamp01((frame - t) / 12));
  const collapseK = clamp01((frame - b09.a.p3 - 10) / 18);
  const lineK = clamp01((frame - b09.a.p3 - 14) / 14);
  // #10 长期刻度
  const runK = clamp01((frame - b10.a.run) / 80);
  // #11 聚光灯
  const spotK = clamp01((frame - b11.a.spot) / 16);
  // #12 回照 + 三个词
  const relightK = clamp01((frame - b12.a.w1 - 8) / 30);
  const wordK = [b12.a.w1, b12.a.w2, b12.a.w3].map((t) => clamp01((frame - t) / 8));

  const PANEL = useMemo(() => [0, 1, 2].map((i) => ({x: 120 + i * 580, y: 150, w: 520, h: 640})), []);
  const ptY = 470; // 三点连线高度
  const tickXs = useMemo(() => Array.from({length: 24}, (_, i) => 420 + i * 46), []);

  if (frame < START || frame > END) return null;
const fadeIn = clamp01((frame - START) / 10);

  return (
    <AbsoluteFill style={{opacity: fadeIn}}>
      <Background />

      {/* #01 呼吸光点 + #02 四图标 */}
      {iconsOut > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: iconsOut}}>
          <circle cx={960} cy={540} r={9 * breathe} fill={COLOR.core} opacity={dotK * iconsOut}
            style={{filter: `drop-shadow(0 0 16px ${COLOR.amber})`}} />
        </svg>
      )}
      {iconsK > 0 && iconsOut > 0 && (
        <div style={{opacity: iconsK * iconsOut}}>
          {[['🔺', 960, 370], ['🧠', 1140, 540], ['💠', 960, 710], ['🧭', 780, 540]].map(([e, x, y], i) => (
            <Annotation key={i} x={x as number} y={y as number} align="center"
              opacity={clamp01(iconsK * 4 - i) * 0.9} style={{fontSize: 44}}>{e}</Annotation>
          ))}
        </div>
      )}

      {/* #03–#04 五步收敛轨道 */}
      {trackK > 0 && trackOut > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: trackOut}}>
          <line x1={300} y1={NODE_Y} x2={1620} y2={NODE_Y} stroke={rgba(COLOR.white, 0.3)} strokeWidth={1.4}
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - trackK} />
          {NODE_X.map((x, i) => (
            <g key={i}>
              <circle cx={x} cy={NODE_Y} r={30} fill={rgba(COLOR.ink, 0.9)}
                stroke={rgba(nodeK[i] > 0 ? cAmber : hex(COLOR.white), 0.3 + nodeK[i] * 0.6)} strokeWidth={1.6}
                style={nodeK[i] > 0.5 ? {filter: `drop-shadow(0 0 10px ${rgba(cAmber, 0.4)})`} : undefined} />
              {/* 收敛渐入：到最后一个节点时连线变粗琥珀 */}
              {i > 0 && nodeK[4] > 0 && (
                <line x1={NODE_X[i - 1]} y1={NODE_Y} x2={x} y2={NODE_Y}
                  stroke={rgba(cAmber, 0.85 * nodeK[4])} strokeWidth={2.6} />
              )}
            </g>
          ))}
        </svg>
      )}
      {trackK > 0 && trackOut > 0 && NODE_X.map((x, i) => (
        <div key={i} style={{position: 'absolute', left: x - 22, top: NODE_Y - 22, opacity: trackOut}}>
          <NodeIcon kind={i} on={nodeK[i]} />
          <Annotation x={22} y={64} align="center" size="sm" opacity={nodeK[i] * 0.9}
            style={{width: 120, marginLeft: -38}}>
            {['定终点', '一起试', '干涉共振', '淘汰', '收敛'][i]}
          </Annotation>
          {i === 0 && sieveK > 0 && (
            <Annotation x={22} y={92} align="center" size="sm" color={COLOR.cyan} opacity={sieveK * 0.8}
              style={{width: 120, marginLeft: -38}}>+ 筛选标准</Annotation>
          )}
        </div>
      ))}

      {/* #05–#08 AI 节点树 */}
      {agentK > 0 && treeOut > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: agentK * treeOut}}>
          {/* AGENT / GOAL 节点 */}
          <rect x={AG.x - 46} y={AG.y - 30} width={92} height={60} rx={8} fill={rgba(COLOR.ink, 0.9)}
            stroke={rgba(cCyan, 0.8)} strokeWidth={1.8} style={{filter: `drop-shadow(0 0 12px ${rgba(cCyan, 0.35)})`}} />
          {/* 分支 */}
          {BRANCH_Y.map((by, i) => {
            const k = clamp01(branchK * 4 - i * 0.6);
            const pruned = (i === 1 || i === 3) ? pruneK : 0;
            const merged = (i === 0 || i === 2) ? mergeK : 0;
            const midX = 960, endX = lerp(midX, GO.x, merged);
            const col = pruned > 0 ? cReject : cCyan;
            return (
              <g key={i} opacity={(0.9 - pruned * 0.7)}>
                <path d={`M ${AG.x + 46} ${AG.y} C ${620} ${AG.y} ${700} ${by} ${endX} ${lerp(by, GO.y, merged)}`}
                  fill="none" stroke={rgba(col, 0.75)} strokeWidth={merged > 0.5 ? 2.4 : 1.6}
                  pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.max(k, merged)}
                  style={merged > 0.5 ? {filter: `drop-shadow(0 0 8px ${rgba(cCyan, 0.5)})`} : undefined} />
                {/* 流动的 reasoning 小字 */}
                {k > 0.4 && pruned === 0 && merged < 1 && (
                  <text x={lerp(560, endX - 120, (frame % 40) / 40)} y={lerp(AG.y, lerp(by, GO.y, merged), 0.55) - 10}
                    fill={rgba(cCyan, 0.65)} fontSize={15} fontFamily={FONT.mono} letterSpacing="0.1em">reasoning…</text>
                )}
                {pruned > 0 && (
                  <g stroke={rgba(cAlert, 0.95)} strokeWidth={3} strokeLinecap="round" opacity={pruned}>
                    <line x1={880} y1={by - 16} x2={912} y2={by + 16} />
                    <line x1={912} y1={by - 16} x2={880} y2={by + 16} />
                  </g>
                )}
              </g>
            );
          })}
          {/* GOAL */}
          {goalK > 0 && (
            <g opacity={goalK} style={{filter: mergeK > 0.6 ? `drop-shadow(0 0 18px ${rgba(cAmber, 0.7)})` : undefined}}>
              <circle cx={GO.x} cy={GO.y} r={34} fill={rgba(COLOR.ink, 0.9)}
                stroke={rgba(mergeK > 0.6 ? cAmber : cCyan, 0.9)} strokeWidth={2.2} />
              <circle cx={GO.x} cy={GO.y} r={18} fill="none" stroke={rgba(mergeK > 0.6 ? cAmber : cCyan, 0.6)} strokeWidth={1.4} />
            </g>
          )}
        </svg>
      )}
      {agentK > 0 && treeOut > 0 && (
        <>
          <Annotation x={AG.x} y={AG.y - 6} align="center" size="md" color={COLOR.cyan} opacity={agentK * treeOut}>AGENT</Annotation>
          {taskK > 0 && (
            <div style={{
              position: 'absolute', left: AG.x - 60, top: lerp(AG.y - 220, AG.y - 96, taskK), width: 120, height: 40,
              border: `1px solid ${rgba(COLOR.white, 0.4)}`, background: rgba(COLOR.white, 0.06),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FONT.mono, fontSize: 17, letterSpacing: '0.12em', opacity: taskK * treeOut,
            }}>TASK</div>
          )}
          {goalK > 0 && <Annotation x={GO.x} y={GO.y + 52} align="center" size="sm" color={COLOR.amber} opacity={goalK * treeOut}>GOAL</Annotation>}
        </>
      )}

      {/* #09 三联屏 */}
      {PANEL.map((p, i) => panK[i] > 0 && (
        <div key={i} style={{
          position: 'absolute', left: p.x, top: p.y, width: p.w, height: p.h,
          border: `1px solid ${rgba(COLOR.white, 0.25)}`, opacity: panK[i] * (1 - collapseK * 0.9),
          background: rgba(COLOR.white, 0.02),
          transform: collapseK > 0 ? `scale(${1 - collapseK * 0.98}) translate(0, ${collapseK * 0}px)` : undefined,
          transformOrigin: `${p.w / 2}px ${ptY - p.y}px`,
        }}>
          <svg width={p.w} height={p.h}>
            {i === 0 && (
              <g>
                {[0, 1, 2, 3, 4].map((j) => (
                  <path key={j} d={`M 90 340 Q 260 ${340 + (j - 2) * 60} 430 340`}
                    fill="none" stroke={rgba(j === 2 ? cAmber : cReject, j === 2 ? 0.95 : 0.5)} strokeWidth={j === 2 ? 2.6 : 1.2} />
                ))}
                <circle cx={90} cy={340} r={6} fill={COLOR.core} style={{filter: `drop-shadow(0 0 8px ${COLOR.amber})`}} />
                <circle cx={430} cy={340} r={10} fill="none" stroke={rgba(cAmber, 0.9)} strokeWidth={2} />
              </g>
            )}
            {i === 1 && (
              <g>
                <rect x={60} y={320} width={70} height={44} rx={6} fill="none" stroke={rgba(cCyan, 0.9)} strokeWidth={1.6} />
                {[0, 1, 2, 3].map((j) => (
                  <path key={j} d={`M 130 342 C 260 342 280 ${270 + j * 48} ${j === 1 || j === 3 ? 330 : 430} ${j === 1 || j === 3 ? 270 + j * 48 : 342}`}
                    fill="none" stroke={rgba(j === 1 || j === 3 ? cReject : cCyan, 0.7)} strokeWidth={1.4} />
                ))}
                <circle cx={440} cy={342} r={20} fill="none" stroke={rgba(cAmber, 0.9)} strokeWidth={2} />
              </g>
            )}
            {i === 2 && (
              <g>
                {[0, 1, 2, 3, 4, 5].map((j) => (
                  <rect key={j} x={70 + j * 40} y={300 + (j % 3) * 36} width={30} height={20}
                    fill={rgba(cCyan, 0.6)} opacity={0.7} />
                ))}
                <path d="M 240 340 L 400 340" stroke={rgba(cAmber, 0.9)} strokeWidth={3}
                  style={{filter: `drop-shadow(0 0 8px ${rgba(cAmber, 0.6)})`}} />
                <circle cx={420} cy={340} r={12} fill="none" stroke={rgba(cAmber, 0.95)} strokeWidth={2} />
              </g>
            )}
          </svg>
          <Annotation x={p.w / 2} y={p.h - 150} align="center"
            style={{fontFamily: FONT.serif, fontWeight: 900, fontSize: i === 1 ? 72 : 88, width: p.w, marginLeft: -p.w / 2}}>
            {['光', 'AI', '高手'][i]}
          </Annotation>
        </div>
      ))}
      {/* 三点连线 */}
      {lineK > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          {[380, 960, 1540].map((x, i) => (
            <circle key={i} cx={x} cy={ptY} r={7} fill={COLOR.core} opacity={panK[i] > 0 ? 1 : 0}
              style={{filter: `drop-shadow(0 0 12px ${COLOR.amber})`}} />
          ))}
          <line x1={380} y1={ptY} x2={1540} y2={ptY} stroke={rgba(cAmber, 0.9)} strokeWidth={2.6}
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - lineK}
            style={{filter: `drop-shadow(0 0 10px ${rgba(cAmber, 0.5)})`}} />
          {/* #10 跑动光点 + 刻度 */}
          {runK > 0 && (
            <g>
              {tickXs.map((x, i) => {
                const on = clamp01(runK * 26 - i);
                const dim = 1 - spotK * 0.75;
                const relight = relightK * clamp01((x - 400) / 700);
                return <line key={i} x1={x} y1={ptY + 12} x2={x} y2={ptY + 24}
                  stroke={rgba(cAmber, (0.25 + on * 0.6) * Math.max(dim, relight))} strokeWidth={1.6} opacity={on} />;
              })}
              <circle cx={lerp(420, 1540, runK)} cy={ptY} r={8} fill={COLOR.core}
                style={{filter: `drop-shadow(0 0 14px ${COLOR.amber})`}} />
            </g>
          )}
          {/* #11 展柜聚光灯 */}
          {spotK > 0 && (
            <g opacity={spotK}>
              <path d={`M ${1540 + lerp(0, -900, relightK) - 70} 120 L ${1540 + lerp(0, -900, relightK) + 70} 120 L ${1540 + lerp(0, -900, relightK) + 130} ${ptY + 40} L ${1540 + lerp(0, -900, relightK) - 130} ${ptY + 40} Z`}
                fill={rgba(cAmber, 0.10)} />
              <circle cx={1540 + lerp(0, -900, relightK)} cy={ptY} r={14} fill={COLOR.core}
                style={{filter: `drop-shadow(0 0 24px ${COLOR.amber}) drop-shadow(0 0 60px ${rgba(cAmber, 0.5)})`}} />
            </g>
          )}
        </svg>
      )}
      {runK > 0 && spotK === 0 && (
        <Annotation x={960} y={ptY + 52} align="center" size="sm" color={COLOR.amber} opacity={0.7}>长期</Annotation>
      )}
      {/* #12 三个词 */}
      {[0, 1, 2].map((i) => wordK[i] > 0 && (
        <Annotation key={i} x={[560, 900, 1240][i]} y={ptY - 80} align="center" opacity={wordK[i]}
          style={{fontFamily: FONT.serif, fontWeight: 900, fontSize: 40, color: COLOR.core}}>
          {['发散', '试错', '存档'][i]}
        </Annotation>
      ))}

      <ChapterLabel no="06" title="通用方法" />
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

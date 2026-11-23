// S08 · 回到高手（人声 268.1–329.0s，正片帧 8102–9908）｜全片高潮第一段
// REPLAY → 剪影准星 → 扇面 → 图钉定框 → 四图层 → 冰山水面 → 下沉档案库 → 扫描 → 12 卡片飞出命中 → 金句
import React, {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {COLOR, FONT, MOTION} from '../../design/tokens';
import {clamp01, hex, lerp, lerpRgb, rgba} from '../../design/utils';
import {Background, Grain, Vignette} from '../../components/Atmosphere';
import {Annotation, ChapterLabel, GoldLine} from '../../components/Typography';
import {TargetMark} from '../../components/Marks';
import {useBeats} from '../../cues';

const cAmber = hex(COLOR.amber), cCyan = hex(COLOR.cyan), cReject = hex(COLOR.reject);

const AX = 280, BX = 1500, LYY = 480;         // 台上光路
const SEA = 640;                              // 海平线
const LAYERS_Z = [-200, -600, -1200];

// 档案库卡片（固定种子）
type Card = {x: number; y: number; w: number; layer: number; label?: string; hot: boolean};
const makeCards = (): Card[] => {
  const cards: Card[] = [];
  const labels: Record<number, [number, string][]> = {
    0: [[2, '方向 #031'], [11, '方案 v3 · 已否']],
    1: [[5, '方案 v2 · 已否'], [14, '方向 #017']],
    2: [[3, '跨界 · 建筑'], [9, '2019 · 摄影'], [16, '笔记 #217']],
  };
  for (let layer = 0; layer < 3; layer++) {
    const scale = layer === 0 ? 1 : layer === 1 ? 0.82 : 0.62;
    for (let i = 0; i < 22; i++) {
      const col = i % 6, row = Math.floor(i / 6);
      const x = 200 + col * 270 * scale + random(`s08-cx-${layer}-${i}`) * 60;
      const y = 740 + row * 105 * scale + random(`s08-cy-${layer}-${i}`) * 30;
      const lab = labels[layer]?.find(([n]) => n === i);
      cards.push({x, y, w: 190 * scale, layer, label: lab?.[1], hot: false});
    }
  }
  return cards;
};

// 12 张被翻出的卡片：起点（世界）→ 终点列（对准目标环）
const QUAD = (p0: number, p1: number, p2: number, t: number) =>
  (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;

export const S08: React.FC = () => {
  const frame = useCurrentFrame();
  const KB = useBeats('S08');
  const b01 = KB['01'], b02 = KB['02'], b03 = KB['03'], b04 = KB['04'], b05 = KB['05'], b06 = KB['06'],
    b07 = KB['07'], b08 = KB['08'], b09 = KB['09'], b10 = KB['10'], b11 = KB['11'], b12 = KB['12'],
    b13 = KB['13'], b14 = KB['14'], b15 = KB['15'], b16 = KB['16'];

  const START = b01.at - 16, END = b16.end + 40;
  

  // ===== 镜头：9104 下沉 40 帧；命中前快速上浮 =====
  const cam =
    lerp(0, 430, clamp01((frame - b09.a.dive) / 40)) -
    lerp(0, 430, clamp01((frame - (b15.a.hit - 14)) / 12));

  // #01 replay
  const replayK = clamp01((frame - b01.a.replay) / 12);
  // #02 剪影 + 准星 + 锁定
  const figK = clamp01((frame - b02.a.figure) / 14);
  const lockK = clamp01((frame - b02.a.lock) / 12);
  // #03 扇面
  const fanK = clamp01((frame - b03.a.fan) / 20);
  // #04 图钉 + 框 + 试
  const pinK = clamp01((frame - b04.a.pin) / 12);
  const boxK = clamp01((frame - b04.a.framebox) / 14);
  const tryK = clamp01((frame - b04.a.orderly) / 30);
  // #05–#07 图层
  const layersK = clamp01((frame - b05.a.layers) / 18);
  const layTag = [b06.a.l1, b06.a.l2, b06.a.l3, b06.a.l4].map((t) => clamp01((frame - t) / 8));
  const allK = clamp01((frame - b06.a.all) / 14);
  const shrinkK = clamp01((frame - b07.a.shrink) / 15);
  // #08 冰山
  const seaK = clamp01((frame - b08.a.line) / 18);
  const beamOnlyK = clamp01((frame - b08.a.line) / 24); // 台上其它元素退场
  const beamFlashK = clamp01((frame - b08.a.beam) / 4) * (1 - clamp01((frame - b08.a.beam - 5) / 10));
  // #09–#11 档案库
  const archK = clamp01((frame - b10.a.archive) / 24);
  const lay2K = clamp01((frame - b10.a.layer2) / 18);
  const deepK = clamp01((frame - b11.a.deep) / 18);
  const deep2K = clamp01((frame - b11.a.deep2) / 18);
  // #12 新目标
  const newtK = clamp01((frame - b12.a.newtarget) / 14);
  // #13 锁定 + 扫描
  const pinAK = clamp01((frame - b13.a.pinA) / 10);
  const pinBK = clamp01((frame - b13.a.pinB) / 10);
  const scanK = clamp01((frame - b13.a.scan) / 46);
  // #14 卡片飞出
  const flyBase = b14.a.fly;
  // #15 命中
  const hitK = clamp01((frame - b15.a.hit) / 4);
  const hitDecay = 1 - clamp01((frame - b15.a.hit - 4) / 14);
  const beamInK = clamp01((frame - (b15.a.hit - 10)) / 10);
  // #16 金句
  const dimK = clamp01((frame - b16.a.gold) / 16) * 0.6;
  const goldReveal = clamp01((frame - b16.a.gold) / 12) + clamp01((frame - b16.a.gold2) / 12);
  const goldSweep = clamp01((frame - b16.a.gold2) / MOTION.dur.goldSweep);
  const inGold = frame >= b16.a.gold - 6;

  const cards = useMemo(makeCards, []);
  const flyers = useMemo(() => Array.from({length: 12}, (_, i) => {
    const layer = i % 3;
    const x0 = 260 + random(`s08-fx-${i}`) * 1200;
    const y0 = 780 + layer * 60 + random(`s08-fy-${i}`) * 160;
    const x1 = 860 + i * 52, y1 = LYY;
    return {x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: Math.min(y0, y1) - 260, delay: i * 3, layer};
  }), []);

  // 台上元素总退场系数（#08 后只留光束与目标）
  const stageGone = 1 - beamOnlyK;

  if (frame < START || frame > END) return null;
const fadeIn = clamp01((frame - START) / 10);

  return (
    <AbsoluteFill style={{opacity: fadeIn}}>
      <Background />
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${(-cam).toFixed(1)}px)`}}>
        {/* ===== 台上层 ===== */}
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          {/* #03 扇面（剪影背后） */}
          {fanK > 0 && stageGone > 0 && (
            <g opacity={fanK * 0.5 * stageGone}>
              {Array.from({length: 11}, (_, i) => {
                const bend = (i - 5) * 55;
                return <path key={i} d={`M ${AX} ${LYY} Q ${(AX + BX) / 2} ${LYY + bend} ${BX} ${LYY}`}
                  fill="none" stroke={rgba(i === 5 ? cAmber : cReject, i === 5 ? 0.9 : 0.5)} strokeWidth={i === 5 ? 2 : 1.2} />;
              })}
            </g>
          )}
          {/* #01 光线（12 帧画完） */}
          {replayK > 0 && (
            <line x1={AX} y1={LYY} x2={BX} y2={LYY} stroke={rgba(cAmber, 0.95)} strokeWidth={3}
              pathLength={1} strokeDasharray={1} strokeDashoffset={1 - replayK}
              style={{filter: `drop-shadow(0 0 12px ${rgba(cAmber, 0.55)})`}} />
          )}
          {/* #04 框内整齐试错 */}
          {tryK > 0 && stageGone > 0 && (
            <g opacity={stageGone}>
              {[0, 1, 2, 3, 4].map((i) => {
                const k = clamp01(tryK * 5 - i);
                const bend = (i - 2) * 42;
                return <path key={i} d={`M ${AX} ${LYY} Q ${(AX + BX) / 2} ${LYY + bend} ${BX} ${LYY}`}
                  fill="none" stroke={rgba(cCyan, 0.55)} strokeWidth={1.4}
                  pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} opacity={k} />;
              })}
            </g>
          )}
          {/* #08 后的粗光束（保留到命中/金句） */}
          {beamOnlyK > 0 && (
            <rect x={AX} y={LYY - 7} width={(BX - AX) * Math.max(beamInK, beamOnlyK)} height={14}
              fill={rgba(cAmber, 0.9)} style={{filter: `drop-shadow(0 0 18px ${rgba(cAmber, 0.7)})`}}
              opacity={beamOnlyK * (1 - dimK * 0.4)} />
          )}
          {/* 海平线 */}
          {seaK > 0 && (
            <line x1={60} y1={SEA} x2={1860} y2={SEA} stroke={rgba(COLOR.white, 0.35)} strokeWidth={1.2}
              pathLength={1} strokeDasharray={1} strokeDashoffset={1 - seaK} />
          )}
        </svg>

        {/* 光源点 / 图钉 / 目标环 */}
        {stageGone > 0 && (
          <>
            <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: stageGone}}>
              <circle cx={AX} cy={LYY} r={9} fill={COLOR.core}
                style={{filter: `drop-shadow(0 0 16px ${COLOR.amber})`}} opacity={replayK} />
              {/* 人形剪影 */}
              {figK > 0 && (
                <g opacity={figK * 0.85} style={{filter: `drop-shadow(0 0 22px ${rgba(cAmber, 0.35)})`}}>
                  <circle cx={AX} cy={LYY - 150} r={26} fill={rgba(cAmber, 0.5)} />
                  <path d={`M ${AX - 28} ${LYY - 118} L ${AX + 28} ${LYY - 118} L ${AX + 52} ${LYY + 80} L ${AX - 52} ${LYY + 80} Z`} fill={rgba(cAmber, 0.4)} />
                  {/* 眼部准星 */}
                  <circle cx={AX} cy={LYY - 150} r={12} fill="none" stroke={rgba(COLOR.core, 0.95)} strokeWidth={1.6} />
                  <line x1={AX - 12} y1={LYY - 150} x2={AX + 12} y2={LYY - 150} stroke={rgba(COLOR.core, 0.95)} strokeWidth={1.4} />
                  <line x1={AX} y1={LYY - 162} x2={AX} y2={LYY - 138} stroke={rgba(COLOR.core, 0.95)} strokeWidth={1.4} />
                </g>
              )}
              {/* 图钉 A / B */}
              {pinK > 0 && (
                <g opacity={pinK}>
                  <path d={`M ${AX} ${LYY - 34} L ${AX - 9} ${LYY - 52} L ${AX + 9} ${LYY - 52} Z`} fill={rgba(cAmber, 0.9)} />
                  <line x1={AX} y1={LYY - 52} x2={AX} y2={LYY - 74} stroke={rgba(cAmber, 0.9)} strokeWidth={2.4} />
                  <path d={`M ${BX} ${LYY - 34} L ${BX - 9} ${LYY - 52} L ${BX + 9} ${LYY - 52} Z`} fill={rgba(cAmber, 0.9)} />
                  <line x1={BX} y1={LYY - 52} x2={BX} y2={LYY - 74} stroke={rgba(cAmber, 0.9)} strokeWidth={2.4} />
                </g>
              )}
              {/* 细线矩形框 */}
              {boxK > 0 && (
                <rect x={AX - 60} y={LYY - 170} width={BX - AX + 120} height={300} fill="none"
                  stroke={rgba(COLOR.white, 0.35)} strokeWidth={1.2} opacity={boxK} />
              )}
            </svg>
            <div style={{position: 'absolute', inset: 0, opacity: stageGone}}>
              <TargetMark x={BX} y={LYY} lit={Math.max(replayK * 0.7, lockK)} />
              {lockK > 0 && (
                <Annotation x={BX} y={LYY + 66} align="center" size="sm" color={COLOR.amber} opacity={0.8 * lockK}>LOCKED</Annotation>
              )}
              {replayK > 0 && frame < b02.a.figure && (
                <Annotation x={1730} y={96} size="sm" opacity={0.7}>REPLAY</Annotation>
              )}
            </div>
          </>
        )}

        {/* #05–#07 四图层 */}
        {layersK > 0 && stageGone > 0 && (
          <div style={{position: 'absolute', left: 1150, top: 180, width: 560, height: 380, opacity: layersK * stageGone}}>
            {['经验', '信息', '资源', '时机'].map((t, i) => {
              const on = layTag[i];
              return (
                <div key={t} style={{
                  position: 'absolute', left: i * 34, top: i * 62, width: 380, height: 86,
                  border: `1px solid ${rgba(on > 0 ? cCyan : hex(COLOR.white), 0.25 + on * 0.45)}`,
                  background: rgba(on > 0 ? cCyan : hex(COLOR.white), 0.04 + on * 0.06 + (allK > 0 ? allK * 0.03 : 0)),
                  display: 'flex', alignItems: 'center', paddingLeft: 22,
                  boxShadow: on > 0 ? `0 0 20px ${rgba(cCyan, 0.12 * on)}` : 'none',
                }}>
                  <span style={{fontFamily: FONT.serif, fontWeight: 900, fontSize: 30, color: COLOR.core, opacity: 0.25 + on * 0.75}}>{t}</span>
                  <span style={{marginLeft: 'auto', marginRight: 16, fontFamily: FONT.mono, fontSize: 14, letterSpacing: '0.12em', color: rgba(cCyan, 0.6 * on)}}>LAYER {i + 1}</span>
                </div>
              );
            })}
            {/* 「眼光」缩小放回第一格 */}
            {shrinkK > 0 && (
              <div style={{
                position: 'absolute', left: lerp(150, 96, shrinkK), top: lerp(-120, 16, shrinkK),
                fontFamily: FONT.serif, fontWeight: 900, fontSize: lerp(84, 24, shrinkK),
                color: COLOR.core, opacity: 0.9 * shrinkK * 0.7, whiteSpace: 'nowrap',
              }}>眼光</div>
            )}
          </div>
        )}

        {/* ===== 台下：档案库（CSS 3D 三层） ===== */}
        {seaK > 0 && (
          <div style={{position: 'absolute', inset: 0, perspective: 1400, perspectiveOrigin: `50% ${30 + cam * 0.1}%`}}>
            {[0, 1, 2].map((layer) => {
              const layerK = layer === 0 ? archK : layer === 1 ? lay2K : Math.max(deepK, deep2K * 0.5);
              return (
                <div key={layer} style={{
                  position: 'absolute', inset: 0, transformStyle: 'preserve-3d',
                  transform: `translateZ(${LAYERS_Z[layer]}px)`,
                  opacity: layerK * (1 - dimK * 0.5),
                }}>
                  {cards.filter((c) => c.layer === layer).map((c, i) => (
                    <div key={i} style={{
                      position: 'absolute', left: c.x, top: c.y, width: c.w, height: 64,
                      border: `1px solid ${rgba(cCyan, 0.28 + (layer === 2 ? deep2K * 0.2 : 0))}`,
                      background: rgba(cCyan, 0.05),
                      display: 'flex', alignItems: 'center', paddingLeft: 12,
                      fontFamily: FONT.mono, fontSize: 15, letterSpacing: '0.06em',
                      color: rgba(cCyan, 0.85), whiteSpace: 'nowrap',
                    }}>{c.label ?? ''}</div>
                  ))}
                </div>
              );
            })}
            {/* 扫描线 */}
            {scanK > 0 && scanK < 1 && (
              <div style={{
                position: 'absolute', left: 120, right: 120, top: lerp(700, 1060, scanK), height: 3,
                background: rgba(cCyan, 0.85), boxShadow: `0 0 24px 6px ${rgba(cCyan, 0.35)}`,
              }} />
            )}
          </div>
        )}
        {/* HIDDEN TIME 小字 */}
        {cam > 40 && (
          <Annotation x={92} y={cam + 60} size="sm" opacity={0.6 * clamp01(cam / 200)}>HIDDEN TIME</Annotation>
        )}
        {/* #12 新目标环（台面层，随相机下沉时仍固定在世界上方） */}
        {newtK > 0 && cam > 200 && (
          <div style={{position: 'absolute', inset: 0}}>
            <TargetMark x={BX} y={LYY} lit={newtK} />
          </div>
        )}
        {/* 起终点再锁定标记 */}
        {(pinAK > 0 || pinBK > 0) && cam > 200 && (
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
            {pinAK > 0 && <circle cx={AX} cy={LYY} r={10} fill="none" stroke={rgba(cAmber, 0.95 * pinAK)} strokeWidth={2.4} />}
            {pinBK > 0 && <circle cx={BX} cy={LYY} r={10} fill="none" stroke={rgba(cAmber, 0.95 * pinBK)} strokeWidth={2.4} />}
          </svg>
        )}

        {/* #14 飞出的 12 张卡 */}
        {flyers.map((f, i) => {
          const t = clamp01((frame - flyBase - f.delay) / 42);
          if (t <= 0 || beamInK >= 1) return null;
          const x = QUAD(f.x0, f.cx, f.x1, t), y = QUAD(f.y0, f.cy, f.y1, t);
          const col = lerpRgb(cCyan, cAmber, clamp01(t * 1.4 - 0.2));
          return (
            <div key={i} style={{
              position: 'absolute', left: x, top: y, width: 44, height: 26,
              background: rgba(col, 0.85), boxShadow: `0 0 14px ${rgba(col, 0.6)}`,
              opacity: t < 1 ? 1 : 0.95, transform: `rotate(${(1 - t) * (i % 2 ? 14 : -14)}deg)`,
            }} />
          );
        })}
      </div>

      {/* 命中：光束爆闪 + 准星闪 */}
      {hitK > 0 && hitDecay > 0 && (
        <AbsoluteFill style={{background: `radial-gradient(circle at ${BX}px ${LYY}px, ${rgba(cAmber, 0.75)}, transparent 42%)`, opacity: hitK * hitDecay}} />
      )}
      {hitK > 0 && hitDecay > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: hitDecay}}>
          <circle cx={AX} cy={LYY - 150} r={16 + hitK * 8} fill="none" stroke={rgba(COLOR.core, 0.9)} strokeWidth={2} />
        </svg>
      )}

      {/* #16 金句（冰山构图：上一截光束，下档案库） */}
      {dimK > 0 && <AbsoluteFill style={{backgroundColor: COLOR.ink, opacity: dimK}} />}
      {inGold && (
        <>
          <GoldLine lines={['外人看到的那一眼']} top={340} sweep={goldSweep} reveal={clamp01(goldReveal)} />
          <GoldLine lines={['是后台跑完的结果']} top={660} sweep={goldSweep} reveal={clamp01(goldReveal - 1)} />
        </>
      )}

      <ChapterLabel no="05" title="一眼命中" />
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

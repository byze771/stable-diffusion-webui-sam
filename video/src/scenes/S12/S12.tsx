// S12 · 三个动作与结尾（人声 442.1–471.1s，正片帧 13323–14360）
// 三张 420×560 翻卡（卡内小动画）→ 合拢 + 全片路径回放 → 结尾金句光束射出 → 片尾署名卡
import React, {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {COLOR, FONT, MOTION} from '../../design/tokens';
import {clamp01, hex, lerp, rgba} from '../../design/utils';
import {Background, Grain, Vignette} from '../../components/Atmosphere';
import {Annotation, ChapterLabel, GoldLine} from '../../components/Typography';
import {useBeats} from '../../cues';

const cAmber = hex(COLOR.amber), cCyan = hex(COLOR.cyan), cReject = hex(COLOR.reject);
const CARD_X = [330, 750, 1170], CARD_Y = 230, CW = 420, CH = 560;

// 卡片内粒子（卡 1：图钉拔掉乱撒 / 插回收拢）
const CardParticles: React.FC<{frame: number; unpinAt: number; chaosAt: number; ox: number; oy: number}> =
  ({frame, unpinAt, chaosAt, ox, oy}) => {
    const P = useMemo(() => Array.from({length: 26}, (_, i) => ({
      hx: 60 + (i % 7) * 44, hy: 40 + Math.floor(i / 7) * 44,
      dx: (random(`s12-dx-${i}`) - 0.5) * 300, dy: (random(`s12-dy-${i}`) - 0.5) * 200,
      sp: 0.6 + random(`s12-sp-${i}`) * 1.4,
    })), []);
    const outK = clamp01((frame - unpinAt) / 20);
    const backK = clamp01((frame - chaosAt) / 18);
    const k = outK * (1 - backK);
    return (
      <g>
        {P.map((p, i) => (
          <circle key={i} cx={ox + p.hx + p.dx * k * p.sp} cy={oy + p.hy + p.dy * k * p.sp} r={2.2}
            fill={rgba(cCyan, 0.75)} />
        ))}
      </g>
    );
  };

const CardFace: React.FC<{no: string; title: string; children?: React.ReactNode}> = ({no, title, children}) => (
  <div style={{
    position: 'absolute', inset: 0,
    border: `1px solid ${rgba(cAmber, 0.55)}`, borderRadius: 24,
    background: '#14161C',
    padding: '34px 30px',
  }}>
    <div style={{fontFamily: FONT.serif, fontWeight: 900, fontSize: 76, color: COLOR.amber, lineHeight: 1}}>{no}</div>
    <div style={{fontFamily: FONT.serif, fontWeight: 900, fontSize: 34, color: COLOR.core, marginTop: 14}}>{title}</div>
    <div style={{position: 'absolute', left: 30, right: 30, top: 170, bottom: 24}}>{children}</div>
  </div>
);
const CardBack: React.FC = () => (
  <div style={{
    position: 'absolute', inset: 0,
    border: `1px solid ${rgba(cAmber, 0.4)}`, borderRadius: 24,
    background: '#14161C',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <span style={{fontFamily: FONT.serif, fontWeight: 900, fontSize: 90, color: rgba(cAmber, 0.35)}}>光</span>
  </div>
);

export const S12: React.FC = () => {
  const frame = useCurrentFrame();
  const KB = useBeats('S12');
  const b01 = KB['01'], b02 = KB['02'], b03 = KB['03'], b04 = KB['04'], b05 = KB['05'], b06 = KB['06'],
    b07 = KB['07'], b08 = KB['08'], b10 = KB['10'];

  const START = b01.at - 16;
  const END = 14360; // FILM_END
  

  const dropK = [0, 1, 2].map((i) => clamp01((frame - b01.a.cards - i * 6) / 10));
  const flipK = [
    clamp01((frame - b02.a.flip1) / 12),
    clamp01((frame - b04.a.flip2) / 12),
    clamp01((frame - b06.a.flip3) / 12),
  ];
  // 卡 2 内部：细线下沉进盒
  const sinkK = clamp01((frame - b05.a.sink) / 24);
  const lidK = clamp01((frame - b05.a.sink - 18) / 10);
  const brightK = clamp01((frame - b05.a.bright) / 12);
  // 卡 3 内部：纸团 → 展平入盒 → 微光同频
  const crumK = clamp01((frame - b07.a.crumple) / 18);
  const flatK = clamp01((frame - b08.a.flatten) / 16);
  const glowK = clamp01((frame - b08.a.glow) / 14);
  const syncK = clamp01((frame - b08.a.sync) / 10);
  const syncPulse = syncK > 0 ? 0.55 + Math.sin((frame - b08.a.sync) * 0.45) * 0.45 : 0;
  // #09 合拢 + 回放（金句前停顿里）
  const recapIn = clamp01((frame - (b10.a.g1 - 44)) / 18);
  const recapOut = 1 - clamp01((frame - (b10.a.g1 + 2)) / 14);
  const convergeK = clamp01((frame - (b10.a.g1 - 20)) / 18);
  // #10 金句 + 光束
  const dimK = clamp01((frame - b10.a.g1) / 14) * 0.8;
  const gReveal = clamp01((frame - b10.a.g1) / 10) + clamp01((frame - b10.a.g2) / 10) + clamp01((frame - b10.a.g3) / 10);
  const goldSweep = clamp01((frame - b10.a.g3) / MOTION.dur.goldSweep);
  const beamK = clamp01((frame - b10.a.g3) / 20);
  const pinK = clamp01((frame - b10.a.g1) / 12);
  // 片尾卡
  const tailIn = clamp01((frame - (b10.end + 12)) / 18);
  const tailOut = 1 - clamp01((frame - 14330) / 28);
  const tailK = Math.min(tailIn, tailOut);

  const cardsGone = 1 - clamp01((frame - (b10.a.g1 - 24)) / 16);

  if (frame < START || frame > END) return null;
const fadeIn = clamp01((frame - START) / 10);

  return (
    <AbsoluteFill style={{opacity: fadeIn}}>
      <Background />

      {/* ===== 三张卡片 ===== */}
      {cardsGone > 0 && (
        <div style={{position: 'absolute', inset: 0, perspective: 1400, opacity: cardsGone}}>
          {[0, 1, 2].map((i) => {
            const conv = convergeK * recapIn;
            const x = lerp(CARD_X[i], 750, conv), y = lerp(CARD_Y, 260, conv);
            return (
              <div key={i} style={{
                position: 'absolute', left: x, top: y, width: CW, height: CH,
                transform: `translateY(${-(1 - dropK[i]) * 60}px) rotateY(${180 - flipK[i] * 180}deg) rotate(${conv * (i - 1) * 14}deg) scale(${1 - conv * 0.7})`,
                transformStyle: 'preserve-3d', opacity: dropK[i] * (1 - conv * 0.6),
              }}>
                {flipK[i] >= 0.5 && (<CardFace no={`${i + 1}`} title={['定终点 · 立筛子', '分主线 · 收支线', '勤存档 · 留子波'][i]}>
                  {i === 0 && (
                    <svg width={360} height={360}>
                      {/* 图钉 */}
                      <g transform={`translate(180 36) rotate(${lerp(0, -30, clamp01((frame - b03.a.unpin) / 12) * (1 - clamp01((frame - b03.a.chaos) / 12)))})`}>
                        <circle r={10} fill={rgba(cAmber, 0.9)} />
                        <line x1={0} y1={10} x2={0} y2={34} stroke={rgba(cAmber, 0.9)} strokeWidth={3} />
                      </g>
                      <CardParticles frame={frame} unpinAt={b03.a.unpin} chaosAt={b03.a.chaos} ox={0} oy={70} />
                      {/* 筛网 */}
                      <rect x={80} y={290} width={200} height={56} fill="none" stroke={rgba(cCyan, 0.5)} strokeWidth={1.2} />
                      {[0, 1, 2, 3].map((j) => <line key={j} x1={120 + j * 40} y1={290} x2={120 + j * 40} y2={346} stroke={rgba(cCyan, 0.35)} strokeWidth={1} />)}
                    </svg>
                  )}
                  {i === 1 && (
                    <svg width={360} height={360}>
                      <line x1={20} y1={90} x2={340} y2={90} stroke={rgba(cAmber, 0.9)}
                        strokeWidth={4 + brightK * 2}
                        style={{filter: `drop-shadow(0 0 ${6 + brightK * 10}px ${rgba(cAmber, 0.6)})`}} />
                      {[0, 1, 2].map((j) => {
                        const k = clamp01(sinkK * 3 - j * 0.5);
                        return <line key={j} x1={40} y1={lerp(150 + j * 40, 300, k)} x2={320} y2={lerp(150 + j * 40, 300, k)}
                          stroke={rgba(cCyan, 0.65 * (1 - lidK * 0.4))} strokeWidth={1.8} opacity={1 - k * 0.15} />;
                      })}
                      {/* 小盒子 */}
                      <rect x={110} y={296} width={140} height={52} fill="none" stroke={rgba(COLOR.white, 0.45)} strokeWidth={1.4} />
                      <rect x={104} y={288} width={152} height={12} fill={rgba(COLOR.white, 0.12)}
                        stroke={rgba(COLOR.white, 0.4)} strokeWidth={1}
                        transform={`rotate(${lerp(-24, 0, lidK)} 110 294)`} />
                    </svg>
                  )}
                  {i === 2 && (
                    <svg width={360} height={360}>
                      {/* 垃圾桶 */}
                      <g opacity={0.7}>
                        <rect x={270} y={240} width={60} height={70} rx={6} fill="none" stroke={rgba(cReject, 0.9)} strokeWidth={2} />
                        <line x1={262} y1={240} x2={338} y2={240} stroke={rgba(cReject, 0.9)} strokeWidth={2.4} />
                      </g>
                      {/* 纸团/展平的卡 */}
                      {flatK < 0.6 ? (
                        <g transform={`translate(${lerp(60, 210, crumK)} ${lerp(280, 200, crumK)})`}>
                          <circle r={16} fill={rgba(COLOR.white, 0.75)} />
                          {[0, 1, 2].map((j) => <path key={j} d={`M -10 ${-6 + j * 6} Q 0 ${-10 + j * 6} 10 ${-5 + j * 6}`}
                            stroke={rgba(cReject, 0.9)} strokeWidth={1.4} fill="none" />)}
                        </g>
                      ) : (
                        <rect x={lerp(194, 128, flatK)} y={lerp(184, 236, flatK)} width={34} height={46} rx={4}
                          fill={rgba(cCyan, 0.8)} />
                      )}
                      {/* 档案盒 + 同频微光 */}
                      <g style={glowK > 0 ? {filter: `drop-shadow(0 0 ${10 + syncPulse * 14}px ${rgba(cCyan, 0.7)})`} : undefined}>
                        <rect x={60} y={230} width={140} height={80} rx={6} fill="none"
                          stroke={rgba(glowK > 0 ? cCyan : hex(COLOR.white), 0.5 + glowK * 0.4)} strokeWidth={1.6} />
                        <rect x={54} y={220} width={152} height={14} rx={4} fill={rgba(COLOR.white, 0.10)}
                          stroke={rgba(glowK > 0 ? cCyan : hex(COLOR.white), 0.4)} strokeWidth={1.2} />
                      </g>
                      {/* 上方琥珀线（同频闪烁） */}
                      <line x1={40} y1={60} x2={320} y2={60} stroke={rgba(cAmber, 0.4 + syncPulse * 0.6)} strokeWidth={3} />
                    </svg>
                  )}
                </CardFace>)}
                {flipK[i] < 0.5 && <CardBack />}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== #09 全片回放（20% 透明度） ===== */}
      {recapIn > 0 && recapOut > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: recapIn * recapOut * 0.55}}>
          <g transform={`translate(${convergeK * 0}px 0) scale(${1 - convergeK * 0.55}) translate(${convergeK * 830}px ${convergeK * 240}px)`}>
            {/* 扇面 */}
            {[0, 1, 2, 3, 4].map((j) => (
              <path key={`f${j}`} d={`M 300 700 Q 960 ${700 + (j - 2) * 90} 1620 700`}
                fill="none" stroke={rgba(j === 2 ? cAmber : cCyan, 0.5)} strokeWidth={1.6} />
            ))}
            {/* 支线 */}
            {[0, 1, 2].map((j) => (
              <path key={`b${j}`} d={`M ${500 + j * 120} 700 q 30 -60 10 -120 q -20 -60 20 -110`}
                fill="none" stroke={rgba(cCyan, 0.5)} strokeWidth={1.4} />
            ))}
            {/* AI 分支 */}
            {[0, 1, 2, 3].map((j) => (
              <path key={`a${j}`} d={`M 1150 620 C 1300 620 1330 ${520 + j * 60} 1500 ${520 + j * 60}`}
                fill="none" stroke={rgba(j % 2 ? cReject : cCyan, 0.5)} strokeWidth={1.4} />
            ))}
            {/* 档案光点 */}
            {Array.from({length: 24}, (_, j) => (
              <circle key={`d${j}`} cx={420 + (j % 8) * 150} cy={780 + Math.floor(j / 8) * 50} r={2.4}
                fill={rgba(cCyan, 0.6)} />
            ))}
          </g>
        </svg>
      )}

      {/* ===== #10 结尾金句 ===== */}
      {dimK > 0 && <AbsoluteFill style={{backgroundColor: COLOR.ink, opacity: dimK}} />}
      {frame >= b10.a.g1 - 6 && frame < b10.end + 12 && (
        <>
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
            <circle cx={300} cy={620} r={9} fill={COLOR.core} style={{filter: `drop-shadow(0 0 16px ${COLOR.amber})`}} />
            {pinK > 0 && (
              <g opacity={pinK}>
                <path d={`M 1620 ${620 - 30} L 1611 ${620 - 48} L 1629 ${620 - 48} Z`} fill={rgba(cAmber, 0.95)} />
                <line x1={1620} y1={620 - 48} x2={1620} y2={620 - 70} stroke={rgba(cAmber, 0.95)} strokeWidth={2.6} />
              </g>
            )}
            {/* 光束：A → B → 右缘，20 帧，带运动模糊 */}
            {beamK > 0 && (
              <g>
                <rect x={300} y={614} width={(1920 - 300) * beamK} height={12} fill={rgba(cAmber, 0.35)}
                  style={{filter: 'blur(6px)'}} />
                <rect x={300} y={617} width={(1920 - 300) * beamK} height={6} fill={rgba(cAmber, 0.98)}
                  style={{filter: `drop-shadow(0 0 18px ${rgba(cAmber, 0.8)})`}} />
              </g>
            )}
          </svg>
          <GoldLine lines={['先定好你的终点', '然后', '像光一样出发']} top={260} sweep={goldSweep} reveal={gReveal} />
        </>
      )}

      {/* ===== 片尾署名卡 ===== */}
      {tailK > 0 && (
        <AbsoluteFill style={{backgroundColor: COLOR.ink, opacity: tailK}}>
          <AbsoluteFill style={{opacity: tailK}}>
            <div style={{position: 'absolute', left: 160, top: 430}}>
              <div style={{fontFamily: FONT.serif, fontWeight: 900, fontSize: 72, color: COLOR.core}}>光路</div>
              <div style={{fontFamily: FONT.mono, fontSize: 18, letterSpacing: '0.22em', color: rgba(cAmber, 0.8), marginTop: 10}}>LIGHT PATH</div>
            </div>
            <div style={{position: 'absolute', right: 160, top: 436, textAlign: 'right'}}>
              <div style={{fontFamily: FONT.mono, fontSize: 16, letterSpacing: '0.22em', color: rgba(cCyan, 0.7)}}>NEXT</div>
              <div style={{fontFamily: FONT.serif, fontWeight: 900, fontSize: 40, color: COLOR.core, marginTop: 8}}>下期预告</div>
            </div>
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 60, textAlign: 'center',
              fontFamily: FONT.sans, fontSize: 18, color: rgba(hex(COLOR.white), 0.55),
            }}>
              Music: "Signal to Noise" / "Ephemera" / "Hymn to the Dawn" by Scott Buckley (CC BY 4.0)
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      <ChapterLabel no="07" title="明天就能做" />
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

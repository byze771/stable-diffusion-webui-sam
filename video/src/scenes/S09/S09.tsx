// S09 · 新手与高手（人声 327.5–359.9s，正片帧 9885–10896）
// 左右分屏：左「乱」（模糊终点/乱撒/内耗堆积）右「稳」（定钉/扇形/沉淀/扫描出结果）→ 全屏 10 年刻度坍缩金句
import React, {useEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {COLOR, FONT, MOTION} from '../../design/tokens';
import {clamp01, hex, lerp, lerpRgb, rgba} from '../../design/utils';
import {Background, Grain, Vignette} from '../../components/Atmosphere';
import {Annotation, ChapterLabel, GoldLine} from '../../components/Typography';
import {TargetMark} from '../../components/Marks';
import {useBeats} from '../../cues';

const cAmber = hex(COLOR.amber), cCyan = hex(COLOR.cyan), cAlert = hex(COLOR.alert), cReject = hex(COLOR.reject);
const MID = 960;

// ===== 左屏粒子（canvas） =====
const N = 70;
const LeftChaos: React.FC<{frame: number; scatterAt: number; pullAt: number; resetAt: number; pileAt: number; heatAt: number; shakeAt: number; dim: number}> =
  ({frame, scatterAt, pullAt, resetAt, pileAt, heatAt, shakeAt, dim}) => {
    const ref = useRef<HTMLCanvasElement>(null);
    const P = useMemo(() => Array.from({length: N}, (_, i) => {
      const ang = random(`s09-a-${i}`) * Math.PI * 2;
      const sp = 1.6 + random(`s09-s-${i}`) * 2.6;
      const icon = i % 3;
      const col = i % 18, row = Math.floor(i / 18);
      return {
        ang, sp, icon,
        px: 320 + col * 19 + random(`s09-jx-${i}`) * 8,
        py: 706 - row * 13 + random(`s09-jy-${i}`) * 5,
        r: 1.6 + random(`s09-r-${i}`) * 1.8,
      };
    }), []);
    const icons = useMemo(() => [{x: 520, y: 400}, {x: 640, y: 690}, {x: 420, y: 780}], []);
    useEffect(() => {
      const ctx = ref.current?.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, 1920, 1080);
      const A = {x: 260, y: 560};
      const resetOut = Math.min(1, clamp01((resetAt + 8 - frame) / 8) + clamp01((frame - resetAt - 10) / 12)); // 清空后重撒
      const reT = frame < resetAt ? frame - scatterAt : frame - resetAt - 10; // 重撒计时
      const pullK = clamp01((frame - pullAt) / 30);
      const pileK = clamp01((frame - pileAt) / 18);
      const heatK = clamp01((frame - heatAt) / 20);
      const shakeK = clamp01((frame - shakeAt) / 4) * (1 - clamp01((frame - shakeAt - 4) / 12));
      const shx = shakeK * Math.sin(frame * 2.7) * 5;
      for (let i = 0; i < N; i++) {
        const p = P[i];
        // 散射位置
        let x = A.x + Math.cos(p.ang) * p.sp * reT;
        let y = A.y + Math.sin(p.ang) * p.sp * reT;
        // 被兴趣图标牵走
        if (pullK > 0) {
          const ic = icons[p.icon];
          const wob = Math.sin(frame * 0.09 + i) * 14;
          x = lerp(x, ic.x + wob, pullK * 0.85);
          y = lerp(y, ic.y + Math.cos(frame * 0.07 + i) * 10, pullK * 0.85);
        }
        // 堆到台面上
        if (pileK > 0) {
          x = lerp(x, p.px, pileK);
          y = lerp(y, p.py, pileK);
        }
        const inPile = pileK > 0.9 && p.py > 640;
        const col = inPile && heatK > 0 ? lerpRgb(cCyan, cAlert, heatK * (0.4 + (i % 5) / 8)) : cCyan;
        const alpha = resetOut * dim * (0.75 - (frame < resetAt ? 0 : 0));
        ctx.beginPath();
        ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${(alpha * 0.8).toFixed(3)})`;
        ctx.arc(x + shx * (inPile ? 1 : 0), y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // 台面线
      ctx.strokeStyle = `rgba(255,255,255,${0.3 * dim})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(140 + shx, 724); ctx.lineTo(880 + shx, 724); ctx.stroke();
    });
    return <canvas ref={ref} width={1920} height={1080} style={{position: 'absolute', inset: 0}} />;
  };

export const S09: React.FC = () => {
  const frame = useCurrentFrame();
  const KB = useBeats('S09');
  const b01 = KB['01'], b02 = KB['02'], b03 = KB['03'], b04 = KB['04'], b05 = KB['05'], b06 = KB['06'],
    b07 = KB['07'], b08 = KB['08'], b09 = KB['09'], b10 = KB['10'];

  const START = b01.at - 16, END = b10.end + 40;
  

  const splitK = clamp01((frame - b01.a.split) / 16);
  const blurK = clamp01((frame - b02.a.blur) / 14);
  const flipK = clamp01((frame - b06.a.flip) / 10);
  const leftDim = (1 - flipK * 0.6) * (1 - clamp01((frame - b09.a.push) / 24)); // #06 压 40%，#09 全暗
  const rightK = flipK;

  // 右屏
  const pinK = clamp01((frame - b07.a.pin) / 12);
  const fanK = clamp01((frame - b07.a.fan) / 22);
  const settleK = clamp01((frame - b07.a.settle) / 26);
  const targetK = clamp01((frame - b08.a.target) / 12);
  const scanK = clamp01((frame - b08.a.scan) / 30);
  const resK = clamp01((frame - b08.a.resonate) / 16);
  const resultK = clamp01((frame - b08.a.result) / 12);
  // #09 下推
  const pushK = clamp01((frame - b09.a.push) / 30);
  const cam = pushK * 240;
  // #10 坍缩金句
  const goldAt = b10.a.gold;
  const collapseAt = b10.a.collapse;
  const dimK = clamp01((frame - goldAt) / 14) * 0.75;
  const convergeK = clamp01((frame - goldAt - 8) / (collapseAt - goldAt - 8));
  const hitK = clamp01((frame - collapseAt) / 3);
  const shake = hitK * (1 - clamp01((frame - collapseAt - 3) / 10));
  const shx = shake * Math.sin(frame * 3.1) * 3, shy = shake * Math.cos(frame * 2.3) * 3;
  const goldReveal = clamp01((frame - collapseAt) / 10);
  const goldSweep = clamp01((frame - collapseAt + 8) / MOTION.dur.goldSweep);

  const yearTicks = useMemo(() => Array.from({length: 11}, (_, i) => ({
    x: 260 + i * 140, label: `${2016 + i}`, dots: 1 + Math.floor(random(`s09-yd-${i}`) * 3),
  })), []);

  const RA = {x: 1120, y: 560}, RB = {x: 1700, y: 560};

  if (frame < START || frame > END) return null;
const fadeIn = clamp01((frame - START) / 10);

  return (
    <AbsoluteFill style={{opacity: fadeIn}}>
      <Background />
      <div style={{position: 'absolute', inset: 0, transform: `translate(${shx.toFixed(1)}px, ${(-cam + shy).toFixed(1)}px)`}}>
        {/* 分屏竖线 + 标题 */}
        {splitK > 0 && cam < 1 && (
          <>
            <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
              <line x1={MID} y1={120} x2={MID} y2={980} stroke={rgba(COLOR.white, 0.35)} strokeWidth={1.2}
                pathLength={1} strokeDasharray={1} strokeDashoffset={1 - splitK} />
            </svg>
            <Annotation x={520} y={180} align="center" opacity={splitK * leftDim}
              style={{fontFamily: FONT.serif, fontWeight: 900, fontSize: 48}}>新手</Annotation>
            <Annotation x={1400} y={180} align="center" opacity={splitK * Math.max(rightK, 0.25)}
              style={{fontFamily: FONT.serif, fontWeight: 900, fontSize: 48}}>高手</Annotation>
          </>
        )}

        {/* ===== 左屏 ===== */}
        {leftDim > 0.01 && cam < 1 && (
          <div style={{position: 'absolute', inset: 0, opacity: leftDim}}>
            {/* 模糊终点光斑 */}
            {blurK > 0 && (
              <div style={{
                position: 'absolute', left: 740 - 46 + Math.sin(frame * 0.05) * 26, top: 560 - 46 + Math.cos(frame * 0.04) * 18,
                width: 92, height: 92, borderRadius: '50%',
                background: `radial-gradient(circle, ${rgba(cAmber, 0.7)}, transparent 70%)`,
                filter: `blur(${10 + Math.sin(frame * 0.08) * 4}px)`, opacity: blurK,
              }} />
            )}
            {/* 兴趣图标 */}
            {[['📷', 520, 400], ['🎸', 640, 690], ['📖', 420, 780]].map(([e, x, y], i) => (
              <Annotation key={i} x={x as number} y={y as number} align="center"
                opacity={clamp01((frame - b03.a.pull) / 16) * 0.85} style={{fontSize: 34}}>{e}</Annotation>
            ))}
            <LeftChaos frame={frame} scatterAt={b03.a.scatter} pullAt={b03.a.pull} resetAt={b04.a.reset}
              pileAt={b05.a.pile} heatAt={b05.a.heat} shakeAt={b05.a.shake} dim={1} />
            {/* 起点 */}
            <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
              <circle cx={260} cy={560} r={7} fill={COLOR.core} opacity={0.9}
                style={{filter: `drop-shadow(0 0 10px ${rgba(cCyan, 0.6)})`}} />
            </svg>
            {/* #04 问号 */}
            {clamp01((frame - b04.a.reset) / 8) > 0 && (
              <Annotation x={740} y={430} align="center" color={COLOR.amber}
                opacity={clamp01((frame - b04.a.reset) / 8) * (1 - clamp01((frame - b05.a.pile) / 14))}
                style={{fontFamily: FONT.serif, fontWeight: 900, fontSize: 72}}>?</Annotation>
            )}
          </div>
        )}

        {/* ===== 右屏 ===== */}
        {rightK > 0 && (
          <div style={{position: 'absolute', inset: 0, opacity: rightK}}>
            <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
              {/* 图钉 */}
              {pinK > 0 && (
                <g opacity={pinK}>
                  <path d={`M ${RA.x} ${RA.y - 26} L ${RA.x - 8} ${RA.y - 42} L ${RA.x + 8} ${RA.y - 42} Z`} fill={rgba(cAmber, 0.9)} />
                  <path d={`M ${RB.x} ${RB.y - 26} L ${RB.x - 8} ${RB.y - 42} L ${RB.x + 8} ${RB.y - 42} Z`} fill={rgba(cAmber, 0.9)} />
                </g>
              )}
              {/* 扇形子波 */}
              {fanK > 0 && (
                <g opacity={fanK * (1 - settleK * 0.85)}>
                  {Array.from({length: 8}, (_, i) => {
                    const bend = (i - 3.5) * 26;
                    const k = clamp01(fanK * 8 - i);
                    return <path key={i} d={`M ${RA.x} ${RA.y} Q ${(RA.x + RB.x) / 2} ${RA.y + bend} ${RB.x} ${RB.y}`}
                      fill="none" stroke={rgba(cCyan, 0.6)} strokeWidth={1.4}
                      pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />;
                  })}
                </g>
              )}
              {/* 沉淀到档案层 */}
              {settleK > 0 && (
                <g opacity={settleK}>
                  {Array.from({length: 8}, (_, i) => {
                    const k = clamp01(settleK * 8 - i);
                    const y = lerp(RA.y + (i - 3.5) * 26, 800 + i * 22, k);
                    return <line key={i} x1={RA.x + 60} y1={y} x2={RB.x - 60} y2={y}
                      stroke={rgba(cCyan, 0.4)} strokeWidth={1.6} opacity={k} />;
                  })}
                </g>
              )}
              {/* 扫描线 */}
              {scanK > 0 && scanK < 1 && (
                <rect x={lerp(RA.x + 40, RB.x - 40, scanK)} y={760} width={3} height={220}
                  fill={rgba(cCyan, 0.9)} style={{filter: `drop-shadow(0 0 14px ${rgba(cCyan, 0.6)})`}} />
              )}
              {/* 3 张卡片升起共振 */}
              {resK > 0 && (
                <g opacity={resK * (1 - resultK * 0.9)}>
                  {[0, 1, 2].map((i) => {
                    const y = lerp(830 + i * 22, 640, resK);
                    return <rect key={i} x={1260 + i * 110} y={y} width={64} height={40}
                      fill={rgba(cCyan, 0.75)} style={{filter: `drop-shadow(0 0 12px ${rgba(cCyan, 0.5)})`}} />;
                  })}
                </g>
              )}
              {/* 结果光束 */}
              {resultK > 0 && (
                <rect x={RA.x} y={RA.y - 6} width={(RB.x - RA.x) * resultK} height={12}
                  fill={rgba(cAmber, 0.95)} style={{filter: `drop-shadow(0 0 18px ${rgba(cAmber, 0.7)})`}} />
              )}
              {/* #09 右屏下方大档案库（推镜露出） */}
              {pushK > 0 && (
                <g opacity={pushK}>
                  {Array.from({length: 40}, (_, i) => {
                    const col = i % 8, row = Math.floor(i / 8);
                    return <rect key={i} x={1010 + col * 110} y={1010 + row * 90} width={88} height={56}
                      fill="none" stroke={rgba(cCyan, 0.3)} strokeWidth={1} />;
                  })}
                </g>
              )}
            </svg>
            <div style={{opacity: targetK}}><TargetMark x={RB.x} y={RB.y} lit={targetK} /></div>
          </div>
        )}
      </div>

      {/* ===== #10 坍缩金句（全屏） ===== */}
      {dimK > 0 && <AbsoluteFill style={{backgroundColor: COLOR.ink, opacity: dimK}} />}
      {frame >= goldAt - 4 && (
        <AbsoluteFill style={{transform: `translate(${shx.toFixed(1)}px, ${shy.toFixed(1)}px)`}}>
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
            {/* 10 年刻度线 */}
            <line x1={220} y1={880} x2={1700} y2={880} stroke={rgba(COLOR.white, 0.3)} strokeWidth={1.2} opacity={1 - convergeK * 0.7} />
            {yearTicks.map((t, i) => (
              <g key={i} opacity={1 - convergeK * 0.7}>
                <line x1={t.x} y1={872} x2={t.x} y2={888} stroke={rgba(COLOR.white, 0.4)} strokeWidth={1} />
              </g>
            ))}
            {/* 光点涌向中心 */}
            {yearTicks.map((t, i) => Array.from({length: t.dots}, (_, j) => {
              const x0 = t.x + (j - 1) * 12, y0 = 850 - j * 20;
              const x = lerp(x0, MID, convergeK), y = lerp(y0, 540, convergeK);
              return <circle key={`${i}-${j}`} cx={x} cy={y} r={2.6} fill={rgba(cAmber, 0.9)} opacity={1 - convergeK * 0.4} />;
            }))}
            {/* 坍缩亮点（辉光 1.5 倍） */}
            {hitK > 0 && (
              <circle cx={MID} cy={540} r={8 + hitK * 6} fill={COLOR.core}
                style={{filter: `drop-shadow(0 0 ${22 * (1 + hitK * 0.5)}px ${COLOR.amber}) drop-shadow(0 0 60px ${rgba(cAmber, 0.6)})`}} />
            )}
          </svg>
          {hitK > 0 && (
            <GoldLine lines={['一眼命中', '是长年积累的一次快速坍缩']} top={280} sweep={goldSweep} reveal={goldReveal} />
          )}
        </AbsoluteFill>
      )}

      <ChapterLabel no="05" title="一眼命中" />
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

// 全片 cue 访问层：cues.json 的帧号是人声时间轴（voice 0 起）
// 正片片头有 2s 无声片名卡，人声整体后移 OFFSET 帧
import data from './cues.json';

export const OFFSET = 60;

export type Sub = {t: string; s: number; e: number};
export type Beat = {at: number; end: number; subs: Sub[]; a: Record<string, number>};

type RawBeat = {at: number; end: number; subs: Sub[]; a: Record<string, number>};

const shiftBeat = (b: RawBeat): Beat => ({
  at: b.at + OFFSET,
  end: b.end + OFFSET,
  subs: b.subs.map((s) => ({t: s.t, s: s.s + OFFSET, e: s.e + OFFSET})),
  a: Object.fromEntries(Object.entries(b.a).map(([k, v]) => [k, v + OFFSET])),
});

// 取一个场景的全部拍：B['11'].a.spread 这样用
export const useBeats = (scene: string): Record<string, Beat> => {
  const raw = (data.scenes as unknown as Record<string, {beats: Record<string, RawBeat>}>)[scene].beats;
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => {
    const b = shiftBeat(v);
    return [k, {...b, a: snapActions(b.a)}]; // 动作帧卡拍（抢跑≤6 / 拖拍≤10）
  }));
};

export const sceneRange = (scene: string): {start: number; end: number} => {
  const d = data.scenes as unknown as Record<string, {paraStart: number; paraEnd: number}>;
  return {start: d[scene].paraStart + OFFSET, end: d[scene].paraEnd + OFFSET};
};

// 全片字幕（人声轴 +OFFSET）。S01 段字幕由 S01 组件自己渲染，这里剔除
export const SUBTITLES: Sub[] = (data.subtitles as Sub[])
  .map((s) => ({t: s.t, s: s.s + OFFSET, e: s.e + OFFSET}))
  .filter((s) => s.s >= 930 + OFFSET - 30);

// 金句窗口：这些时间段内不显示普通字幕（金句组件接管）
export const GOLD_WINDOWS: [number, number][] = [];
for (const sc of Object.values(data.scenes as unknown as Record<string, {beats?: Record<string, RawBeat>}>)) {
  if (!sc.beats) continue;
  for (const b of Object.values(sc.beats)) {
    if (b.a.gold !== undefined) {
      GOLD_WINDOWS.push([b.at + OFFSET - 6, b.end + OFFSET + 50]);
    }
  }
}

// ===== 音乐节拍卡拍（beats.json 由 tools/beats.py 生成，正片轴） =====
import beatData from './beats.json';

type BeatPt = {f: number; strong: boolean; seg: string};
const BEATS = (beatData as {beats: BeatPt[]}).beats;

/**
 * snap：把动作帧吸附到最近的音乐拍点。
 * 抢跑（拍在动作前）≤ 6 帧、拖拍（拍在动作后）≤ 10 帧才吸附，否则保持原帧。
 * strongOnly 时只吸附强拍（金句 / 转场 / 重击用）。
 */
export const snap = (frame: number, strongOnly = false): number => {
  let best = frame, bestDist = Infinity;
  for (const b of BEATS) {
    if (strongOnly && !b.strong) continue;
    const d = b.f - frame; // d<0 拍在前（抢跑），d>0 拍在后（拖拍）
    if (d >= -6 && d <= 10 && Math.abs(d) < bestDist) { best = b.f; bestDist = Math.abs(d); }
    if (b.f - frame > 10) break;
  }
  return best;
};

/** 对一整组触发帧做卡拍：gold、hit、collapse、flip、split、pin 走强拍，其余走普通拍 */
export const snapActions = <T extends Record<string, number>>(a: T): T =>
  Object.fromEntries(Object.entries(a).map(([k, v]) => [
    k, snap(v, /gold|hit|collapse|flip|split|pin|beam|impact/.test(k)),
  ])) as T;

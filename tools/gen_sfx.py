#!/usr/bin/env python3
"""程序化合成全片音效床 sfx.wav（正片轴，44.1kHz 立体声）
- 全部音色用 numpy 合成（正弦+泛音+包络+噪声），无外部采样，即天然 CC0
- 触发帧 = cues.json 动作帧 +OFFSET，并按 beats.json 做与画面一致的 snap
- S09 左右分屏音效按脚本偏左/右声道 30%
输出：video/public/sfx.wav + assets/sfx-manifest.txt
"""
import json, re
import numpy as np
import wave, struct, os

ROOT = '/Users/wtcl/Desktop/Code/kimiii/VideoMaker/guang'
SR = 44100
FPS = 30
OFF = 60
FILM_END = 14360
N = int((FILM_END / FPS + 1) * SR)

cues = json.load(open(f'{ROOT}/video/src/cues.json'))
beats = json.load(open(f'{ROOT}/video/src/beats.json'))['beats']

def snap(frame, strong=False):
    best, bd = frame, 1e9
    for b in beats:
        if strong and not b['strong']:
            continue
        d = b['f'] - frame
        if -6 <= d <= 10 and abs(d) < bd:
            best, bd = b['f'], abs(d)
        if b['f'] - frame > 10:
            break
    return best

# ---------- 基础合成 ----------
def env_exp(n, decay, attack=0.004):
    t = np.arange(n) / SR
    a = np.minimum(1, t / attack)
    return a * np.exp(-t / decay)

def sine_note(freq, dur, decay, harmonics=(1, 0.5, 0.25), gain=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for i, h in enumerate(harmonics):
        sig += h * np.sin(2 * np.pi * freq * (i + 1) * t)
    return gain * sig * env_exp(n, decay)

def noise(n, low=0, high=SR // 2, decay=0.3, attack=0.005, gain=1.0, reverse=False):
    """带通噪声"""
    x = np.random.randn(n)
    X = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(n, 1 / SR)
    X[(freqs < low) | (freqs > high)] = 0
    y = np.fft.irfft(X, n)
    y /= (np.abs(y).max() + 1e-9)
    e = env_exp(n, decay, attack)
    if reverse:
        e = e[::-1]
    return gain * y * e

# ---------- 音色库 ----------
def tone(freq):  # 按段落调性取音
    return freq

def celesta(f=1568, dur=1.0, gain=0.5):
    return sine_note(f, dur, 0.35, (1, 0.6, 0.3, 0.12), gain)

def kalimba(f=784, dur=0.7, gain=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    sig = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t) + 0.1 * np.sin(2 * np.pi * f * 4.2 * t)
    return gain * sig * env_exp(n, 0.22)

def woodblock(f=950, dur=0.12, gain=0.55):
    n = int(dur * SR); t = np.arange(n) / SR
    sig = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.02)
    return gain * (sig + 0.5 * noise(n, 1200, 5000, 0.015, gain=1))

def tubular_bell(f=660, dur=2.2, gain=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    partials = [(1, 1), (2.76, 0.55), (5.4, 0.25), (8.9, 0.1)]
    sig = np.zeros(n)
    for p, g in partials:
        sig += g * np.sin(2 * np.pi * f * p * t)
    return gain * sig * env_exp(n, 0.9, 0.002)

def bowl_chord(f=392, dur=3.0, gain=0.42):
    n = int(dur * SR); t = np.arange(n) / SR
    sig = np.zeros(n)
    for m in (1, 1.5, 2.0):  # 根音+五度+八度
        for p, g in [(1, 1), (2.7, 0.3), (5.1, 0.12)]:
            sig += g * np.sin(2 * np.pi * f * m * p * t)
    atk = np.minimum(1, t / 0.25)
    return gain * sig * atk * np.exp(-t / 1.4) * 0.33

def harp_gliss(root=523, dur=1.0, gain=0.4, reverse=False):
    scale = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4, 5 / 2]
    if reverse:
        scale = scale[::-1]
    out = np.zeros(int((dur + 0.6) * SR))
    step = dur / len(scale)
    for i, r in enumerate(scale):
        note = sine_note(root * r, 0.8, 0.3, (1, 0.35), gain)
        s = int(i * step * SR)
        e = min(len(out), s + len(note))
        out[s:e] += note[:e - s]
    return out

def whoosh(dur=0.7, gain=0.5, up=True):
    n = int(dur * SR)
    x = np.random.randn(n)
    X = np.fft.rfft(x); freqs = np.fft.rfftfreq(n, 1 / SR)
    t = np.arange(n) / n
    center = 300 + (4000 - 300) * t if up else 4000 - (4000 - 300) * t
    out = np.zeros(n)
    B = 8
    for b in range(B):
        band = np.zeros(n)
        idx = int(b * n / B), int((b + 1) * n / B)
        seg = np.fft.rfft(x[idx[0]:idx[1]])
        fr = np.fft.rfftfreq(idx[1] - idx[0], 1 / SR)
        c = center[idx[0]]
        seg[(fr < c * 0.5) | (fr > c * 2)] = 0
        band[idx[0]:idx[1]] = np.fft.irfft(seg, idx[1] - idx[0])
        out += band
    out /= (np.abs(out).max() + 1e-9)
    e = np.sin(np.pi * t) ** 1.5
    return gain * out * e

def shimmer(dur=1.6, gain=0.35):
    n = int(dur * SR); t = np.arange(n) / SR
    sig = np.zeros(n)
    for f in (5200, 6300, 7400, 8900):
        sig += 0.25 * np.sin(2 * np.pi * f * t + f) * (0.6 + 0.4 * np.sin(2 * np.pi * 6 * t + f))
    atk = np.minimum(1, t / 0.3)
    return gain * sig * atk * np.exp(-t / 0.8)

def typing(dur=0.5, gain=0.4):
    n = int(dur * SR)
    out = np.zeros(n)
    for s in range(0, n - 800, int(0.07 * SR)):
        click = noise(800, 1800, 6000, 0.006, gain=1)
        out[s:s + 800] += click
    return gain * out

def reverse_breath(dur=0.8, gain=0.45):
    n = int(dur * SR)
    return noise(n, 400, 4500, 0.4, gain=gain, reverse=True)

def piano_muted(f=330, dur=0.8, gain=0.45):
    n = int(dur * SR); t = np.arange(n) / SR
    sig = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2 * t) + 0.08 * np.sin(2 * np.pi * f * 3 * t)
    # 低通（闷）
    X = np.fft.rfft(sig); fr = np.fft.rfftfreq(n, 1 / SR)
    X[fr > 1800] *= 0.15
    return gain * np.fft.irfft(X, n) * env_exp(n, 0.28)

def marimba_paper(f=523, dur=0.5, gain=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    sig = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t / 0.03)
    paper = noise(n, 2500, 9000, 0.05, gain=0.35)
    return gain * (sig * env_exp(n, 0.16) + paper)

def water_glass(f=1200, dur=1.2, gain=0.4):
    n = int(dur * SR); t = np.arange(n) / SR
    vib = 1 + 0.008 * np.sin(2 * np.pi * 5.5 * t)
    sig = np.sin(2 * np.pi * f * vib * t) + 0.35 * np.sin(2 * np.pi * f * 2.5 * t)
    return gain * sig * env_exp(n, 0.5, 0.05)

def impact_collapse(dur=2.0, gain=0.9):
    n = int(dur * SR); t = np.arange(n) / SR
    drop = np.sin(2 * np.pi * (150 * np.exp(-t / 0.25) + 38) * t)
    crash = noise(n, 200, 8000, 0.5, gain=0.8)
    sub = np.sin(2 * np.pi * 45 * t) * np.exp(-t / 0.5)
    atk = np.minimum(1, t / 0.004)
    return gain * (0.9 * drop * atk * np.exp(-t / 0.6) + crash + 0.8 * sub * atk)

def synth_arp(root=440, dur=0.9, gain=0.4):
    notes = [1, 5 / 4, 3 / 2, 2]
    out = np.zeros(int((dur + 0.3) * SR))
    for i, r in enumerate(notes):
        n = int(0.35 * SR); t = np.arange(n) / SR
        f = root * r
        sig = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 3 * t)
        note = sig * env_exp(n, 0.1)
        s = int(i * 0.16 * SR)
        out[s:s + n] += note
    return gain * out

def box_close(dur=0.3, gain=0.5):
    n = int(dur * SR)
    thud = sine_note(140, dur, 0.06, (1, 0.4), gain)
    return thud + 0.4 * noise(n, 300, 3000, 0.04, gain=gain)

SFX = {
    'celesta': celesta, 'kalimba': kalimba, 'woodblock': woodblock,
    'tubular_bell': tubular_bell, 'bowl_chord': bowl_chord,
    'harp_gliss': harp_gliss, 'whoosh': whoosh, 'shimmer': shimmer,
    'typing': typing, 'reverse_breath': reverse_breath, 'piano_muted': piano_muted,
    'marimba_paper': marimba_paper, 'water_glass': water_glass,
    'impact_collapse': impact_collapse, 'synth_arp': synth_arp, 'box_close': box_close,
}

# ---------- 触发规则（键名正则 → 音效），按顺序首个命中 ----------
RULES = [
    (r'impact|collapse', [('impact_collapse', 1.0), ('shimmer', 0.8)]),
    (r'gold2?$', [('shimmer', 1.0), ('bowl_chord', 1.0)]),
    (r'gold$', [('shimmer', 1.0), ('bowl_chord', 1.0)]),
    (r'^g[123]$', [('tubular_bell', 1.0)]),
    (r'flash|resonate|^fit$|sync|merge', [('bowl_chord', 0.9)]),
    (r'fan|spread|burst|wavelets|gliss', [('harp_gliss', 0.9)]),
    (r'cancel|flatten|prune|fade|reset|gone|noplan', [('reverse_breath', 0.9)]),
    (r'stars', [('whoosh', 0.7), ('celesta', 1.0)]),
    (r'hint|dot|glint|blink|arrive', [('celesta', 0.9)]),
    (r'typing|counter|digits', [('typing', 0.9)]),
    (r'n[1-6]|b[1-3]|w[1-3]|l[1-4]|stamp|label|node', [('woodblock', 0.85)]),
    (r'icons|layers|curve|skill|job|occupy|hobby', [('kalimba', 0.9)]),
    (r'morph', [('water_glass', 0.9)]),
    (r'scissors|heat|pile|spot|crumple', [('piano_muted', 0.85)]),
    (r'agent|branch', [('synth_arp', 0.9)]),
    (r'box|archive|cards|paper|embed|lift|crumple2|occupy2', [('marimba_paper', 0.9)]),
    (r'pin|lock|target|premise|newtarget', [('tubular_bell', 0.85)]),
    (r'cut|dive|push|sink|zoom|rise|replay|drop|sink2', [('whoosh', 0.8)]),
    (r'wall|shake|hit2', [('woodblock', 0.9)]),
    (r'flip', [('tubular_bell', 1.0)]),
    (r'result|beam|line|shine', [('tubular_bell', 0.8)]),
    (r'unpin|chaos', [('piano_muted', 0.8)]),
    (r'scan', [('whoosh', 0.6)]),
    (r'desk|order|pass|catch', [('marimba_paper', 0.7)]),
    (r'rail|gauge|crawl|twist|boxes|slots|frame', [('woodblock', 0.65)]),
    (r'base|risk|human', [('tubular_bell', 0.6)]),
    (r'grind|iter|flower|grow|stack|side|modeA|modeB', [('kalimba', 0.7)]),
    (r'bulb', [('celesta', 0.9)]),
    (r'sleep|thin', [('piano_muted', 0.7)]),
]

# S09 分屏声像：左屏 -0.3，右屏 +0.3
S09_LEFT = {'blur', 'scatter', 'pull', 'reset', 'pile', 'heat', 'shake'}
S09_RIGHT = {'pin', 'fan', 'settle', 'target', 'scan', 'resonate', 'result'}

events = []  # (frame, sound, gain, pan)

# S01 手工点缀：19–21s 灰烬火星 celesta 双音（+片名收缩 whoosh）
events += [(70, 'whoosh', 0.5, 0), (645, 'celesta', 0.8, 0), (668, 'celesta', 0.8, 0)]

for sc, sdata in cues['scenes'].items():
    bts = sdata.get('beats')
    if not bts:
        continue
    for bk, b in bts.items():
        for ak, av in b['a'].items():
            for pat, hits in RULES:
                if re.search(pat, ak):
                    strong = bool(re.search(r'gold|hit|collapse|flip|split|pin|beam|impact', ak))
                    f = snap(av + OFF, strong)
                    pan = 0
                    if sc == 'S09':
                        pan = -0.3 if ak in S09_LEFT else (0.3 if ak in S09_RIGHT else 0)
                    for name, g in hits:
                        events.append((f, name, g, pan))
                    break

# ---------- 渲染 ----------
buf = np.zeros((N, 2))
manifest = []
for f, name, g, pan in events:
    fn = SFX[name]
    sig = fn() if name not in ('harp_gliss',) else fn(reverse=('reverse' in name))
    sig = sig * g
    start = int(f / FPS * SR)
    end = min(N, start + len(sig))
    if start >= N:
        continue
    seg = sig[:end - start]
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    buf[start:end, 0] += seg * l
    buf[start:end, 1] += seg * r
    manifest.append((f, name, round(g, 2), pan))

# 防削波
peak = np.abs(buf).max()
if peak > 0.95:
    buf *= 0.95 / peak

os.makedirs(f'{ROOT}/video/public', exist_ok=True)
with wave.open(f'{ROOT}/video/public/sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    data = (buf * 32767).astype(np.int16)
    w.writeframes(data.tobytes())

with open(f'{ROOT}/assets/sfx-manifest.txt', 'w') as fp:
    fp.write('# SFX 事件清单（全部 numpy 程序化合成，无外部采样，等同 CC0）\n')
    for m in manifest:
        fp.write(f'{m[0]}\t{m[1]}\t{m[2]}\tpan={m[3]}\n')
print('sfx events:', len(manifest), 'peak:', round(float(np.abs(buf).max()), 3))

#!/usr/bin/env python3
"""节拍检测：Signal to Noise / Hymn 用 beat_track，Ephemera 用 onset_detect（打击感弱）
输出 video/src/beats.json：正片轴帧号 + strong 标记（每 4 拍一个强拍）"""
import json
import librosa
import numpy as np

ROOT = '/Users/wtcl/Desktop/Code/kimiii/VideoMaker/guang'
M = f'{ROOT}/assets/music'
FPS = 30
X1, X2, XF = 122.8, 269.6, 2.5
SEGS = [
    ('sb_signaltonoise.mp3', 0, X1 + XF / 2, 0, 'beat'),
    ('sb_ephemera.mp3', 0, (X2 + XF / 2) - (X1 - XF / 2), X1 - XF / 2, 'onset'),
    ('HymnToTheDawn.mp3', 0, 14360 / 30 - (X2 - XF / 2), X2 - XF / 2, 'beat'),
]

all_beats = []
for fname, start, dur, offset, mode in SEGS:
    y, sr = librosa.load(f'{M}/{fname}', sr=22050, offset=start, duration=dur, mono=True)
    if mode == 'beat':
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time')
        tempo = float(np.atleast_1d(tempo)[0])
        # BPM 落在 120–180 时做减半核验：若相邻拍间隔过密（视觉卡拍用），减半
        if 120 <= tempo <= 180:
            print(f'{fname}: tempo {tempo:.1f} in 120-180, 采用半速 {tempo/2:.1f}')
            beats = beats[::2]
            tempo /= 2
        else:
            print(f'{fname}: tempo {tempo:.1f}')
    else:
        onsets = librosa.onset.onset_detect(y=y, sr=sr, units='time', backtrack=True,
                                            pre_max=30, post_max=30, pre_avg=60, post_avg=60,
                                            delta=0.35, wait=30)
        # Ephemera 太稀就放宽
        if len(onsets) < dur / 4:
            onsets = librosa.onset.onset_detect(y=y, sr=sr, units='time', backtrack=True, delta=0.2, wait=20)
        beats = onsets
        tempo = None
        print(f'{fname}: onset 模式，{len(beats)} 个点')
    for i, t in enumerate(beats):
        all_beats.append({'f': round((offset + float(t)) * FPS), 'strong': i % 4 == 0,
                          'seg': fname.split('.')[0]})

all_beats.sort(key=lambda b: b['f'])
out = {'fps': FPS, 'beats': all_beats}
with open(f'{ROOT}/video/src/beats.json', 'w') as fp:
    json.dump(out, fp)
print('beats:', len(all_beats), 'strong:', sum(1 for b in all_beats if b['strong']))

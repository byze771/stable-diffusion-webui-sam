#!/usr/bin/env python3
"""拼接三首配乐为整条 music.wav（正片轴，含 2.5s 换曲 crossfade 与片尾淡出）"""
import subprocess, os

FF = '/Users/wtcl/.local/share/localtools/bin/ffmpeg'
ROOT = '/Users/wtcl/Desktop/Code/kimiii/VideoMaker/guang'
M = f'{ROOT}/assets/music'
OUT = f'{ROOT}/video/public/music.wav'

X1, X2 = 122.8, 269.6   # 换曲中点（秒，正片轴）
XF = 2.5                # crossfade 时长
END = 14360 / 30        # 478.67s

seg1_end = X1 + XF / 2            # 124.05
seg2_start = X1 - XF / 2          # 121.55
seg2_end = X2 + XF / 2            # 270.85
seg3_start = X2 - XF / 2          # 268.35
seg2_len = seg2_end - seg2_start  # 149.3
seg3_len = END - seg3_start       # ~210.3

cmd = [
    FF, '-y', '-loglevel', 'error',
    '-i', f'{M}/sb_signaltonoise.mp3',
    '-i', f'{M}/sb_ephemera.mp3',
    '-i', f'{M}/HymnToTheDawn.mp3',
    '-filter_complex',
    f'[0:a]atrim=0:{seg1_end},asetpts=PTS-STARTPTS[s1];'
    f'[1:a]atrim=0:{seg2_len},asetpts=PTS-STARTPTS[s2];'
    f'[2:a]atrim=0:{seg3_len},asetpts=PTS-STARTPTS[s3];'
    f'[s1][s2]acrossfade=d={XF}:c1=tri:c2=tri[m1];'
    f'[m1][s3]acrossfade=d={XF}:c1=tri:c2=tri[m2];'
    f'[m2]afade=t=out:st={END - 3}:d=3[out]',
    '-map', '[out]', '-ar', '44100', '-ac', '2', '-c:a', 'pcm_s16le', OUT,
]
subprocess.run(cmd, check=True)
print('music.wav done:', os.path.getsize(OUT))

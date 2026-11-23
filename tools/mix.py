#!/usr/bin/env python3
"""最终混音导出：
- 视频轨直接 copy（已是 H.264 20Mbps）
- 音乐以人声为侧链做 ducking（sidechaincompress）
- 人声 + 音乐 + 音效混成一条，loudnorm 两遍到 -14 LUFS / 峰值 ≤ -1 dBTP
用法：python3 tools/mix.py [输入视频] [输出]
"""
import subprocess, json, re, sys, os

FF = '/Users/wtcl/Desktop/Code/kimiii/VideoMaker/guang/ffmpeg' if os.path.exists('/Users/wtcl/Desktop/Code/kimiii/VideoMaker/guang/ffmpeg') else '/Users/wtcl/.local/share/localtools/bin/ffmpeg'
ROOT = '/Users/wtcl/Desktop/Code/kimiii/VideoMaker/guang'
VID = sys.argv[1] if len(sys.argv) > 1 else f'{ROOT}/out/full-video.mp4'
OUT = sys.argv[2] if len(sys.argv) > 2 else f'{ROOT}/out/光路-full.mp4'
MUS = f'{ROOT}/video/public/music.wav'
SFX = f'{ROOT}/video/public/sfx.wav'

FILTER = (
    '[0:a]asplit=2[voice][sc];'
    '[1:a]volume=0.9[music];'
    '[music][sc]sidechaincompress=threshold=0.015:ratio=8:attack=12:release=420:makeup=1[mduck];'
    '[2:a]volume=0.85[sfx];'
    '[voice][mduck][sfx]amix=inputs=3:normalize=0'
)

def run(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, text=True, **kw)

# 第一遍：测量
p = run([FF, '-hide_banner', '-i', VID, '-i', MUS, '-i', SFX,
         '-filter_complex', FILTER + ',loudnorm=I=-14:TP=-1:LRA=11:print_format=json[mix]',
         '-map', '[mix]', '-f', 'null', '-'])
m = re.search(r'\{[^{}]*"input_i"[^{}]*\}', p.stderr)
meas = json.loads(m.group(0))
print('measured:', meas)

ln = (f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={meas['input_i']}:measured_TP={meas['input_tp']}"
      f":measured_LRA={meas['input_lra']}:measured_thresh={meas['input_thresh']}"
      f":offset={meas['target_offset']}:linear=true")

# 第二遍：应用 + 出片
run([FF, '-y', '-hide_banner', '-i', VID, '-i', MUS, '-i', SFX,
     '-filter_complex', FILTER + ',' + ln + ',alimiter=limit=0.94[mix]',
     '-map', '0:v', '-map', '[mix]',
     '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '44100',
     '-movflags', '+faststart', OUT])
print('done:', OUT, os.path.getsize(OUT))

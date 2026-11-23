#!/bin/bash
# 从最终成片切分 12 个场景单独视频（重编码保证帧精确）
set -e
FF=/Users/wtcl/.local/share/localtools/bin/ffmpeg
SRC=/Users/wtcl/Desktop/Code/kimiii/VideoMaker/guang/out/光路-full.mp4
DIR=/Users/wtcl/Desktop/Code/kimiii/VideoMaker/guang/out/scenes
mkdir -p "$DIR"

# 帧边界转秒（30fps）：S01 含片头从 0 起
cut() { # name startFrame endFrame
  local s=$(python3 -c "print($2/30)") e=$(python3 -c "print($3/30)")
  $FF -hide_banner -loglevel error -ss "$s" -to "$e" -i "$SRC" \
    -c:v libx264 -preset veryfast -crf 17 -pix_fmt yuv420p \
    -c:a aac -b:a 256k -movflags +faststart -y "$DIR/$1.mp4"
  echo "done $1 ($s-$e)"
}

cut "S01-冷开场" 0 1064
cut "S02-费马原理与费曼" 990 2659
cut "S03-关键前提" 2690 3099
cut "S04-从光到人" 3123 3673
cut "S05-直线模式" 3699 5197
cut "S06-探索模式" 5219 6787
cut "S07-沉睡的子波" 6811 8127
cut "S08-回到高手" 8102 9908
cut "S09-新手与高手" 9885 10896
cut "S10-存档被唤醒" 10872 12024
cut "S11-通用方法与AI" 11999 13343
cut "S12-三个动作与结尾" 13323 14360
echo ALL_DONE

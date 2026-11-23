#!/usr/bin/env python3
"""解析口播逐字时间 txt，输出前 N 秒的字幕切片（供样片使用）。

txt 行格式：段号 | 字 | 开始 | 结束 | 时长
切分规则（执行方案 1.2 的样片简化版）：优先按句末标点断，其次按词间停顿，条长 <=16 字。
样片阶段：分词边界用标点+停顿近似；正片阶段再换 jieba 分词。
"""
import json, sys, re

SRC = "/Users/wtcl/Desktop/Code/kimiii/VideoMaker/guang/口播音频和逐字时间/光路_口播_v3_克隆版_逐字时间.txt"

def parse_txt(path):
    chars = []
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        p = [x.strip() for x in line.split("|")]
        if len(p) >= 5:
            try:
                chars.append({"ch": p[1], "s": float(p[2]), "e": float(p[3])})
            except ValueError:
                pass
    return chars

END_PUNCT = "。？！"
MID_PUNCT = "，、；："
ALL_PUNCT = END_PUNCT + MID_PUNCT + "“”\"…"

def split_chars(chars, max_len=16, gap_th=0.25):
    """按标点和停顿把字流切成短字幕。样片近似版：不依赖 jieba。"""
    subs, cur = [], []

    def flush():
        if cur:
            subs.append(cur.copy())
            cur.clear()

    def text_len(seq):
        return len("".join(c["ch"] for c in seq if c["ch"] not in ALL_PUNCT))

    for c in chars:
        ch = c["ch"]
        if cur:
            gap = c["s"] - cur[-1]["e"]
            if gap >= gap_th and ch not in ALL_PUNCT:
                flush()
        if ch in END_PUNCT:
            cur.append(c)
            flush()
            continue
        if ch in MID_PUNCT:
            if text_len(cur) >= 4:
                flush()
            else:
                cur.append(c)
            continue
        if ch in ALL_PUNCT:
            cur.append(c)
            continue
        cur.append(c)
        if text_len(cur) > max_len:
            gaps = [(cur[k + 1]["s"] - cur[k]["e"], k) for k in range(len(cur) - 1)]
            _, k = max(gaps)
            subs.append(cur[: k + 1])
            cur[:] = cur[k + 1 :]
    flush()

    out = []
    for i, s in enumerate(subs, 1):
        txt = "".join(c["ch"] for c in s).rstrip("，。、；：")
        real = [c for c in s if c["ch"] not in ALL_PUNCT]
        if not real:
            continue
        out.append({
            "id": i,
            "text": txt,
            "start": real[0]["s"],
            "end": real[-1]["e"],
            "chars": [{"ch": c["ch"], "s": c["s"], "e": c["e"]} for c in real],
        })
    return out

if __name__ == "__main__":
    limit = float(sys.argv[1]) if len(sys.argv) > 1 else 16.0
    chars = parse_txt(SRC)
    print(f"总字数: {len(chars)}, 末字结束: {chars[-1]['e']:.2f}s", file=sys.stderr)
    subs = split_chars(chars)
    head = [s for s in subs if s["start"] < limit]
    for s in head:
        print(f'{s["id"]:3d}  {s["start"]:7.3f} → {s["end"]:7.3f}  {s["text"]}', file=sys.stderr)
    json.dump(head, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)

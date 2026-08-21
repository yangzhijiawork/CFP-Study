#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""经济法第二章《公司法律制度》习题纯享 PDF 文本解析脚本
输入：xiti_ch2.txt（pypdf 提取）
输出：_q_ch2.json（题目）/ _a_ch2.json（答案解析）
规则：逐行状态机，处理题干/选项跨行、跨页续行、题干+A选项同行混入
"""
import re, json, io, os

ROOT = "/Users/yzj/WorkBuddy/2026-08-06-07-25-28"
TEST = os.path.join(ROOT, "CFP-Study/jingjifaTest")
SRC = os.path.join(TEST, "xiti_ch2.txt")
OUT_Q = os.path.join(TEST, "_q_ch2.json")
OUT_A = os.path.join(TEST, "_a_ch2.json")

lines = io.open(SRC, encoding="utf-8").read().split("\n")

q_head = re.compile(r'^(\d+)\.【(单选题|多选题|判断题)】')
a_head = re.compile(r'^(\d+)\.【答案】([A-D√×]+)')
opt_re = re.compile(r'^([A-D])[.．、]')
page_sep = re.compile(r'^={5,}\s*第\d+页\s*={5,}')
header_re = re.compile(r'^第\s*[一二三四五六七八九十\d]+\s*章|^\d+\s*学\s*会\s*计|^学\s*会\s*计')

questions = {}
answers = {}
cur_n = None      # 当前题目编号
cur_a_n = None    # 当前答案编号
in_answer = False

def flush_q_buf():
    pass

for ln in lines:
    s = ln.strip()
    if not s:
        continue
    if page_sep.match(s) or header_re.match(s) or s == "参考答案":
        continue

    # ---- 题目头 ----
    m = q_head.match(s)
    if m:
        n = int(m.group(1))
        t = m.group(2)
        rest = s[m.end():].strip()
        questions[n] = {"type": t, "stem": "", "opts": []}
        cur_n = n
        in_answer = False
        # 检测题干与 A 选项同行混入（如“……（ ）。A.对仲裁……”）
        hit = None
        for marker in ("（ ）。A.", "（ ）A."):
            idx = rest.find(marker)
            if idx != -1:
                hit = (idx, marker)
                break
        if hit:
            idx, marker = hit
            questions[n]["stem"] = rest[:idx] + "（ ）"
            optA = rest[idx + len(marker):]
            if optA:
                questions[n]["opts"].append(["A", optA])
        else:
            questions[n]["stem"] = rest
        continue

    # ---- 答案头 ----
    m = a_head.match(s)
    if m:
        n = int(m.group(1))
        ans = m.group(2)
        answers[n] = {"ans": ans, "exp": ""}
        cur_a_n = n
        in_answer = True
        continue

    if in_answer:
        # 答案区正文（含【解析】或续行）
        if s.startswith("【解析】"):
            s = s[len("【解析】"):]
        elif s.startswith("【解析]"):  # 半角]容错
            s = s[len("【解析]"):]
        if cur_a_n is not None:
            answers[cur_a_n]["exp"] += ("" if not answers[cur_a_n]["exp"] else "\n") + s
        continue

    # ---- 题目区正文 ----
    if cur_n is None:
        continue
    m = opt_re.match(s)
    if m:
        # 新选项行
        questions[cur_n]["opts"].append([m.group(1), s[m.end():].strip()])
    else:
        # 续行：有选项则追加到最后一个选项，否则追加到题干
        qq = questions[cur_n]
        if qq["opts"]:
            qq["opts"][-1][1] += s
        else:
            qq["stem"] += s

# ---------- 校验 ----------
n_total = len(questions)
print("题目总数:", n_total, " 答案总数:", len(answers))
print("题型分布:", {t: sum(1 for q in questions.values() if q["type"] == t) for t in ("单选题", "多选题", "判断题")})

miss_q = [n for n in range(1, n_total + 1) if n not in questions]
miss_a = [n for n in range(1, n_total + 1) if n not in answers]
print("缺失题目:", miss_q or "无")
print("缺失答案:", miss_a or "无")

empty_stem = [n for n, q in questions.items() if not q["stem"]]
empty_opts = [n for n, q in questions.items() if q["type"] != "判断题" and not q["opts"]]
empty_exp = [n for n, a in answers.items() if not a["exp"]]
print("空题干:", empty_stem or "无")
print("非判断题空选项:", empty_opts or "无")
print("空解析:", empty_exp or "无")

bad_opt_n = [n for n, q in questions.items() if q["type"] != "判断题" and len(q["opts"]) < 2]
print("选项<2的非判断题:", bad_opt_n or "无")

# 判断答案类型检查
bad_ans = [n for n, a in answers.items() if a["ans"] not in ("A", "B", "C", "D", "AB", "AC", "AD", "BC", "BD", "CD", "ABC", "ABD", "ACD", "BCD", "ABCD", "√", "×")]
print("异常答案:", bad_ans or "无")

io.open(OUT_Q, "w", encoding="utf-8").write(json.dumps(questions, ensure_ascii=False, indent=1))
io.open(OUT_A, "w", encoding="utf-8").write(json.dumps(answers, ensure_ascii=False, indent=1))
print("写出:", OUT_Q, os.path.getsize(OUT_Q), "字节")
print("写出:", OUT_A, os.path.getsize(OUT_A), "字节")

# 抽样打印
for n in (1, 2, 60, 87, 100, 114):
    if n in questions:
        print("\n[题目", n, "]", questions[n]["type"], "|", questions[n]["stem"][:60])
        print("  选项数:", len(questions[n]["opts"]), "答案:", answers.get(n, {}).get("ans"))

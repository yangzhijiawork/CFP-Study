#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""经济法第一章《总论》互动习题 数据生成脚本
数据源：习题纯享 PDF（已解析为 _q.json/_a.json）+ learningSummary 第一章详解
产出：hudongxiti/jingjifa/ch1-jjf-data.js
"""
import io, json, re, os

ROOT = "/Users/yzj/WorkBuddy/2026-08-06-07-25-28"
TEST = os.path.join(ROOT, "jingjifaTest")
LS = os.path.join(ROOT, "CFP-Study/learningSummary/经济法/第一章-总论-全三单元详解.md")
OUT = os.path.join(ROOT, "hudongxiti/jingjifa/ch1-jjf-data.js")

q = json.load(open(os.path.join(TEST, "_q.json")))
a = json.load(open(os.path.join(TEST, "_a.json")))

# ---------- 修复题 87：题干与 A 选项同行混入 ----------
q87 = q["87"]
stem87 = q87["stem"]
idx = stem87.find("（ ）。A.")
if idx != -1:
    q87["stem"] = stem87[:idx] + "（ ）"
    q87["opts"].insert(0, ["A", stem87[idx + len("（ ）。A."):]])

# ---------- 题型映射 ----------
TMAP = {"单选题": "single", "多选题": "multi", "判断题": "judge"}

def esc(s):
    return json.dumps(s, ensure_ascii=False)

# ---------- 生成 Q 数组 ----------
lines = []
for n in range(1, 102):
    qq = q[str(n)]
    aa = a[str(n)]
    t = TMAP[qq["type"]]
    stem = qq["stem"]
    opts = qq["opts"]
    ans = aa["ans"]
    exp = aa["exp"]
    if t == "judge":
        opts = [["A", "正确"], ["B", "错误"]]
    o_str = ",".join('[%s,%s]' % (esc(l), esc(txt)) for l, txt in opts)
    line = ' {t:"%s",stem:%s,o:[%s],a:%s,e:%s}' % (t, esc(stem), o_str, esc(ans), esc(exp))
    lines.append(line)

Q_JS = "const Q = [\n" + ",\n".join(lines) + "\n];"

N = len(lines)
print("题数 N =", N)
assert N == 101

# ---------- 考点映射（题号 -> 考点名） ----------
kp_map = {}
for n in range(1, 3):   kp_map[n] = "民事行为能力"
for n in range(3, 7):   kp_map[n] = "民事法律行为概述"
for n in range(7, 17):  kp_map[n] = "民事法律行为效力"
for n in range(17, 21): kp_map[n] = "附条件与附期限"
for n in [21, 22, 23, 30]: kp_map[n] = "代理制度概述"
for n in range(24, 30): kp_map[n] = "特殊代理行为"
for n in range(31, 34): kp_map[n] = "代理关系终止"
for n in range(34, 71): kp_map[n] = "民事诉讼"
for n in range(71, 77): kp_map[n] = "行政复议"
for n in range(77, 81): kp_map[n] = "行政诉讼"
for n in range(81, 102): kp_map[n] = "仲裁"

kp_list = [kp_map[n] for n in range(1, 102)]
assert len(kp_list) == 101, len(kp_list)
# 校验考点集合
cats = sorted(set(kp_list))
print("考点集合（%d 个）:" % len(cats), cats)

KPOINTS_JS = "const KPOINTS=[%s];" % ",".join(esc(k) for k in kp_list)
FOR_JS = "Q.forEach((q,i)=>q.k=KPOINTS[i]);"

# ---------- RECOMMEND ----------
RECOMMEND = {
 "民事行为能力": "回看「第一单元·知识点2 民事行为能力」：自然人三档（8/18 岁分界）、“以上含本数、不满不含本数”、16 岁自立视为完全、法人能力随成立产生随终止消灭",
 "民事法律行为概述": "回看「第一单元·知识点3 民事法律行为概述」：界定（意思表示＋法律后果）、四种分类（单方/多方、有偿/无偿、要式/非要式、主/从）",
 "民事法律行为效力": "回看「第一单元·知识点4 民事法律行为效力」：有效要件、四种效力样态（无效/可撤销/效力待定）、无效五情形、撤销权时限（误解90日/胁迫终止1年/欺诈1年/兜底5年）",
 "附条件与附期限": "回看「第一单元·知识点5 附条件与附期限」：条件=是否发生不确定、期限=必然发生、条件五特征、恶意阻止视为成就",
 "代理制度概述": "回看「第二单元·知识点1 代理制度概述」：代理概念、委托/法定、三种不得代理（遗嘱/婚姻登记/收养）、非代理（传递信息/行纪/寄售）",
 "特殊代理行为": "回看「第二单元·知识点2 特殊代理行为」：滥用（自己/双方=效力待定、串通=无效连带）、无权（狭义=效力待定）、表见=有效、转委托",
 "代理关系终止": "回看「第二单元·知识点3 代理关系终止」：委托终止“疯没了”、法定多“有能力了”、被代理人死亡后 4 种仍有效情形",
 "民事诉讼": "回看「第三单元·知识点2 民事诉讼」：基本制度、专属管辖（不动产/港口/继承）、合同/票据/侵权管辖、诉讼时效三权与中止/中断",
 "行政复议": "回看「第三单元·知识点3 行政复议」：“找政府”管辖、受案范围、复议前置情形、申请60日、中止 vs 终止",
 "行政诉讼": "回看「第三单元·知识点4 行政诉讼」：受案范围（国家/抽象/内部/终裁/调解/指导等）、不动产专属管辖、起诉6个月、被告举证",
 "仲裁": "回看「第三单元·知识点5 仲裁」：一裁终局、仲裁协议书面+三项必备+独立性+无效情形、裁决先多数后首席、撤销3个月+中院",
}
REC_JS = "const RECOMMEND={\n" + ",\n".join(' %s:%s' % (esc(k), esc(v)) for k, v in RECOMMEND.items()) + "\n};"

# ---------- SUMMARY_SECTIONS（learningSummary 按单元切分） ----------
ls = io.open(LS, encoding="utf-8").read()

markers = [
    ("# 🧩 第一单元 民事法律行为", "民事行为能力"),
    ("## 📍 知识点 3：民事法律行为概述", "民事法律行为概述"),
    ("## 📍 知识点 4：民事法律行为效力", "民事法律行为效力"),
    ("## 📍 知识点 5：附条件与附期限的民事法律行为", "附条件与附期限"),
    ("# 🧩 第二单元 代理制度", "代理制度概述"),
    ("## 📍 知识点 2：特殊代理行为", "特殊代理行为"),
    ("## 📍 知识点 3：代理关系终止", "代理关系终止"),
    ("# 🧩 第三单元 经济纠纷解决途径", "民事诉讼"),
    ("## 📍 知识点 3：行政复议", "行政复议"),
    ("## 📍 知识点 4：行政诉讼", "行政诉讼"),
    ("## 📍 知识点 5：仲裁", "仲裁"),
    ("# 🎯 全章常考知识点速查表", "速查表"),
    ("# 📍 全章知识链闭环", "闭环"),
]

titles = {
 "思维导图": "〇 · 本章考情 + 整章思维导图（三单元全景）",
 "民事行为能力": "第一单元 · 知识点 1~2 法律关系与民事行为能力",
 "民事法律行为概述": "第一单元 · 知识点 3 民事法律行为概述",
 "民事法律行为效力": "第一单元 · 知识点 4 民事法律行为效力",
 "附条件与附期限": "第一单元 · 知识点 5 附条件与附期限",
 "代理制度概述": "第二单元 · 知识点 1 代理制度概述",
 "特殊代理行为": "第二单元 · 知识点 2 特殊代理行为",
 "代理关系终止": "第二单元 · 知识点 3 代理关系终止",
 "民事诉讼": "第三单元 · 知识点 1~2 概述与民事诉讼",
 "行政复议": "第三单元 · 知识点 3 行政复议",
 "行政诉讼": "第三单元 · 知识点 4 行政诉讼",
 "仲裁": "第三单元 · 知识点 5 仲裁",
 "速查表": "🎯 全章常考知识点速查表",
 "闭环": "📍 全章知识链闭环",
}

# 定位切分点
positions = [ls.find(m) for m, _ in markers]
assert all(p != -1 for p in positions), "存在未找到的标题"

section_ks = ["思维导图"] + [k for _, k in markers]
bounds = [0] + positions + [len(ls)]
assert len(bounds) == len(section_ks) + 1

segs = {}
for i, k in enumerate(section_ks):
    segs[k] = ls[bounds[i]:bounds[i+1]]

# 组装 SUMMARY_SECTIONS
sec_lines = []
for k in section_ks:
    md = segs[k]
    # 去掉 ``` 代码块标记（mdToHtml 不识别，ASCII 树靠 │├└ 字符识别）
    md = md.replace("```", "")
    # 去掉可能残留的反引号与模板插值隐患
    md = md.replace("`", "")
    title = titles[k]
    sec_lines.append(' {k:%s,title:%s,md:`\n%s`}' % (esc(k), esc(title), md))

SUM_JS = "const SUMMARY_SECTIONS=[\n" + ",\n".join(sec_lines) + "\n];"

# ---------- 拼接数据文件 ----------
data = "\n".join([
    "// 第一章 总论（经济法）· 习题纯享 全量 101 题",
    "// 数据源：周周 2026 精讲班《第一章 总论（习题纯享）》PDF（含参考答案与解析），按原文转录",
    "// 章节模式：经济法为「章-单元」结构（第一单元 民事法律行为 / 第二单元 代理制度 / 第三单元 经济纠纷解决途径）",
    Q_JS,
    KPOINTS_JS,
    FOR_JS,
    "",
    "// 掌握分析参数与建议回看指引",
    "const SMALL_N=3, WEAK_TH=70;",
    REC_JS,
    "",
    "// ============ 知识讲解（learningSummary《第一章-总论-全三单元详解》完整原文，按单元切分锚点）============",
    SUM_JS,
])

io.open(OUT, "w", encoding="utf-8").write(data)
print("写入完成：", OUT)
print("字节数：", len(data.encode("utf-8")))
print("SUMMARY_SECTIONS 段数：", len(section_ks))
print("KPOINTS 项数：", len(kp_list), "（应=101）")
print("考点集合：", cats)

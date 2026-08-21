#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""经济法第一章《总论》互动习题 HTML 构建脚本
复制骨架（财务管理第一章）的 <style>+JS 整段，注入经济法第一章数据，替换章节文案。
"""
import io, re

ROOT = "/Users/yzj/WorkBuddy/2026-08-06-07-25-28"
SRC = ROOT + "/第一章总论互动习题.html"
DATA = ROOT + "/hudongxiti/jingjifa/ch1-jjf-data.js"
OUT = ROOT + "/hudongxiti/jingjifa/第一章总论互动习题.html"

with io.open(SRC, encoding="utf-8") as f:
    html = f.read()
with io.open(DATA, encoding="utf-8") as f:
    data = f.read().strip()

N = len(re.findall(r'\n \{t:"', data))
print("检测到题数 N =", N)
assert N == 101

# 1) 注入数据块：从 `const Q = [` 到 `// 轻量 Markdown` 之前
s = html.index("const Q = [")
e = html.index("// 轻量 Markdown")
assert html[e-1] == "\n"
new_html = html[:s] + data + "\n\n" + html[e:]

# 2) 章节文案替换
repl = [
    ("中级财务管理 · 第一章 总论 互动自测题",
     "中级经济法 · 第一章 总论 互动自测题"),
    ("依据高红瑞 2026 精讲班《第一章 总论》整章讲义与习题纯享命题 · 共 51 题（单选 / 多选 / 判断）",
     "依据周周 2026 精讲班《第一章 总论》整章讲义与习题纯享命题 · 共 %d 题（单选 / 多选 / 判断）" % N),
    (" / 51", " / %d" % N),
    ('<span class="tag">企业组织形式</span><span class="tag">四大财务管理目标</span><span class="tag">利益冲突与协调</span>\n    <span class="tag">财务决策核心</span><span class="tag">集权分权体制</span><span class="tag">经济环境</span><span class="tag">金融环境（货币/资本市场）</span>',
     '<span class="tag">民事行为能力</span><span class="tag">民事法律行为概述</span><span class="tag">民事法律行为效力</span><span class="tag">附条件与附期限</span><span class="tag">代理制度概述</span>\n    <span class="tag">特殊代理行为</span><span class="tag">代理关系终止</span><span class="tag">民事诉讼</span><span class="tag">行政复议</span><span class="tag">行政诉讼</span><span class="tag">仲裁</span>'),
    ("7 大考点掌握分析", "11 大考点掌握分析"),
    ("按本章 7 大考点归类你的作答", "按本章 11 大考点归类你的作答"),
    ("知识详解内容为 learningSummary《第一章-总论-全六节详解》完整原文。",
     "知识详解内容为 learningSummary《第一章-总论-全三单元详解》完整原文。"),
    ("📘 第一章 总论 · 知识讲解", "📘 经济法第一章 总论 · 知识讲解"),
    ("优秀！第一章考点掌握扎实，可直接进入第二章。",
     "优秀！经济法第一章考点掌握扎实，可直接进入经济法第二章。"),
    ("【第一章 总论 自测结果】", "【经济法·第一章 总论 自测结果】"),
]

for a, b in repl:
    cnt = new_html.count(a)
    if cnt == 0:
        print("WARN 未找到替换项：", a[:50])
    new_html = new_html.replace(a, b)

with io.open(OUT, "w", encoding="utf-8") as f:
    f.write(new_html)

print("写入完成：", OUT)
print("字节数：", len(new_html.encode("utf-8")))

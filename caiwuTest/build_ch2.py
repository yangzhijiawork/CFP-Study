#!/usr/bin/env python3
import io, sys, re

SRC = "/Users/yzj/WorkBuddy/2026-08-06-07-25-28/第一章总论互动习题.html"
DATA = "/Users/yzj/WorkBuddy/2026-08-06-07-25-28/ch2-data.js"
OUT = "/Users/yzj/WorkBuddy/2026-08-06-07-25-28/第二章财务管理基础互动习题.html"

with io.open(SRC, encoding="utf-8") as f:
    html = f.read()
with io.open(DATA, encoding="utf-8") as f:
    ch2data = f.read().strip()

# 0) 从数据文件动态计算题数（页内硬编码 51 全部按此替换）
N = len(re.findall(r'\n \{t:"', ch2data))
print("检测到题数 N =", N)
assert N > 0, "未能从数据文件解析题数"

# 1) 注入数据块：从 `const Q = [` 到 `// 轻量 Markdown` 之前
s = html.index("const Q = [")
e = html.index("// 轻量 Markdown")
assert html[e-1] == "\n"
new_html = html[:s] + ch2data + "\n\n" + html[e:]

# 2) 章节文案替换
repl = [
    ("中级财务管理 · 第一章 总论 互动自测题",
     "中级财务管理 · 第二章 财务管理基础 互动自测题"),
    ("依据高红瑞 2026 精讲班《第一章 总论》整章讲义与习题纯享命题 · 共 51 题（单选 / 多选 / 判断）",
     "依据高红瑞 2026 精讲班《第二章 财务管理基础》整章讲义与习题纯享命题 · 共 %d 题（单选 / 多选 / 判断）" % N),
    (" / 51", " / %d" % N),
    ('<span class="tag">企业组织形式</span><span class="tag">四大财务管理目标</span><span class="tag">利益冲突与协调</span>\n    <span class="tag">财务决策核心</span><span class="tag">集权分权体制</span><span class="tag">经济环境</span><span class="tag">金融环境（货币/资本市场）</span>',
     '<span class="tag">货币时间价值</span><span class="tag">复利与年金</span><span class="tag">利率计算</span><span class="tag">收益与风险</span><span class="tag">资本资产定价模型</span><span class="tag">成本性态分析</span>'),
    ("7 大考点掌握分析",
     "15 大考点掌握分析"),
    ("按本章 7 大考点归类你的作答。",
     "按本章 15 大考点归类你的作答。"),
    ("习题与解析均整理自乐享知识库 CFP-Study-main《第一章 总论（整章讲义）》与《第一章 总论（习题纯享）》；知识详解内容为 learningSummary《第一章-总论-全六节详解》完整原文。",
     "习题与解析均整理自乐享知识库 CFP-Study-main《第二章 财务管理基础（整章讲义）》与《第二章 财务管理基础（习题纯享）》；知识详解内容为 learningSummary《第二章-财务管理基础-全三节详解》完整原文。"),
    ("📘 第一章 总论 · 知识讲解",
     "📘 第二章 财务管理基础 · 知识讲解"),
    ("优秀！第一章考点掌握扎实，可直接进入第二章。",
     "优秀！第二章考点掌握扎实，可直接进入第三章。"),
    ("【第一章 总论 自测结果】",
     "【第二章 财务管理基础 自测结果】"),
]

for a, b in repl:
    cnt = new_html.count(a)
    if cnt == 0:
        print("WARN 未找到替换项：", a[:40])
    new_html = new_html.replace(a, b)

with io.open(OUT, "w", encoding="utf-8") as f:
    f.write(new_html)

print("写入完成：", OUT)
print("字节数：", len(new_html.encode("utf-8")))

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""经济法第二章《公司法律制度》互动习题 HTML 构建脚本
复制骨架（经济法第一章 HTML）的 <style>+JS 整段，注入第二章数据，替换章节文案。
"""
import io, re

ROOT = "/Users/yzj/WorkBuddy/2026-08-06-07-25-28"
SRC = ROOT + "/CFP-Study/hudongxiti/jingjifa/第一章总论互动习题.html"
DATA = ROOT + "/CFP-Study/jingjifaTest/ch2-jjf-data.js"
OUT = ROOT + "/CFP-Study/hudongxiti/jingjifa/第二章公司法律制度互动习题.html"

with io.open(SRC, encoding="utf-8") as f:
    html = f.read()
with io.open(DATA, encoding="utf-8") as f:
    data = f.read().strip()

N = len(re.findall(r'\n \{t:"', data))
print("检测到题数 N =", N)
assert N == 114

# 1) 注入数据块：从 `const Q = [` 到 `// 轻量 Markdown` 之前
s = html.index("const Q = [")
e = html.index("// 轻量 Markdown")
assert html[e-1] == "\n"
new_html = html[:s] + data + "\n\n" + html[e:]

# 2) 章节文案替换
tags2 = ('<span class="tag">公司概述</span><span class="tag">公司法人财产权</span><span class="tag">公司登记管理</span><span class="tag">公司财务会计</span><span class="tag">有限责任公司设立</span><span class="tag">股东出资</span><span class="tag">出资瑕疵处理</span>\n'
         '    <span class="tag">公司组织机构概述</span><span class="tag">股东会</span><span class="tag">董事会</span><span class="tag">监事会</span><span class="tag">董监高任职与义务</span><span class="tag">决议效力</span><span class="tag">股东权利</span>\n'
         '    <span class="tag">股份有限公司设立</span><span class="tag">股份公司股东会</span><span class="tag">股份公司董事会</span><span class="tag">审计委员会</span><span class="tag">股份公司监事会</span><span class="tag">股份</span>\n'
         '    <span class="tag">上市公司组织机构</span><span class="tag">独立董事制度</span><span class="tag">国有独资公司</span><span class="tag">公司合并</span><span class="tag">公司分立</span><span class="tag">减资与增资</span><span class="tag">公司解散</span><span class="tag">公司清算</span><span class="tag">公司注销</span>')

repl = [
    ("第一章 总论", "第二章 公司法律制度"),
    ("第一章-总论-全三单元详解", "第二章-公司法律制度-全六单元详解"),
    ("共 101 题", "共 %d 题" % N),
    ("全量 101 题", "全量 %d 题" % N),
    (" / 101", " / %d" % N),
    ("11 大考点", "29 大考点"),
    ("优秀！经济法第一章考点掌握扎实，可直接进入经济法第二章。",
     "优秀！经济法第二章考点掌握扎实，可直接进入经济法第三章。"),
    ("按本章 11 大考点归类你的作答", "按本章 29 大考点归类你的作答"),
]

# tags 整段替换（先替换再其他，避免与"第一章 总论"冲突——tags 内无"第一章 总论"）
new_html = new_html.replace(
    '<span class="tag">民事行为能力</span><span class="tag">民事法律行为概述</span><span class="tag">民事法律行为效力</span><span class="tag">附条件与附期限</span><span class="tag">代理制度概述</span>\n    <span class="tag">特殊代理行为</span><span class="tag">代理关系终止</span><span class="tag">民事诉讼</span><span class="tag">行政复议</span><span class="tag">行政诉讼</span><span class="tag">仲裁</span>',
    tags2)

for a, b in repl:
    cnt = new_html.count(a)
    if cnt == 0:
        print("WARN 未找到替换项：", a[:50])
    new_html = new_html.replace(a, b)

# 校验残留
for bad in ("第一章 总论", "101", "11 大考点"):
    c = new_html.count(bad)
    if c:
        print("WARN 残留：%s x%d" % (bad, c))

with io.open(OUT, "w", encoding="utf-8") as f:
    f.write(new_html)

print("写入完成：", OUT)
print("字节数：", len(new_html.encode("utf-8")))

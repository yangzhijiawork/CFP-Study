---
name: lexiang-chapter-quiz
description: 章节互动自测题**端到端流水线**：从乐享知识库（讲义+习题纯享+learningSummary）制作单文件互动 HTML（做题/判分/解析/疑问标记/掌握分析/知识讲解弹框）→ jsdom 主+深双套件全面测试验收 → CloudStudio 部署公网 + 乐享原地更新存档。后续任何章节照此流程即可高度还原。触发词：给某章做互动习题、章节自测题、互动做题页面、展示章节知识点。
---

# 章节互动自测题：制作 → 全面测试 → 验收 → 部署存档（乐享 + HTML + jsdom）

## 0. 总览
- **输入**：乐享知识库某章「整章讲义」(MD) +「习题纯享」(PDF) + `learningSummary/` 该章详解 MD。
- **输出**：单文件自包含 HTML（无外部依赖）+ 主/深双验收脚本 + 公网链接 + 乐享条目。
- **参考实现（骨架模板）**：`/Users/yzj/WorkBuddy/2026-08-06-07-25-28/第一章总论互动习题.html`（已 136 项验收通过）。**新章节 = 复制该骨架 → 替换内容**，这是"高度还原"的最快路径。
- **流程五步**：素材 → 制作 → 测试 → 验收 → 部署存档。

## 1. 素材收集（乐享）
- `entry_list_children` 定位章节文件夹；「整章讲义」与「习题纯享」用 `entry_describe_ai_parse_content` 读取（PDF 也可用 PyPDF2 本地解析）；`learningSummary/` 下该章详解 MD 取出**完整原文**。
- 命题原则：**严格基于讲义据实命题**，每题解析写清考点/底层逻辑/易错点；判断题选项固定「正确/错误」。

## 2. 页面制作（以参考实现为骨架）

### 2.1 数据模型（与参考实现一致）
- `Q=[{t:'single'|'multi'|'judge', stem, o:[['A','文案'],...], a:'A..', e}]`；`a` 与选项字母一一对应，多选题 `a` 为多字母串（如 `"ABCD"`）。
- `KPOINTS` 数组与 Q **等长按序对应**，末尾 `Q.forEach((q,i)=>q.k=KPOINTS[i])`（k 在 Q 定义后再挂载）。
- `SMALL_N=3`（考点题数<3 标注"样本少仅供参考"、不下薄弱结论）、`WEAK_TH=70`（正确率<70% 且样本充足才标薄弱）、`RECOMMEND={k:回看讲义指引}`。
- `SUMMARY_SECTIONS=[{k,title,md}]`：learningSummary 完整原文按节切分；`k` 与 KPOINTS 考点对齐 + 额外锚点（如「思维导图/速查表」）；每节渲染为 `<section id="kp-<k>">`。

### 2.2 功能规格（精确文案，勿擅改）
- **顶栏**（5 个按钮全部 `type="button"`）：已答/正确/疑问 计数；`章节知识点`(btn-outline，打开弹框定位顶部)；`只看错题`(btn-ghost，提交后显示，文案 只看错题↔显示全部，用 `.dim` 调暗非错题)；`重置`(btn-ghost)；`提交答卷`(btn-primary，只保留此文案)；`隐藏全部解析`(btn-amber，提交后显示，文案 隐藏全部解析↔查看全部解析)。
- **题卡 `#q<i>`**：`.q-head`(题号+题型badge+题干 stem + `.doubt-btn` 疑问按钮)；`.opts` 单选/判断用 radio、多选用 checkbox。
- **疑问标记**：按钮文案 `标记疑问` ↔ `有疑问`（**不用「已标记」**）；提交前可反复反选，提交后 `disabled` 锁定，重置清空；卡片 `.q.doubt` 琥珀边框高亮（**无 ⚠疑问 文字芯片**）。
- **解析 `.explain#ex<i>`**：`.et-row`（flex 两端对齐、可换行）——左侧「✓ 正确答案：」+`.ans`，右侧 `.btn-know`「📖 知识讲解：「k」」（与答案**同行右端**，**勿写"聚焦"**）；下方 `q.e`；多选错题给 `.opt.correct/.wrong/.missed` 标记 + `.my-ans-tip`「你的作答 → 正确答案，漏选 X/错选 Y」。
- **判分 `submit()`**：开头 `if(graded) return;` 防重复；正确题 `.res-correct` 绿框、错误题 `.res-wrong` 红框并高亮正确项；隐藏提交按钮、显示解析切换与只看错题；`showAll=true`；`renderMastery()`。
- **解析切换 `toggleExplain()`**：**只由 `showAll` 控制**（`for(i) ex[i].classList.toggle('show',showAll)`），勿写 `showAll||graded`（graded 交卷后恒真会导致无法隐藏）。
- **掌握分析 `renderMastery()`**：按 `k` 归类（样本保护+薄弱标红+RECOMMEND 建议）；**疑问加权**：每考点行显示「⚠疑问知识点：你标记 N 题（对 X / 错 Y）」，答对但标疑问也提示巩固；疑问汇总面板**只做聚合**（「⚠疑问知识点：共 N 题（涉及考点：…）+ 引导语」，不列逐题——逐题明细在导出报告）；导出按钮 + textarea 报告（总分/正确率、各考点含「·⚠疑问知识点N题(对X/错Y)」、错题清单 `第N题【k】你的答案→正确答案`、`⚠疑问知识点（N题）` 逐题 `第N题【k】答对/答错(你标疑问)`、薄弱模块）。
- **知识讲解弹框**：`#sumMask > .modal-box > .modal-head`(标题+圆形关闭按钮) + `#sumNav`(吸顶导航：`flex:0 0 auto;width:100%;background:#fff` **不透明**+阴影+下边框，位于 modal-head 之后、sumBody 之前，**不随内容滚动**) + `#sumBody`(**`position:relative`**，滚动区，scrollspy 基准)。`openSummary(k)` 定位 `#kp-<k>`、`null` 定位顶部；`updateSumNav` 按 `offsetTop+NAV_OFFSET(20)` 给 `.sum-nav-btn.active` 蓝底高亮；`.ksec` 设 `scroll-margin-top:16px` 防锚定被遮挡；关闭：关闭按钮/点遮罩/ESC 三种方式，点内容区不误关。
- **`mdToHtml(md)`**：轻量渲染器，支持 标题/表格/有序无序列表/`**加粗**`/行内代码/ASCII 思维导图树（→ `pre.ktree` 等宽+横向滚动）。

### 2.3 知识详解内容规范（全量忠实，勿摘编）
- 弹框嵌入 learningSummary 该章详解**完整原文**：考情定位、整章思维导图树、各节正文、真题印证（年份+题号）、知识链闭环、个性化批注都要保留。
- 乐享解析出的 md 通常**没有 `**` 标记**——若要求"加粗细节"，需按讲义重点给高频考点/易错结论**显式补加粗**（如"财务决策是财务管理的核心"）。
- 文案残留检查（防旧版串味）：全页不得出现「已标记」「聚焦」；疑问按钮只用 标记疑问/有疑问。

### 2.4 计数
- 题数用 `Q.length` 动态计算（页内禁止硬编码 51）。

### 2.5 样式参考（Style Reference，视觉令牌，复制即一致）
- **设计令牌 `:root`**（直接复用，勿改色值，保证跨章视觉统一）：
  ```css
  :root{
    --bg:#f5f7fa; --card:#ffffff; --line:#e6eaf0; --ink:#1f2733; --sub:#6b7785;
    --blue:#2f6fed; --blue-soft:#eaf1ff; --green:#1f9d55; --green-soft:#e7f6ee;
    --red:#e0463e; --red-soft:#fdecea; --amber:#e8973a; --amber-soft:#fdf2e3;
  }
  ```
- **基底**：`body` 字体 `-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif`，`background:var(--bg)`，`line-height:1.65`，`font-size:15px`。`.wrap{max-width:820px;margin:0 auto;padding:20px 16px 80px}`。`header` 蓝紫渐变 `linear-gradient(135deg,#2f6fed,#5b8def)` 白字圆角卡片带阴影；`.topbar` sticky 半透白底毛玻璃吸顶（`rgba(255,255,255,.96)` + `backdrop-filter:blur(6px)`）。
- **按钮四型**：`.btn-primary`(蓝底白字) / `.btn-ghost`(浅灰 #eef1f6) / `.btn-amber`(琥珀白字) / `.btn-outline`(白底蓝字蓝边)；统一 `border-radius:10px;padding:9px 16px;font-weight:600`。
- **题卡 `.q`**：白底圆角卡片带边框；`.q.doubt` 琥珀边框 + `box-shadow:0 0 0 2px var(--amber-soft)`；`.q.res-correct/.res-wrong` 绿/红边框。`.qno` 蓝底白字题号；`.badge` 三型色（单选蓝/多选琥珀/判断紫 `#6f4fd6`）；`.opt` 选项行 hover 浅蓝，`.correct/.wrong/.missed` 绿/红/琥珀标记。
- **解析 `.explain`**：虚线边框浅底块（`.show` 才显示）；`.et-row` flex 两端对齐（正确答案左、知识讲解右）；`.my-ans-tip` 琥珀虚线提示框。
- **掌握分析 `.mastery`**：`.mk-bar` 进度条（`.mk-fill` 按正确率着色，绿/红），`.weak-tags .wt` 红底薄弱标签，`.doubt-summary` 琥珀汇总块。
- **知识讲解弹框**：`.modal-mask` 半透遮罩 `rgba(15,23,35,.55)`；`.modal-box` 白底圆角 `max-width:860px;max-height:88vh` 纵向 flex；`.modal-head` 标题 + 圆形关闭按钮 `.modal-close`(34px 固定)；`.sum-nav` 吸顶全宽白底不透明 + 阴影（见 2.2）；`.modal-body`(position:relative 滚动区) 内 `h1~h4.kh*` 标题层级、`table.ktab` 表格、`pre.ktree` 等宽思维导图树、`code` 行内代码。
- **最强保证**：新章节**直接复制骨架 HTML 的 `<style>` 整段**（连同 `:root` 与上列所有 class），只替换 `Q/KPOINTS/SUMMARY_SECTIONS` 与章节文案——不要重写 CSS，这是跨章风格 100% 一致的根本保证；本参考仅用于核对与兜底（骨架文件丢失时按令牌重建）。

## 3. 全面测试（jsdom，主+深双套件，勿跳过）

### 3.1 环境
- 受管 Node 22 + jsdom：`NODE_PATH=/Users/yzj/.workbuddy/binaries/node/workspace/node_modules <node>/node test-quiz-xxx.js`
- 加载：`new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true})`；先打桩 `window.HTMLElement.prototype.scrollIntoView=()=>{}`（jsdom 未实现，否则 submit 抛错）。
- **`const Q` 不挂 window**：测试从 DOM 反读（解析里的 `.ans` 文本→正确答案字母）。

### 3.2 主验收 `test-quiz-v3.js`（72 项）
- 覆盖：渲染/文案（提交答卷、标记疑问、知识讲解无聚焦、疑问芯片已移除）、弹框全量（10+ 锚点区块、思维导图树、加粗/表格/列表）、吸顶导航贴标题+宽度100%、scrollspy 打桩滚动高亮、题内按钮锚定、疑问勾选/锁定/重置、判分、掌握分析 7 行+疑问权重、导出报告、重置回归。

### 3.3 深度验收 `test-quiz-deep.js`（64 项）
- 覆盖：**考点锚点可达性**（每题的 data-k 都有对应 `#kp-<k>`，无死链）、51 题全量疑问流（全标→计数/文案/高亮一致→提交全锁定→重置全清空）、空卷提交 0 分不崩、双击提交 guard 不重复判分、多选漏选（只勾首项→判错+「漏选 X」提示+`.opt.correct.missed` 标记）、只看错题/显示全部、疑问加权到掌握分析（对而疑→对1/错0+建议巩固；错而疑→对0/错1）、弹框三方式关闭+内容区不误关、全量文案残留（已标记/聚焦/⚠疑问芯片）、顶栏 `type="button"`。

### 3.4 测试自身易踩坑（全量清单）
1. 判断题 `.ans` 文本是「正确/错误」→ 反读须映射回 A/B。
2. 多选题 `.ans` 是多字母串（如"ABCD"），反读**不能只用 `/^[A-D]$/` 单字母正则**（会掉进 else 返回 ['B'] 误判页面）；正确写法：正确/错误→映射，否则 `ansTxt.split('')`。
3. 别用文案 contains 断言（庆祝语可能含"薄弱"等词），查元素数量。
4. 硬编码题号必须核对 Q 数组 index，别想当然。
5. **jsdom 无布局**：scrollspy 需 `Object.defineProperty(el,'offsetTop',{value:N,configurable:true})` 打桩，滚动用 `Object.defineProperty(sumBody,'scrollTop',{value:N})` + dispatch scroll。
6. `**加粗**` 断言依赖内容里真有 `**`——乐享解析常无，需主动补。
7. 样式断言直接读 `<style>` 源码文本（jsdom 的 getComputedStyle 对 style 标签支持弱）。
8. `textContent` 是字符串：断言用 `'40'` 而非 `40`。

### 3.5 验收清单（提交前逐项对照）
- [ ] 主+深双套件**全部通过**（当前参考实现 72+64=136 项）
- [ ] 每题的 `data-k` 都有对应 `#kp-<k>` 锚点（锚点可达）
- [ ] 全页无「已标记」「聚焦」、无 ⚠疑问 芯片
- [ ] 提交后疑问按钮锁定、重置后清空恢复
- [ ] 空卷提交不崩、双击提交不重复判分
- [ ] 多选错题区分漏选/错选
- [ ] 掌握分析行数=考点数、疑问加权文案正确、导出报告含错题清单+疑问明细
- [ ] 弹框关闭按钮/遮罩/ESC 均可关闭、内容区不误关

## 4. 部署与存档

### 4.1 公网（CloudStudio）
- `cp <成品>.html deploy-quiz-chN/index.html` → `workbuddy_cloudstudio_deploy action=deploy directory=deploy-quiz-chN` → 返回 shareLink（**更新同链接**，sandboxId 不变）。
- 交付时告知用户：**可在「设置 - 数据管理 - 我发布的应用」中管理该已发布应用（如删除）**。

### 4.2 乐享（优先原地更新，不产生重复条目）
- 先 `entry_describe_entry` 拿 `target_id`（= file_id）与 entry `id`（= parent_entry_id）。
- `wc -c` 取**真实字节数**（size 错 → 预签名 URL 的 content-length 签名不匹配 → PUT 403）。
- `file_apply_upload(file_id, parent_entry_id, size, mime_type:'text/html')` → `curl -X PUT -H "Content-Type: text/html" --data-binary @<文件> "<预签名URL>"`（预期 HTTP 200）→ `file_commit_upload(session_id)` → 同 entry revision+1（created_from=renew）。
- 首次上传不传 file_id；若历史产生了重复条目：建「旧版本归档」文件夹（`entry_create_entry` entry_type=folder）用 `entry_move_entry` 把旧条目移进去（乐享 MCP **无 delete**）。

### 4.3 上传后核验（三方逐字节）
- `file_download_file(file_id)` 拿预签名 GET URL 下载回来，与本地、deploy 副本做 `md5`/`cmp` 逐字节比对。
- **下载 URL 首次可能 403 `SignatureDoesNotMatch`**（filename* 编码问题）：再调一次该工具（或不带 revision_id 重取），拿到双层编码（`%25E7...`）变体即可 200 下载。

## 5. 新章节适配清单（照此执行即高度还原）
1. 乐享定位该章「整章讲义 / 习题纯享 / learningSummary 详解」并读全文。
2. 复制参考实现 `第一章总论互动习题.html` 为 `<第N章>互动习题.html`。
3. 替换 `Q`（新章题目，据讲义命题）、`KPOINTS`、`RECOMMEND`、`SUMMARY_SECTIONS`（新章详解全文按节切分，锚点 k 与 KPOINTS 一致 + 思维导图/速查表类额外锚点）。
4. 更新章节文案：页面标题/副标题/tags/操作引导/foot 说明（第N章 名称）。
5. 更新测试脚本：`N`、考点名（k 列表）、掌握分析行数、弹框关键词 `kw` 数组、预期分数（test-quiz-v3.js 与 test-quiz-deep.js 里所有硬编码）。
6. 跑主+深双套件**全部通过**；重点核对锚点可达性与文案残留。
7. CloudStudio 部署公网 + 乐享原地更新 + 三方逐字节核验。
8. 写当日记忆日志 + 如有新坑追加到本技能。

### 5.1 科目差异（财务管理 vs 经济法，仅影响切分/命名/文案，流程 100% 复用，**无需另建 skill**）
- **章节模式**：财务管理=「章→节」（学习摘要「全 N 节详解」）；经济法=「章→单元」（学习摘要「全 N 单元详解」，如第一章=民事法律行为/代理制度/经济纠纷解决途径 三单元）。SUMMARY_SECTIONS 切分粒度：财管按「节」，经济法按「单元+知识点」；KPOINTS 考点名用知识点名（如「民事法律行为效力」）。
- **讲师文案**：财管=高红瑞 2026 精讲班、经济法=周周 2026 精讲班（副标题「依据 XX 2026 精讲班」）。
- **「无对应题目」的知识点段**（如「法律关系概述」「经济纠纷解决途径概述」）仍保留原文，并入相邻锚点的 section，保证全文完整。

## 坑（全量经验汇总）
- PUT 403 = size≠`wc -c`（content-length 参与签名）。
- 乐享下载 URL 首次 403 → 再取一次（双层编码变体）即可。
- `.modal-body` 必须 `position:relative`（scrollspy 的 offsetTop 基准），误删会被测试抓到——**测试确实能抓回归，别跳过**。
- 掌握分析**面板是聚合设计**（共N题+涉及考点），逐题明细在**导出报告**——测试断言别按错误预期写。
- jsdom：`textContent` 是字符串；`const Q` 不挂 window；scrollIntoView/offsetTop/scrollTop 需打桩。
- 乐享为唯一真源：进度/Session 记录不建本地副本；HTML 交付物留本地供预览。
- 归档/删除：乐享无 delete，只有 `entry_move_entry`。
- 习题纯享 PDF 解析：用**逐行状态机**（比纯正则稳）处理题干/选项的跨行、跨页续行；偶有「题干+A选项同行」混入（如经济法第 87 题「……（ ）。A.对仲裁……」），检测 `（ ）。A.` 位置拆分 stem 与 A 选项。
- 判断题答案映射：习题纯享 PDF 答案用 √/×，生成数据时 √→A、×→B。
- learningSummary 的 ``` 代码块：`mdToHtml` 不识别 ``` 标记（靠 │├└ 字符识别 ASCII 树为 pre.ktree），生成 SUMMARY_SECTIONS 时需**去掉 ``` 标记**（并去残留反引号，防 JS 模板字符串插值）。

## 产出
- 本地 HTML（present_files 实时预览）+ 公网 shareLink + 乐享条目（可下载交互）。
- `test-quiz-v3.js`（主）+ `test-quiz-deep.js`（深）留工作区，后续章节复用改造。
- 当日记忆日志 + 本技能随新坑持续更新。

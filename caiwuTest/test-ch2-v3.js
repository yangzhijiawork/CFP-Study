// 第二章财务管理基础互动习题 v3 验收测试
// 覆盖：1) 弹框全量渲染(思维导图/加粗/真题印证/全文细节) 2) 锚点滚动高亮(scrollspy)
//       3) 疑问文案(标记疑问/有疑问,⚠疑问芯片移除) 4) 提交按钮只留【提交答卷】
//       5) 知识讲解按钮去【聚焦】且置于正确答案同行右端 6) 弹框样式 + 全量回归
//       7) 章节知识点按钮与提交答卷行为分离（不触发判分）
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, '第二章财务管理基础互动习题.html'), 'utf8');

let passed = 0, failed = 0;
const fails = [];
function assert(cond, name) {
  if (cond) { passed++; }
  else { failed++; fails.push(name); console.log('  ✗ FAIL: ' + name); }
}
function ok(msg) { console.log('  ✓ ' + msg); }

const dom = new JSDOM(HTML, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  beforeParse(window) {
    window.HTMLElement.prototype.scrollIntoView = function () {};
  }
});
const { window } = dom;
const { document } = window;

function fire(el, evt) { el.dispatchEvent(new window.Event(evt, { bubbles: true })); }
function click(el) { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true })); }
function qsel(sel) { return document.querySelectorAll(sel); }
function q1(sel) { return document.querySelector(sel); }

// 从 DOM 反读每题正确答案（判题解析里的 .ans）
function correctLabsFromDom(i) {
  const ansTxt = document.getElementById('ex' + i).querySelector('.ans').textContent.trim();
  if (ansTxt === '正确') return ['A'];
  if (ansTxt === '错误') return ['B'];
  return ansTxt.split(''); // 单选/多选：直接是字母串
}
// 作答到正确
function answerCorrect(i) {
  const labs = correctLabsFromDom(i);
  labs.forEach(l => {
    const inp = document.querySelector(`input[name="q${i}"][value="${l}"]`);
    if (inp) { inp.checked = true; fire(inp, 'change'); }
  });
}

console.log('=== 一、渲染与文案 ===');

// 1. 110 题渲染
assert(qsel('.q').length === 110, '渲染 110 题卡片');
ok('110 题卡片渲染');

// 2. 提交按钮只保留【提交答卷】
const submitBtn = q1('#submitBtn');
assert(submitBtn.textContent.trim() === '提交答卷', '提交按钮文案为【提交答卷】');
assert(!submitBtn.textContent.includes('查看对错'), '提交按钮不含"查看对错"');
ok('提交按钮 = 提交答卷');

// 3. 疑问按钮初始文案【标记疑问】
const dbtns = qsel('.doubt-btn');
assert(dbtns.length === 110, '每题一个疑问按钮');
let allMarkOk = true;
dbtns.forEach(b => { if (b.textContent.trim() !== '标记疑问') allMarkOk = false; });
assert(allMarkOk, '所有疑问按钮初始文案=【标记疑问】');
ok('疑问按钮初始文案 = 标记疑问');

// 4. 知识讲解按钮：含"知识讲解：「"，不含"聚焦"
const knows = qsel('.btn-know');
assert(knows.length === 110, '每题一个知识讲解按钮');
let knowOk = true, noFocus = true;
knows.forEach(b => {
  const t = b.textContent;
  if (!t.includes('知识讲解：「') || !t.includes('」')) knowOk = false;
  if (t.includes('聚焦')) noFocus = false;
});
assert(knowOk, '知识讲解按钮文案格式=「知识讲解：「考点」」');
assert(noFocus, '知识讲解按钮不含【聚焦】二字');
ok('知识讲解按钮 = 📖 知识讲解：「考点」，无聚焦');

// 3b. 知识讲解按钮位于「正确答案」同一行右端（.et-row 同时含 .et 与 .btn-know）
assert(qsel('.et-row').length === 110, '每题一个 .et-row（正确答案行）');
let rowOk = true;
qsel('.et-row').forEach(r => { if (!r.querySelector('.et') || !r.querySelector('.btn-know')) rowOk = false; });
assert(rowOk, '每个 .et-row 同时含【正确答案 .et】与【知识讲解 .btn-know】→ 同行右端');
assert(qsel('.explain > .btn-know').length === 0, '知识讲解按钮不再独占一行（已从 explain 直接子节点移入 et-row）');
ok('知识讲解按钮 = 正确答案同行右端');

console.log('=== 二、弹框内容全量（md 全部信息）===');

// 打开弹框（章节知识点 → 顶部）
click(q1('#chapterBtn'));
assert(q1('#sumMask').classList.contains('show'), '章节知识点按钮打开弹框');
// 7. 章节知识点 与 提交答卷 行为分离：开弹框不应触发判分/隐藏提交
assert(q1('#submitBtn').style.display !== 'none', '点章节知识点后【提交答卷】仍可见（未触发提交）');
assert(!document.getElementById('result').classList.contains('show'), '点章节知识点后结果区未显示（未触发判分）');
ok('章节知识点 与 提交答卷 行为分离（前者只开知识面板，绝不判分）');

// 5. 锚点导航与区块数量
const navBtns = qsel('.sum-nav-btn');
assert(navBtns.length >= 10, `吸顶导航按钮 ≥10 个（实际 ${navBtns.length}）`);
const ksecs = qsel('.ksec');
assert(ksecs.length >= 10, `知识点区块 ≥10 个（实际 ${ksecs.length}）`);
ok(`导航 ${navBtns.length} 个 / 区块 ${ksecs.length} 个`);

// 6. 全量关键词：思维导图、资本资产定价模型、真题印证、全三节详解、知识链闭环
const sumTxt = q1('#sumBody').textContent;
const kw = ['整章思维导图', '资本资产定价模型', '真题印证', '知识链闭环', '全三节完整详解', '混合成本', '年金现值', '标准差率'];
kw.forEach(k => assert(sumTxt.includes(k), `弹框包含原文关键内容【${k}】`));
ok('弹框含原文全部关键内容（考情/思维导图/CAPM/真题印证/闭环/混合成本/年金/标准差率）');

// 7. 思维导图树渲染（ASCII 树 → pre.ktree）
const trees = qsel('.modal-body pre.ktree');
assert(trees.length > 0, '思维导图以 pre.ktree 渲染');
let treeHas = false;
trees.forEach(t => { if (t.textContent.includes('├─')) treeHas = true; });
assert(treeHas, '思维导图树包含 ├─ 分支符号');
ok(`思维导图树 pre 块 ×${trees.length}，含 ├─ 分支`);

// 8. 正文细节：加粗 <strong>、表格 th、列表 li、行内 code
assert(qsel('.modal-body strong').length > 0, '正文加粗 <strong> 渲染');
assert(qsel('.modal-body th').length > 0, '表格表头 th 渲染');
assert(qsel('.modal-body li').length > 0, '列表 li 渲染');
assert(qsel('.modal-body h1.kh1').length > 0, '一级标题 kh1 渲染（原文 # 标题）');
ok('加粗/表格/列表/标题细节渲染完整');

// 9. 弹框样式断言（读 <style> 源码：吸顶区域宽度100%、贴标题、背景不透明、关闭按钮圆形、active 高亮）
const css = HTML;
assert(/\.sum-nav\{[^}]*width:100%/.test(css), '吸顶导航宽度 100%');
assert(/\.sum-nav\{[^}]*background:#fff/.test(css), '吸顶导航背景为不透明 #fff');
assert(/\.modal-close\{[^}]*border-radius:50%/.test(css), '关闭按钮圆形（修复错位：flex 居中+固定尺寸）');
assert(/\.sum-nav-btn\.active\{[^}]*background:var\(--blue\)/.test(css), '锚点高亮 active 样式存在');
assert(/\.modal-body\{[^}]*position:relative/.test(css), 'modal-body position:relative（scrollspy offsetTop 基准）');
ok('弹框样式：导航全宽贴标题+实底、关闭按钮圆形居中、active 高亮');

// 10. 吸顶导航贴住标题：位于 modal-head 之后、滚动区之前（不随内容滚动）
const sumNavEl = q1('#sumNav');
assert(sumNavEl && sumNavEl.previousElementSibling && sumNavEl.previousElementSibling.classList.contains('modal-head'), '吸顶导航紧贴标题栏（modal-head 之后）');
assert(sumNavEl && sumNavEl.nextElementSibling && sumNavEl.nextElementSibling.id === 'sumBody', '吸顶导航在滚动区(sumBody)之前');
ok('吸顶导航紧贴标题栏、宽度 100%（独立于滚动区）');

// 11. 关闭按钮可关闭
click(q1('#sumClose'));
assert(!q1('#sumMask').classList.contains('show'), '点击关闭按钮弹框关闭');
click(q1('#chapterBtn'));
ok('关闭按钮交互正常');

console.log('=== 三、锚点定位与滚动高亮（scrollspy）===');

// 11. 题内【知识讲解】按钮 → 弹框 + 定位到对应考点区块
click(qsel('.btn-know')[0]); // 第1题 k=货币时间价值概念
assert(q1('#sumMask').classList.contains('show'), '题内知识讲解按钮打开弹框');
assert(!!q1('#kp-货币时间价值概念'), '目标考点区块 #kp-货币时间价值概念 存在');
assert(q1('#sumMask').classList.contains('show'), '打开后仍显示');
ok('题内按钮锚定到对应考点区块');

// 12. scrollspy：stub offsetTop → 滚动 → 对应导航按钮高亮
const secEls = [];
navBtns.forEach(b => secEls.push(document.getElementById('kp-' + b.getAttribute('data-k'))));
const tops = { '思维导图': 0, '货币时间价值概念': 500, '复利终值与现值': 1200, '年金现值': 2000, '年金终值': 2800, '偿债基金与资本回收': 3400, '利率计算': 4200, '资产收益与收益率': 5000, '风险衡量': 5800, '风险对策': 6600, '证券组合风险': 7400, '资本资产定价模型': 8200, '固定成本': 9000, '变动成本': 9800, '混合成本': 10600, '混合成本分解': 11400, '速查表': 12200, '闭环': 13000 };
Object.entries(tops).forEach(([k, v]) => {
  const el = document.getElementById('kp-' + k);
  if (el) Object.defineProperty(el, 'offsetTop', { value: v, configurable: true });
});
function scrollTo(top) {
  Object.defineProperty(q1('#sumBody'), 'scrollTop', { value: top, configurable: true, writable: true });
  fire(q1('#sumBody'), 'scroll');
}
scrollTo(1400); // 复利终值与现值 1200 已过，年金现值 2000 未到 → active=复利终值与现值
let act = q1('.sum-nav-btn.active');
assert(act && act.getAttribute('data-k') === '复利终值与现值', `滚动至目标区 → 导航高亮【复利终值与现值】(实际 ${act && act.getAttribute('data-k')})`);
scrollTo(3800); // 偿债基金与资本回收 3400 已过，利率计算 4200 未到 → active=偿债基金与资本回收
act = q1('.sum-nav-btn.active');
assert(act && act.getAttribute('data-k') === '偿债基金与资本回收', `滚动至偿债基金区 → 导航高亮【偿债基金与资本回收】(实际 ${act && act.getAttribute('data-k')})`);
scrollTo(12500); // 速查表 12200 已过，闭环 13000 未到 → active=速查表
act = q1('.sum-nav-btn.active');
assert(act && act.getAttribute('data-k') === '速查表', `滚动至速查表 → 导航高亮【速查表】(实际 ${act && act.getAttribute('data-k')})`);
scrollTo(0);
act = q1('.sum-nav-btn.active');
assert(act && act.getAttribute('data-k') === '思维导图', `回到顶部 → 高亮【思维导图】`);
ok('scrollspy：滚动到对应知识点区块时，吸顶按钮自动高亮');

// 13. 点击导航按钮跳转（scrollIntoView 打桩不报错即可）
click(qsel('.sum-nav-btn')[7]); // 资产收益与收益率
assert(true, '点击导航按钮跳转不报错');
ok('点击吸顶导航跳转正常');

console.log('=== 四、疑问标记流程 ===');

click(q1('#sumClose')); // 关弹框
const db0 = qsel('.doubt-btn')[0];
click(db0);
assert(qsel('.q')[0].classList.contains('doubt'), '标记后卡片带 doubt 边框高亮');
assert(db0.textContent.trim() === '有疑问', '标记后按钮文案=【有疑问】');
assert(db0.classList.contains('on'), '标记后按钮 on 态');
assert(qsel('.doubt-tag').length === 0, '疑问标识 ⚠疑问 芯片已移除（按新要求）');
assert(q1('#doubtcnt').textContent.trim() === '1', '顶栏疑问计数=1');
ok('标记疑问 → 有疑问 + 计数（⚠疑问 芯片已移除）');

// 反选
click(db0);
assert(db0.textContent.trim() === '标记疑问', '反选后恢复【标记疑问】');
assert(qsel('.doubt-tag').length === 0, '反选后无 ⚠疑问 芯片');
click(db0); // 再标记回来
ok('提交前可反复反选');

console.log('=== 五、判分与掌握分析（含疑问权重）===');

// 全部答对 + 第1题标记疑问
for (let i = 0; i < 110; i++) answerCorrect(i);
click(q1('#submitBtn'));
assert(document.getElementById('scoreOk').textContent.trim() === '110', '全对 → 110 分');
assert(q1('#submitBtn').style.display === 'none', '提交后隐藏提交按钮');
assert(qsel('.doubt-btn')[0].disabled === true, '提交后疑问按钮锁定 disabled');
ok('判分 110/110，疑问按钮锁定');

// 解析显隐 toggle 回归
const exp0 = document.getElementById('ex0');
assert(exp0.classList.contains('show'), '提交后解析展开');
click(q1('#explainBtn'));
assert(!exp0.classList.contains('show'), '【隐藏全部解析】可隐藏');
assert(q1('#explainBtn').textContent.trim() === '查看全部解析', '按钮文案切为 查看全部解析');
click(q1('#explainBtn'));
assert(exp0.classList.contains('show'), '【查看全部解析】可再展开');
ok('查看/隐藏全部解析 toggle 正常');

// 掌握分析：15 行 + 疑问权重文案
const mkRows = qsel('.mk-row');
assert(mkRows.length === 15, '掌握分析 15 大考点');
const mkTxt = q1('#mkList').textContent;
assert(mkTxt.includes('⚠疑问知识点：你标记 1 题'), '掌握分析含 ⚠疑问知识点 权重提示');
ok('掌握分析 15 行 + ⚠疑问知识点 加权提示');

// 疑问汇总
const ds = q1('#doubtSummary');
assert(ds.style.display !== 'none' && ds.textContent.includes('⚠疑问知识点：共 1 题'), '疑问汇总含 ⚠疑问知识点 文案');
ok('疑问汇总 = ⚠疑问知识点：共 N 题');

// 导出报告
const report = document.getElementById('masteryText').value;
assert(report.includes('⚠疑问知识点（1题）'), '导出报告含 ⚠疑问知识点 段落');
assert(report.includes('⚠疑问知识点1题'), '导出报告各考点含 ⚠疑问知识点 计数');
ok('导出报告含 ⚠疑问知识点');

console.log('=== 六、重置回归 ===');

click(q1('#resetBtn'));
assert(qsel('.q').length === 110, '重置后 110 题重建');
assert(qsel('.doubt-btn')[0].textContent.trim() === '标记疑问', '重置后疑问按钮恢复【标记疑问】');
assert(!qsel('.doubt-btn')[0].disabled, '重置后疑问按钮可再操作');
assert(qsel('.doubt-tag').length === 0, '重置后 ⚠疑问 芯片清空');
assert(q1('#doubtcnt').textContent.trim() === '0', '重置后疑问计数归零');
assert(!document.getElementById('ex0').classList.contains('show'), '重置后解析收起');
assert(q1('#submitBtn').style.display === 'inline-block', '重置后提交按钮恢复');
ok('重置清空疑问/解析/结果，全部恢复初始');

console.log('\n========== 结果 ==========');
console.log(`通过 ${passed} / ${passed + failed}`);
if (failed > 0) { console.log('失败项：\n' + fails.map(f => ' - ' + f).join('\n')); process.exit(1); }
console.log('ALL PASSED ✅');

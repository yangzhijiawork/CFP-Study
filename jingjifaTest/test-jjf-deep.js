// 经济法第一章总论互动习题 深度复核验收
// 补充 test-jjf-v3.js 未覆盖的边界：考点锚点可达性 / 101 题全量疑问流 / 空卷提交
// 多选漏选 / 双击提交 guard / 只看错题 / 疑问加权到掌握分析 / 弹框 ESC 与遮罩关闭 / 全量文案残留
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'hudongxiti', 'jingjifa', '第一章总论互动习题.html'), 'utf8');

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

function correctLabsFromDom(i) {
  const ansTxt = document.getElementById('ex' + i).querySelector('.ans').textContent.trim();
  if (ansTxt === '正确') return ['A'];
  if (ansTxt === '错误') return ['B'];
  return ansTxt.split('');
}
function answerCorrect(i) {
  correctLabsFromDom(i).forEach(l => {
    const inp = document.querySelector(`input[name="q${i}"][value="${l}"]`);
    if (inp) { inp.checked = true; fire(inp, 'change'); }
  });
}
function answerLabs(i, labs) {
  labs.forEach(l => {
    const inp = document.querySelector(`input[name="q${i}"][value="${l}"]`);
    if (inp) { inp.checked = true; fire(inp, 'change'); }
  });
}
const N = 101;

console.log('=== A. 结构与数据完整性 ===');

// A1. 题目数 & 每题结构
assert(qsel('.q').length === N, `渲染 ${N} 题`);
let structOk = true;
for (let i = 0; i < N; i++) {
  const card = document.getElementById('q' + i);
  if (!card) { structOk = false; continue; }
  if (!card.querySelector('.qno')) structOk = false;
  const inputs = card.querySelectorAll('input');
  const multi = card.querySelector('input[type="checkbox"]');
  const single = card.querySelector('input[type="radio"]');
  if (multi && single) structOk = false;
  if (!inputs.length) structOk = false;
  if (!card.querySelector('.btn-know[data-k]')) structOk = false;
  if (!card.querySelector('.doubt-btn[data-i]')) structOk = false;
}
assert(structOk, '每题均有题号/选项/知识讲解按钮/疑问按钮，单多选控件互斥');
ok('题目结构完整');

// A2. 判断题只有两个选项（正确/错误）
let judgeOk = true;
for (let i = 0; i < N; i++) {
  const card = document.getElementById('q' + i);
  const labs = Array.from(card.querySelectorAll('.opt .lab')).map(e => e.textContent.trim());
  if (labs.length === 2 && (labs.includes('正确') || labs.includes('错误'))) {
    if (labs.length !== 2 || !labs.includes('正确') || !labs.includes('错误')) judgeOk = false;
  }
}
assert(judgeOk, '判断题选项严格为 正确/错误 两个');
ok('判断题选项格式正确');

// A3. 每个考点 data-k 都有锚点区块
click(q1('#chapterBtn'));
const ksecIds = new Set(Array.from(qsel('.ksec')).map(s => s.id));
const navKs = Array.from(qsel('.sum-nav-btn')).map(b => b.getAttribute('data-k'));
assert(ksecIds.size === qsel('.ksec').length, '考点区块 id 唯一');
let anchorOk = true, navOk = true;
for (let i = 0; i < N; i++) {
  const k = document.getElementById('q' + i).querySelector('.btn-know').getAttribute('data-k');
  if (!ksecIds.has('kp-' + k)) anchorOk = false;
}
navKs.forEach(k => { if (!ksecIds.has('kp-' + k)) navOk = false; });
assert(anchorOk, `全部 ${N} 题的知识讲解锚点均可达`);
assert(navOk, '导航按钮 data-k 均有对应锚点区块');
assert(navKs.length === ksecIds.size, `导航数 = 区块数（${navKs.length}）`);
ok('考点锚点 100% 可达，无死链');
click(q1('#sumClose'));

// A4. 全量文案残留检查
const docTxt = document.body.textContent;
assert(!docTxt.includes('已标记'), '全文无【已标记】残留');
assert(!docTxt.includes('聚焦'), '全文无【聚焦】残留');
assert(qsel('.doubt-tag').length === 0, '无 .doubt-tag 芯片元素');
assert(!docTxt.includes('章节知识点按钮'), '无调试残留');
const chip = Array.from(qsel('*')).find(el => el.children.length === 0 && el.textContent.trim() === '⚠疑问');
assert(!chip, '无独立【⚠疑问】文本元素');
ok('文案无残留（已标记/聚焦/⚠疑问芯片均已清除）');

// A5. 顶栏按钮全部 type="button"
const topBtns = ['chapterBtn', 'filterBtn', 'resetBtn', 'submitBtn', 'explainBtn'];
assert(topBtns.every(id => q1('#' + id) && q1('#' + id).getAttribute('type') === 'button'), '5 个顶栏按钮均有 type="button"');
ok('顶栏按钮 type="button"');

console.log('=== B. 101 题全量疑问流 ===');

for (let i = 0; i < N; i++) click(qsel('.doubt-btn')[i]);
assert(q1('#doubtcnt').textContent.trim() === String(N), `全标后计数=${N}`);
let allOn = true;
qsel('.doubt-btn').forEach(b => { if (!b.classList.contains('on') || b.textContent.trim() !== '有疑问') allOn = false; });
assert(allOn, '全部按钮=有疑问 且 on 态');
assert(qsel('.q.doubt').length === N, '全部卡片带 doubt 边框高亮');
ok('全量标疑问：计数/文案/高亮一致');

click(q1('#submitBtn'));
assert(Array.from(qsel('.doubt-btn')).every(b => b.disabled), `提交后 ${N} 个疑问按钮全部 disabled`);
ok('提交后疑问按钮全锁定');

click(q1('#resetBtn'));
assert(q1('#doubtcnt').textContent.trim() === '0', '重置后计数归零');
assert(qsel('.q.doubt').length === 0, '重置后无 doubt 高亮');
assert(Array.from(qsel('.doubt-btn')).every(b => !b.disabled && b.textContent.trim() === '标记疑问'), '重置后全部恢复标记疑问且可操作');
ok('重置后疑问状态完全清空');

console.log('=== C. 判分边界 ===');

// C1. 空卷提交
click(q1('#submitBtn'));
assert(document.getElementById('scoreOk').textContent.trim() === '0', '空卷提交 → 0 分');
assert(document.getElementById('scorePct').textContent.includes('0%'), '空卷正确率 0%');
assert(q1('#submitBtn').style.display === 'none', '空卷提交后隐藏提交按钮');
assert(qsel('.q.res-wrong').length === N, `空卷 → ${N} 题全部标错`);
assert(Array.from(qsel('.doubt-btn')).every(b => b.disabled), '空卷提交后疑问仍锁定');
ok('空卷提交无异常，全题标错');

// C2. 双击提交 guard
const before = document.getElementById('scoreOk').textContent;
click(q1('#submitBtn'));
assert(document.getElementById('scoreOk').textContent === before, '重复点击提交不改变分数（guard 生效）');
assert(qsel('.my-ans-tip').length === N, '重复提交不重复插入作答提示');
ok('双击提交 guard 正常');

// C3. 多选漏选
click(q1('#resetBtn'));
let multiIdx = -1;
for (let i = 0; i < N; i++) {
  const c = document.getElementById('q' + i);
  if (c.querySelector('input[type="checkbox"]')) { multiIdx = i; break; }
}
assert(multiIdx >= 0, '存在多选题用于漏选测试');
const multiLabs = correctLabsFromDom(multiIdx);
assert(multiLabs.length >= 2, '该多选正确答案 ≥2 个');
for (let i = 0; i < N; i++) {
  if (i === multiIdx) answerLabs(i, multiLabs.slice(0, 1));
  else answerCorrect(i);
}
click(q1('#submitBtn'));
assert(document.getElementById('scoreOk').textContent.trim() === String(N - 1), `漏选 1 题 → ${N - 1} 分`);
const tipEl = document.getElementById('q' + multiIdx).querySelector('.my-ans-tip');
assert(!!tipEl && tipEl.textContent.includes('漏选 '), '漏选题出现【漏选 X】提示');
assert(tipEl && !tipEl.textContent.includes('错选'), '漏选题无【错选】误标');
assert(document.getElementById('q' + multiIdx).querySelectorAll('.opt.correct.missed').length === multiLabs.length - 1, '漏选选项带 correct+missed 标记');
ok('多选漏选：判错、漏选提示、选项标记全部正确');

// C4. 只看错题
click(q1('#filterBtn'));
assert(qsel('.q.dim').length === N - 1, '只看错题 → 非错题全部调暗 dim');
assert(q1('#filterBtn').textContent.trim() === '显示全部', 'filter 按钮文案=显示全部');
click(q1('#filterBtn'));
assert(qsel('.q.dim').length === 0, '显示全部 → 无调暗');
assert(q1('#filterBtn').textContent.trim() === '只看错题', 'filter 按钮文案恢复只看错题');
ok('只看错题/显示全部 切换正常');

console.log('=== D. 疑问加权 → 掌握分析 ===');

click(q1('#resetBtn'));
const k0 = document.getElementById('q0').querySelector('.btn-know').getAttribute('data-k');
let k1 = k0, idx1 = 0;
for (let i = 0; i < N; i++) {
  const k = document.getElementById('q' + i).querySelector('.btn-know').getAttribute('data-k');
  if (k !== k0) { k1 = k; idx1 = i; break; }
}
assert(k1 !== k0, '找到考点不同的题');
for (let i = 0; i < N; i++) answerCorrect(i);
click(qsel('.doubt-btn')[0]);
click(qsel('.doubt-btn')[idx1]);
click(q1('#submitBtn'));
const mkTxt = q1('#mkList').textContent;
assert(mkTxt.includes('疑问知识点：你标记 1 题（对 1 / 错 0）'), '答对+疑问 → 考点行【对 1 / 错 0】');
assert((mkTxt.match(/对 1 \/ 错 0/g) || []).length >= 2, '两个考点均显示 对1/错0 加权提示');
assert(mkTxt.includes('虽达标但含疑问，建议巩固'), '达标但含疑问 → 建议巩固提示');
const ds = q1('#doubtSummary');
assert(ds.style.display !== 'none' && ds.textContent.includes('共 2 题'), '疑问汇总=共 2 题');
const dscats = ds.textContent.match(/涉及考点：(.+?)。/);
assert(dscats && dscats[1].includes(k0) && dscats[1].includes(k1), '疑问汇总列出涉及考点');
const report = document.getElementById('masteryText').value;
assert(report.includes('疑问知识点（2题）'), '导出报告疑问段落=2题');
assert(report.includes('疑问知识点1题(对1/错0)'), '导出报告考点级疑问计数正确');
assert(report.includes('第1题') && report.includes(`第${idx1 + 1}题`), '导出报告疑问段落逐题列出');
assert(report.includes('(你标疑问)'), '导出报告疑问行带 (你标疑问) 标记');
ok('疑问加权：对而疑→建议巩固，面板聚合/导出明细计数一致');

// D2. 答错+标疑问
click(q1('#resetBtn'));
for (let i = 0; i < N; i++) { if (i !== 0) answerCorrect(i); }
click(qsel('.doubt-btn')[0]);
click(q1('#submitBtn'));
const mkTxt2 = q1('#mkList').textContent;
assert(mkTxt2.includes('疑问知识点：你标记 1 题（对 0 / 错 1）'), '答错+疑问 → 考点行【对 0 / 错 1】');
ok('疑问加权：错而疑→对0/错1');

console.log('=== E. 弹框交互细节 ===');

click(q1('#resetBtn'));
click(q1('#chapterBtn'));
assert(q1('#sumMask').classList.contains('show'), '章节知识点打开弹框');
click(q1('#sumClose'));
assert(!q1('#sumMask').classList.contains('show'), '关闭按钮可关');
click(q1('#chapterBtn'));
click(q1('#sumMask'));
assert(!q1('#sumMask').classList.contains('show'), '点遮罩可关闭');
click(q1('#chapterBtn'));
click(q1('.modal-box'));
assert(q1('#sumMask').classList.contains('show'), '点弹框内容区不误关');
document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
assert(!q1('#sumMask').classList.contains('show'), 'ESC 关闭弹框');
ok('关闭按钮/遮罩/ESC 三种关闭方式 + 内容区不误关');

click(qsel('.btn-know')[0]);
assert(q1('#sumMask').classList.contains('show'), '题内知识讲解打开弹框');
assert(!!q1('#kp-' + document.getElementById('q0').querySelector('.btn-know').getAttribute('data-k')), '锚点区块存在');
click(q1('#sumClose'));
ok('题内按钮锚点打开正常');

// E3. 弹框内容完整性
click(q1('#chapterBtn'));
const sumTxt = q1('#sumBody').textContent;
['整章思维导图', '民事法律行为', '代理', '仲裁', '民事诉讼', '行政复议', '行政诉讼', '真题印证', '知识链闭环', '全三单元完整详解'].forEach(k => assert(sumTxt.includes(k), `弹框仍含【${k}】`));
assert(qsel('.modal-body strong').length > 0, '弹框仍有加粗细节');
assert(qsel('.modal-body pre.ktree').length > 0, '弹框仍有思维导图树');
click(q1('#sumClose'));
ok('弹框全量内容复核通过');

console.log('\n========== 深度复核结果 ==========');
console.log(`通过 ${passed} / ${passed + failed}`);
if (failed > 0) { console.log('失败项：\n' + fails.map(f => ' - ' + f).join('\n')); process.exit(1); }
console.log('ALL PASSED ✅');

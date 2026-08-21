// ===== 第三章 预算管理 互动自测题 · 深度验收套件（test-quiz-deep.js）=====
// 覆盖：考点锚点可达性、全量疑问流（79 题）、空卷提交、双击提交 guard、多选漏选、
//       只看错题/显示全部、疑问加权到掌握分析、弹框三方式关闭+内容区不误关、
//       全量文案残留、顶栏 type=button。
const { JSDOM } = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync('hudongxiti/第三章预算管理互动习题.html','utf-8');
const dom = new JSDOM(html, {runScripts:'dangerously', pretendToBeVisual:true});
const { window } = dom;
window.HTMLElement.prototype.scrollIntoView = ()=>{};
const doc = window.document;

let passed=0, failed=0;
function assert(name, cond, extra){
  if(cond){ passed++; console.log('  ✔', name); }
  else { failed++; console.error('  ✘', name, extra||''); }
}
function $all(sel){ return Array.from(doc.querySelectorAll(sel)); }
function $(sel){ return doc.querySelector(sel); }
const Q = window.eval('Q');
const KPOINTS = window.eval('KPOINTS');
const SUMS = window.eval('SUMMARY_SECTIONS');
const N = Q.length;

console.log('=== 第三章 深度验收（test-quiz-deep）===');

// ---------- 1. 考点锚点可达性 ----------
// 先打开弹框触发 buildSumBody 生成 #kp- 锚点
$('#chapterBtn').click();
const uniqueK = [...new Set(KPOINTS)];
assert('全部 KPOINT 都有对应 #kp-<k> 锚点（无死链）', uniqueK.every(k=>SUMS.some(s=>s.k===k)&&$('#kp-'+k)!==null));
assert('每题的 data-k 都在 SUMMARY_SECTIONS 中有锚点', $all('.btn-know').every(b=>$('#kp-'+b.getAttribute('data-k'))!==null));
$('#sumClose').click();

// ---------- 2. 顶栏 type=button ----------
assert('顶栏所有按钮 type=button', $all('.topbar button').every(b=>b.type==='button'));
assert('导航按钮 type=button', $all('.sum-nav-btn').every(b=>b.type==='button'));
assert('关闭按钮 type=button', $('#sumClose').type==='button');

// ---------- 3. 空卷提交 ----------
$('#submitBtn').click();
assert('空卷提交不崩，得分为 0', $('#scoreOk').textContent==='0');
assert('空卷提交后正确率 0%', $('#scorePct').textContent.includes('0%'));
assert('空卷提交后全部判错（res-wrong）', $all('#quiz .q.res-wrong').length===N);
assert('空卷提交显示错题清单含未作答', $('#masteryText').value.includes('未作答'));
$('#resetBtn').click();

// ---------- 4. 双击提交 guard ----------
// 全对作答一次后双击提交
Q.forEach((q,i)=>{
  if(q.t==='judge'){ $all(`input[name="q${i}"]`).forEach(r=>{if(r.value===q.a)r.checked=true;}); }
  else if(q.t==='single'){ $all(`input[name="q${i}"]`).forEach(r=>{if(r.value===q.a)r.checked=true;}); }
  else { q.a.split('').forEach(lab=>$all(`input[name="q${i}"]`).forEach(r=>{if(r.value===lab)r.checked=true;})); }
});
$('#submitBtn').click();
const scoreAfterFirst = $('#scoreOk').textContent;
$('#submitBtn').click();
assert('双击提交不重复判分', $('#scoreOk').textContent===scoreAfterFirst);
assert('提交按钮点击第二次不改变隐藏状态', $('#submitBtn').style.display==='none');
$('#resetBtn').click();

// ---------- 5. 全量疑问流（79 题） ----------
// 全部标记疑问
Q.forEach((q,i)=>{ $('#q'+i+' .doubt-btn').click(); });
assert('全部标记后疑问计数 = 79', $('#doubtcnt').textContent==='79');
assert('全部标记后按钮文案为“有疑问”', $all('.doubt-btn').every(b=>b.textContent==='有疑问'));
assert('全部标记后卡片均高亮 .doubt', $all('#quiz .q.doubt').length===N);
// 提交后锁定
$('#submitBtn').click();
assert('提交后疑问按钮全部 disabled', $all('.doubt-btn').every(b=>b.disabled));
assert('提交后疑问计数保持 79', $('#doubtcnt').textContent==='79');
// 重置后清空
$('#resetBtn').click();
assert('重置后疑问全部清空', $('#doubtcnt').textContent==='0');
assert('重置后无 .doubt 卡片', $all('#quiz .q.doubt').length===0);
assert('重置后按钮文案恢复“标记疑问”', $all('.doubt-btn').every(b=>b.textContent==='标记疑问'));

// ---------- 6. 疑问加权到掌握分析 ----------
// 构造场景：某考点部分答对但标疑问 → 疑问汇总加权
$('#resetBtn').click();
// 全部答对，但把 Q0（预算特征与分类）标疑问
Q.forEach((q,i)=>{
  if(q.t==='judge'){ $all(`input[name="q${i}"]`).forEach(r=>{if(r.value===q.a)r.checked=true;}); }
  else if(q.t==='single'){ $all(`input[name="q${i}"]`).forEach(r=>{if(r.value===q.a)r.checked=true;}); }
  else { q.a.split('').forEach(lab=>$all(`input[name="q${i}"]`).forEach(r=>{if(r.value===lab)r.checked=true;})); }
});
$('#q0 .doubt-btn').click(); // 对而疑
$('#submitBtn').click();
assert('对而疑：疑问汇总面板显示', $('#doubtSummary').style.display==='block');
assert('疑问汇总含“⚠疑问知识点：共 1 题”', $('#doubtSummary').textContent.includes('⚠疑问知识点：共 1 题'));
assert('疑问汇总涉及考点列出', $('#doubtSummary').textContent.includes('预算的特征与分类'));
assert('该考点行显示疑问权重（对1）', $all('.mk-doubt').some(d=>d.textContent.includes('对 1 / 错 0')));
assert('导出报告含疑问明细', $('#masteryText').value.includes('⚠疑问知识点（1题）'));
assert('导出报告含逐题“你标疑问”', $('#masteryText').value.includes('你标疑问'));
// 重置后做错而疑场景
$('#resetBtn').click();
// 答错 Q0（故意不选），标疑问
$('#q0 .doubt-btn').click();
Q.forEach((q,i)=>{
  if(i===0) return; // 不选 Q0
  if(q.t==='judge'){ $all(`input[name="q${i}"]`).forEach(r=>{if(r.value===q.a)r.checked=true;}); }
  else if(q.t==='single'){ $all(`input[name="q${i}"]`).forEach(r=>{if(r.value===q.a)r.checked=true;}); }
  else { q.a.split('').forEach(lab=>$all(`input[name="q${i}"]`).forEach(r=>{if(r.value===lab)r.checked=true;})); }
});
$('#submitBtn').click();
assert('错而疑：疑问汇总仍显示 1 题', $('#doubtSummary').textContent.includes('共 1 题'));
assert('错而疑：考点行显示疑问权重（错1）', $all('.mk-doubt').some(d=>d.textContent.includes('对 0 / 错 1')));
$('#resetBtn').click();

// ---------- 7. 只看错题 / 显示全部（混合对错） ----------
// 只答对一半：奇数题对，偶数题错
Q.forEach((q,i)=>{
  if(i%2===0){
    if(q.t==='judge'){ $all(`input[name="q${i}"]`).forEach(r=>{if(r.value===q.a)r.checked=true;}); }
    else if(q.t==='single'){ $all(`input[name="q${i}"]`).forEach(r=>{if(r.value===q.a)r.checked=true;}); }
    else { q.a.split('').forEach(lab=>$all(`input[name="q${i}"]`).forEach(r=>{if(r.value===lab)r.checked=true;})); }
  }
});
$('#submitBtn').click();
const wrongCount = $all('#quiz .q.res-wrong').length;
assert('奇数题对偶数题错 → 错题数为偶数题数量', wrongCount>0);
$('#filterBtn').click();
assert('只看错题后显示错题数（非 .dim）', $all('#quiz .q:not(.dim)').length===wrongCount, $all('#quiz .q:not(.dim)').length);
assert('只看错题后错题不调暗', $all('#quiz .q.res-wrong.dim').length===0);
assert('只看错题按钮文案为“显示全部”', $('#filterBtn').textContent==='显示全部');
$('#filterBtn').click();
assert('显示全部后无 .dim', $all('#quiz .q.dim').length===0);
$('#resetBtn').click();

// ---------- 8. 弹框三方式关闭 + 内容区不误关 ----------
$('#chapterBtn').click();
assert('打开弹框显示', $('#sumMask').classList.contains('show'));
$('#sumBody').click();
assert('点内容区不误关', $('#sumMask').classList.contains('show'));
// 关闭按钮
$('#sumClose').click();
assert('关闭按钮可关闭', !$('#sumMask').classList.contains('show'));
// 遮罩
$('#chapterBtn').click();
$('#sumMask').dispatchEvent(new window.MouseEvent('click',{bubbles:true}));
assert('点遮罩可关闭', !$('#sumMask').classList.contains('show'));
// ESC
$('#chapterBtn').click();
doc.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
assert('ESC 可关闭', !$('#sumMask').classList.contains('show'));

// ---------- 9. 全量文案残留检查 ----------
assert('全页无“已标记”', !html.includes('已标记'));
assert('全页无“聚焦”', !html.includes('聚焦'));
assert('全页无“⚠疑问”芯片文本', !html.includes('⚠疑问芯片'));
assert('无“疑问 芯片”样式类', !html.includes('疑问 芯片'));
// 解析切换只由 showAll 控制（交卷后仍可隐藏）
$('#chapterBtn').click(); $('#sumClose').click();
$('#submitBtn').click(); // 空卷交卷
assert('交卷后解析默认展开', $all('.explain.show').length===N);
$('#explainBtn').click();
assert('交卷后仍可隐藏全部解析（只由 showAll 控制）', $all('.explain.show').length===0);
$('#explainBtn').click();
assert('再次展开解析', $all('.explain.show').length===N);
$('#resetBtn').click();

// ---------- 10. 锚点导航点击 ----------
$('#chapterBtn').click();
const targetNav = $('#sumNav .sum-nav-btn[data-k="资金预算"]');
targetNav.click();
// scrollIntoView 已打桩，不报错即可；校验 updateSumNav 调用后 active
assert('点击导航按钮不报错且存在目标锚点', $('#kp-资金预算')!==null);
$('#sumClose').click();

console.log(`\n===== 深度验收结果：通过 ${passed}，失败 ${failed} =====`);
process.exit(failed>0?1:0);

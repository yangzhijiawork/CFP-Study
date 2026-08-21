const { JSDOM } = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync('hudongxiti/第五章筹资管理下互动习题.html','utf-8');
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

console.log('=== 第五章 深度验收 ===');

// 锚点可达
$('#chapterBtn').click();
const uniqueK = [...new Set(KPOINTS)];
assert('全部KPOINT有锚点', uniqueK.every(k=>SUMS.some(s=>s.k===k)&&$('#kp-'+k)!==null));
assert('每题data-k有锚点', $all('.btn-know').every(b=>$('#kp-'+b.getAttribute('data-k'))!==null));
$('#sumClose').click();

// 空卷
$('#submitBtn').click();
assert('空卷得分0', $('#scoreOk').textContent==='0');
assert('空卷全错', $all('#quiz .q.res-wrong').length===N);
assert('空卷有未作答', $('#masteryText').value.includes('未作答'));
$('#resetBtn').click();

// 双击
Q.forEach((q,i)=>{
  if(q.t==='judge'||q.t==='single'){ $all(`input[name="q${i}"]`).forEach(r=>{if(r.value===q.a)r.checked=true;}); }
  else { q.a.split('').forEach(lab=>$all(`input[name="q${i}"]`).forEach(r=>{if(r.value===lab)r.checked=true;})); }
});
$('#submitBtn').click();
const score = $('#scoreOk').textContent;
$('#submitBtn').click();
assert('双击不重复', $('#scoreOk').textContent===score);
$('#resetBtn').click();

// 全量疑问
Q.forEach((q,i)=>{ $('#q'+i+' .doubt-btn').click(); });
assert('全标计数='+N, $('#doubtcnt').textContent===String(N));
assert('全标文案', $all('.doubt-btn').every(b=>b.textContent==='有疑问'));
$('#submitBtn').click();
assert('提交后锁定', $all('.doubt-btn').every(b=>b.disabled));
$('#resetBtn').click();
assert('重置清空', $('#doubtcnt').textContent==='0');

// 疑问加权
$('#resetBtn').click();
Q.forEach((q,i)=>{
  if(q.t==='judge'||q.t==='single'){ $all(`input[name="q${i}"]`).forEach(r=>{if(r.value===q.a)r.checked=true;}); }
  else { q.a.split('').forEach(lab=>$all(`input[name="q${i}"]`).forEach(r=>{if(r.value===lab)r.checked=true;})); }
});
$('#q0 .doubt-btn').click();
$('#submitBtn').click();
assert('疑问汇总显示', $('#doubtSummary').style.display==='block');
assert('疑问汇总含共1题', $('#doubtSummary').textContent.includes('共 1 题'));
assert('报告含疑问明细', $('#masteryText').value.includes('⚠疑问知识点'));
$('#resetBtn').click();

// 只看错题
Q.forEach((q,i)=>{
  if(i%2===0){
    if(q.t==='judge'||q.t==='single'){ $all(`input[name="q${i}"]`).forEach(r=>{if(r.value===q.a)r.checked=true;}); }
    else { q.a.split('').forEach(lab=>$all(`input[name="q${i}"]`).forEach(r=>{if(r.value===lab)r.checked=true;})); }
  }
});
$('#submitBtn').click();
const wrongCount = $all('#quiz .q.res-wrong').length;
$('#filterBtn').click();
assert('只看错题数量正确', $all('#quiz .q:not(.dim)').length===wrongCount);
assert('按钮文案切换', $('#filterBtn').textContent==='显示全部');
$('#filterBtn').click();
assert('显示全部无dim', $all('#quiz .q.dim').length===0);
$('#resetBtn').click();

// 弹框三方式关闭
$('#chapterBtn').click();
assert('弹框打开', $('#sumMask').classList.contains('show'));
$('#sumBody').click();
assert('内容区不误关', $('#sumMask').classList.contains('show'));
$('#sumClose').click();
assert('关闭按钮关', !$('#sumMask').classList.contains('show'));
$('#chapterBtn').click();
$('#sumMask').dispatchEvent(new window.MouseEvent('click',{bubbles:true}));
assert('遮罩关', !$('#sumMask').classList.contains('show'));
$('#chapterBtn').click();
doc.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
assert('ESC关', !$('#sumMask').classList.contains('show'));

// 文案残留
assert('无已标记', !html.includes('已标记'));
assert('无聚焦', !html.includes('聚焦'));

console.log(`\n===== 深度验收：通过 ${passed}，失败 ${failed} =====`);
process.exit(failed>0?1:0);

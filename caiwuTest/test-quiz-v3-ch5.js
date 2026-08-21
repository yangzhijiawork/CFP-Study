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
function $(sel){ return doc.querySelector(sel); }
function $all(sel){ return Array.from(doc.querySelectorAll(sel)); }
const Q = window.eval('Q');
const KPOINTS = window.eval('KPOINTS');
const SUMS = window.eval('SUMMARY_SECTIONS');
const N = Q.length;
const NUM_KPOINTS = 14;

console.log('=== 第五章 主验收 ===');
assert('题卡数量 = '+N, $all('#quiz .q').length===N);
assert('标题含第五章', doc.title.includes('第五章 筹资管理'));
assert('h1正确', $('header h1').textContent.includes('第五章 筹资管理（下） 互动自测题'));
assert('副标题含共 '+N+' 题', $('header p').textContent.includes('共 '+N+' 题'));
assert('已答=0', $('#answered').textContent==='0');
assert('提交按钮', $('button#submitBtn').textContent==='提交答卷');
assert('5按钮type=button', $all('.topbar button').every(b=>b.type==='button'));
assert('疑问按钮文案', $all('.doubt-btn').every(b=>b.textContent==='标记疑问'));
assert('无已标记', !html.includes('已标记'));
assert('无聚焦', !html.includes('聚焦'));
assert('每题有解析', $all('.explain').length===N);
assert('解析默认隐藏', $all('.explain.show').length===0);
assert('判断题选项', Q.filter(q=>q.t==='judge').every(q=>q.o[0][1]==='正确'&&q.o[1][1]==='错误'));
const types = new Set(Q.map(q=>q.t));
assert('题型覆盖', ['single','multi','judge'].every(t=>types.has(t)));

// 弹框
$('#chapterBtn').click();
assert('弹框显示', $('#sumMask').classList.contains('show'));
assert('导航按钮数', $all('#sumNav .sum-nav-btn').length===SUMS.length);
SUMS.forEach(s=>{ assert('锚点'+s.k, $('#kp-'+s.k)!==null); });
assert('有思维导图', $all('#sumBody pre.ktree').length>=1);
assert('有表格', $all('#sumBody table.ktab').length>=1);
assert('有加粗', $all('#sumBody strong').length>=1);
assert('有速查表', $('#kp-速查表')!==null);
assert('有闭环', $('#kp-闭环')!==null);
$('#sumClose').click();
assert('关闭按钮可关', !$('#sumMask').classList.contains('show'));

// 疑问标记
$('#q0 .doubt-btn').click();
assert('标疑问', $('#q0 .doubt-btn').textContent==='有疑问');
assert('卡片高亮', $('#q0').classList.contains('doubt'));
assert('计数1', $('#doubtcnt').textContent==='1');
$('#q0 .doubt-btn').click();
assert('取消', $('#q0 .doubt-btn').textContent==='标记疑问');

// 判分
Q.forEach((q,i)=>{
  if(q.t==='judge'||q.t==='single'){ $all(`input[name="q${i}"]`).forEach(r=>{if(r.value===q.a)r.checked=true;}); }
  else { q.a.split('').forEach(lab=>$all(`input[name="q${i}"]`).forEach(r=>{if(r.value===lab)r.checked=true;})); }
});
$('#submitBtn').click();
assert('得分='+N, $('#scoreOk').textContent===String(N));
assert('100%', $('#scorePct').textContent.includes('100%'));
assert('提交隐藏', $('#submitBtn').style.display==='none');
assert('全部解析展开', $all('.explain.show').length===N);
assert('绿框', $all('.q.res-correct').length===N);
assert('掌握分析', $all('.mk-row').length===NUM_KPOINTS);
assert('无薄弱', $all('.weak-tags .wt').length===0);

// 导出
$('#exportBtn').click();
assert('报告含标题', $('#masteryText').value.includes('第五章 筹资管理（下） 自测结果'));
assert('报告含总分', $('#masteryText').value.includes(`总分：${N}/${N}`));

// 重置
$('#resetBtn').click();
assert('重置后已答0', $('#answered').textContent==='0');
assert('重置后提交显示', $('#submitBtn').style.display==='inline-block');

console.log(`\n===== 主验收：通过 ${passed}，失败 ${failed} =====`);
process.exit(failed>0?1:0);

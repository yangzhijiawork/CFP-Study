const { JSDOM } = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync('hudongxiti/第九章收入与分配管理互动习题.html','utf-8');
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
const NUM_KPOINTS = 4;

console.log('=== 第九章 主验收（test-quiz-v3-ch9）===');
console.log(`题目总数 Q=${N}，知识讲解区块=${SUMS.length}`);

// ---------- 1. 渲染与文案 ----------
assert('题卡数量 = Q 长度', $all('#quiz .q').length===N, $all('#quiz .q').length);
assert('标题含“第九章 收入与分配管理”', doc.title.includes('第九章 收入与分配管理'));
assert('头部 h1 含“第九章 收入与分配管理”', $('header h1').textContent.includes('第九章 收入与分配管理'));
assert('头部副标题含“共 '+N+' 题”', $('header p').textContent.includes('共 '+N+' 题'));
assert('顶栏“已答”初始为 0', $('#answered').textContent==='0');
assert('顶栏“正确”初始为 0', $('#rightcnt').textContent==='0');
assert('顶栏“疑问”初始为 0', $('#doubtcnt').textContent==='0');
assert('顶栏“提交答卷”按钮存在且文案正确', $('button#submitBtn').textContent==='提交答卷');
assert('顶栏 5 个按钮 type=button', $all('.topbar button').every(b=>b.type==='button'));
assert('章节知识点按钮文案', $('#chapterBtn').textContent==='章节知识点');
assert('重置按钮文案', $('#resetBtn').textContent==='重置');
assert('只看错题初始隐藏', $('#filterBtn').style.display==='none');
assert('解析按钮初始隐藏', $('#explainBtn').style.display==='none');
assert('首题题号显示 1', $('#q0 .qno').textContent==='1');
assert('末题题号显示 '+N, $('#q'+(N-1)+' .qno').textContent===String(N));

// 疑问按钮文案规范
assert('疑问按钮统一用“标记疑问”', $all('.doubt-btn').every(b=>b.textContent==='标记疑问'));
assert('全页无“已标记”', !html.includes('已标记'));
assert('全页无“聚焦”', !html.includes('聚焦'));

// ---------- 2. 题卡结构 ----------
assert('每题有 .q-head', $all('.q-head').length===N);
assert('每题有 .opts', $all('.opts').length===N);
assert('每题有 .explain（解析）', $all('.explain').length===N);
assert('每题解析默认隐藏（无 .show）', $all('.explain.show').length===0);
assert('每题解析含“✓ 正确答案：”', $all('.et').length===N);
assert('每题解析含“知识讲解”按钮', $all('.btn-know').length===N);
assert('知识讲解按钮文案为“📖 知识讲解：「k」”', $all('.btn-know').every(b=>b.textContent.startsWith('📖 知识讲解：「')&&b.textContent.endsWith('」')));
assert('判断题选项为正确/错误', Q.filter(q=>q.t==='judge').every(q=>q.o[0][0]==='A'&&q.o[0][1]==='正确'&&q.o[1][1]==='错误'));
const types = new Set(Q.map(q=>q.t));
assert('题型覆盖单选/多选/判断', ['single','multi','judge'].every(t=>types.has(t)));

// ---------- 3. 知识讲解弹框全量 ----------
$('#chapterBtn').click();
assert('点击章节知识点后弹框显示', $('#sumMask').classList.contains('show'));
assert('弹框标题含“第九章 收入与分配管理”', $('.modal-head span').textContent.includes('第九章 收入与分配管理'));
assert('吸顶导航存在', $('#sumNav')!==null);
assert('导航按钮数量 = SUMMARY_SECTIONS 数量', $all('#sumNav .sum-nav-btn').length===SUMS.length);
assert('导航贴标题（在 modal-head 之后、sumBody 之前）', $('#sumNav').nextElementSibling.id==='sumBody');
SUMS.forEach(s=>{
  assert('锚点区块存在 #kp-'+s.k, $('#kp-'+s.k)!==null);
});
assert('思维导图树渲染为 pre.ktree', $all('#sumBody pre.ktree').length>=1);
assert('知识详解含表格 ktab', $all('#sumBody table.ktab').length>=1);
assert('知识详解含加粗 strong', $all('#sumBody strong').length>=1);
assert('速查表锚点存在', $('#kp-速查表')!==null);
assert('闭环锚点存在', $('#kp-闭环')!==null);
// 关闭按钮
$('#sumClose').click();
assert('关闭按钮可关闭弹框', !$('#sumMask').classList.contains('show'));
$('#chapterBtn').click();
$('#sumMask').dispatchEvent(new window.MouseEvent('click',{bubbles:true}));
$('#chapterBtn').click();
$('#sumBody').dispatchEvent(new window.MouseEvent('click',{bubbles:true}));
assert('点内容区不误关', $('#sumMask').classList.contains('show'));
doc.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
assert('ESC 可关闭弹框', !$('#sumMask').classList.contains('show'));

// ---------- 4. scrollspy ----------
$('#chapterBtn').click();
const sumBody = $('#sumBody');
SUMS.forEach((s,i)=>{ Object.defineProperty($('#kp-'+s.k),'offsetTop',{value:i*100,configurable:true}); });
Object.defineProperty(sumBody,'scrollTop',{value:230});
sumBody.dispatchEvent(new window.Event('scroll'));
assert('scrollspy 高亮当前考点', $all('#sumNav .sum-nav-btn.active').length>=1);
const activeNav = $('#sumNav .sum-nav-btn.active');
assert('滚动后高亮锚点对应', activeNav && activeNav.getAttribute('data-k')==='纳税管理', activeNav?activeNav.getAttribute('data-k'):'none');
$('#sumClose').click();

// ---------- 5. 疑问标记 ----------
assert('首题疑问按钮初始文案', $('#q0 .doubt-btn').textContent==='标记疑问');
$('#q0 .doubt-btn').click();
assert('标记后按钮文案为“有疑问”', $('#q0 .doubt-btn').textContent==='有疑问');
assert('标记后卡片高亮 .doubt', $('#q0').classList.contains('doubt'));
assert('顶栏疑问计数为 1', $('#doubtcnt').textContent==='1');
$('#q0 .doubt-btn').click();
assert('反选后按钮文案为“标记疑问”', $('#q0 .doubt-btn').textContent==='标记疑问');
assert('反选后顶栏疑问计数为 0', $('#doubtcnt').textContent==='0');
$('#q1 .doubt-btn').click();
$('#q2 .doubt-btn').click();
assert('多题疑问计数', $('#doubtcnt').textContent==='2');
$('#q1 .doubt-btn').click();
$('#q2 .doubt-btn').click();

// ---------- 6. 判分 ----------
Q.forEach((q,i)=>{
  if(q.t==='judge'||q.t==='single'){ $all(`input[name="q${i}"]`).forEach(r=>{if(r.value===q.a)r.checked=true;}); }
  else { q.a.split('').forEach(lab=>$all(`input[name="q${i}"]`).forEach(r=>{if(r.value===lab)r.checked=true;})); }
});
$('#submitBtn').click();
assert('判分正确题数 = '+N, $('#scoreOk').textContent===String(N));
assert('正确率显示', $('#scorePct').textContent.includes('100%'));
assert('提交后隐藏提交按钮', $('#submitBtn').style.display==='none');
assert('提交后显示解析按钮', $('#explainBtn').style.display==='inline-block');
assert('提交后解析按钮文案为“隐藏全部解析”', $('#explainBtn').textContent==='隐藏全部解析');
assert('提交后显示只看错题', $('#filterBtn').style.display==='inline-block');
assert('提交后全部解析展开（show）', $all('.explain.show').length===N);
assert('正确题绿框', $all('.q.res-correct').length===N);
assert('疑问按钮提交后锁定 disabled', $all('.doubt-btn').every(b=>b.disabled));
assert('结果区显示', $('#result').classList.contains('show'));
assert('掌握分析区显示', $('#mastery').classList.contains('show'));

// 掌握分析
const mkRows = $all('.mk-row');
assert('掌握分析行数 = '+NUM_KPOINTS+' 考点', mkRows.length===NUM_KPOINTS, mkRows.length);
assert('掌握分析无薄弱标签', $all('.weak-tags .wt').length===0);
assert('全部考点达标提示', $('#weakTags').textContent.includes('所有样本充足的考点均达标'));

// 导出报告
$('#exportBtn').click();
assert('导出报告含标题“第九章 收入与分配管理 自测结果”', $('#masteryText').value.includes('第九章 收入与分配管理 自测结果'));
assert('导出报告含总分', $('#masteryText').value.includes(`总分：${N}/${N}`));
assert('导出报告含考点行', $('#masteryText').value.includes('收入管理'));
assert('导出报告含“错题清单”', $('#masteryText').value.includes('错题清单'));
assert('导出报告含“薄弱模块”', $('#masteryText').value.includes('薄弱模块'));

// ---------- 7. 只看错题 / 显示全部 ----------
$('#filterBtn').click();
assert('全部正确时只看错题将所有题调暗（.dim）', $all('#quiz .q.dim').length===N);
assert('只看错题按钮文案切换为“显示全部”', $('#filterBtn').textContent==='显示全部');
$('#filterBtn').click();
assert('显示全部后无 .dim', $all('#quiz .q.dim').length===0);

// ---------- 8. 解析切换 ----------
$('#explainBtn').click();
assert('隐藏全部解析后 .show 为 0', $all('.explain.show').length===0);
assert('切换后文案为“查看全部解析”', $('#explainBtn').textContent==='查看全部解析');
$('#explainBtn').click();
assert('查看全部解析后 .show 为 N', $all('.explain.show').length===N);

// ---------- 9. 重置回归 ----------
$('#resetBtn').click();
assert('重置后已答为 0', $('#answered').textContent==='0');
assert('重置后疑问为 0', $('#doubtcnt').textContent==='0');
assert('重置后题卡无 .doubt', $all('#quiz .q.doubt').length===0);
assert('重置后题卡无 .res-correct/.res-wrong', $all('#quiz .q.res-correct, #quiz .q.res-wrong').length===0);
assert('重置后提交按钮重新显示', $('#submitBtn').style.display==='inline-block');
assert('重置后解析按钮隐藏', $('#explainBtn').style.display==='none');
assert('重置后只看错题隐藏', $('#filterBtn').style.display==='none');
assert('重置后结果区隐藏', !$('#result').classList.contains('show'));
assert('重置后掌握分析隐藏', !$('#mastery').classList.contains('show'));
assert('重置后疑问按钮可点', !$('#q0 .doubt-btn').disabled);

// ---------- 10. 多选漏选提示 ----------
$('#resetBtn').click();
const multiIdx = Q.findIndex(q=>q.t==='multi');
if(multiIdx>=0){
  Q.forEach((q,i)=>{
    if(i===multiIdx){ $all(`input[name="q${i}"]`).forEach((r,idx)=>{ if(idx===0) r.checked=true; }); }
    else if(q.t==='judge'||q.t==='single'){ $all(`input[name="q${i}"]`).forEach(r=>{if(r.value===q.a)r.checked=true;}); }
    else { q.a.split('').forEach(lab=>$all(`input[name="q${i}"]`).forEach(r=>{if(r.value===lab)r.checked=true;})); }
  });
  $('#submitBtn').click();
  assert('多选只勾首项被判错', $('#q'+multiIdx).classList.contains('res-wrong'));
  assert('多选错题出现漏选提示', ($('#q'+multiIdx).textContent.includes('漏选')));
  assert('正确答案选项标记 .correct', $all(`#q${multiIdx} .opt.correct`).length>0);
  assert('漏选正确项标记 .missed', $all(`#q${multiIdx} .opt.missed`).length>0);
}

console.log(`\n===== 主验收结果：通过 ${passed}，失败 ${failed} =====`);
process.exit(failed>0?1:0);

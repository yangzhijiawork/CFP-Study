// 第一章互动习题 v3 验收测试：覆盖 bug修复 + 疑问标记 + 知识详解弹框
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const file = path.join(__dirname, '第一章总论互动习题.html');
const html = fs.readFileSync(file, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function check(name, cond, extra) {
  if (cond) { pass++; }
  else { fail++; fails.push(name + (extra ? ' => ' + extra : '')); }
}

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  beforeParse(window) {
    window.HTMLElement.prototype.scrollIntoView = function () {};
  }
});
const doc = dom.window.document;

function selectAnswer(i, labs) {
  const inputs = doc.querySelectorAll(`input[name="q${i}"]`);
  inputs.forEach(inp => {
    inp.checked = labs.includes(inp.value);
    inp.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  });
}
function correctLabsFromDom(i) {
  const ansTxt = doc.getElementById('ex' + i).querySelector('.ans').textContent.trim();
  if (ansTxt === '正确') return ['A'];
  if (ansTxt === '错误') return ['B'];
  return ansTxt.split(''); // 单选/多选：直接是字母串
}

// ===== 基础渲染 =====
check('题目渲染51题', doc.querySelectorAll('.q').length === 51, doc.querySelectorAll('.q').length);
check('每题有疑问按钮', doc.querySelectorAll('.doubt-btn').length === 51);
check('每题有知识详解按钮(隐藏)', doc.querySelectorAll('.btn-know').length === 51);
check('顶部有章节知识点按钮', !!doc.getElementById('chapterBtn'));

// ===== 疑问标记：提交前可切换 =====
const db3 = doc.querySelector('.doubt-btn[data-i="3"]');
db3.click();
check('提交前标记疑问→卡片加doubt类', doc.getElementById('q3').classList.contains('doubt'));
check('提交前疑问按钮文字变已疑问', db3.textContent === '已疑问');
check('疑问计数=1', doc.getElementById('doubtcnt').textContent === '1', doc.getElementById('doubtcnt').textContent);
db3.click(); // 反选
check('再次点击反选→doubt类移除', !doc.getElementById('q3').classList.contains('doubt'));
check('反选后疑问计数=0', doc.getElementById('doubtcnt').textContent === '0');

// 标记若干疑问（用于后续掌握分析校验）：题0、题20、题37
[0,20,37].forEach(i => doc.querySelector(`.doubt-btn[data-i="${i}"]`).click());
check('标记3题后疑问计数=3', doc.getElementById('doubtcnt').textContent === '3', doc.getElementById('doubtcnt').textContent);

// ===== 作答：前40题全对，后11题错（含标记过的题0/20/37中0和20在前40，37在后11）=====
for (let i = 0; i < 51; i++) {
  const c = correctLabsFromDom(i);
  if (i < 40) selectAnswer(i, c);
  else { const all = Array.from(doc.querySelectorAll(`input[name="q${i}"]`)).map(x => x.value); const wrong = all.find(l => !c.includes(l)); selectAnswer(i, [wrong]); }
}
check('已答计数=51', doc.getElementById('answered').textContent === '51', doc.getElementById('answered').textContent);

// ===== 提交 =====
doc.getElementById('submitBtn').click();
check('得分=40', doc.getElementById('scoreOk').textContent === '40', doc.getElementById('scoreOk').textContent);
check('正确计数=40', doc.getElementById('rightcnt').textContent === '40', doc.getElementById('rightcnt').textContent);
check('提交后疑问按钮被禁用(锁定)', doc.querySelector('.doubt-btn[data-i="0"]').disabled === true);
// 锁定的疑问尝试反选应无效
doc.querySelector('.doubt-btn[data-i="0"]').click();
check('提交后疑问锁定不可改(仍为doubt)', doc.getElementById('q0').classList.contains('doubt'));

// ===== bug修复：查看/隐藏全部解析 =====
const exBtn = doc.getElementById('explainBtn');
check('提交后解析默认显示(showAll)', [...doc.querySelectorAll('.explain')].every(e => e.classList.contains('show')));
check('提交后按钮文字=隐藏全部解析', exBtn.textContent === '隐藏全部解析', exBtn.textContent);
exBtn.click(); // 点隐藏
const shownAfterHide = [...doc.querySelectorAll('.explain')].filter(e => e.classList.contains('show')).length;
check('点击隐藏后所有解析收起', shownAfterHide === 0, shownAfterHide);
check('隐藏后按钮文字=查看全部解析', exBtn.textContent === '查看全部解析', exBtn.textContent);
exBtn.click(); // 点查看
const shownAfterShow = [...doc.querySelectorAll('.explain')].filter(e => e.classList.contains('show')).length;
check('再次点击后所有解析展开', shownAfterShow === 51, shownAfterShow);

// ===== 掌握分析含疑问权重 =====
const mkList = doc.getElementById('mkList').innerHTML;
check('掌握面板渲染7个考点', (mkList.match(/mk-row/g) || []).length === 7);
check('掌握面板含疑问提示文字', mkList.includes('你标记疑问'));
const ds = doc.getElementById('doubtSummary');
check('疑问汇总块可见', ds.style.display === 'block');
check('疑问汇总提到3题', /疑问标记共\s*3\s*题/.test(ds.textContent), ds.textContent.slice(0,40));
// 导出报告含疑问标记
const report = doc.getElementById('masteryText').value;
check('导出报告含疑问标记段落', report.includes('疑问标记（3题）'));
check('导出报告含你标疑问字样', report.includes('你标疑问'));

// ===== 知识详解弹框 =====
doc.getElementById('chapterBtn').click();
check('章节知识点→弹框显示', doc.getElementById('sumMask').classList.contains('show'));
check('弹框已构建(缓存built)', doc.getElementById('sumBody').dataset.built === '1');
check('弹框含7个知识点section+速查', doc.querySelectorAll('#sumBody .ksec').length === 8, doc.querySelectorAll('#sumBody .ksec').length);
check('section锚点 kp-企业组织形式 存在', !!doc.getElementById('kp-企业组织形式'));
check('section锚点 kp-经济环境 存在', !!doc.getElementById('kp-经济环境'));
check('section锚点含表格渲染', doc.querySelectorAll('#sumBody table.ktab').length > 0, doc.querySelectorAll('#sumBody table.ktab').length);
check('导航按钮含企业组织形式', [...doc.querySelectorAll('.sum-nav-btn')].some(b => b.textContent === '企业组织形式'));
// 通过某题的"知识详解"按钮打开并定位
const knowBtn = doc.querySelector('.btn-know[data-k="经济环境"]');
knowBtn.click();
check('点知识详解→弹框显示', doc.getElementById('sumMask').classList.contains('show'));
check('经济环境锚点存在(可定位)', !!doc.getElementById('kp-经济环境'));
// 关闭弹框
doc.getElementById('sumClose').click();
check('关闭后弹框隐藏', !doc.getElementById('sumMask').classList.contains('show'));

// ===== 重置：清空疑问+状态 =====
doc.getElementById('resetBtn').click();
check('重置后疑问计数=0', doc.getElementById('doubtcnt').textContent === '0', doc.getElementById('doubtcnt').textContent);
check('重置后无doubt类卡片', doc.querySelectorAll('.q.doubt').length === 0);
check('重置后疑问按钮恢复可点', doc.querySelector('.doubt-btn[data-i="0"]').disabled === false);
check('重置后结果面板隐藏', !doc.getElementById('result').classList.contains('show'));
check('重置后解析默认隐藏', [...doc.querySelectorAll('.explain')].every(e => !e.classList.contains('show')));
check('重置后可重新标记疑问', (doc.querySelector('.doubt-btn[data-i="5"]').click(), doc.getElementById('q5').classList.contains('doubt')));

console.log(`\n========== 验收结果 ==========`);
console.log(`通过 ${pass} 项，失败 ${fail} 项`);
if (fail) { console.log('失败项：'); fails.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
else console.log('✅ 全部通过');

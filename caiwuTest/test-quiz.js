const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('/Users/yzj/WorkBuddy/2026-08-06-07-25-28/第一章总论互动习题.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
const { window } = dom;
const doc = window.document;

// jsdom 未实现 scrollIntoView，打桩避免 submit 抛错
window.HTMLElement.prototype.scrollIntoView = function(){};

const results = [];
function check(name, cond, detail) {
  results.push({ name, pass: !!cond, detail: detail || '' });
}

// 1. 题目数量渲染正确
const cards = doc.querySelectorAll('.q');
check('题目渲染数量=51', cards.length === 51, `实际渲染 ${cards.length} 题`);

// 2. 顶部统计初始化
check('顶部"已答"初始为0', doc.getElementById('answered').textContent === '0');

// ---- 模拟作答：从页面渲染的"正确答案"反读，构造已知对错 ----
// 策略：前 40 题按正确答案作答（全对），后 11 题故意选错项（全错）
function correctLabsFromDom(i) {
  const ansTxt = doc.getElementById('ex' + i).querySelector('.ans').textContent.trim();
  if (ansTxt === '正确') return ['A'];
  if (ansTxt === '错误') return ['B'];
  return ansTxt.split(''); // 单选用例为单字母，多选用例为多字母
}

function selectAnswer(i, labs) {
  const inputs = doc.querySelectorAll(`input[name="q${i}"]`);
  inputs.forEach(inp => {
    inp.checked = labs.includes(inp.value);
    inp.dispatchEvent(new window.Event('change', { bubbles: true }));
  });
}

let expectedRight = 0;
for (let i = 0; i < 51; i++) {
  const c = correctLabsFromDom(i);
  if (i < 40) {
    selectAnswer(i, c);
    expectedRight++;
  } else {
    const allLabs = Array.from(doc.querySelectorAll(`input[name="q${i}"]`)).map(inp => inp.value);
    const wrong = allLabs.find(l => !c.includes(l));
    selectAnswer(i, [wrong]);
  }
}
check('前40题按正确作答、后11题故意答错 构造成功', true, `预期正确 ${expectedRight} 题`);

// 3. 作答后"已答"统计正确
check('作答后"已答"=51', doc.getElementById('answered').textContent === '51', `实际 ${doc.getElementById('answered').textContent}`);

// 4. 点击提交
doc.getElementById('submitBtn').click();

// 5. 结果面板出现
check('提交后结果面板显示', doc.getElementById('result').classList.contains('show'));

// 6. 得分=40（前40对，后11错）
check('得分=40', doc.getElementById('scoreOk').textContent === '40', `实际 ${doc.getElementById('scoreOk').textContent}`);
check('正确率文本正确', doc.getElementById('scorePct').textContent === '正确率 78%', `实际 "${doc.getElementById('scorePct').textContent}"`);

// 7. 正确题标记 res-correct，错误题标记 res-wrong
let correctMarks=0, wrongMarks=0;
for (let i=0;i<51;i++){
  const card=doc.getElementById('q'+i);
  if(card.classList.contains('res-correct')) correctMarks++;
  if(card.classList.contains('res-wrong')) wrongMarks++;
}
check('res-correct 标记=40', correctMarks===40, `实际 ${correctMarks}`);
check('res-wrong 标记=11', wrongMarks===11, `实际 ${wrongMarks}`);

// 8. 正确选项被高亮（.opt.correct），错误勾选被标红（.opt.wrong）
// 取第1题（对）：应有一个 .opt.correct
const q0 = doc.getElementById('q0');
check('第1题正确项高亮', q0.querySelector('.opt.correct') !== null);
// 取第50题（错）：应有一个 .opt.wrong（用户勾选的错误项）
const q50 = doc.getElementById('q50');
check('第51题错误勾选标红', q50.querySelector('.opt.wrong') !== null);

// 9. 解析展开
check('第1题解析已展开', doc.getElementById('ex0').classList.contains('show'));

// 10. 提交后提交按钮隐藏，解析/错题按钮出现
check('提交后提交按钮隐藏', doc.getElementById('submitBtn').style.display === 'none');
check('解析按钮显示', doc.getElementById('explainBtn').style.display === 'inline-block');
check('只看错题按钮显示', doc.getElementById('filterBtn').style.display === 'inline-block');

// 11. 点击"查看全部解析"切换
doc.getElementById('explainBtn').click();
check('点击查看全部解析后按钮文案变为隐藏', doc.getElementById('explainBtn').textContent.includes('隐藏'));

// 12. 点击"只看错题"过滤：应只剩 11 题可见
doc.getElementById('filterBtn').click();
let visible=0;
for(let i=0;i<51;i++){ if(!doc.getElementById('q'+i).classList.contains('dim')) visible++; }
check('只看错题后可见=11', visible===11, `实际可见 ${visible}`);

// 13. 知识点掌握情况面板
check('提交后掌握情况面板显示', doc.getElementById('mastery').classList.contains('show'));
const mkRows = doc.querySelectorAll('#mkList .mk-row');
check('考点归类行数=7', mkRows.length === 7, `实际 ${mkRows.length} 行`);
const weakEls = doc.querySelectorAll('#weakTags .wt');
check('存在薄弱模块标记(本题故意错11题)', weakEls.length >= 1, `薄弱模块 ${weakEls.length} 个`);
const exportText = doc.getElementById('masteryText').value;
check('导出报告含标题', exportText.includes('第一章 总论 自测结果'), '');
check('导出报告含各考点', exportText.includes('财务管理目标') && exportText.includes('金融环境'), '');

// 14. 重置
doc.getElementById('resetBtn').click();
check('重置后结果面板隐藏', !doc.getElementById('result').classList.contains('show'));
check('重置后掌握面板隐藏', !doc.getElementById('mastery').classList.contains('show'));
check('重置后提交按钮恢复', doc.getElementById('submitBtn').style.display !== 'none' || doc.getElementById('submitBtn').style.display === '');
let answeredAfterReset = doc.getElementById('answered').textContent;
check('重置后已答归零', answeredAfterReset === '0', `实际 ${answeredAfterReset}`);

// 输出
let allPass = true;
console.log('\n===== 第一章互动习题 HTML 验收测试 =====');
for(const r of results){
  console.log(`${r.pass?'✅':'❌'} ${r.name}${r.detail? '  ·  '+r.detail : ''}`);
  if(!r.pass) allPass=false;
}
console.log('\n结论：' + (allPass ? '全部通过' : '存在失败项，需修复'));
process.exit(allPass?0:1);

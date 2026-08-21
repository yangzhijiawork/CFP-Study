const fs = require('fs');
const { JSDOM } = require('jsdom');

const HTML_PATH = '/Users/yzj/WorkBuddy/2026-08-06-07-25-28/第一章总论互动习题.html';
const html = fs.readFileSync(HTML_PATH, 'utf8');

function fresh() {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  return dom;
}
const results = [];
function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || '' }); }

function ansText(dom, i) { return dom.window.document.getElementById('ex' + i).querySelector('.ans').textContent.trim(); }
// 判断题答案显示为"正确/错误"，转回字母
function letterOf(dom, i) {
  const t = ansText(dom, i);
  if (t === '正确') return 'A';
  if (t === '错误') return 'B';
  return t;
}
function selectAll(dom, i, labs) {
  const doc = dom.window.document;
  doc.querySelectorAll(`input[name="q${i}"]`).forEach(inp => {
    inp.checked = labs.includes(inp.value);
    inp.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  });
}
function wrongLab(dom, i) {
  const a = letterOf(dom, i);
  return Array.from(dom.window.document.querySelectorAll(`input[name="q${i}"]`)).find(x => x.value !== a).value;
}

// ============ 场景A：数据完整性 + 全对提交 ============
{
  const dom = fresh(), doc = dom.window.document;
  check('A1 渲染51题', doc.querySelectorAll('.q').length === 51);
  // 判断题答案以文本显示
  check('A2 判断题答案显示为"错误"而非字母', ansText(dom, 4) === '错误', `实际 "${ansText(dom,4)}"`);
  check('A3 判断题答案显示为"正确"', ansText(dom, 15) === '正确', `实际 "${ansText(dom,15)}"`);
  // 数据完整性：答案字母均在选项中、每题选项不重复
  let integ = true, msg = '';
  for (let i = 0; i < 51; i++) {
    const labs = Array.from(doc.querySelectorAll(`input[name="q${i}"]`)).map(x => x.value);
    if (new Set(labs).size !== labs.length) { integ = false; msg += `q${i}选项重复;`; }
    for (const ch of letterOf(dom, i).split('')) if (!labs.includes(ch)) { integ = false; msg += `q${i}答案${ch}不在选项;`; }
  }
  check('A4 数据完整性(答案∈选项/选项唯一)', integ, msg);
  // 全对提交
  for (let i = 0; i < 51; i++) selectAll(dom, i, letterOf(dom, i).split(''));
  check('A5 已答=51', doc.getElementById('answered').textContent === '51');
  doc.getElementById('submitBtn').click();
  check('A6 全对得分51', doc.getElementById('scoreOk').textContent === '51', `实际 ${doc.getElementById('scoreOk').textContent}`);
  check('A7 无res-wrong', doc.querySelectorAll('.q.res-wrong').length === 0);
  // 掌握面板：7行，且各考点题数与 KPOINTS 一致
  const rows = doc.querySelectorAll('#mkList .mk-row');
  check('A8 掌握面板7行', rows.length === 7, `实际 ${rows.length}`);
  const expected = { '企业组织形式': 5, '财务管理目标': 14, '利益冲突与协调': 11, '财务决策核心': 2, '集权分权体制': 5, '经济环境': 6, '金融环境': 8 };
  let totalsOk = true, bad = [];
  rows.forEach(r => {
    const m = r.querySelector('.mk-name').textContent.match(/^(.*?)（(\d+)题）$/);
    if (!m || expected[m[1]] !== +m[2]) { totalsOk = false; bad.push(r.querySelector('.mk-name').textContent); }
  });
  check('A9 各考点题数与KPOINTS一致(5/14/11/2/5/6/8)', totalsOk, bad.join(','));
  check('A10 全对时无薄弱标签', doc.querySelectorAll('#weakTags .wt').length === 0);
  check('A11 报告含"错题清单（0题）"', doc.getElementById('masteryText').value.includes('错题清单（0题）'));
}

// ============ 场景B：多选漏选（index10 答案ABCD，选ABC） ============
{
  const dom = fresh(), doc = dom.window.document;
  selectAll(dom, 10, ['A', 'B', 'C']);
  doc.getElementById('submitBtn').click();
  const c10 = doc.getElementById('q10');
  check('B1 漏选被判错', c10.classList.contains('res-wrong'));
  const miss = c10.querySelector('.opt.missed');
  check('B2 漏选项D被标黄(missed)', !!miss && miss.getAttribute('data-lab') === 'D');
  check('B3 本题无错选标红', c10.querySelectorAll('.opt.wrong').length === 0);
  const tip = c10.querySelector('.my-ans-tip');
  check('B4 提示行含"漏选 D"', !!tip && tip.textContent.includes('漏选') && tip.textContent.includes('D'));
}

// ============ 场景C：多选错选+漏选并存（index44 答案CD，选AD） ============
{
  const dom = fresh(), doc = dom.window.document;
  selectAll(dom, 44, ['A', 'D']);
  doc.getElementById('submitBtn').click();
  const c43 = doc.getElementById('q44');
  check('C1 错选+漏选题判错', c43.classList.contains('res-wrong'));
  const wrongLabs = Array.from(c43.querySelectorAll('.opt.wrong')).map(x => x.getAttribute('data-lab'));
  const missLabs = Array.from(c43.querySelectorAll('.opt.missed')).map(x => x.getAttribute('data-lab'));
  check('C2 错选A被标红', wrongLabs.join('') === 'A', wrongLabs.join(''));
  check('C3 漏选C被标黄', missLabs.join('') === 'C', missLabs.join(''));
  const tip = c43.querySelector('.my-ans-tip').textContent;
  check('C4 提示行同时含错选/漏选', tip.includes('错选') && tip.includes('漏选'));
}

// ============ 场景D：小样本考点不误判薄弱（财务决策核心2题：1对1错） ============
{
  const dom = fresh(), doc = dom.window.document;
  for (let i = 0; i < 51; i++) {
    if (i === 31) selectAll(dom, i, [wrongLab(dom, i)]); // index31 答错
    else selectAll(dom, i, letterOf(dom, i).split(''));
  }
  doc.getElementById('submitBtn').click();
  const row = Array.from(doc.querySelectorAll('#mkList .mk-row')).find(r => r.textContent.includes('财务决策核心'));
  check('D1 财务决策核心行标注"样本少"', !!row && row.textContent.includes('样本少'), row && row.textContent);
  check('D2 薄弱列表不含财务决策核心', !doc.getElementById('weakTags').textContent.includes('财务决策核心'));
  const rep = doc.getElementById('masteryText').value;
  check('D3 报告含"财务决策核心：1/2"与样本少提示', rep.includes('财务决策核心：1/2') && rep.includes('样本少'), rep.split('\n')[2]);
}

// ============ 场景E：重复提交保护 + 重置后二次作答 ============
{
  const dom = fresh(), doc = dom.window.document;
  for (let i = 0; i < 51; i++) {
    if (i === 3) selectAll(dom, i, [wrongLab(dom, i)]); // index3 答错
    else selectAll(dom, i, letterOf(dom, i).split(''));
  }
  doc.getElementById('submitBtn').click();
  check('E1 首次提交得分50', doc.getElementById('scoreOk').textContent === '50');
  check('E2 错题提示行1个', doc.querySelectorAll('.my-ans-tip').length === 1);
  doc.getElementById('submitBtn').click(); // 再点一次（按钮虽隐藏，程序化点击测试 guard）
  check('E3 二次提交得分不变', doc.getElementById('scoreOk').textContent === '50');
  check('E4 二次提交不重复插入提示行', doc.querySelectorAll('.my-ans-tip').length === 1);
  const rep = doc.getElementById('masteryText').value;
  check('E5 报告含错题清单1题', rep.includes('错题清单（1题）'));
  check('E6 报告含具体错题行(第4题→正确答案C)', rep.includes('第4题') && rep.includes('正确答案:C'));
  // 重置后重做全对
  doc.getElementById('resetBtn').click();
  for (let i = 0; i < 51; i++) selectAll(dom, i, letterOf(dom, i).split(''));
  doc.getElementById('submitBtn').click();
  check('E7 重置后重做全对得51', doc.getElementById('scoreOk').textContent === '51');
  check('E8 重置后无残留提示行', doc.querySelectorAll('.my-ans-tip').length === 0);
}

// ============ 场景F：全部未作答提交 ============
{
  const dom = fresh(), doc = dom.window.document;
  doc.getElementById('submitBtn').click();
  check('F1 未作答提交得分0', doc.getElementById('scoreOk').textContent === '0');
  check('F2 51题全部标错', doc.querySelectorAll('.q.res-wrong').length === 51);
  check('F3 解析全部展开', doc.querySelectorAll('.explain.show').length === 51);
  check('F4 薄弱模块6个(样本充足的6类)', doc.querySelectorAll('#weakTags .wt').length === 6, `实际 ${doc.querySelectorAll('#weakTags .wt').length}`);
}

let allPass = true;
console.log('\n===== 第一章互动习题 HTML 严格验收测试 =====');
for (const r of results) {
  console.log(`${r.pass ? '✅' : '❌'} ${r.name}${r.detail ? '  ·  ' + r.detail : ''}`);
  if (!r.pass) allPass = false;
}
console.log(`\n共 ${results.length} 项，结论：${allPass ? '全部通过' : '存在失败项'}`);
process.exit(allPass ? 0 : 1);

// 经济法第一章互动习题 浏览器渲染验证（截图）
const { chromium } = require('playwright');
const path = require('path');

const HTML = 'file://' + path.resolve(__dirname, '..', 'hudongxiti', 'jingjifa', '第一章总论互动习题.html');
const OUT = path.join(__dirname, 'screenshots');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Users/yzj/Library/Caches/ms-playwright/chromium-1187/chrome-mac/Chromium.app/Contents/MacOS/Chromium'
  });
  const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

  await page.goto(HTML, { waitUntil: 'load' });
  await page.waitForTimeout(300);

  // 1. 顶部 + 题卡
  await page.screenshot({ path: path.join(OUT, '1-top.png') });

  // 题数校验
  const qCount = await page.locator('.q').count();
  console.log('渲染题数 =', qCount);

  // 2. 知识讲解弹框
  await page.click('#chapterBtn');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '2-modal.png') });

  // 弹框内导航数量
  const navCount = await page.locator('.sum-nav-btn').count();
  console.log('弹框导航按钮 =', navCount);

  // 3. 弹框内思维导图树
  await page.locator('.modal-body').evaluate(el => { el.scrollTop = 0; });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, '3-modal-tree.png') });

  // 关闭弹框
  await page.click('#sumClose');
  await page.waitForTimeout(200);

  // 4. 答题 + 判分（答前 5 题）
  // 反读每题正确答案并作答前 5 题
  for (let i = 0; i < 5; i++) {
    const ansTxt = await page.locator(`#ex${i} .ans`).textContent();
    let labs = ansTxt.trim();
    if (labs === '正确') labs = 'A';
    else if (labs === '错误') labs = 'B';
    for (const ch of labs) {
      const inp = page.locator(`input[name="q${i}"][value="${ch}"]`);
      if (await inp.count()) { await inp.check(); }
    }
  }
  // 第 6 题故意答错（选错误答案）
  const ans6 = (await page.locator('#ex5 .ans').textContent()).trim();
  let correct6 = ans6;
  if (correct6 === '正确') correct6 = 'A'; else if (correct6 === '错误') correct6 = 'B';
  const wrong = correct6.includes('A') ? 'B' : 'A';
  await page.locator(`input[name="q5"][value="${wrong}"]`).check();

  await page.click('#submitBtn');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '4-graded.png') });

  // 判分结果
  const score = await page.locator('#scoreOk').textContent();
  console.log('判分得分 =', score.trim(), '/ 101');

  // 滚动到掌握分析
  await page.locator('#mastery').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, '5-mastery.png') });

  // 5. 题内知识讲解锚点定位（点第1题的知识讲解按钮）
  await page.locator('.btn-know').first().click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '6-kp-anchor.png') });

  console.log('浏览器错误数 =', errors.length);
  errors.slice(0, 10).forEach(e => console.log('  ', e));

  await browser.close();
  console.log('截图完成');
})().catch(e => { console.error(e); process.exit(1); });

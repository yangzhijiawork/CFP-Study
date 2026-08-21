// 移动端布局验证：390px 视口下，题干是否换行、topbar 按钮是否换行
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const HTML = 'file://' + path.resolve(__dirname, '..', 'hudongxiti', 'caiwuguanli', '第一章总论互动习题.html');
const OUT = path.join(__dirname, 'screenshots-mobile');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Users/yzj/Library/Caches/ms-playwright/chromium-1187/chrome-mac/Chromium.app/Contents/MacOS/Chromium'
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

  await page.goto(HTML, { waitUntil: 'load' });
  await page.waitForTimeout(300);

  // 1. topbar 区域截图 + 断言按钮是否在统计行之下
  await page.locator('.topbar').screenshot({ path: path.join(OUT, '1-topbar.png') });
  const topbar = await page.evaluate(() => {
    const tb = document.querySelector('.topbar');
    const stat = tb.querySelector('.stat');
    const btn = tb.querySelector('#submitBtn');
    const sr = stat.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    return {
      statY: Math.round(sr.top), btnY: Math.round(br.top),
      sameRow: Math.abs(sr.top - br.top) < 5,
      btnRowBelow: br.top > sr.bottom - 5
    };
  });
  console.log('topbar: 统计行Y=', topbar.statY, ' 按钮行Y=', topbar.btnY, ' 同排=', topbar.sameRow, ' 按钮在下一行=', topbar.btnRowBelow);

  // 2. 第一道题 q-head 截图 + 断言：题号/标签/标记疑问同一行，题干在下一行
  const first = page.locator('.q').first();
  await first.screenshot({ path: path.join(OUT, '2-qhead.png') });
  const qhead = await page.evaluate(() => {
    const qh = document.querySelector('.q-head');
    const qno = qh.querySelector('.qno');
    const badge = qh.querySelector('.badge');
    const stem = qh.querySelector('.stem');
    const doubt = qh.querySelector('.doubt-btn');
    const qr = qno.getBoundingClientRect();
    const br = badge.getBoundingClientRect();
    const sr = stem.getBoundingClientRect();
    const dr = doubt.getBoundingClientRect();
    return {
      qnoY: Math.round(qr.top), badgeY: Math.round(br.top), stemY: Math.round(sr.top), doubtY: Math.round(dr.top),
      qnoBadgeSameRow: Math.abs(qr.top - br.top) < 5,
      doubtWithQno: Math.abs(dr.top - qr.top) < 5,
      stemBelow: sr.top > qr.bottom - 5
    };
  });
  console.log('q-head: 题号Y=', qhead.qnoY, ' 标签Y=', qhead.badgeY, ' 标记疑问Y=', qhead.doubtY, ' 题干Y=', qhead.stemY,
    ' 题号标签同排=', qhead.qnoBadgeSameRow, ' 标记疑问与题号同行=', qhead.doubtWithQno, ' 题干在下一行=', qhead.stemBelow);

  // 2b. 按钮左右 padding 断言（应为 8px）
  const btnPad = await page.evaluate(() => {
    const b = document.querySelector('#submitBtn');
    const cs = getComputedStyle(b);
    return { pl: cs.paddingLeft, pr: cs.paddingRight };
  });
  console.log('提交答卷按钮 padding =', btnPad.pl, '/', btnPad.pr);

  // 3. 整页首屏截图
  await page.screenshot({ path: path.join(OUT, '3-full.png') });

  // 4. 提交后 topbar 按钮变多（只看错题/隐藏解析显示）再截一次
  await page.locator('input[name="q0"]').first().check({ force: true }).catch(() => {});
  await page.click('#submitBtn').catch(() => {});
  await page.waitForTimeout(300);
  await page.locator('.topbar').screenshot({ path: path.join(OUT, '4-topbar-submitted.png') });

  console.log('浏览器错误数 =', errors.length);
  errors.slice(0, 10).forEach(e => console.log('  ', e));
  await browser.close();
  console.log('验证完成');
})().catch(e => { console.error(e); process.exit(1); });

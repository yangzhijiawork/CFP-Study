// 移动端真机模拟复现测试：检查 JS 错误、题数渲染、页面滚动
const { chromium } = require('playwright');
const path = require('path');

const TARGET = process.argv[2] || 'caiwuguanli/第一章总论互动习题.html';
const HTML = 'file://' + path.resolve(__dirname, '..', 'hudongxiti', TARGET);

const DEVICES = [
  { name: 'iPhone 13 (Safari/WKWebView)', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1', vp: { width: 390, height: 844 }, scaleFactor: 3 },
  { name: 'Android 微信 X5', ua: 'Mozilla/5.0 (Linux; Android 12; SM-G9910) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045604 Mobile Safari/537.36 MicroMessenger/8.0.40', vp: { width: 393, height: 851 }, scaleFactor: 2.75 },
  { name: 'Chrome Android 现代', ua: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36', vp: { width: 412, height: 915 }, scaleFactor: 2.625 },
];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Users/yzj/Library/Caches/ms-playwright/chromium-1187/chrome-mac/Chromium.app/Contents/MacOS/Chromium'
  });

  for (const d of DEVICES) {
    const ctx = await browser.newContext({ userAgent: d.ua, viewport: d.vp, deviceScaleFactor: d.scaleFactor, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

    await page.goto(HTML, { waitUntil: 'load' });
    await page.waitForTimeout(500);

    const qCount = await page.locator('.q').count();
    const info = await page.evaluate(() => ({
      scrollH: document.documentElement.scrollHeight,
      innerH: window.innerHeight,
      bodyOverflow: document.body.style.overflow,
      htmlOverflow: document.documentElement.style.overflow,
      quizChildren: document.getElementById('quiz').children.length,
      bodyH: document.body.scrollHeight
    }));

    console.log(`\n=== ${d.name} ===`);
    console.log('  题数 .q =', qCount);
    console.log('  quiz 子元素 =', info.quizChildren);
    console.log('  scrollHeight =', info.scrollH, ' innerHeight =', info.innerH, ' body.scrollHeight =', info.bodyH);
    console.log('  body overflow =', JSON.stringify(info.bodyOverflow), ' html overflow =', JSON.stringify(info.htmlOverflow));
    console.log('  JS 错误数 =', errors.length);
    errors.slice(0, 5).forEach(e => console.log('    ', e));

    // 尝试滚动到底部
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(300);
    const scrollY = await page.evaluate(() => window.scrollY);
    console.log('  滚动后 scrollY =', scrollY);

    await ctx.close();
  }

  await browser.close();
  console.log('\n完成');
})().catch(e => { console.error(e); process.exit(1); });

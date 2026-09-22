/**
 * Headless end-to-end smoke test using the system Chrome/Edge:
 * load the app, load a sample STL, verify analysis, slice, run the
 * simulation at high speed, and capture screenshots.
 *   node scripts/e2e-check.mjs [url]
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const URL = process.argv[2] || 'http://localhost:5173/';
const BROWSER =
  process.platform === 'win32'
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : '/usr/bin/google-chrome';

mkdirSync('screenshots', { recursive: true });

const browser = await puppeteer.launch({
  executablePath: BROWSER,
  headless: 'new',
  args: ['--window-size=1500,950', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  defaultViewport: { width: 1500, height: 950 },
});

const page = await browser.newPage();
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

const fail = async (msg) => {
  console.error(`FAIL: ${msg}`);
  if (errors.length) console.error('Console errors:\n' + errors.join('\n'));
  await page.screenshot({ path: 'screenshots/failure.png' });
  await browser.close();
  process.exit(1);
};

console.log(`Opening ${URL}`);
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise((r) => setTimeout(r, 1500)); // let the scene render
await page.screenshot({ path: 'screenshots/01-startup.png' });

// 1. load the tower sample via the sample dropdown
await page.select('#sample-select', '/samples/tower.stl');
try {
  await page.waitForFunction(
    () => !document.getElementById('report-content').hidden &&
          document.getElementById('stat-tris').textContent !== '–',
    { timeout: 15000 }
  );
} catch {
  await fail('analysis report did not appear');
}
const stats = await page.evaluate(() => ({
  tris: document.getElementById('stat-tris').textContent,
  dims: document.getElementById('stat-dims').textContent,
  volume: document.getElementById('stat-volume').textContent,
  layers: document.getElementById('stat-layers').textContent,
  checks: [...document.querySelectorAll('#checks li')].map((li) => `${li.className}: ${li.textContent}`),
}));
console.log('Analysis:', JSON.stringify(stats, null, 2));
if (stats.tris !== '644') await fail(`expected 644 triangles, got ${stats.tris}`);
await page.screenshot({ path: 'screenshots/02-analyzed.png' });

// 2. slice
await page.click('#btn-slice');
try {
  await page.waitForFunction(
    () => !document.getElementById('playback-bar').classList.contains('disabled'),
    { timeout: 20000 }
  );
} catch {
  await fail('slicing did not complete / playback bar stayed disabled');
}
const time = await page.evaluate(() => document.getElementById('stat-time').textContent);
console.log('Print time estimate:', time);

// 3. let the simulation run at high speed and check progress advances
await page.evaluate(() => {
  const s = document.getElementById('speed-slider');
  s.value = 100; // 100×
  s.dispatchEvent(new Event('input'));
});
await new Promise((r) => setTimeout(r, 4000));
const p1 = await page.evaluate(() => ({
  pct: document.getElementById('progress-pct').textContent,
  layer: document.getElementById('layer-indicator').textContent,
}));
console.log('After 4 s at 100×:', JSON.stringify(p1));
if (p1.pct === '0%') await fail('simulation progress did not advance');
await page.screenshot({ path: 'screenshots/03-printing.png' });

// 4. scrub to 80%
await page.evaluate(() => {
  const s = document.getElementById('scrubber');
  s.value = 8000;
  s.dispatchEvent(new Event('input'));
});
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: 'screenshots/04-scrubbed-80pct.png' });

// 5. camera presets + follow cam render without errors
for (const cam of ['front', 'top', 'iso']) {
  await page.click(`.cam-btn[data-cam="${cam}"]`);
  await new Promise((r) => setTimeout(r, 700));
}
await page.click('#btn-follow');
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: 'screenshots/05-follow-cam.png' });

// 6. Center & Drop flow with the offset cube
await page.select('#sample-select', '/samples/cube-offset.stl');
await page.waitForFunction(
  () => document.getElementById('stat-tris').textContent === '12',
  { timeout: 10000 }
);
const centerVisible = await page.evaluate(() => !document.getElementById('btn-center').hidden);
if (!centerVisible) await fail('Center & Drop button should be visible for the offset cube');
await page.click('#btn-center');
try {
  await page.waitForFunction(
    () => document.getElementById('btn-center').hidden &&
          [...document.querySelectorAll('#checks li.ok')].length === 3,
    { timeout: 10000 }
  );
} catch {
  await fail('Center & Drop did not re-center the model');
}
console.log('Center & Drop: OK');
await page.screenshot({ path: 'screenshots/06-centered-cube.png' });

if (errors.length) {
  console.error('Console errors detected:\n' + errors.join('\n'));
  await browser.close();
  process.exit(1);
}
console.log('PASS: end-to-end flow works, screenshots in ./screenshots');
await browser.close();

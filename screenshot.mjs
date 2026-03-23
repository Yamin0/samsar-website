import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';
const dir = path.join(__dirname, 'temporary screenshots');

if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Find next index
const existing = fs.readdirSync(dir).filter(f => f.startsWith('screenshot-'));
let maxN = 0;
for (const f of existing) {
  const m = f.match(/screenshot-(\d+)/);
  if (m) maxN = Math.max(maxN, parseInt(m[1]));
}
const n = maxN + 1;
const filename = label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`;
const filepath = path.join(dir, filename);

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
const width = process.argv[4] ? parseInt(process.argv[4]) : 1440;
const height = process.argv[5] ? parseInt(process.argv[5]) : 900;
await page.setViewport({ width, height });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

// Wait for fonts
await new Promise(r => setTimeout(r, 1500));

// Scroll through the page to trigger IntersectionObserver reveals
await page.evaluate(async () => {
  const distance = 400;
  const delay = 100;
  const height = document.body.scrollHeight;
  for (let i = 0; i < height; i += distance) {
    window.scrollBy(0, distance);
    await new Promise(r => setTimeout(r, delay));
  }
  window.scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 500));
});

await page.screenshot({ path: filepath, fullPage: true });
await browser.close();

console.log(`Screenshot saved: ${filepath}`);

import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';

const baseline = process.argv[2];
if (!baseline) throw new Error('Uso: node scripts/measure-chat.mjs /ruta/al/dist-anterior');
const output = resolve('test-results/performance');
await mkdir(output, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg' };
async function serve(directory) {
  const root = resolve(directory);
  const server = createServer(async (req, res) => {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    const target = path === root ? resolve(root, 'index.html') : path;
    try { res.setHeader('Content-Type', types[extname(target)] ?? 'application/octet-stream'); res.end(await readFile(target)); }
    catch { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}
const before = await serve(baseline);
const after = await serve('dist');
const chrome = await launch({ chromePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'] });
const results = { before: [], after: [] };
try {
  // Alternate the builds to reduce warm-up and machine-load bias.
  for (let i = 0; i < 3; i++) for (const [name, target] of [['before', before], ['after', after]]) {
    const { lhr } = await lighthouse(target.url, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility'] });
    await writeFile(resolve(output, `${name}-${i + 1}.json`), JSON.stringify(lhr));
    const result = { performance: Math.round(lhr.categories.performance.score * 100), accessibility: Math.round(lhr.categories.accessibility.score * 100), lcp: lhr.audits['largest-contentful-paint'].numericValue, cls: lhr.audits['cumulative-layout-shift'].numericValue };
    results[name].push(result); console.log(name, i + 1, result);
  }
  const median = name => results[name].map(r => r.performance).sort((a, b) => a - b)[1];
  const summary = { ...results, medianBefore: median('before'), medianAfter: median('after'), acceptable: median('after') >= median('before') - 5 };
  await writeFile(resolve(output, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary));
  if (!summary.acceptable) process.exitCode = 1;
} finally {
  await chrome.kill();
  for (const { server } of [before, after]) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}

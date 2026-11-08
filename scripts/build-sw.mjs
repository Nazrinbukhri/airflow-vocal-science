// After `next build` (static export to ./out), write the list of every built file
// into out/sw.js so the service worker can precache the whole app for offline use.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { COMMON, CSP } from './security-headers.mjs';

const OUT = 'out';

// Font subsets Bahasa Melayu / English never need. They still load on demand if ever used.
const SKIP = [/\.map$/, /^sw\.js$/, /(cyrillic|greek|vietnamese)[^/]*\.woff2$/i];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const files = walk(OUT)
  .map((p) => relative(OUT, p).split(sep).join('/'))
  .filter((rel) => !SKIP.some((re) => re.test(rel)))
  .sort();

const hash = createHash('sha256');
const urls = files.map((rel) => {
  hash.update(rel).update(readFileSync(join(OUT, rel)));
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
});

const version = hash.digest('hex').slice(0, 12);
const swPath = join(OUT, 'sw.js');
const sw = readFileSync(swPath, 'utf8')
  .replace("'__BUILD_VERSION__'", JSON.stringify(version))
  .replace('[] /*__PRECACHE_LIST__*/', JSON.stringify(urls));
if (sw.includes('__PRECACHE_LIST__') || sw.includes('__BUILD_VERSION__')) {
  throw new Error('sw.js placeholders were not replaced');
}
writeFileSync(swPath, sw);

const bytes = files.reduce((n, rel) => n + statSync(join(OUT, rel)).size, 0);
console.log(`sw.js: version ${version}, ${urls.length} files precached (${(bytes / 1024).toFixed(0)} KiB)`);

// Host configs for Netlify / Cloudflare Pages (_headers) and Vercel (vercel.json).
const headerLines = Object.entries(COMMON).map(([k, v]) => `  ${k}: ${v}`);
writeFileSync(
  join(OUT, '_headers'),
  ['/*', ...headerLines, `  Content-Security-Policy: ${CSP}`, '', '/_next/static/*', '  Cache-Control: public, max-age=31536000, immutable', '', '/sw.js', '  Cache-Control: no-cache', ''].join('\n'),
);
writeFileSync(
  join(OUT, 'vercel.json'),
  JSON.stringify({ headers: [{ source: '/(.*)', headers: [...Object.entries(COMMON), ['Content-Security-Policy', CSP]].map(([key, value]) => ({ key, value })) }] }, null, 2),
);

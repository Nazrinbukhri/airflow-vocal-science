// End-to-end smoke test against the production static export.
// Usage: npm run build && npm run test:e2e   (set SCREENSHOTS=dir to save screenshots)
// Uses the Playwright + Chromium available on the machine (require('playwright')).
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const { chromium, devices } = createRequire(import.meta.url)('playwright');
const PUZZLES = JSON.parse((await import('node:fs')).readFileSync('src/lib/tactics/puzzles.json', 'utf8'));
const PORT = 4310;
const BASE = `http://localhost:${PORT}`;
const SHOTS = process.env.SCREENSHOTS;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const ROUTES = ['/', '/learn/', '/fundamentals/', '/openings/', '/tactics/', '/formations/', '/prediction/', '/play/', '/masterclass/', '/analysis/', '/progress/'];

let failures = 0;
async function step(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures++;
    console.log(`  ✗ ${name}\n    ${String(e?.message ?? e).split('\n').slice(0, 6).join('\n    ')}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
const piece = (page, s) => page.getAttribute(`[data-square="${s}"]`, 'data-piece');
async function center(page, s) {
  const box = await page.locator(`[data-square="${s}"]`).boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, size: box.width };
}

const server = spawn(process.execPath, ['scripts/serve.mjs', '--port', String(PORT)], { stdio: 'pipe' });
await new Promise((resolve) => server.stdout.on('data', (d) => String(d).includes('Serving') && resolve()));

const browser = await chromium.launch();
try {
  // ---------------- Desktop (Windows-like viewport) ----------------
  console.log('Desktop 1366×768');
  const desktop = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await desktop.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await step('all 11 pages render with a heading and no errors', async () => {
    for (const r of ROUTES) {
      const res = await page.goto(BASE + r);
      assert(res.ok(), `${r} status ${res.status()}`);
      await page.locator('h1').first().waitFor();
    }
    assert(errors.length === 0, `console errors: ${errors.join(' | ')}`);
  });

  await step('sidebar visible, bottom nav hidden on desktop', async () => {
    await page.goto(BASE + '/');
    assert(await page.getByRole('navigation', { name: 'Navigasi utama' }).isVisible(), 'sidebar hidden');
    assert(!(await page.getByRole('navigation', { name: 'Navigasi bawah' }).isVisible()), 'bottom nav visible');
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/desktop-dashboard.png`, fullPage: true });
  });

  await step('play: click-to-move e2→e4, mouse drag g8→f6, illegal drop rejected', async () => {
    await page.goto(BASE + '/play/');
    await page.getByRole('radio', { name: 'Dua pemain' }).click();
    await page.click('[data-square="e2"]');
    await page.click('[data-square="e4"]');
    assert((await piece(page, 'e4')) === 'wp', 'e4 pawn missing');
    const from = await center(page, 'g8');
    const to = await center(page, 'f6');
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 10, from.y + 10, { steps: 3 });
    await page.mouse.move(to.x, to.y, { steps: 8 });
    await page.mouse.up();
    assert((await piece(page, 'f6')) === 'bn', 'drag to f6 failed');
    // Illegal: drag the d2 pawn to d5
    const a = await center(page, 'd2');
    const b = await center(page, 'd5');
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 8 });
    await page.mouse.up();
    assert((await piece(page, 'd2')) === 'wp' && !(await piece(page, 'd5')), 'illegal move was applied');
    const text = await page.getByTestId('last-move-explainer').textContent();
    assert(text.includes('Kuda'), `explainer: ${text}`);
  });

  await step('play: undo / redo and game restored after reload', async () => {
    await page.getByRole('button', { name: 'Undur' }).click();
    assert(!(await piece(page, 'f6')), 'undo failed');
    await page.getByRole('button', { name: 'Ulang' }).click();
    assert((await piece(page, 'f6')) === 'bn', 'redo failed');
    await page.waitForTimeout(300);
    await page.reload();
    await page.waitForFunction(() => document.querySelector('[data-square="f6"]')?.dataset.piece === 'bn', null, { timeout: 5000 });
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/desktop-play.png` });
  });

  await step('play vs Stockfish: the engine answers a move', async () => {
    await page.goto(BASE + '/play/');
    await page.getByRole('radio', { name: 'Lawan Stockfish' }).click();
    await page.getByRole('button', { name: 'Baharu: saya Putih' }).click();
    await page.click('[data-square="e2"]');
    await page.click('[data-square="e4"]');
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="move-list"] button').length === 2, null, { timeout: 20000 });
    const status = await page.getByTestId('status').textContent();
    assert(status.includes('Putih'), `status after AI reply: ${status}`);
    // Undo takes back both half-moves.
    await page.getByRole('button', { name: 'Undur' }).click();
    assert((await piece(page, 'e2')) === 'wp', 'undo vs AI failed');
  });

  await step('analysis: Stockfish finds mate in one with several candidate lines', async () => {
    await page.goto(BASE + '/analysis/');
    await page.fill('#game\\:analysis-fen', 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4');
    await page.getByRole('button', { name: 'Muat FEN' }).click();
    await page.waitForSelector('[data-testid="engine-status"][data-status="done"]', { timeout: 30000 });
    const lines = await page.getByTestId('engine-lines').locator('li').allTextContents();
    assert(lines.length === 3, `expected 3 lines, got ${lines.length}`);
    assert(lines[0].includes('#1') && lines[0].includes('Qxf7#'), `first line: ${lines[0]}`);
  });

  await step('analysis: PGN import reaches checkmate; bad FEN shows an error', async () => {
    await page.goto(BASE + '/analysis/');
    await page.fill('#game\\:analysis-pgn', '1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# 1-0');
    await page.getByRole('button', { name: 'Muat PGN' }).click();
    const status = await page.getByTestId('status').textContent();
    assert(status.includes('Checkmate'), `status: ${status}`);
    assert((await page.getByTestId('move-list').locator('button').count()) === 7, 'move list size');
    await page.getByRole('tab', { name: 'FEN / PGN' }).click();
    await page.fill('#game\\:analysis-fen', '8/8/8/8/8/8/8/8 w - - 0 1');
    await page.getByRole('button', { name: 'Muat FEN' }).click();
    const msg = await page.getByTestId('workbench-message').textContent();
    assert(msg.includes('Raja'), `fen message: ${msg}`);
  });

  await step('coach: spots the f7 mate threat and explains candidates A–D', async () => {
    await page.goto(BASE + '/prediction/');
    await page.getByRole('button', { name: 'Ancaman pada f7 (Hitam bergerak)' }).click();
    await page.getByTestId('coach-report').waitFor({ timeout: 60000 });
    const threats = await page.getByTestId('coach-threats').textContent();
    assert(threats.includes('Qxf7'), `threats: ${threats}`);
    await page.getByTestId('coach-hint').click();
    await page.getByTestId('coach-reveal').click();
    assert((await page.getByTestId('coach-candidate').count()) === 3, 'expected 3 candidates');
    const cats = await page.getByTestId('coach-categories').textContent();
    for (const k of ['Langkah terbaik enjin', 'Alternatif agresif', 'Alternatif bertahan']) assert(cats.includes(k), `missing ${k}`);
    assert(await page.getByTestId('coach-recommendation').isVisible(), 'no recommendation');
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/desktop-coach.png`, fullPage: true });
  });

  await step('openings: show mode explains moves; practice the Italian main line; variations unlock', async () => {
    await page.goto(BASE + '/openings/');
    assert(await page.getByTestId('line-italian-two-knights').isDisabled(), 'variation should start locked');
    await page.getByTestId('opening-next').click();
    assert((await page.getByTestId('opening-explain').textContent()).includes('e4'), 'no explanation');
    await page.getByTestId('opening-practice').click();
    const board = page.locator('[aria-label^="Papan pembukaan"]');
    // A legal but non-book move is rejected with an explanation.
    await board.locator('[data-square="a2"]').click();
    await board.locator('[data-square="a3"]').click();
    assert((await page.getByTestId('opening-feedback').textContent()).includes('langkah sah'), 'wrong-move feedback');
    for (const uci of ['e2e4', 'g1f3', 'f1c4', 'c2c3', 'd2d4', 'c3d4', 'c1d2', 'b1d2', 'e4d5', 'd1b3', 'e1g1']) {
      await board.locator(`[data-square="${uci.slice(0, 2)}"]:not([disabled])`).waitFor();
      await page.waitForFunction((sq) => document.querySelector(`[aria-label^="Papan pembukaan"] [data-square="${sq}"]`)?.getAttribute('tabindex') === '0', uci.slice(0, 2), { timeout: 5000 });
      await board.locator(`[data-square="${uci.slice(0, 2)}"]`).click();
      await board.locator(`[data-square="${uci.slice(2, 4)}"]`).click();
    }
    await page.getByTestId('opening-finished').waitFor({ timeout: 5000 });
    assert(await page.getByTestId('line-italian-two-knights').isEnabled(), 'variation still locked');
    // Regression: after a reload the saved progress must not crash the page, and the Fried Liver trap plays to the end.
    await page.waitForTimeout(300);
    await page.reload();
    await page.getByTestId('line-italian-fried-liver').click();
    for (let k = 0; k < 30 && (await page.getByTestId('opening-next').isEnabled()); k++) await page.getByTestId('opening-next').click();
    assert((await page.getByTestId('opening-finished').textContent()).includes('Pengajaran'), 'fried liver lesson');
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/desktop-openings.png`, fullPage: true });
  });

  await step('lessons: first lesson flows Explain → Show → Practice → Test → Review and saves a score', async () => {
    await page.goto(BASE + '/fundamentals/#f01-what');
    await page.getByTestId('lesson-explain').waitFor();
    for (let k = 0; k < 3; k++) await page.getByTestId('lesson-next-step').click();
    const tests = page.getByTestId('lesson-test');
    await tests.nth(0).getByRole('button', { name: 'Memberi checkmate kepada Raja lawan' }).click();
    await tests.nth(1).getByRole('button', { name: 'Tidak – anda mesti bergerak setiap giliran' }).click();
    assert((await page.getByTestId('lesson-score').textContent()).includes('2/2'), 'lesson score');
    await page.getByText('Ujian: 2/2').waitFor({ timeout: 5000 }); // saved result shown in the lesson header
    await page.waitForTimeout(300); // let the IndexedDB write finish before a full page load
    await page.goto(BASE + '/fundamentals/');
    await page.getByText('✓ Ujian 2/2').waitFor({ timeout: 5000 });
  });

  await step('tactics: a verified puzzle can be solved by playing its solution', async () => {
    const p = PUZZLES.find((x) => x.level === 1 && x.solution.length === 1) ?? PUZZLES[0];
    await page.goto(BASE + '/tactics/');
    await page.getByRole('button', { name: new RegExp(p.id) }).click();
    const board = page.locator(`[aria-label="Teka-teki ${p.id}"]`);
    for (let i = 0; i < p.solution.length; i += 2) {
      const u = p.solution[i];
      await page.waitForFunction(([sq, id]) => document.querySelector(`[aria-label="Teka-teki ${id}"] [data-square="${sq}"]`)?.getAttribute('tabindex') === '0', [u.slice(0, 2), p.id], { timeout: 5000 });
      await board.locator(`[data-square="${u.slice(0, 2)}"]`).click();
      await board.locator(`[data-square="${u.slice(2, 4)}"]`).click();
      if (u.length === 5) await page.locator(`[data-promotion="${u[4]}"]`).click();
    }
    await page.getByTestId('puzzle-explanation').waitFor({ timeout: 8000 });
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/desktop-puzzle.png` });
  });

  await step('formations, masterclass and attack lessons open and respond', async () => {
    await page.goto(BASE + '/formations/');
    await page.getByRole('button', { name: /Pion Terpencil/ }).click();
    await page.locator('[aria-label="Papan latihan"] [data-square="d4"]').click();
    assert((await page.getByTestId('exercise-feedback').getAttribute('data-correct')) === 'true', 'formation answer');
    await page.goto(BASE + '/masterclass/');
    await page.getByTestId('gm-byrne-fischer-1956').click();
    for (let k = 0; k < 8; k++) await page.getByTestId('gm-next').click();
    assert((await page.getByTestId('gm-note').textContent()).includes('fianchetto'), 'gm note');
    await page.goto(BASE + '/tactics/');
    await page.getByRole('tab', { name: 'Pelajaran serangan & pertahanan' }).click();
    await page.getByTestId('lesson-a01-king-safety').click();
    await page.getByTestId('lesson-explain').waitFor();
  });

  await step('analysis: full game review finds the blunder in Scholar\'s mate', async () => {
    await page.goto(BASE + '/analysis/');
    await page.getByRole('tab', { name: 'FEN / PGN' }).click().catch(() => undefined);
    await page.fill('#game\\:analysis-pgn', '1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#');
    await page.getByRole('button', { name: 'Muat PGN' }).click();
    await page.getByTestId('review-run').click();
    await page.getByTestId('review-report').waitFor({ timeout: 60000 });
    const moments = await page.getByTestId('review-moments').textContent();
    assert(moments.includes('Nf6') && moments.includes('Blunder'), `moments: ${moments}`);
  });

  await step('assessment + performance report', async () => {
    await page.goto(BASE + '/progress/');
    await page.getByTestId('assessment-start-day1').click();
    for (let k = 0; k < 12; k++) {
      await page.getByTestId('assessment-item').getByRole('button', { name: 'Tunjuk jawapan' }).click();
      await page.getByTestId(k < 11 ? 'assessment-next' : 'assessment-finish').click();
    }
    await page.getByTestId('assessment-result-day1').waitFor();
    await page.getByTestId('report-overall').waitFor();
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/desktop-progress.png`, fullPage: true });
  });

  await step('progress: completing hour 1 persists and resume points to hour 2', async () => {
    await page.goto(BASE + '/learn/');
    await page.getByTestId('complete-h01').click();
    await page.locator('#h01').getByText('Selesai', { exact: true }).waitFor({ timeout: 5000 });
    await page.goto(BASE + '/');
    await page.getByText('Sambung Jam 2').waitFor({ timeout: 5000 });
    await page.reload();
    await page.getByText('Sambung Jam 2').waitFor({ timeout: 5000 });
  });

  await step('learn: session timer starts and finishing records the session', async () => {
    await page.goto(BASE + '/learn/');
    await page.getByTestId('timer-start-h02').click();
    await page.getByRole('timer').getByRole('button', { name: 'Tamat sesi' }).click();
    await page.locator('#h02').getByText('Selesai', { exact: true }).waitFor({ timeout: 5000 });
    await page.goto(BASE + '/');
    await page.getByText('Sambung Jam 3').waitFor({ timeout: 5000 });
  });

  await step('PWA: manifest + service worker, pages load offline', async () => {
    const manifest = await (await page.request.get(BASE + '/manifest.webmanifest')).json();
    assert(manifest.icons.some((i) => i.purpose === 'maskable'), 'no maskable icon');
    await page.goto(BASE + '/');
    await page.evaluate(() => navigator.serviceWorker.ready);
    // Wait until install precache finished and the SW controls the page.
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 10000 });
    await desktop.setOffline(true);
    for (const r of ['/fundamentals/', '/learn/', '/play/']) {
      await page.goto(BASE + r);
      await page.locator('h1').first().waitFor({ timeout: 5000 });
    }
    // The board works offline too (the restored game is 1.e4 Nf6, so play d2-d4).
    await page.click('[data-square="d2"]');
    await page.click('[data-square="d4"]');
    assert((await piece(page, 'd4')) === 'wp', 'offline move failed');
    // Stockfish (WASM) also runs offline.
    await page.goto(BASE + '/analysis/');
    await page.waitForSelector('[data-testid="engine-status"][data-status="done"]', { timeout: 30000 });
    await desktop.setOffline(false);
  });
  await desktop.close();

  // ---------------- iPhone emulation (touch) ----------------
  console.log('iPhone 13 emulation (Chromium, touch)');
  const phone = await browser.newContext({ ...devices['iPhone 13'] });
  const m = await phone.newPage();

  await step('bottom nav visible, sidebar hidden, no horizontal scroll', async () => {
    for (const r of ROUTES) {
      await m.goto(BASE + r);
      await m.locator('h1').first().waitFor();
      const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(overflow <= 0, `${r} overflows by ${overflow}px`);
    }
    await m.goto(BASE + '/');
    assert(await m.getByRole('navigation', { name: 'Navigasi bawah' }).isVisible(), 'bottom nav hidden');
    assert(!(await m.getByRole('navigation', { name: 'Navigasi utama' }).isVisible()), 'sidebar visible');
    if (SHOTS) await m.screenshot({ path: `${SHOTS}/iphone-dashboard.png` });
  });

  await step('"Lagi" sheet opens and navigates', async () => {
    await m.getByRole('button', { name: 'Lagi' }).tap();
    await m.getByRole('dialog', { name: 'Semua modul' }).getByRole('link', { name: /Kelas Grandmaster/ }).tap();
    await m.waitForURL('**/masterclass/');
  });

  await step('touch: tap-to-move and finger drag', async () => {
    await m.goto(BASE + '/play/');
    await m.getByRole('radio', { name: 'Dua pemain' }).tap();
    await m.tap('[data-square="d2"]');
    await m.tap('[data-square="d4"]');
    assert((await piece(m, 'd4')) === 'wp', 'tap move failed');
    // Finger drag d7→d5 with real touch events (the dragged piece is lifted above the finger).
    const cdp = await phone.newCDPSession(m);
    const a = await center(m, 'd7');
    const b = await center(m, 'd5');
    const lift = b.size * 0.9;
    const touch = (type, x, y) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    await touch('touchStart', a.x, a.y);
    for (let i = 1; i <= 10; i++) await touch('touchMove', a.x + ((b.x - a.x) * i) / 10, a.y + ((b.y + lift - a.y) * i) / 10);
    await touch('touchEnd');
    await m.waitForFunction(() => document.querySelector('[data-square="d5"]')?.dataset.piece === 'bp', null, { timeout: 3000 });
    if (SHOTS) await m.screenshot({ path: `${SHOTS}/iphone-play.png`, fullPage: true });
  });

  await step('fundamentals: square finder and piece explorer respond to taps', async () => {
    await m.goto(BASE + '/fundamentals/');
    const target = (await m.getByTestId('square-target').textContent()).trim();
    await m.locator('[aria-label="Papan latihan cari petak"]').locator(`[data-square="${target}"]`).tap();
    await m.getByText(/^Betul!/).waitFor();
    const explorer = m.locator('[aria-label^="Papan penjelajah"]');
    await explorer.locator('[data-square="g1"]').tap();
    await explorer.locator('[data-square="f3"]').tap();
    const count = await m.getByTestId('explorer-count').textContent();
    assert(count.includes('f3') && count.includes('8'), `explorer: ${count}`);
    if (SHOTS) await m.screenshot({ path: `${SHOTS}/iphone-fundamentals.png`, fullPage: true });
  });
  await phone.close();
} finally {
  await browser.close();
  server.kill();
}

if (failures) {
  console.log(`\n${failures} step(s) failed`);
  process.exit(1);
}
console.log('\nAll e2e smoke steps passed');

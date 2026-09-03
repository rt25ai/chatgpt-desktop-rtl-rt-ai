// Behavioural test for codex-rtl-payload.js.
//
// tests/rtl-harness.html is a small stand-in for the ChatGPT desktop webview:
// it reproduces the app's real Tailwind v4 `rtl:` variant selectors and its
// logical-property utilities, plus a thread of Hebrew/English message content
// and a ProseMirror-style composer.
//
// The test measures every chrome element twice - once with no payload, once
// with the payload loaded - and fails if the patch moved any of them by a
// single pixel, or if any painted control stopped being the thing a click at
// its centre would hit. That is the regression that made buttons stop
// responding: writing dir="rtl" turns on the app's own rtl: variants and
// translates controls away from their hit areas.
//
// Usage:  node tests/run-rtl-harness.mjs [--payload <file>] [--keep]

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const REPO = path.dirname(HERE);

const args = process.argv.slice(2);
const payloadArg = args.includes('--payload') ? args[args.indexOf('--payload') + 1] : null;
const payloadSrc = payloadArg
  ? path.resolve(payloadArg)
  : path.join(REPO, 'codex-rtl-payload.js');

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  const candidates = [];
  try {
    return require('playwright');
  } catch { /* fall through to the npx cache */ }

  const npxRoot = path.join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
  if (fs.existsSync(npxRoot)) {
    for (const dir of fs.readdirSync(npxRoot)) {
      const p = path.join(npxRoot, dir, 'node_modules', 'playwright');
      if (fs.existsSync(p)) candidates.push(p);
    }
  }
  for (const c of candidates) {
    try {
      return require(c);
    } catch { /* try the next one */ }
  }
  return null;
}

const pw = loadPlaywright();
if (!pw) {
  console.error('SKIP: playwright is not installed. Run `npx --yes playwright install chromium` first.');
  process.exit(0);
}

// The harness loads ./payload-new.js relative to itself.
const payloadDst = path.join(HERE, 'payload-new.js');
fs.copyFileSync(payloadSrc, payloadDst);

const failures = [];
const notes = [];
function check(ok, message) {
  if (!ok) failures.push(message);
}

// A playwright resolved out of the npx cache often pins a browser build that
// is not the one actually downloaded on this machine. Fall back to whatever
// chromium is present under ms-playwright rather than failing the run.
function findChromium() {
  const root = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (!fs.existsSync(root)) return null;
  const rel = [
    ['chrome-headless-shell-win64', 'chrome-headless-shell.exe'],
    ['chrome-win64', 'chrome.exe'],
    ['chrome-linux', 'chrome'],
    ['chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium']
  ];
  const dirs = fs.readdirSync(root)
    .filter(d => d.startsWith('chromium'))
    .sort()
    .reverse();
  for (const d of dirs) {
    for (const parts of rel) {
      const exe = path.join(root, d, ...parts);
      if (fs.existsSync(exe)) return exe;
    }
  }
  return null;
}

async function launch() {
  try {
    return await pw.chromium.launch();
  } catch (err) {
    const exe = findChromium();
    if (!exe) throw err;
    console.log('note: using chromium at ' + exe);
    return await pw.chromium.launch({ executablePath: exe });
  }
}

const browser = await launch();
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
  const harness = url.pathToFileURL(path.join(HERE, 'rtl-harness.html')).href;

  await page.goto(harness + '?payload=none');
  await page.waitForFunction(() => document.title === 'loaded');
  const before = await page.evaluate(() => window.__snapshot());

  await page.goto(harness + '?payload=new');
  await page.waitForFunction(() => document.title === 'loaded');
  // Let the payload's requestAnimationFrame pass run.
  await page.waitForFunction(() => !!document.getElementById('rt-ai-codex-rtl-styles'));
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const after = await page.evaluate(() => window.__snapshot());

  // ---------------------------------------------------------------------
  // 1. The patch must never write a dir or lang attribute.
  // ---------------------------------------------------------------------
  check(after.attrs.dirAttributes === 0,
    `patch wrote ${after.attrs.dirAttributes} dir attribute(s); it must never write dir=`);
  check(after.attrs.langAttributes === 0,
    `patch wrote ${after.attrs.langAttributes} lang attribute(s); it must never write lang=`);
  check(after.attrs.inlineStyled === before.attrs.inlineStyled,
    `patch added inline styles (${before.attrs.inlineStyled} -> ${after.attrs.inlineStyled}); it should only toggle classes`);

  // ---------------------------------------------------------------------
  // 2. No chrome element may move.
  // ---------------------------------------------------------------------
  for (const id of Object.keys(before.chrome)) {
    const b = before.chrome[id];
    const a = after.chrome[id];
    const same = b.x === a.x && b.y === a.y && b.w === a.w && b.h === a.h;
    check(same, `chrome element #${id} moved: ${JSON.stringify(b)} -> ${JSON.stringify(a)}`);
  }

  // ---------------------------------------------------------------------
  // 3. Every painted control must still be hittable at its centre.
  // ---------------------------------------------------------------------
  for (const id of Object.keys(after.hits)) {
    check(after.hits[id] === true, `control #${id} is no longer hit-testable at its own centre`);
  }

  // ---------------------------------------------------------------------
  // 4. RTL content must actually be aligned.
  // ---------------------------------------------------------------------
  const expectSide = {
    'p-he': 'right',        // plain hebrew paragraph
    'p-en': 'left',         // plain english paragraph
    'p-mixed': 'right',     // "ChatGPT הוא כלי מצוין ..." - latin first, hebrew body
    'p-ltrdom': 'left',     // mostly english with one hebrew word
    'li-he1': 'right',
    'li-en1': 'left',
    'bq-he': 'right',
    'pm-l1': 'right',       // composer line, hebrew
    'pm-l2': 'left'         // composer line, english
  };
  for (const [id, side] of Object.entries(expectSide)) {
    const got = after.text[id];
    check(got && got.side === side,
      `#${id} should render ${side}-aligned, got ${JSON.stringify(got)}`);
  }

  // Code stays left to right no matter what surrounds it.
  const code = await page.evaluate(() => ({
    pre: getComputedStyle(document.getElementById('pre1')).direction,
    inline: getComputedStyle(document.getElementById('code2')).direction,
    preAlign: getComputedStyle(document.getElementById('pre1')).textAlign
  }));
  check(code.pre === 'ltr', `code block direction should be ltr, got ${code.pre}`);
  check(code.inline === 'ltr', `inline code direction should be ltr, got ${code.inline}`);

  // Hebrew list markers and the quote bar must flip to the right; english
  // lists must be left alone.
  const lists = await page.evaluate(() => ({
    heList: getComputedStyle(document.getElementById('ul-he')).direction,
    enList: getComputedStyle(document.getElementById('ul-en')).direction,
    quoteBorderRight: getComputedStyle(document.getElementById('bq-he')).borderRightWidth,
    quoteBorderLeft: getComputedStyle(document.getElementById('bq-he')).borderLeftWidth
  }));
  check(lists.heList === 'rtl', `hebrew list should flip to rtl, got ${lists.heList}`);
  check(lists.enList === 'ltr', `english list must stay ltr, got ${lists.enList}`);
  check(lists.quoteBorderRight === '4px' && lists.quoteBorderLeft === '0px',
    `hebrew blockquote bar should move to the right, got L=${lists.quoteBorderLeft} R=${lists.quoteBorderRight}`);

  // ---------------------------------------------------------------------
  // 4b. Phantom OS drag regions.
  //
  // ChatGPT desktop 26.831 lays click-through overlays across the toolbar
  // that still carry `-webkit-app-region: drag`. Chromium builds the window's
  // drag region from that property alone and ignores `pointer-events`, so
  // Windows reports the strip as HTCAPTION and real clicks on the bell,
  // search and mode switcher start a window drag instead. The patch clears
  // the region on overlays that cannot receive pointer events, and must leave
  // a genuine interactive drag handle alone.
  // ---------------------------------------------------------------------
  const drag = await page.evaluate(() => {
    const phantom = document.getElementById('phantom');
    const real = document.getElementById('realdrag');
    const read = el => {
      const cs = getComputedStyle(el);
      return {
        region: cs.webkitAppRegion || cs.getPropertyValue('-webkit-app-region') || '',
        marked: el.classList.contains('rt-ai-nodrag')
      };
    };
    return { supported: !!(getComputedStyle(document.body).webkitAppRegion !== undefined),
             phantom: read(phantom), real: read(real) };
  });

  if (!drag.supported || drag.phantom.region === '') {
    notes.push('-webkit-app-region not reported by this browser build; drag-region assertions limited to the class check');
  }
  check(drag.phantom.marked === true,
    'the click-through drag overlay should be marked rt-ai-nodrag so the controls under it stay clickable');
  check(drag.real.marked === false,
    'a genuine interactive drag handle must NOT be marked rt-ai-nodrag - the window has to stay draggable');
  if (drag.phantom.region !== '') {
    check(drag.phantom.region === 'no-drag',
      `the phantom overlay should end up no-drag, got ${drag.phantom.region}`);
    check(drag.real.region === 'drag',
      `the real drag handle should stay drag, got ${drag.real.region}`);
  }

  // ---------------------------------------------------------------------
  // 5. The stylesheet must be the weakest layer in the cascade, so that no
  //    app rule is ever overridden.
  // ---------------------------------------------------------------------
  const cascade = await page.evaluate(() => {
    const first = document.head.firstElementChild;
    return {
      isFirstStylesheet: !!first && first.id === 'rt-ai-codex-rtl-styles',
      usesLayer: document.getElementById('rt-ai-codex-rtl-styles').textContent.includes('@layer rt-ai-rtl'),
      usesImportant: document.getElementById('rt-ai-codex-rtl-styles').textContent.includes('!important')
    };
  });
  check(cascade.isFirstStylesheet, 'the patch stylesheet must be the first node in <head> to sort into the weakest layer');
  check(cascade.usesLayer, 'the patch stylesheet must be wrapped in @layer rt-ai-rtl');
  check(!cascade.usesImportant, 'the patch stylesheet must not use !important');

  // ---------------------------------------------------------------------
  // 6. Streaming must not melt the main thread.
  // ---------------------------------------------------------------------
  const streamMs = await page.evaluate(async () => {
    const md = document.getElementById('md');
    const p = document.createElement('p');
    md.appendChild(p);
    const t0 = performance.now();
    for (let i = 0; i < 400; i++) {
      p.textContent += 'מילה ';
      // force layout the way a real streaming render would
      void p.offsetHeight;
    }
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    return performance.now() - t0;
  });
  notes.push(`400 streamed token appends took ${streamMs.toFixed(0)}ms`);
  check(streamMs < 3000, `streaming 400 tokens took ${streamMs.toFixed(0)}ms - the observer is too expensive`);

  await page.screenshot({ path: path.join(HERE, 'rtl-harness-after.png'), fullPage: true });
} finally {
  await browser.close();
  if (!args.includes('--keep')) fs.rmSync(payloadDst, { force: true });
}

for (const n of notes) console.log('note: ' + n);
if (failures.length) {
  console.error('\nRTL harness FAILED (' + failures.length + '):');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log('RTL harness passed.');

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { renderToStaticMarkup } = require('react-dom/server');

// Render the real server and client components with fictional input; no network or Redis.
function load(file) {
  const mod = new Module(path.resolve(file));
  mod.filename = path.resolve(file);
  mod.paths = module.paths;
  const original = mod.require.bind(mod);
  mod.require = name => {
    if (name.endsWith('.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
    if (name === 'next/navigation') return { notFound() { throw Error('Not found'); } };
    if (name === './localized-text') return load('app/p/[id]/localized-text.tsx');
    if (name === './medication-item') return load('app/p/[id]/medication-item.tsx');
    if (name.endsWith('rx-presentation')) return load('app/lib/rx-presentation.ts');
    return original(name);
  };
  mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, mod.filename);
  return mod.exports;
}

test('compact prescription keeps all directions visible without dropdowns', async () => {
  const originalFetch = global.fetch;
  const oldUrl = process.env.UPSTASH_REDIS_REST_URL;
  const oldToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.UPSTASH_REDIS_REST_URL = 'http://fictional.invalid';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-only';
  global.fetch = async () => ({ json: async () => ({ result: {
    doctor: 'Fictional doctor', patient: 'Fictional patient',
    medications: [
      { name: 'Example tab', frequency: '1x1', mealTiming: 'قبل الاكل', duration: 'شهرين', quantity: '60' },
      { name: 'Example two', instructions: '0·5 mg • 1 • 1 • 1' },
      { name: 'Example three' },
      'Example four',
    ],
  } }) });
  try {
    const Page = load('app/p/[id]/page.tsx').default;
    const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ id: 'fictional' }) }));
    assert(!html.includes('aria-expanded'));
    assert(!html.includes('aria-controls'));
    assert(!html.includes('Prescription details'));
    assert(!html.includes('Dosing schedule'));
    assert(!html.includes('Meal timing'));
    assert(!html.includes('Treatment length'));
    assert(html.includes('Qty: <bdi>60</bdi>'));
    const text = html.replace(/<[^>]*>/g, '');
    assert(text.includes('1x1 • قبل الاكل • شهرين'));
    assert(text.includes('0·5 mg • 1 • 1 • 1'));
    assert(html.includes('lang="ar">قبل'));
    assert(html.includes('lang="en">mg'));

    assert(!html.includes('Refill details'));
    assert(!html.includes('Days left'));
    assert(!html.includes('Not provided'));
    assert(!html.includes('test-only'));
    assert(html.includes('class="number" aria-hidden="true">4</span>'));
  } finally {
    global.fetch = originalFetch;
    if (oldUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL; else process.env.UPSTASH_REDIS_REST_URL = oldUrl;
    if (oldToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN; else process.env.UPSTASH_REDIS_REST_TOKEN = oldToken;
  }
});

test('instruction fields preserve internal punctuation, repeats, and distinct conflicts', () => {
  const { instructionSummary: summary } = load('app/lib/rx-presentation.ts');
  assert.equal(summary('0·5 mg'), '0·5 mg');
  assert.equal(summary('1 • 1 • 1'), '1 • 1 • 1');
  assert.equal(summary('once daily', 'twice daily'), 'once daily • twice daily');
  assert.equal(summary('1x1', 'قبل الاكل', 'شهرين'), '1x1 • قبل الاكل • شهرين');
  assert.equal(summary('', 'Not provided', '  '), '');
  assert.equal(summary('Same', 'Same'), 'Same • Same');
  assert.equal(summary('line 1\nline 2'), 'line 1\nline 2');
});

test('known script annotations preserve mixed-language text exactly', () => {
  const LocalizedText = load('app/p/[id]/localized-text.tsx').default;
  const React = require('react');
  const value = '1x1 • قبل الأكل • 0·5 mg';
  const html = renderToStaticMarkup(React.createElement(LocalizedText, { text: value }));
  assert.equal(html.replace(/<[^>]*>/g, ''), value);
  assert(html.includes('lang="ar"'));
  assert(html.includes('lang="en"'));
});

test('unavailable-link and temporary-error views provide bilingual recovery', () => {
  const React = require('react');
  const NotFound = load('app/p/[id]/not-found.tsx').default;
  const ErrorView = load('app/p/[id]/error.tsx').default;
  const missing = renderToStaticMarkup(React.createElement(NotFound));
  const failed = renderToStaticMarkup(React.createElement(ErrorView, { reset() {} }));
  assert(missing.includes('ask your prescriber for a new one'));
  assert(missing.includes('lang="ar"'));
  assert(!missing.toLowerCase().includes('expired'));
  assert(failed.includes('type="button"'));
  assert(failed.includes('Try again'));
  assert(!failed.includes('Redis'));
});

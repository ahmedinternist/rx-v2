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
      { name: 'Example two', instructions: 'قبل الاكل' },
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
    assert(html.includes('class="instructionText" dir="auto">1x1 • قبل الاكل • شهرين'));
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

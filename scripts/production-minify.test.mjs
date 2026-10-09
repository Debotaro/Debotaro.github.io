import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { minifyStaticHtml, STATIC_ENTRY_FILES } from './production-minify.mjs';

test('production minification preserves meaningful spaces, literal fields and dynamic style hooks', async () => {
  const source =
    '<!doctype html><html><head><style>.added-later { color: #ffffff; padding: 0px 0px; }</style></head><body><p>Read <em>this</em> carefully.</p><pre>  literal\n  spacing  </pre><textarea aria-label="Notes">  exact\n text </textarea><button data-action="open" aria-expanded="false">Open</button></body></html>';
  const output = await minifyStaticHtml(source);
  assert.ok(output.includes('Read <em>this</em> carefully.'));
  assert.ok(output.includes('<pre>  literal\n  spacing  </pre>'));
  assert.ok(output.includes('  exact\n text '));
  assert.ok(output.includes('aria-label="Notes"'));
  assert.ok(output.includes('aria-expanded="false"'));
  assert.ok(output.includes('data-action="open"'));
  assert.ok(output.includes('.added-later'));
});

test('classic globals and separate asynchronous module scripts retain their execution', async () => {
  const source =
    '<!doctype html><html><body><script>/* @license retained */\nwindow.example = 4 + 2;</script><script type="module">const value = await Promise.resolve(7); export default value;</script></body></html>';
  const output = await minifyStaticHtml(source);
  const scripts = [...output.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 2);
  assert.ok(output.includes('@license retained'));
  const context = vm.createContext({ window: {} });
  new vm.Script(scripts[0][2]).runInContext(context);
  assert.equal(context.window.example, 6);
  assert.ok(scripts[1][1].includes('type="module"'));
  const module = await import(
    `data:text/javascript;base64,${Buffer.from(scripts[1][2]).toString('base64')}`
  );
  assert.equal(module.default, 7);
});

test('all four static sources minify successfully while preserving main content and script boundaries', async () => {
  const root = new URL('../', import.meta.url);
  assert.deepEqual(STATIC_ENTRY_FILES, [
    'index.html',
    'aura/index.html',
    'vanta/index.html',
    'rasa/index.html',
  ]);
  for (const file of STATIC_ENTRY_FILES) {
    const source = await fs.readFile(fileURLToPath(new URL(file, root)), 'utf8');
    const output = await minifyStaticHtml(source);
    assert.ok(Buffer.byteLength(output) < Buffer.byteLength(source));
    assert.ok(output.includes('<!doctype html>'));
    assert.ok(output.includes('<main'));
    assert.equal(
      [...output.matchAll(/<script\b/g)].length,
      [...source.matchAll(/<script\b/g)].length,
    );
  }
});

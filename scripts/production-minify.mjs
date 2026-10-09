import fs from 'node:fs/promises';
import path from 'node:path';
import { minify } from 'html-minifier-next';

// These four pages use readable HTML as their source. Framework-generated
// HTML stays with the Next.js/Vite compiler that owns its hydration semantics.
export const STATIC_ENTRY_FILES = [
  'index.html',
  'aura/index.html',
  'vanta/index.html',
  'rasa/index.html',
];

export async function minifyStaticHtml(html) {
  return minify(html, {
    collapseWhitespace: true,
    conservativeCollapse: true,
    collapseInlineTagWhitespace: false,
    removeComments: false,
    removeAttributeQuotes: false,
    removeOptionalTags: false,
    removeEmptyElements: false,
    minifyCSS: true,
    removeUnusedCSS: false,
    minifyJS: { compress: false, mangle: false, format: { comments: 'some' } },
    minifySVG: false,
    mergeScripts: false,
    continueOnMinifyError: false,
    continueOnParseError: false,
  });
}

export async function minifyStaticEntries(directory) {
  for (const entry of STATIC_ENTRY_FILES) {
    const filename = path.join(directory, entry);
    const source = await fs.readFile(filename, 'utf8');
    const output = await minifyStaticHtml(source);
    await fs.writeFile(filename, output, 'utf8');
    console.log(
      `Minified ${entry}: ${Buffer.byteLength(source)} → ${Buffer.byteLength(output)} bytes`,
    );
  }
}

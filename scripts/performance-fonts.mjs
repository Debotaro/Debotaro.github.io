import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Refresh the exact Google Fonts already used by the portfolio. Keep the
// downloaded files and OFL notices in Git; no network is needed by visitors.
const root = fileURLToPath(new URL('../', import.meta.url));
const target = path.join(root, 'assets/fonts');
await fs.mkdir(target, { recursive: true });
const stylesheet =
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@400;500;600;700&display=swap';
const response = await fetch(stylesheet, {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',
  },
});
if (!response.ok) throw new Error(`Font stylesheet failed: ${response.status}`);
const source = await response.text();
const faces = [...source.matchAll(/\/\* latin \*\/\s*(@font-face\s*\{[^}]+\})/g)].map(
  (match) => match[1],
);
if (!faces.length) throw new Error('No Latin font faces found.');
const manifest = [];
const filenames = new Map();
const declarations = [];
for (const face of faces) {
  const family = face.match(/font-family:\s*'([^']+)'/)[1];
  const url = face.match(/url\(([^)]+)\)/)[1];
  let filename = filenames.get(url);
  if (!filename) {
    filename = `${family.toLowerCase().replaceAll(' ', '-')}-${createHash('sha256').update(url).digest('hex').slice(0, 8)}.woff2`;
    const fontResponse = await fetch(url);
    if (!fontResponse.ok) throw new Error(`Font failed: ${fontResponse.status}`);
    const bytes = Buffer.from(await fontResponse.arrayBuffer());
    await fs.writeFile(path.join(target, filename), bytes);
    manifest.push({
      family,
      source: url,
      filename,
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    });
    filenames.set(url, filename);
  }
  declarations.push(face.replace(url, `./${filename}`));
}
for (const directory of ['dmsans', 'instrumentserif', 'spacegrotesk']) {
  const url = `https://raw.githubusercontent.com/google/fonts/main/ofl/${directory}/OFL.txt`;
  const licenseResponse = await fetch(url);
  if (!licenseResponse.ok) throw new Error(`License failed: ${licenseResponse.status}`);
  await fs.writeFile(path.join(target, `${directory}-OFL.txt`), await licenseResponse.text());
}
await fs.writeFile(
  path.join(target, 'portfolio-fonts.css'),
  `/* Latin delivery of the existing Google Fonts; font-display: swap. OFL notices included. */\n${[...new Set(declarations)].join('\n')}\n`,
);
await fs.writeFile(
  path.join(target, 'manifest.json'),
  JSON.stringify(
    {
      stylesheet,
      subset: 'Latin; other scripts fall back to the existing native stacks',
      fonts: manifest,
    },
    null,
    2,
  ) + '\n',
);
console.log(`Downloaded ${manifest.length} existing font deliveries and three OFL notices.`);

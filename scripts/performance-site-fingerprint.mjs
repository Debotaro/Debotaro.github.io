import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export async function siteFingerprint(directory) {
  const files = [];
  async function visit(folder) {
    for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
      const filename = path.join(folder, entry.name);
      if (entry.isDirectory()) await visit(filename);
      else if (entry.isFile()) files.push(filename);
    }
  }
  await visit(directory);
  files.sort((a, b) => a.localeCompare(b, 'en'));
  const fingerprint = createHash('sha256');
  let bytes = 0;
  for (const filename of files) {
    const content = await fs.readFile(filename);
    bytes += content.length;
    const relative = path.relative(directory, filename).split(path.sep).join('/');
    const fileHash = createHash('sha256').update(content).digest('hex');
    fingerprint.update(`${relative}\0${fileHash}\0`);
  }
  return {
    algorithm: 'SHA-256 of sorted relative path + NUL + file SHA-256 + NUL for every served file',
    sha256: fingerprint.digest('hex'),
    files: files.length,
    bytes,
  };
}

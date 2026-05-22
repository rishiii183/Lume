import SimHash from 'simhash-js';
import type { ParsedFile } from '@/types';

const SHINGLE_SIZE = 3;

export function computeDuplicationScores(
  files: ParsedFile[]
): Map<string, number> {
  const fileHashes: { path: string; hash: string }[] = [];
  const simhash = new SimHash();

  for (const file of files) {
    const shingles = tokenize(file.content);
    if (shingles.length === 0) continue;
    const hash = simhash.hash(shingles.join(' '));
    fileHashes.push({ path: file.path, hash });
  }

  const scores = new Map<string, number>();

  for (let i = 0; i < fileHashes.length; i++) {
    let maxSimilarity = 0;
    for (let j = 0; j < fileHashes.length; j++) {
      if (i === j) continue;
      const distance = hammingDistance(fileHashes[i].hash, fileHashes[j].hash);
      const similarity = 1 - distance / 256;
      if (similarity > maxSimilarity) maxSimilarity = similarity;
    }
    scores.set(fileHashes[i].path, Math.max(0, maxSimilarity));
  }

  return scores;
}

function tokenize(content: string): string[] {
  const tokens = content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '')
    .split(/\W+/)
    .filter((t) => t.length > 2)
    .map((t) => t.toLowerCase());

  const shingles: string[] = [];
  for (let i = 0; i <= tokens.length - SHINGLE_SIZE; i++) {
    shingles.push(tokens.slice(i, i + SHINGLE_SIZE).join(' '));
  }
  return shingles.length > 0 ? shingles : tokens.slice(0, 50);
}

function hammingDistance(a: string, b: string): number {
  const len = Math.min(a.length, b.length);
  let distance = Math.abs(a.length - b.length) * 4;
  for (let i = 0; i < len; i++) {
    const x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    distance += (x & 8 ? 1 : 0) + (x & 4 ? 1 : 0) + (x & 2 ? 1 : 0) + (x & 1 ? 1 : 0);
  }
  return distance;
}

export function getFileDuplicationScore(
  filePath: string,
  scores: Map<string, number>
): number {
  return scores.get(filePath) ?? 0;
}

import simhash from 'simhash';
import type { ParsedFile } from '@/types';

const SHINGLE_SIZE = 3;

export function computeDuplicationScores(
  files: ParsedFile[]
): Map<string, number> {
  const fileHashes: { path: string; hash: number[] }[] = [];
  
  // Safe initialization of simhash using 'md5' algorithm
  let hasher: (tokens: string[]) => number[];
  try {
    hasher = simhash('md5');
  } catch (err) {
    console.error('Failed to initialize simhash with md5, falling back to default:', err);
    try {
      hasher = simhash();
    } catch (err2) {
      console.error('Failed to initialize default simhash, using fallback stub:', err2);
      hasher = () => [];
    }
  }

  for (const file of files) {
    try {
      const shingles = tokenize(file.content);
      if (shingles.length === 0) continue;
      // Generate the simhash array of bits safely
      const hash = hasher(shingles);
      fileHashes.push({ path: file.path, hash });
    } catch (err) {
      console.error(`Failed to generate simhash for file ${file.path}:`, err);
      // Keep going, don't crash the pipeline
    }
  }

  const scores = new Map<string, number>();

  for (let i = 0; i < fileHashes.length; i++) {
    let maxSimilarity = 0;
    const hashA = fileHashes[i].hash;

    if (hashA.length === 0) {
      scores.set(fileHashes[i].path, 0);
      continue;
    }

    for (let j = 0; j < fileHashes.length; j++) {
      if (i === j) continue;
      const hashB = fileHashes[j].hash;
      if (hashB.length === 0) continue;

      const distance = hammingDistance(hashA, hashB);
      const maxBits = Math.max(hashA.length, hashB.length);
      const similarity = maxBits > 0 ? 1 - distance / maxBits : 0;
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

function hammingDistance(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let distance = Math.abs(a.length - b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) {
      distance++;
    }
  }
  return distance;
}

export function getFileDuplicationScore(
  filePath: string,
  scores: Map<string, number>
): number {
  return scores.get(filePath) ?? 0;
}

import { Octokit } from 'octokit';
import type { ParsedFile } from '@/types';

const JS_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
]);

const MAX_FILES = 150;
const MAX_FILE_SIZE = 100_000;

export function createOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  return new Octokit(token ? { auth: token } : {});
}

export async function fetchRepositoryFiles(
  owner: string,
  repo: string
): Promise<ParsedFile[]> {
  const octokit = createOctokit();
  const { data: treeData } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: 'HEAD',
    recursive: '1',
  });

  const blobs = (treeData.tree ?? [])
    .filter(
      (item) =>
        item.type === 'blob' &&
        item.path &&
        JS_EXTENSIONS.has(getExtension(item.path)) &&
        (item.size ?? 0) < MAX_FILE_SIZE
    )
    .slice(0, MAX_FILES);

  const files: ParsedFile[] = [];

  await Promise.all(
    blobs.map(async (blob) => {
      if (!blob.path || !blob.sha) return;
      try {
        const { data } = await octokit.rest.git.getBlob({
          owner,
          repo,
          file_sha: blob.sha,
        });
        if (data.encoding === 'base64' && data.content) {
          const content = Buffer.from(data.content, 'base64').toString('utf-8');
          if (content.length > 0 && content.length < MAX_FILE_SIZE) {
            files.push({ path: blob.path, content });
          }
        }
      } catch {
        /* skip unreadable files */
      }
    })
  );

  return files;
}

function getExtension(path: string): string {
  const idx = path.lastIndexOf('.');
  return idx >= 0 ? path.slice(idx) : '';
}

export async function getDefaultBranch(owner: string, repo: string): Promise<string> {
  const octokit = createOctokit();
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return data.default_branch ?? 'main';
}

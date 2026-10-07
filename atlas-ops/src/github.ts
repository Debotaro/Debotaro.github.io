/** The GitHub boundary: no credentials, writes, or unvalidated remote URLs. */
export type GitHubRepository = {
  fullName: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  archived: boolean;
};

export type GitHubIssue = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  url: string;
  author: string;
  updatedAt: string;
  comments: number;
  labels: { name: string; color: string }[];
};

export type GitHubQueue = {
  repository: GitHubRepository;
  issues: GitHubIssue[];
  fetchedAt: string;
};

export class GitHubError extends Error {
  constructor(public readonly title: string, message: string) {
    super(message);
    this.name = 'GitHubError';
  }
}

const API_ROOT = 'https://api.github.com/repos';
export const GITHUB_TIMEOUT_MS = 12_000;
const repositoryPattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})\/[a-zA-Z0-9_.-]{1,100}$/;
export const validRepository = (value: string) => repositoryPattern.test(value) && !['.', '..'].includes(value.split('/')[1]);
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const count = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const nullableText = (value: unknown): value is string | null => value === null || typeof value === 'string';
const invalid = () => new GitHubError('Unexpected response', 'GitHub returned data this workspace could not read. Try again in a moment.');

function parseRepository(value: unknown): GitHubRepository {
  if (!record(value) || typeof value.full_name !== 'string' || !validRepository(value.full_name)
    || !nullableText(value.description) || !nullableText(value.language)
    || !count(value.stargazers_count) || !count(value.forks_count) || typeof value.archived !== 'boolean') throw invalid();
  return {
    fullName: value.full_name,
    url: `https://github.com/${value.full_name}`,
    description: value.description,
    language: value.language,
    stars: value.stargazers_count,
    forks: value.forks_count,
    archived: value.archived,
  };
}

function parseIssues(value: unknown, repository: GitHubRepository): GitHubIssue[] {
  if (!Array.isArray(value) || value.length > 30) throw invalid();
  return value.filter(item => {
    if (!record(item)) throw invalid();
    // GitHub returns pull requests from its issues endpoint as well.
    return !Object.hasOwn(item, 'pull_request');
  }).map(item => {
    if (!record(item) || !count(item.id) || item.id === 0 || !count(item.number) || item.number === 0
      || typeof item.title !== 'string' || !item.title.trim() || !nullableText(item.body)
      || item.state !== 'open' || typeof item.updated_at !== 'string' || !Number.isFinite(Date.parse(item.updated_at))
      || !count(item.comments) || !Array.isArray(item.labels)
      || !(item.user === null || (record(item.user) && typeof item.user.login === 'string'))) throw invalid();
    const labels = item.labels.map(label => {
      if (typeof label === 'string') return { name: label, color: '708393' };
      if (!record(label) || typeof label.name !== 'string' || typeof label.color !== 'string' || !/^[0-9a-f]{6}$/i.test(label.color)) throw invalid();
      return { name: label.name, color: label.color };
    });
    return {
      id: item.id, number: item.number, title: item.title, body: item.body,
      url: `${repository.url}/issues/${item.number}`,
      author: record(item.user) ? String(item.user.login) : 'ghost',
      updatedAt: item.updated_at, comments: item.comments, labels,
    };
  });
}

async function readJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal,
    credentials: 'omit',
    cache: 'no-cache',
    headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10' },
  });
  if (!response.ok) {
    let errorMessage = '';
    if (response.status === 403) {
      try {
        const body: unknown = await response.json();
        if (record(body) && typeof body.message === 'string') errorMessage = body.message;
      } catch (error) { if (signal.aborted) throw error; }
    }
    const exhausted = response.headers.get('x-ratelimit-remaining') === '0';
    if ((response.status === 403 && (exhausted || response.headers.has('retry-after') || /rate limit/i.test(errorMessage))) || response.status === 429) {
      const reset = Number(response.headers.get('x-ratelimit-reset'));
      const retryAfter = Number(response.headers.get('retry-after'));
      const retryAt = exhausted && reset > 0 ? new Date(reset * 1000) : retryAfter > 0 ? new Date(Date.now() + retryAfter * 1000) : null;
      const hint = retryAt && Number.isFinite(retryAt.getTime()) ? ` Try again after ${retryAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.` : ' Wait a few minutes before retrying.';
      throw new GitHubError('GitHub rate limit reached', `Public requests share a limit on your network.${hint} You can still view the repository on GitHub.`);
    }
    if (response.status === 404) throw new GitHubError('Repository not found', 'Check the owner/repository name. This queue can read public repositories only.');
    if (response.status === 410) throw new GitHubError('Issues are unavailable', 'Issues are disabled or unavailable for this repository. Try another public repository.');
    throw new GitHubError('GitHub is unavailable', `GitHub returned HTTP ${response.status}. Try again in a moment, or choose another repository.`);
  }
  try { return await response.json(); } catch (error) {
    if (signal.aborted) throw error;
    throw invalid();
  }
}

export async function fetchGitHubQueue(repository: string, signal: AbortSignal): Promise<GitHubQueue> {
  if (!validRepository(repository)) throw new GitHubError('Check the repository name', 'Enter a public repository as owner/repository, for example facebook/react.');
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) controller.abort();
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, GITHUB_TIMEOUT_MS);
  const path = repository.split('/').map(encodeURIComponent).join('/');
  try {
    const [repositoryJson, issueJson] = await Promise.all([
      readJson(`${API_ROOT}/${path}`, controller.signal),
      readJson(`${API_ROOT}/${path}/issues?state=open&sort=updated&direction=desc&per_page=30`, controller.signal),
    ]);
    const parsedRepository = parseRepository(repositoryJson);
    return { repository: parsedRepository, issues: parseIssues(issueJson, parsedRepository), fetchedAt: new Date().toISOString() };
  } catch (error) {
    if (signal.aborted) throw new DOMException('Request cancelled', 'AbortError');
    if (timedOut) throw new GitHubError('The request took too long', 'GitHub did not respond within 12 seconds. Check your connection and try again.');
    if (error instanceof GitHubError) throw error;
    throw new GitHubError('Could not connect to GitHub', 'Check your internet connection and try again. Your local workspace is still available.');
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
    controller.abort();
  }
}

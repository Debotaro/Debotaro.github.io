/** Credential-free, read-only GitHub data. Remote URLs and HTML are never trusted. */
export type GitHubRepository = {
  id: number;
  fullName: string;
  name: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
  archived: boolean;
  /** GitHub's repository counter includes open issues and pull requests. */
  openIssues: number;
};

export type GitHubMilestone = {
  id: number;
  number: number;
  title: string;
  description: string | null;
  dueOn: string | null;
  url: string;
  openIssues: number;
  closedIssues: number;
  state: 'open';
};

export type GitHubWorkspaceData = {
  repository: GitHubRepository;
  milestones: GitHubMilestone[];
  fetchedAt: string;
};

export class GitHubError extends Error {
  constructor(
    public readonly title: string,
    message: string,
  ) {
    super(message);
    this.name = 'GitHubError';
  }
}

const API_ROOT = 'https://api.github.com/repos';
export const GITHUB_TIMEOUT_MS = 12_000;
const repositoryPattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})\/[a-zA-Z0-9_.-]{1,100}$/;
export const validRepository = (value: string) =>
  repositoryPattern.test(value) && !['.', '..'].includes(value.split('/')[1]);
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const count = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const positiveInteger = (value: unknown): value is number => count(value) && value > 0;
const nullableText = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';
const invalid = () =>
  new GitHubError(
    'Unexpected response',
    'GitHub returned data this workspace could not read. Try again in a moment.',
  );
const cancelled = () => new DOMException('Request cancelled', 'AbortError');

// Date.parse alone accepts impossible dates such as February 30. Verify both
// calendar components and the ISO timestamp shape before keeping a remote date.
function isoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(
      value,
    );
  if (!match) return false;
  const [
    ,
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText,
    zoneHourText = '00',
    zoneMinuteText = '00',
  ] = match;
  const year = Number(yearText),
    month = Number(monthText),
    day = Number(dayText);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return (
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= days[month - 1] &&
    Number(hourText) <= 23 &&
    Number(minuteText) <= 59 &&
    Number(secondText) <= 59 &&
    Number(zoneHourText) <= 23 &&
    Number(zoneMinuteText) <= 59 &&
    Number.isFinite(Date.parse(value))
  );
}

function parseRepository(value: unknown): GitHubRepository {
  if (
    !record(value) ||
    !positiveInteger(value.id) ||
    typeof value.full_name !== 'string' ||
    !validRepository(value.full_name) ||
    typeof value.name !== 'string' ||
    value.name !== value.full_name.split('/')[1] ||
    !nullableText(value.description) ||
    !nullableText(value.language) ||
    !count(value.stargazers_count) ||
    !count(value.forks_count) ||
    !count(value.open_issues_count) ||
    typeof value.archived !== 'boolean'
  )
    throw invalid();
  return {
    id: value.id,
    fullName: value.full_name,
    name: value.name,
    description: value.description,
    language: value.language,
    url: `https://github.com/${value.full_name}`,
    stars: value.stargazers_count,
    forks: value.forks_count,
    archived: value.archived,
    openIssues: value.open_issues_count,
  };
}

function parseMilestones(value: unknown, repository: GitHubRepository): GitHubMilestone[] {
  if (!Array.isArray(value) || value.length > 30) throw invalid();
  const ids = new Set<number>();
  const numbers = new Set<number>();
  return value.map((item) => {
    if (
      !record(item) ||
      !positiveInteger(item.id) ||
      !positiveInteger(item.number) ||
      typeof item.title !== 'string' ||
      !item.title.trim() ||
      !nullableText(item.description) ||
      !(item.due_on === null || isoTimestamp(item.due_on)) ||
      item.state !== 'open' ||
      !count(item.open_issues) ||
      !count(item.closed_issues) ||
      ids.has(item.id) ||
      numbers.has(item.number)
    )
      throw invalid();
    ids.add(item.id);
    numbers.add(item.number);
    return {
      id: item.id,
      number: item.number,
      title: item.title,
      description: item.description,
      dueOn: item.due_on,
      url: `${repository.url}/milestone/${item.number}`,
      openIssues: item.open_issues,
      closedIssues: item.closed_issues,
      state: 'open',
    };
  });
}

async function readJson(url: string, signal: AbortSignal): Promise<unknown> {
  if (signal.aborted) throw cancelled();
  const response = await fetch(url, {
    signal,
    credentials: 'omit',
    cache: 'no-cache',
    headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10' },
  });
  if (signal.aborted) throw cancelled();
  if (!response.ok) {
    let errorMessage = '';
    if (response.status === 403) {
      try {
        const body: unknown = await response.json();
        if (record(body) && typeof body.message === 'string') errorMessage = body.message;
      } catch (error) {
        if (signal.aborted) throw error;
      }
    }
    if (signal.aborted) throw cancelled();
    const exhausted = response.headers.get('x-ratelimit-remaining') === '0';
    if (
      (response.status === 403 &&
        (exhausted || response.headers.has('retry-after') || /rate limit/i.test(errorMessage))) ||
      response.status === 429
    ) {
      const reset = Number(response.headers.get('x-ratelimit-reset'));
      const retryAfter = Number(response.headers.get('retry-after'));
      const retryAt =
        exhausted && Number.isFinite(reset) && reset > 0
          ? new Date(reset * 1000)
          : Number.isFinite(retryAfter) && retryAfter > 0
            ? new Date(Date.now() + retryAfter * 1000)
            : null;
      const hint =
        retryAt && Number.isFinite(retryAt.getTime())
          ? ` Try again after ${retryAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
          : ' Wait a few minutes before retrying.';
      throw new GitHubError(
        'GitHub rate limit reached',
        `Public requests share a limit on your network.${hint} You can still view the repository on GitHub.`,
      );
    }
    if (response.status === 404)
      throw new GitHubError(
        'Repository not found',
        'Check the owner/repository name. This workspace can read public repositories only.',
      );
    if (response.status === 410)
      throw new GitHubError(
        'Milestones are unavailable',
        'Milestones are disabled or unavailable for this repository. Try another public repository.',
      );
    throw new GitHubError(
      'GitHub is unavailable',
      `GitHub returned HTTP ${response.status}. Try again in a moment, or choose another repository.`,
    );
  }
  try {
    const body: unknown = await response.json();
    if (signal.aborted) throw cancelled();
    return body;
  } catch (error) {
    if (signal.aborted) throw error;
    throw invalid();
  }
}

export async function fetchGitHubWorkspace(
  repository: string,
  signal: AbortSignal,
): Promise<GitHubWorkspaceData> {
  if (!validRepository(repository))
    throw new GitHubError(
      'Check the repository name',
      'Enter a public repository as owner/repository, for example microsoft/TypeScript.',
    );
  if (signal.aborted) throw cancelled();
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, GITHUB_TIMEOUT_MS);
  const path = repository.split('/').map(encodeURIComponent).join('/');
  try {
    const [repositoryJson, milestoneJson] = await Promise.all([
      readJson(`${API_ROOT}/${path}`, controller.signal),
      readJson(
        `${API_ROOT}/${path}/milestones?state=open&sort=due_on&direction=asc&per_page=30`,
        controller.signal,
      ),
    ]);
    if (signal.aborted || controller.signal.aborted) throw cancelled();
    const parsedRepository = parseRepository(repositoryJson);
    return {
      repository: parsedRepository,
      milestones: parseMilestones(milestoneJson, parsedRepository),
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (signal.aborted) throw cancelled();
    if (timedOut)
      throw new GitHubError(
        'The request took too long',
        'GitHub did not respond within 12 seconds. Check your connection and try again.',
      );
    if (error instanceof GitHubError) throw error;
    throw new GitHubError(
      'Could not connect to GitHub',
      'Check your internet connection and try again. Your local workspace is still available.',
    );
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
    controller.abort();
  }
}

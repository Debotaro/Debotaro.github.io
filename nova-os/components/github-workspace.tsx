import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CodeXml,
  ExternalLink,
  GitFork,
  Plus,
  RefreshCw,
  Search,
  Star,
  Target,
} from 'lucide-react';
import { Button, Input } from './ui';
import { uid, useStore, type Project, type Task } from './store';
import {
  importGitHubMilestone,
  importGitHubProject,
  reconcileGitHubRepository,
} from './workspace-data';
import {
  fetchGitHubWorkspace,
  GitHubError,
  validRepository,
  type GitHubMilestone,
  type GitHubWorkspaceData,
} from './github-api';

type Result =
  | { status: 'loading' }
  | { status: 'error'; error: GitHubError }
  | { status: 'success'; data: GitHubWorkspaceData };

function summary(text: string | null) {
  const clean = text
    ?.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return clean
    ? clean.slice(0, 350)
    : 'No description provided. Open the milestone on GitHub for its full context.';
}

function dueLabel(date: string | null) {
  return date
    ? new Date(date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : 'No due date';
}

export function GitHubWorkspace() {
  const { state, setState, announce, ready, storageStatus } = useStore();
  const [input, setInput] = useState('microsoft/TypeScript');
  const [request, setRequest] = useState({ repository: 'microsoft/TypeScript', revision: 0 });
  const [result, setResult] = useState<Result>({ status: 'loading' });
  const [inputError, setInputError] = useState('');
  const [query, setQuery] = useState('');
  const [pendingImport, setPendingImport] = useState<{ id: string; message: string } | null>(null);
  const imported = useMemo(
    () =>
      new Set(
        state.tasks.flatMap((task) =>
          task.source?.kind === 'github-milestone' ? [task.source.id] : [],
        ),
      ),
    [state.tasks],
  );
  const data = result.status === 'success' ? result.data : null;
  const localProject = data
    ? state.projects.find((project) => project.source?.id === data.repository.id)
    : undefined;
  const milestones =
    data?.milestones.filter((milestone) =>
      `${milestone.title} ${milestone.number} ${milestone.description || ''}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    ) || [];

  const load = (repository: string) => {
    setInput(repository);
    setInputError('');
    setQuery('');
    setResult({ status: 'loading' });
    setRequest((previous) => ({ repository, revision: previous.revision + 1 }));
  };

  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    setResult({ status: 'loading' });
    fetchGitHubWorkspace(request.repository, controller.signal)
      .then((data) => {
        if (current) setResult({ status: 'success', data });
      })
      .catch((error) => {
        if (current && !controller.signal.aborted)
          setResult({
            status: 'error',
            error:
              error instanceof GitHubError
                ? error
                : new GitHubError('Could not load the repository', 'Please try again.'),
          });
      });
    return () => {
      current = false;
      controller.abort();
    };
  }, [request]);

  useEffect(() => {
    if (data)
      setState((current) =>
        reconcileGitHubRepository(current, data.repository.id, data.repository.fullName),
      );
  }, [data, setState]);

  useEffect(() => {
    if (!pendingImport) return;
    const committed = state.activity?.some((entry) => entry.id === pendingImport.id);
    announce(
      committed
        ? pendingImport.message
        : 'This item could not be added. It may already be imported, or your workspace has reached its record limit.',
    );
    setPendingImport(null);
  }, [pendingImport, state.activity, announce]);

  function projectDraft(workspace: GitHubWorkspaceData, at: string): Project {
    const repository = workspace.repository;
    return {
      id: uid(),
      name: repository.fullName.slice(0, 45),
      description: (repository.description || 'Plan the next steps for this repository.').slice(
        0,
        90,
      ),
      color: '#7dd3c7',
      createdAt: at,
      updatedAt: at,
      source: {
        kind: 'github-repository',
        id: repository.id,
        fullName: repository.fullName,
        url: repository.url,
        importedAt: at,
      },
    };
  }

  function importRepository() {
    if (!data || !ready || localProject) return;
    const at = new Date().toISOString();
    const project = projectDraft(data, at);
    const event = { id: uid(), at };
    setState((current) => importGitHubProject(current, project, event));
    setPendingImport({
      id: event.id,
      message: 'Repository added as a local project. GitHub is unchanged.',
    });
  }

  function importMilestone(milestone: GitHubMilestone) {
    if (!data || !ready || imported.has(milestone.id)) return;
    const at = new Date().toISOString();
    const project = projectDraft(data, at);
    const projectEvent = { id: uid(), at };
    const taskEvent = { id: uid(), at };
    const task: Task = {
      id: uid(),
      title: milestone.title.slice(0, 90),
      description: (milestone.description || '').slice(0, 1000),
      project: project.id,
      status: 'Todo',
      priority: 'Medium',
      assignee: state.name || 'Alex',
      due: dueLabel(milestone.dueOn),
      ...(milestone.dueOn ? { dueDate: new Date(milestone.dueOn).toISOString().slice(0, 10) } : {}),
      createdAt: at,
      updatedAt: at,
      source: {
        kind: 'github-milestone',
        id: milestone.id,
        number: milestone.number,
        repository: data.repository.fullName,
        url: milestone.url,
        importedAt: at,
      },
    };
    setState((current) => {
      const reconciled = reconcileGitHubRepository(
        current,
        data.repository.id,
        data.repository.fullName,
      );
      const next = importGitHubProject(reconciled, project, projectEvent);
      const destination = next.projects.find((item) => item.source?.id === data.repository.id);
      if (!destination) return current;
      const imported = importGitHubMilestone(
        next,
        { ...task, project: destination.id, assignee: current.name || 'Alex' },
        taskEvent,
      );
      return imported === next ? current : imported;
    });
    setPendingImport({
      id: taskEvent.id,
      message: 'Milestone added as one local planning task. GitHub is unchanged.',
    });
  }

  return (
    <>
      <div className="page-heading nova-github-heading">
        <div>
          <div className="eyebrow">LIVE SOURCE. YOUR NEXT STEPS.</div>
          <h1>From repository to possibility.</h1>
          <p>Bring a public project’s milestones into your own plan.</p>
        </div>
        <Link className="button button-secondary" href="/app/projects">
          Your projects <ArrowRight size={16} />
        </Link>
      </div>
      <section className="panel nova-github-connect" aria-label="Choose a GitHub repository">
        <div className="nova-github-intro">
          <span className="nova-github-symbol">
            <CodeXml size={24} />
          </span>
          <div>
            <h2>A little context. A clearer direction.</h2>
            <p>Live public GitHub data. Imported projects and tasks stay on this device.</p>
          </div>
          <span className="nova-github-tag">Read only</span>
        </div>
        <form
          className="nova-github-form"
          onSubmit={(event) => {
            event.preventDefault();
            const repository = input.trim();
            if (!validRepository(repository)) {
              setInputError('Use owner/repository, for example microsoft/TypeScript.');
              return;
            }
            load(repository);
          }}
        >
          <label htmlFor="nova-github-repository">
            Public repository
            <Input
              id="nova-github-repository"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setInputError('');
              }}
              placeholder="owner/repository"
              autoComplete="off"
              spellCheck={false}
              maxLength={140}
              aria-invalid={!!inputError}
              aria-describedby={inputError ? 'nova-github-input-error' : 'nova-github-input-hint'}
            />
          </label>
          <Button type="submit">
            Load repository <ArrowRight size={15} />
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={result.status === 'loading'}
            aria-label="Refresh GitHub workspace"
            onClick={() => load(request.repository)}
          >
            <RefreshCw size={15} />
            Refresh
          </Button>
        </form>
        {inputError ? (
          <p id="nova-github-input-error" role="alert" className="nova-github-input-error">
            {inputError}
          </p>
        ) : (
          <p id="nova-github-input-hint" className="nova-github-hint">
            Explore a public project:
            <button onClick={() => load('microsoft/TypeScript')}>microsoft/TypeScript</button>
            <button onClick={() => load('vitejs/vite')}>vitejs/vite</button>
          </p>
        )}
      </section>
      {storageStatus === 'unavailable' && (
        <p className="nova-github-storage-note" role="status">
          Browser storage is unavailable. Your imports work for this session but may be lost after
          reloading.
        </p>
      )}
      <div className="nova-github-results" aria-busy={result.status === 'loading'}>
        {result.status === 'loading' && (
          <section className="panel nova-github-loading">
            <p role="status">
              <RefreshCw size={17} />
              Loading {request.repository} from GitHub…
            </p>
            <div className="nova-github-skeleton" aria-hidden="true">
              {[0, 1, 2].map((index) => (
                <div key={index}>
                  <span />
                  <span />
                  <span />
                </div>
              ))}
            </div>
          </section>
        )}
        {result.status === 'error' && (
          <section className="panel nova-github-error">
            <AlertCircle size={30} />
            <div role="alert">
              <h2>{result.error.title}</h2>
              <p>{result.error.message}</p>
            </div>
            <Button onClick={() => load(request.repository)}>
              <RefreshCw size={15} />
              Try again
            </Button>
          </section>
        )}
        {data && (
          <>
            <section className="panel nova-github-repository" aria-label="Repository details">
              <div>
                <span className="eyebrow">
                  PUBLIC REPOSITORY {data.repository.archived && '· ARCHIVED'}
                </span>
                <h2>
                  <a href={data.repository.url} target="_blank" rel="noopener noreferrer">
                    {data.repository.fullName}
                    <ExternalLink size={17} />
                  </a>
                </h2>
                <p>{data.repository.description || 'This repository has no description.'}</p>
                <div className="nova-github-stats">
                  <span>
                    <Star size={15} />
                    {data.repository.stars.toLocaleString()} stars
                  </span>
                  <span>
                    <GitFork size={15} />
                    {data.repository.forks.toLocaleString()} forks
                  </span>
                  <span>{data.repository.language || 'No primary language'}</span>
                </div>
              </div>
              <div className="nova-github-project-actions">
                {localProject ? (
                  <>
                    <span className="nova-github-imported">
                      <Check size={15} />
                      Local project ready
                    </span>
                    <Link
                      className="button button-secondary"
                      href={`/app/projects?project=${localProject.id}`}
                    >
                      Open local project <ArrowRight size={15} />
                    </Link>
                  </>
                ) : (
                  <Button
                    disabled={!ready}
                    aria-label="Import repository"
                    onClick={importRepository}
                  >
                    <Plus size={15} />
                    Add as a project
                  </Button>
                )}
              </div>
            </section>
            <div className="nova-github-list-toolbar">
              <div>
                <h2>
                  Open milestones <span>{data.milestones.length}</span>
                </h2>
                <p>Latest page · Up to 30 milestones · Search this page</p>
              </div>
              <div className="nova-github-search">
                <Search size={16} />
                <Input
                  aria-label="Search milestones"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search milestones…"
                />
              </div>
            </div>
            {!data.milestones.length ? (
              <section className="panel nova-github-empty">
                <Target size={32} />
                <h2>No open milestones on this page.</h2>
                <p>
                  You can still add this repository as a local project and create your own tasks.
                </p>
                <a
                  href={`${data.repository.url}/milestones`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link"
                >
                  View milestones on GitHub <ExternalLink size={14} />
                </a>
              </section>
            ) : !milestones.length ? (
              <section className="panel nova-github-empty">
                <Search size={30} />
                <h2>No milestones match your search.</h2>
                <p>Try a title or number from this page.</p>
                <Button variant="secondary" onClick={() => setQuery('')}>
                  Clear milestone search
                </Button>
              </section>
            ) : (
              <div className="nova-github-milestones">
                {milestones.map((milestone) => {
                  const total = milestone.openIssues + milestone.closedIssues;
                  const progress = total ? Math.round((milestone.closedIssues / total) * 100) : 0;
                  const isImported = imported.has(milestone.id);
                  return (
                    <article
                      className="panel nova-github-milestone"
                      key={milestone.id}
                      aria-label={`Milestone ${milestone.number}`}
                    >
                      <div className="nova-github-milestone-content">
                        <span className="nova-github-milestone-meta">
                          MILESTONE #{milestone.number} ·{' '}
                          {milestone.dueOn ? `Due ${dueLabel(milestone.dueOn)}` : 'No due date'}
                        </span>
                        <h3>
                          <a href={milestone.url} target="_blank" rel="noopener noreferrer">
                            {milestone.title}
                            <ExternalLink size={15} />
                          </a>
                        </h3>
                        <p>{summary(milestone.description)}</p>
                        <div className="nova-github-progress-label">
                          <span>
                            {milestone.closedIssues} closed · {milestone.openIssues} open items
                          </span>
                          <b>{progress}%</b>
                        </div>
                        <div
                          className="nova-github-progress"
                          role="progressbar"
                          aria-label={`GitHub progress for ${milestone.title}`}
                          aria-valuenow={progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <span style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <div className="nova-github-milestone-actions">
                        <Button
                          variant={isImported ? 'secondary' : 'primary'}
                          disabled={!ready || isImported}
                          aria-label={
                            isImported
                              ? `Milestone ${milestone.number} imported`
                              : `Import milestone ${milestone.number}`
                          }
                          onClick={() => importMilestone(milestone)}
                        >
                          {isImported ? (
                            <>
                              <Check size={15} />
                              Imported
                            </>
                          ) : (
                            <>
                              <Plus size={15} />
                              Add to your plan
                            </>
                          )}
                        </Button>
                        <a
                          className="text-link"
                          href={milestone.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View on GitHub <ExternalLink size={13} />
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            <p className="nova-github-disclosure">
              One milestone becomes one local planning task; its issues are not imported. Local
              completion is independent of GitHub. Refresh to read updates. Fetched{' '}
              {new Date(data.fetchedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
              .
            </p>
          </>
        )}
      </div>
      {!!state.activity?.length && (
        <section className="panel nova-github-activity" aria-label="Local workspace activity">
          <div className="section-heading">
            <h2>A little momentum</h2>
            <span className="muted text-xs">Local import history</span>
          </div>
          <ul>
            {state.activity.slice(0, 5).map((entry) => (
              <li key={entry.id}>
                <span className="nova-github-activity-dot" />
                <div>
                  <p>{entry.message}</p>
                  <time dateTime={entry.at}>
                    {new Date(entry.at).toLocaleString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

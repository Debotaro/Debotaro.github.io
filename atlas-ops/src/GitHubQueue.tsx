import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Check, CircleDot, CodeXml, ExternalLink, GitFork, MessageSquare, Plus, RefreshCw, Search, Star } from 'lucide-react';
import { Button, Input } from './components/ui';
import { fetchGitHubQueue, GitHubError, validRepository } from './github';
import type { GitHubIssue, GitHubQueue as Queue } from './github';
import type { Task } from './data';
import './github.css';

type Props = { tasks: Task[]; onImport: (issue: GitHubIssue, repository: string) => void; go: (route: string) => void };
type RequestState = { status: 'loading' } | { status: 'success'; data: Queue } | { status: 'error'; error: GitHubError };

function issuePreview(body: string | null) {
  const preview = body?.replace(/<!--[\s\S]*?-->/g, '').replace(/```[\s\S]*?```/g, '')
    .replace(/^\s*#{1,6}\s+/gm, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').trim();
  return preview ? preview.slice(0, 500) : 'No text summary provided. Open the issue on GitHub for context.';
}

export function GitHubQueue({ tasks, onImport, go }: Props) {
  const [input, setInput] = useState('facebook/react');
  const [request, setRequest] = useState({ repository: 'facebook/react', revision: 0 });
  const [result, setResult] = useState<RequestState>({ status: 'loading' });
  const [inputError, setInputError] = useState('');
  const [query, setQuery] = useState('');
  const imported = useMemo(() => new Set(tasks.map(task => task.source?.issueId).filter(Boolean)), [tasks]);
  const load = (repository: string) => {
    setInput(repository);
    setInputError('');
    setQuery('');
    setResult({ status: 'loading' });
    setRequest(previous => ({ repository, revision: previous.revision + 1 }));
  };

  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    setResult({ status: 'loading' });
    fetchGitHubQueue(request.repository, controller.signal).then(data => {
      if (current) setResult({ status: 'success', data });
    }).catch(error => {
      if (current && !controller.signal.aborted) setResult({ status: 'error', error: error instanceof GitHubError ? error : new GitHubError('Could not load the queue', 'Please try again.') });
    });
    return () => { current = false; controller.abort(); };
  }, [request]);

  const data = result.status === 'success' ? result.data : null;
  const visibleIssues = data?.issues.filter(issue => `${issue.title} ${issue.number} ${issue.author} ${issue.labels.map(label => label.name).join(' ')}`.toLowerCase().includes(query.toLowerCase().trim())) || [];
  return <>
    <div className="page-heading github-heading"><div><span className="eyebrow">LIVE PUBLIC DATA · LOCAL PLANNING</span><h1>GitHub queue</h1><p>Give an open issue a place in your next plan.</p></div><Button variant="secondary" onClick={() => go('tasks')}>View local tasks <ArrowRight size={16}/></Button></div>
    <section className="panel github-connect" aria-label="Choose a GitHub repository">
      <div className="github-connect-title"><span className="github-mark"><CodeXml size={22}/></span><div><h2>A clear view of the work ahead.</h2><p>Read public issues from GitHub. Imported tasks stay in this browser.</p></div><span className="github-readonly">Read only</span></div>
      <form className="github-repository-form" onSubmit={event => {
        event.preventDefault();
        const repository = input.trim();
        if (!validRepository(repository)) { setInputError('Use owner/repository, for example facebook/react.'); return; }
        load(repository);
      }}>
        <div><label htmlFor="github-repository">Public repository</label><Input id="github-repository" value={input} onChange={event => { setInput(event.target.value); setInputError(''); }} placeholder="owner/repository" autoComplete="off" spellCheck={false} maxLength={140} aria-invalid={!!inputError} aria-describedby={inputError ? 'github-repository-error' : 'github-repository-hint'}/></div>
        <Button type="submit">Load repository <ArrowRight size={15}/></Button>
        <Button type="button" variant="secondary" disabled={result.status === 'loading'} onClick={() => load(request.repository)} aria-label="Refresh GitHub queue"><RefreshCw size={15}/>Refresh</Button>
      </form>
      {inputError ? <p id="github-repository-error" className="github-input-error" role="alert">{inputError}</p> : <p id="github-repository-hint" className="github-input-hint">Try a public project:<button onClick={() => load('facebook/react')}>facebook/react</button><button onClick={() => load('microsoft/TypeScript')}>microsoft/TypeScript</button></p>}
    </section>
    <div className="github-results" aria-busy={result.status === 'loading'}>
      {result.status === 'loading' && <section className="panel github-loading" aria-label="Loading GitHub queue"><p role="status"><RefreshCw size={16} className="github-spin"/>Loading {request.repository} from GitHub…</p><div className="github-skeleton" aria-hidden="true">{[0, 1, 2].map(index => <div key={index}><span/><span/><span/></div>)}</div></section>}
      {result.status === 'error' && <section className="panel github-error"><AlertCircle size={30}/><div role="alert"><h2>{result.error.title}</h2><p>{result.error.message}</p></div><div className="github-error-actions"><Button onClick={() => load(request.repository)}><RefreshCw size={15}/>Try again</Button><a className="github-source-link" href={`https://github.com/${request.repository}`} target="_blank" rel="noreferrer">View repository <ExternalLink size={14}/></a></div></section>}
      {data && <>
        <section className="panel github-repository-card" aria-label="Repository details"><div><span className="github-repository-caption">PUBLIC REPOSITORY {data.repository.archived && '· ARCHIVED'}</span><h2><a href={data.repository.url} target="_blank" rel="noreferrer">{data.repository.fullName}<ExternalLink size={16}/></a></h2><p>{data.repository.description || 'This repository has no description.'}</p></div><div className="github-repository-stats"><span><Star size={16}/><strong>{data.repository.stars.toLocaleString()}</strong> stars</span><span><GitFork size={16}/><strong>{data.repository.forks.toLocaleString()}</strong> forks</span><span><i/>{data.repository.language || 'No primary language'}</span></div></section>
        <div className="github-list-toolbar"><div><h2>Open issues <span>{data.issues.length}</span></h2><p>Latest page · Up to 30 GitHub entries, pull requests excluded</p></div><div className="search-field"><Search size={16}/><Input aria-label="Search GitHub issues" placeholder="Search issues or labels…" value={query} onChange={event => setQuery(event.target.value)}/></div></div>
        {data.issues.length === 0 ? <section className="panel github-empty"><CircleDot size={30}/><h2>No open issues on this page.</h2><p>Pull requests are excluded. Check the full issue list on GitHub, or try another repository.</p><a className="github-source-link" href={`${data.repository.url}/issues`} target="_blank" rel="noreferrer">View all issues on GitHub <ExternalLink size={14}/></a></section>
          : visibleIssues.length === 0 ? <section className="panel github-empty"><Search size={30}/><h2>No issues match your search.</h2><p>Try an issue number, author or label from this page.</p><Button variant="secondary" onClick={() => setQuery('')}>Clear issue search</Button></section>
          : <div className="github-issue-list">{visibleIssues.map(issue => <article className="panel github-issue" key={issue.id} aria-label={`Issue ${issue.number}`}><div className="github-issue-content"><div className="github-issue-meta"><span><CircleDot size={14}/>Open</span><span>#{issue.number} · {issue.author}</span><span title={new Date(issue.updatedAt).toLocaleString()}>Updated {new Date(issue.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div><h3><a href={issue.url} target="_blank" rel="noreferrer">{issue.title}<ExternalLink size={14}/></a></h3><p className="github-issue-body">{issuePreview(issue.body)}</p><div className="github-labels">{issue.labels.slice(0, 4).map((label, index) => <span key={`${label.name}-${index}`}><i style={{ background: `#${label.color}` }}/>{label.name}</span>)}{issue.labels.length > 4 && <span>+{issue.labels.length - 4} more</span>}<span className="github-comments"><MessageSquare size={13}/>{issue.comments} comments</span></div></div><div className="github-issue-actions"><Button variant={imported.has(issue.id) ? 'secondary' : 'primary'} disabled={imported.has(issue.id)} aria-label={imported.has(issue.id) ? `Issue ${issue.number} imported` : `Import issue ${issue.number}`} onClick={() => onImport(issue, data.repository.fullName)}>{imported.has(issue.id) ? <><Check size={15}/>Imported</> : <><Plus size={15}/>Add to local tasks</>}</Button><a className="github-source-link" href={issue.url} target="_blank" rel="noreferrer">View on GitHub <ExternalLink size={13}/></a></div></article>)}</div>}
        <p className="github-sync-note">Fetched {new Date(data.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Refresh to check for updates. Local task status is independent of GitHub.</p>
      </>}
    </div>
  </>;
}

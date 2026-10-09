import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CodeXml,
  Command,
  Download,
  ExternalLink,
  Folder,
  Globe,
  LayoutDashboard,
  Menu,
  Moon,
  Play,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Workflow,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Button, Input, Modal } from './ui';
import { seed, uid, useStore, type FlowNode, type Task } from './store';
import { applyAssistantRequest, assistantReply } from './assistant';
import { GitHubWorkspace } from './github-workspace';

export function NovaMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`nova-mark ${small ? 'small' : ''}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}
const navigation: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/app', label: 'Overview', icon: LayoutDashboard },
  { href: '/app/projects', label: 'Projects', icon: Folder },
  { href: '/app/github', label: 'GitHub workspace', icon: CodeXml },
  { href: '/app/assistant', label: 'AI assistant', icon: Sparkles },
  { href: '/app/automations', label: 'Automations', icon: Workflow },
  { href: '/app/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/app/integrations', label: 'Integrations', icon: Globe },
];

export function Workspace({ view = 'overview' }: { view?: string }) {
  const { state, setState, announce, storageStatus } = useStore();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [command, setCommand] = useState(false);
  const [query, setQuery] = useState('');
  const [notifications, setNotifications] = useState(false);
  const [help, setHelp] = useState(false);
  const [settings, setSettings] = useState(false);
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommand((v) => !v);
      }
    }
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);
  const matches = useMemo(
    () =>
      [
        ...navigation.map((n) => ({ label: n.label, detail: 'Go to page', href: n.href })),
        ...state.projects.map((p) => ({
          label: p.name,
          detail: 'Project workspace',
          href: `/app/projects?project=${p.id}`,
        })),
        ...state.tasks.map((t) => ({
          label: t.title,
          detail: `${t.status} · ${state.projects.find((p) => p.id === t.project)?.name || 'Project'}`,
          href: `/app/projects?project=${t.project}&task=${t.id}`,
        })),
      ].filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
    [state, query],
  );
  const names: Record<string, string> = {
    overview: 'Overview',
    projects: 'Projects',
    assistant: 'AI assistant',
    automations: 'Automations',
    analytics: 'Analytics',
    integrations: 'Integrations',
    github: 'GitHub workspace',
  };
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const ribbon = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!menu) return;
    const first = ribbon.current?.querySelector<HTMLAnchorElement>('a');
    first?.focus();
    function close(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenu(false);
        menuTrigger.current?.focus();
      }
    }
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menu]);
  const navLabels: Record<string, string> = {
    Overview: 'Today',
    'GitHub workspace': 'GitHub',
    'AI assistant': 'Assistant',
  };
  function openCommand() {
    setCommand(true);
    setQuery('');
  }
  return (
    <div className="workspace nova-sanctuary">
      <a href="#workspace-content" className="skip-link">
        Skip to content
      </a>
      <div className="workspace-main">
        <header className="nova-ribbon">
          <div className="nova-ribbon-top">
            <Link className="workspace-logo" href="/">
              <NovaMark />
              <strong>
                NOVA<span>OS</span>
              </strong>
            </Link>
            <nav
              ref={ribbon}
              className={`nova-workspace-nav ${menu ? 'open' : ''}`}
              aria-label="Workspace navigation"
            >
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  className={names[view] === item.label ? 'active' : ''}
                  aria-current={names[view] === item.label ? 'page' : undefined}
                  aria-label={item.label}
                  href={item.href}
                  onClick={() => setMenu(false)}
                >
                  <item.icon size={16} />
                  <span>{navLabels[item.label] || item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="header-actions">
              <button
                className="icon-button nova-command-toggle"
                aria-label="Search anything"
                onClick={openCommand}
              >
                <Search size={18} />
              </button>
              <button
                className="icon-button"
                aria-label={`Switch to ${state.theme === 'dark' ? 'light' : 'dark'} theme`}
                onClick={() =>
                  setState((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))
                }
              >
                {state.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                className="icon-button notification-icon"
                aria-label="Open notifications"
                onClick={() => setNotifications(true)}
              >
                <Bell size={18} />
                {state.notifications.length > 0 && <i />}
              </button>
              <button
                className="avatar header-avatar"
                aria-label="Account settings"
                onClick={() => setSettings(true)}
              >
                {state.name.slice(0, 1)}
              </button>
              <button
                ref={menuTrigger}
                className="icon-button nova-mobile-menu"
                aria-label={menu ? 'Close navigation' : 'Open navigation'}
                aria-expanded={menu}
                onClick={() => setMenu(!menu)}
              >
                {menu ? <X size={19} /> : <Menu size={19} />}
              </button>
            </div>
          </div>
          <div className="nova-context-bar">
            <button className="nova-workspace-switch" onClick={() => setSettings(true)}>
              <span className="nova-workspace-initial">{state.team.slice(0, 1)}</span>
              <span className="nova-workspace-switch-label">{state.team}</span>
              <ChevronDown size={13} />
            </button>
            <span className="nova-context-separator" />
            <span className="nova-context-view">
              {view === 'overview' ? 'Your daily space' : names[view]}
            </span>
            <span className="demo-indicator">
              <i />
              Portfolio demo
            </span>
            <button className="nova-shortcut-hint" onClick={openCommand}>
              Jump to anything <kbd>⌘ K</kbd>
            </button>
            <button
              className="icon-button"
              aria-label="Help & shortcuts"
              onClick={() => setHelp(true)}
            >
              <CircleHelp size={16} />
            </button>
          </div>
        </header>
        <main id="workspace-content" className="workspace-content" tabIndex={-1}>
          {view === 'overview' ? (
            <Dashboard openCommand={openCommand} />
          ) : view === 'projects' ? (
            <Projects />
          ) : view === 'assistant' ? (
            <Assistant />
          ) : view === 'automations' ? (
            <Automations />
          ) : view === 'analytics' ? (
            <Analytics />
          ) : view === 'github' ? (
            <GitHubWorkspace />
          ) : (
            <Integrations />
          )}
        </main>
        <footer className="workspace-footer">
          <span>
            <i className="status-dot" />A little more room to think.
          </span>
          <span>
            {storageStatus === 'unavailable'
              ? 'Session only · Browser storage unavailable'
              : storageStatus === 'loading'
                ? 'Loading local workspace…'
                : 'Local workspace · Saved on this device'}
          </span>
          <Link href="/">
            NOVA OS <ArrowUpRight size={12} />
          </Link>
        </footer>
      </div>
      <Modal
        open={command}
        onOpenChange={setCommand}
        title="Your workspace, one search away"
        description="Find pages, projects and tasks. Use Tab and Enter to open a result."
      >
        <div className="command-input">
          <Search size={19} />
          <Input
            autoFocus
            placeholder="Search projects, tasks, pages…"
            aria-label="Search workspace"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="command-results">
          {matches.slice(0, 12).map((item, i) => (
            <button
              key={`${item.label}-${i}`}
              onClick={() => {
                setCommand(false);
                router.push(item.href);
              }}
            >
              <span>
                <b>{item.label}</b>
                <small>{item.detail}</small>
              </span>
              <ArrowUpRight size={16} />
            </button>
          ))}
          {!matches.length && <p className="muted">No matches. Try “brand” or “analytics”.</p>}
        </div>
      </Modal>
      <Modal
        open={notifications}
        onOpenChange={setNotifications}
        title="You’re in the loop"
        description="Activity from your local demo workspace."
      >
        <div className="notifications-list">
          {state.notifications.length ? (
            state.notifications.map((n, i) => (
              <div key={i}>
                <span className="notification-symbol">
                  <Bell size={16} />
                </span>
                <p>
                  {n}
                  <small>Workspace activity</small>
                </p>
              </div>
            ))
          ) : (
            <p className="empty-state">
              <CheckCheck />
              You’re all caught up.
            </p>
          )}
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setState((s) => ({ ...s, notifications: [] }));
            announce('Notifications marked as read.');
          }}
        >
          Mark all as read
        </Button>
      </Modal>
      <Modal
        open={help}
        onOpenChange={setHelp}
        title="A shortcut to good work"
        description="Explore the demo with these useful controls."
      >
        <dl className="shortcut-list">
          <div>
            <dt>Search the workspace</dt>
            <dd>Ctrl / ⌘ + K</dd>
          </div>
          <div>
            <dt>Close any dialog</dt>
            <dd>Escape</dd>
          </div>
          <div>
            <dt>Complete a task</dt>
            <dd>Click its status circle</dd>
          </div>
          <div>
            <dt>Reorder an automation</dt>
            <dd>Drag a node or use arrows</dd>
          </div>
        </dl>
        <p className="muted text-sm">
          The assistant runs deterministic rules locally. GitHub reads live public milestones; other
          integrations and accounts are simulations.
        </p>
      </Modal>
      <Modal
        open={settings}
        onOpenChange={setSettings}
        title="Workspace settings"
        description="Personalise this demo. Changes stay in your browser."
      >
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            setSettings(false);
            announce('Workspace settings saved.');
          }}
        >
          <label>
            Your first name
            <Input
              value={state.name}
              required
              maxLength={30}
              onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
            />
          </label>
          <label>
            Workspace name
            <Input
              value={state.team}
              required
              maxLength={40}
              onChange={(e) => setState((s) => ({ ...s, team: e.target.value }))}
            />
          </label>
          <Button type="submit">Save changes</Button>
        </form>
      </Modal>
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
function ProjectCard({
  project,
  compact = false,
}: {
  project: { id: string; name: string; description: string; color: string };
  compact?: boolean;
}) {
  const { state } = useStore();
  const tasks = state.tasks.filter((t) => t.project === project.id);
  const done = tasks.filter((t) => t.status === 'Done').length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const index = state.projects.findIndex((p) => p.id === project.id);
  const source = state.projects.find((p) => p.id === project.id)?.source;
  return (
    <Link
      href={`/app/projects?project=${project.id}`}
      className={`project-card nova-notebook ${compact ? 'compact' : ''}`}
      style={{ '--notebook-color': project.color } as React.CSSProperties}
    >
      <div className="nova-notebook-spine" />
      <div className="project-card-top">
        <span className="nova-notebook-index">NOTEBOOK / {String(index + 1).padStart(2, '0')}</span>
        <span className="project-menu">
          <ArrowUpRight size={17} />
        </span>
      </div>
      <div className="nova-notebook-heading">
        <span
          className="project-symbol"
          style={{ color: project.color, background: `${project.color}18` }}
        >
          <Folder size={19} />
        </span>
        <h3>{project.name}</h3>
      </div>
      <p>{project.description}</p>
      {source && (
        <span className="nova-project-source">
          <CodeXml size={12} />
          From GitHub
        </span>
      )}
      <div className="project-progress-label">
        <span>
          {done} of {tasks.length} tasks completed
        </span>
        <b>{progress}%</b>
      </div>
      <div className="progress-track">
        <span style={{ width: `${progress}%`, background: project.color }} />
      </div>
      <div className="project-card-bottom">
        <span>{tasks.filter((t) => t.status === 'In progress').length} in motion</span>
        <span>
          {tasks.length ? 'Open notebook' : 'A fresh start'} <ArrowRight size={12} />
        </span>
      </div>
    </Link>
  );
}

function TaskTable({ tasks, search = false }: { tasks: Task[]; search?: boolean }) {
  const { state, setState, announce } = useStore();
  const [filter, setFilter] = useState('All tasks');
  const [query, setQuery] = useState('');
  const router = useRouter();
  const shown = tasks.filter(
    (t) =>
      (filter === 'All tasks' || t.status === filter) &&
      t.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="table-toolbar">
        <div className="tab-bar">
          {['All tasks', 'Todo', 'In progress', 'Done'].map((tab) => (
            <button
              key={tab}
              className={filter === tab ? 'selected' : ''}
              onClick={() => setFilter(tab)}
            >
              {tab}
              {tab === 'All tasks' && <span>{tasks.length}</span>}
            </button>
          ))}
        </div>
        {search && (
          <div className="small-search">
            <Search size={15} />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search tasks"
              placeholder="Search tasks"
            />
          </div>
        )}
      </div>
      <div className="table-scroll">
        <table className="task-table">
          <thead>
            <tr>
              <th>Task name</th>
              <th>Project</th>
              <th>Priority</th>
              <th>Due date</th>
              <th>Assignee</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((t) => (
              <tr key={t.id} className={router.query.task === t.id ? 'highlighted' : ''}>
                <td>
                  <button
                    className={`task-check ${t.status === 'Done' ? 'done' : ''}`}
                    aria-label={`${t.status === 'Done' ? 'Reopen' : 'Complete'} ${t.title}`}
                    onClick={() => {
                      setState((s) => ({
                        ...s,
                        tasks: s.tasks.map((task) =>
                          task.id === t.id
                            ? { ...task, status: task.status === 'Done' ? 'Todo' : 'Done' }
                            : task,
                        ),
                      }));
                      announce(
                        t.status === 'Done'
                          ? 'Task reopened.'
                          : 'Task completed. A little more progress.',
                      );
                    }}
                  >
                    {t.status === 'Done' ? (
                      <Check size={12} />
                    ) : t.status === 'In progress' ? (
                      <span />
                    ) : null}
                  </button>
                  <span className={t.status === 'Done' ? 'completed-task' : ''}>{t.title}</span>
                  {t.source && (
                    <a
                      className="nova-task-source"
                      href={t.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Source: ${t.source.repository} milestone ${t.source.number}`}
                    >
                      GitHub milestone #{t.source.number}
                      <ExternalLink size={10} />
                    </a>
                  )}
                </td>
                <td>
                  <span className="table-project">
                    <i
                      style={{ background: state.projects.find((p) => p.id === t.project)?.color }}
                    />
                    {state.projects.find((p) => p.id === t.project)?.name}
                  </span>
                </td>
                <td>
                  <span className={`priority ${t.priority.toLowerCase()}`}>
                    <i />
                    {t.priority}
                  </span>
                </td>
                <td className={t.due === 'Today' ? 'due-today' : 'muted'}>{t.due}</td>
                <td>
                  <span className="assignee">
                    <span>{t.assignee.slice(0, 1)}</span>
                    {t.assignee}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <p className="empty-state">No tasks match your filters.</p>}
      </div>
    </>
  );
}

function NewTask({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: string;
}) {
  const { state, setState, announce } = useStore();
  const [title, setTitle] = useState('');
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Make your next move"
      description="Add a task to keep the good work moving."
    >
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          const data = new FormData(e.currentTarget);
          if (!state.projects.some((p) => p.id === String(data.get('project')))) {
            announce('Create a project before adding a task.');
            return;
          }
          setState((s) => ({
            ...s,
            tasks: [
              {
                id: uid(),
                title: title.trim(),
                project: String(data.get('project')),
                status: 'Todo',
                priority: String(data.get('priority')) as Task['priority'],
                assignee: state.name || 'Alex',
                due: String(data.get('due')),
              },
              ...s.tasks,
            ],
          }));
          setTitle('');
          onOpenChange(false);
          announce('New task added to your workspace.');
        }}
      >
        <label>
          Task name
          <Input
            autoFocus
            required
            placeholder="What needs to happen?"
            value={title}
            maxLength={90}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Project
          <select name="project" defaultValue={project || state.projects[0]?.id}>
            {state.projects.map((p) => (
              <option value={p.id} key={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <div className="form-columns">
          <label>
            Priority
            <select name="priority" defaultValue="Medium">
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </label>
          <label>
            Due
            <select name="due">
              <option>Today</option>
              <option>Tomorrow</option>
              <option>This week</option>
              <option>No due date</option>
            </select>
          </label>
        </div>
        <Button type="submit">
          <Plus size={16} />
          Create task
        </Button>
      </form>
    </Modal>
  );
}

function Dashboard({ openCommand }: { openCommand: () => void }) {
  const { state, setState, announce } = useStore();
  const [newTask, setNewTask] = useState(false);
  const [agenda, setAgenda] = useState<'Today' | 'Next up' | 'All tasks'>('Today');
  const [focusId, setFocusId] = useState('');
  const completed = state.tasks.filter((t) => t.status === 'Done').length;
  const progress = Math.round(state.tasks.length ? (completed / state.tasks.length) * 100 : 0);
  const today = state.tasks.filter((t) => t.due === 'Today');
  const upcoming = state.tasks.filter((t) => t.due !== 'Today' && t.status !== 'Done');
  const shown = agenda === 'Today' ? today : agenda === 'Next up' ? upcoming : state.tasks;
  const unfinished = state.tasks.filter((t) => t.status !== 'Done');
  const focus =
    unfinished.find((t) => t.id === focusId) ||
    unfinished.find((t) => t.status === 'In progress' && t.priority === 'High') ||
    unfinished[0];
  const focusProject = state.projects.find((p) => p.id === focus?.project);
  return (
    <div className="nova-daily-space">
      <PageHeading
        eyebrow="YOUR DAILY SPACE"
        title={`A good day to make progress, ${state.name}.`}
        description="Make room for the work that matters. One thoughtful step at a time."
      >
        <Button onClick={() => setNewTask(true)}>
          <Plus size={16} />
          New task
        </Button>
      </PageHeading>
      <div className="nova-daily-grid">
        <section className="nova-agenda" aria-label="Daily agenda">
          <div className="nova-agenda-heading">
            <div>
              <span className="nova-section-number">01 / YOUR NEXT STEPS</span>
              <h2>A little direction.</h2>
            </div>
            <span className="nova-today-count">
              {today.filter((t) => t.status !== 'Done').length} due today
            </span>
          </div>
          <div className="nova-agenda-tabs" role="group" aria-label="Agenda view">
            {(['Today', 'Next up', 'All tasks'] as const).map((label) => (
              <button
                key={label}
                aria-pressed={agenda === label}
                className={agenda === label ? 'active' : ''}
                onClick={() => setAgenda(label)}
              >
                {label}
                {label === 'Today' && <span>{today.length}</span>}
              </button>
            ))}
          </div>
          <div className="nova-agenda-list">
            {shown.map((t) => (
              <article
                className={`nova-agenda-task ${t.status === 'Done' ? 'is-complete' : ''}`}
                key={t.id}
              >
                <button
                  className={`task-check ${t.status === 'Done' ? 'done' : ''}`}
                  aria-label={`${t.status === 'Done' ? 'Reopen' : 'Complete'} ${t.title}`}
                  onClick={() => {
                    setState((s) => ({
                      ...s,
                      tasks: s.tasks.map((task) =>
                        task.id === t.id
                          ? { ...task, status: task.status === 'Done' ? 'Todo' : 'Done' }
                          : task,
                      ),
                    }));
                    announce(
                      t.status === 'Done'
                        ? 'Task reopened.'
                        : 'Task completed. A little more progress.',
                    );
                  }}
                >
                  {t.status === 'Done' ? (
                    <Check size={12} />
                  ) : t.status === 'In progress' ? (
                    <span />
                  ) : null}
                </button>
                <div>
                  <Link
                    href={`/app/projects?project=${t.project}&task=${t.id}`}
                    className="nova-agenda-title"
                  >
                    {t.title}
                  </Link>
                  <span className="nova-agenda-meta">
                    <i
                      style={{ background: state.projects.find((p) => p.id === t.project)?.color }}
                    />
                    {state.projects.find((p) => p.id === t.project)?.name}
                    <span>·</span>
                    {t.assignee}
                    <span>·</span>
                    {t.due}
                  </span>
                </div>
                <span className={`nova-agenda-priority ${t.priority.toLowerCase()}`}>
                  {t.priority}
                </span>
                <Link
                  href={`/app/projects?project=${t.project}&task=${t.id}`}
                  className="icon-button nova-task-open"
                  aria-label={`Open ${t.title}`}
                >
                  <ArrowUpRight size={15} />
                </Link>
              </article>
            ))}
            {!shown.length && (
              <div className="nova-agenda-empty">
                <CheckCheck size={26} />
                <h3>{state.tasks.length ? 'A little breathing room.' : 'A fresh page.'}</h3>
                <p>
                  {state.tasks.length
                    ? 'No tasks in this view. Explore your next steps or make space for a new idea.'
                    : 'Create a project, then add your first task. Good work starts with one small step.'}
                </p>
                {!state.projects.length && (
                  <Link href="/app/projects" className="text-link">
                    Create your first project <ArrowRight size={15} />
                  </Link>
                )}
              </div>
            )}
          </div>
          {agenda === 'Today' && upcoming.length > 0 && (
            <div className="nova-agenda-next">
              <div>
                <span className="nova-section-number">LOOKING AHEAD</span>
                <button onClick={() => setAgenda('Next up')}>
                  See next steps <ArrowRight size={12} />
                </button>
              </div>
              {upcoming.slice(0, 2).map((t) => (
                <Link key={t.id} href={`/app/projects?project=${t.project}&task=${t.id}`}>
                  <span>
                    <i
                      style={{ background: state.projects.find((p) => p.id === t.project)?.color }}
                    />
                    {t.title}
                  </span>
                  <small>{t.due}</small>
                </Link>
              ))}
            </div>
          )}
          <button className="nova-quick-add" onClick={() => setNewTask(true)}>
            <Plus size={16} />
            Capture a next step
          </button>
        </section>
        <aside className="nova-focus-space" aria-label="Focus and clarity">
          <div className="nova-focus-card">
            <div className="nova-focus-top">
              <span className="nova-section-number">02 / MAKE SPACE</span>
              <span className="nova-focus-orbit" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </div>
            <h2>
              {focus ? (
                <>
                  One thing,
                  <br />
                  at a time.
                </>
              ) : state.tasks.length ? (
                <>
                  A little room,
                  <br />
                  well earned.
                </>
              ) : (
                <>
                  Room for
                  <br />
                  your next idea.
                </>
              )}
            </h2>
            <p className="nova-focus-intro">
              {focus
                ? 'A small place to begin. Pick up where you left off.'
                : state.tasks.length
                  ? 'Every current task is complete. Take a breath, then make space for what’s next.'
                  : 'Your next chapter starts with a little intention.'}
            </p>
            {focus ? (
              <div className="nova-focus-next">
                <span>
                  <i style={{ background: focusProject?.color }} />
                  {focusProject?.name}
                </span>
                <label className="nova-focus-picker">
                  Focus task
                  <select
                    aria-label="Focus task"
                    value={focus.id}
                    onChange={(e) => setFocusId(e.target.value)}
                  >
                    {unfinished.map((t) => (
                      <option value={t.id} key={t.id}>
                        {t.title} · {state.projects.find((p) => p.id === t.project)?.name}
                      </option>
                    ))}
                  </select>
                </label>
                <h3>{focus.title}</h3>
                <div className="nova-focus-actions">
                  <Link
                    className="button button-primary"
                    href={`/app/projects?project=${focus.project}&task=${focus.id}`}
                  >
                    Continue in project <ArrowUpRight size={16} />
                  </Link>
                  <Button
                    variant="ghost"
                    size="small"
                    aria-label="Complete focus task"
                    onClick={() => {
                      setState((s) => ({
                        ...s,
                        tasks: s.tasks.map((t) =>
                          t.id === focus.id ? { ...t, status: 'Done' as const } : t,
                        ),
                      }));
                      announce('Focus task completed. A little more progress.');
                    }}
                  >
                    <Check size={15} />
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <Link className="button button-primary" href="/app/projects">
                Explore your projects <ArrowUpRight size={16} />
              </Link>
            )}
            <div className="nova-daily-progress">
              <div
                className="focus-ring"
                style={{ '--progress': `${progress}%` } as React.CSSProperties}
              >
                <span>
                  <b>
                    {progress}
                    <small>%</small>
                  </b>
                </span>
              </div>
              <div>
                <b>{completed} thoughtful steps, done.</b>
                <p>
                  {state.tasks.length
                    ? `${state.tasks.length - completed} still taking shape. Keep your own pace.`
                    : 'Your workspace is ready when you are.'}
                </p>
              </div>
            </div>
          </div>
          <Link href="/app/assistant" className="nova-clarity-link">
            <Sparkles size={21} />
            <span>
              <b>Need a little clarity?</b>
              <small>Find your next move with NOVA.</small>
            </span>
            <ArrowUpRight size={16} />
          </Link>
        </aside>
      </div>
      <section className="nova-project-shelf">
        <div className="section-heading">
          <div>
            <span className="nova-section-number">03 / IDEAS TAKING SHAPE</span>
            <h2>Your open notebooks.</h2>
          </div>
          <Link href="/app/projects">
            View all projects <ArrowRight size={15} />
          </Link>
        </div>
        <div className="project-grid">
          {state.projects.slice(0, 3).map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
        {!state.projects.length && (
          <Link href="/app/projects" className="nova-empty-project">
            Give your first idea a home <Plus size={18} />
          </Link>
        )}
      </section>
      <div className="nova-bottom-row">
        <button className="nova-command-entry" onClick={openCommand}>
          <Command size={20} />
          <span>
            Less searching. More doing.<small>Find a page, project or task.</small>
          </span>
          <kbd>Ctrl / ⌘ K</kbd>
          <ArrowRight size={18} />
        </button>
        <div className="nova-workspace-pulse" aria-label="Workspace progress">
          <div className="metric">
            <div>
              <span>Active projects</span>
            </div>
            <b>{String(state.projects.length).padStart(2, '0')}</b>
          </div>
          <div className="metric">
            <div>
              <span>Tasks in progress</span>
            </div>
            <b>
              {String(state.tasks.filter((t) => t.status === 'In progress').length).padStart(
                2,
                '0',
              )}
            </b>
          </div>
          <div className="metric">
            <div>
              <span>Workspace focus</span>
            </div>
            <b>{progress}%</b>
          </div>
        </div>
      </div>
      <NewTask open={newTask} onOpenChange={setNewTask} />
    </div>
  );
}
function Metric({
  label,
  value,
  foot,
  icon: Icon,
}: {
  label: string;
  value: string;
  foot: string;
  icon: LucideIcon;
}) {
  return (
    <div className="metric">
      <div>
        <span>{label}</span>
        <Icon size={17} />
      </div>
      <b>{value}</b>
      <p>
        <span className="metric-tick">
          <ArrowUpRight size={12} />
        </span>
        {foot}
      </p>
    </div>
  );
}
function ActivityChart({ wide = false, range = 'week' }: { wide?: boolean; range?: string }) {
  const values = range === 'month' ? [30, 46, 39, 63, 50, 77, 70] : [20, 32, 27, 54, 46, 74, 62];
  return (
    <div className={`activity-panel panel ${wide ? 'wide' : ''}`}>
      <div className="section-heading">
        <div>
          <h2>Momentum, visualised</h2>
          <p className="muted text-xs mt-1">
            Tasks completed over {range === 'month' ? 'the last month' : 'the last week'}
          </p>
        </div>
        <span className="chart-legend">
          <i />
          Completed tasks
        </span>
      </div>
      <div className="line-chart">
        <div className="chart-y">
          <span>80</span>
          <span>60</span>
          <span>40</span>
          <span>20</span>
          <span>0</span>
        </div>
        <svg
          viewBox="0 0 640 160"
          role="img"
          aria-label={`Completed task trend: ${values.join(', ')}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`chartGradient-${wide}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#a496ff" stopOpacity=".24" />
              <stop offset="1" stopColor="#a496ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 40, 80, 120, 159].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="640"
              y2={y}
              stroke="currentColor"
              strokeDasharray="3 5"
            />
          ))}
          <path
            d={`M 0 160 L ${values.map((v, i) => `${i * 106.6} ${160 - v * 1.8}`).join(' L ')} L 640 160 Z`}
            fill={`url(#chartGradient-${wide})`}
          />
          <polyline
            points={values.map((v, i) => `${i * 106.6},${160 - v * 1.8}`).join(' ')}
            fill="none"
            stroke="#a496ff"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {values.map((v, i) => (
            <circle key={i} cx={i * 106.6} cy={160 - v * 1.8} r="4" fill="#a496ff" />
          ))}
        </svg>
      </div>
      <div className="chart-x">
        {(range === 'month'
          ? ['Week 1', '', 'Week 2', '', 'Week 3', '', 'Week 4']
          : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        ).map((day, i) => (
          <span key={i}>{day}</span>
        ))}
      </div>
    </div>
  );
}

function Projects() {
  const { state, setState, announce } = useStore();
  const router = useRouter();
  const selected = state.projects.find((p) => p.id === router.query.project);
  const [newTask, setNewTask] = useState(false);
  const [newProject, setNewProject] = useState(false);
  const [board, setBoard] = useState(false);
  return (
    <>
      <PageHeading
        eyebrow="FROM IDEA TO DONE"
        title={selected ? selected.name : 'Good work starts here.'}
        description={
          selected ? selected.description : 'Give your ideas a home. Make something great together.'
        }
      >
        <Button onClick={() => (selected ? setNewTask(true) : setNewProject(true))}>
          <Plus size={16} />
          {selected ? 'New task' : 'New project'}
        </Button>
      </PageHeading>
      {selected ? (
        <>
          <div className="project-view-toolbar">
            <div>
              <Link href="/app/projects" className="text-link">
                ← All projects
              </Link>
              {selected.source && (
                <a
                  className="nova-project-source-link"
                  style={{ marginTop: 12 }}
                  href={selected.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View source repository <ExternalLink size={13} />
                </a>
              )}
            </div>
            <div className="tab-bar">
              <button className={!board ? 'selected' : ''} onClick={() => setBoard(false)}>
                List view
              </button>
              <button className={board ? 'selected' : ''} onClick={() => setBoard(true)}>
                Board view
              </button>
            </div>
          </div>
          {board ? (
            <div className="kanban-grid">
              {(['Todo', 'In progress', 'Done'] as const).map((status) => (
                <div
                  className="kanban-column"
                  key={status}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData('task');
                    setState((s) => ({
                      ...s,
                      tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
                    }));
                    announce(`Task moved to ${status}.`);
                  }}
                >
                  <h3>
                    <i className={`board-status ${status.toLowerCase().replace(' ', '-')}`} />
                    {status}
                    <span>
                      {
                        state.tasks.filter((t) => t.project === selected.id && t.status === status)
                          .length
                      }
                    </span>
                  </h3>
                  {state.tasks
                    .filter((t) => t.project === selected.id && t.status === status)
                    .map((t) => (
                      <article
                        className="kanban-task"
                        key={t.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('task', t.id)}
                      >
                        <span className={`priority ${t.priority.toLowerCase()}`}>
                          <i />
                          {t.priority}
                        </span>
                        <h4>{t.title}</h4>
                        <div>
                          <span>{t.due}</span>
                          <select
                            aria-label={`Status of ${t.title}`}
                            value={t.status}
                            onChange={(e) =>
                              setState((s) => ({
                                ...s,
                                tasks: s.tasks.map((task) =>
                                  task.id === t.id
                                    ? { ...task, status: e.target.value as Task['status'] }
                                    : task,
                                ),
                              }))
                            }
                          >
                            <option>Todo</option>
                            <option>In progress</option>
                            <option>Done</option>
                          </select>
                        </div>
                      </article>
                    ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="panel">
              <TaskTable tasks={state.tasks.filter((t) => t.project === selected.id)} search />
            </div>
          )}
        </>
      ) : (
        <>
          <div className="project-grid">
            {state.projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
          <div className="section-heading task-section-heading">
            <h2>All your next steps</h2>
          </div>
          <div className="panel">
            <TaskTable tasks={state.tasks} search />
          </div>
        </>
      )}
      <NewTask open={newTask} onOpenChange={setNewTask} project={selected?.id} />
      <Modal
        open={newProject}
        onOpenChange={setNewProject}
        title="Give your idea a home"
        description="Create a project in your demo workspace."
      >
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const name = String(data.get('name')).trim();
            if (!name) return;
            setState((s) => ({
              ...s,
              projects: [
                ...s.projects,
                {
                  id: uid(),
                  name,
                  description: String(data.get('description')).trim() || 'Your next great idea',
                  color: ['#ab9cff', '#7dd3c7', '#edb876'][s.projects.length % 3],
                },
              ],
            }));
            setNewProject(false);
            announce('Your new project is ready.');
          }}
        >
          <label>
            Project name
            <Input name="name" required maxLength={45} placeholder="Something worth making" />
          </label>
          <label>
            Description
            <Input name="description" maxLength={90} placeholder="What are we working towards?" />
          </label>
          <Button type="submit">
            Create project <ArrowRight size={16} />
          </Button>
        </form>
      </Modal>
    </>
  );
}

function Assistant() {
  const { state, setState, announce } = useStore();
  const [prompt, setPrompt] = useState('');
  const [thinking, setThinking] = useState(false);
  const [mutation, setMutation] = useState('');
  const [pendingId, setPendingId] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRequest = useRef('');
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
      activeRequest.current = '';
    },
    [],
  );
  useEffect(() => {
    if (!pendingId) return;
    const reply = assistantReply(state.messages[state.messages.length - 1], pendingId);
    if (!reply) return;
    activeRequest.current = '';
    setPendingId('');
    setThinking(false);
    setMutation(reply.action);
    if (reply.action) announce(`${reply.action}. Your workspace is up to date.`);
  }, [state.messages, pendingId, announce]);
  function cancelPending() {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    activeRequest.current = '';
    setPendingId('');
    setThinking(false);
    setMutation('');
  }
  function send(value = prompt) {
    const text = value.trim();
    if (!text || activeRequest.current) return;
    const request = { id: uid(), taskId: uid(), text };
    activeRequest.current = request.id;
    setPrompt('');
    setThinking(true);
    setMutation('');
    setPendingId(request.id);
    timer.current = setTimeout(() => {
      timer.current = null;
      setState((current) => applyAssistantRequest(current, request));
    }, 650);
  }
  return (
    <>
      <PageHeading
        eyebrow="A BRIGHTER WAY TO WORK"
        title="Meet your creative co-pilot."
        description="Turn a little context into your next best move."
      />
      <div className="assistant-layout">
        <section className="chat-panel panel">
          <div className="chat-top">
            <span className="assistant-avatar">
              <Sparkles size={19} />
            </span>
            <span>
              <b>NOVA assistant</b>
              <small>
                <i className="status-dot" />
                Local demo · Ready to help
              </small>
            </span>
            <Button
              variant="ghost"
              size="small"
              onClick={() => {
                cancelPending();
                setState((s) => ({ ...s, messages: seed.messages }));
                announce('Conversation cleared.');
              }}
            >
              Clear chat
            </Button>
          </div>
          <div className="chat-messages" aria-live="polite">
            {state.messages.map((m, i) => (
              <div className={`chat-message ${m.role}`} key={i}>
                <span className={m.role === 'assistant' ? 'assistant-avatar' : 'avatar'}>
                  {m.role === 'assistant' ? <Sparkles size={16} /> : state.name.slice(0, 1)}
                </span>
                <div>
                  <b>{m.role === 'assistant' ? 'NOVA' : state.name}</b>
                  <p>{m.text}</p>
                </div>
              </div>
            ))}
            {thinking && (
              <div className="thinking">
                <Sparkles size={15} />
                Finding your next best move<span>•••</span>
              </div>
            )}
            {mutation && (
              <span className="action-confirmation">
                <CheckCheck size={14} />
                {mutation} in your workspace
              </span>
            )}
          </div>
          <form
            className="chat-composer"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <Input
              aria-label="Message NOVA"
              placeholder="Ask, create, or find a little clarity…"
              value={prompt}
              maxLength={400}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Button
              disabled={thinking || !prompt.trim()}
              size="icon"
              type="submit"
              aria-label="Send message"
            >
              <ArrowUp size={18} />
            </Button>
          </form>
          <p className="chat-disclosure">
            Demo assistant. Deterministic responses, real updates to your local tasks.
          </p>
        </section>
        <aside className="assistant-context">
          <div className="panel context-card">
            <Sparkles size={22} />
            <h2>A little inspiration</h2>
            <p>Good questions make good things happen.</p>
            {[
              'What should I focus on today?',
              'Summarise Brand refresh',
              'Create task: Plan the launch',
              'Complete Explore visual direction',
            ].map((p) => (
              <button key={p} onClick={() => send(p)} disabled={thinking}>
                {p}
                <ArrowUpRight size={14} />
              </button>
            ))}
          </div>
          <div className="context-note">
            <i className="status-dot" />
            <span>
              Connected to your workspace
              <small>
                {state.projects.length} projects · {state.tasks.length} tasks
              </small>
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}

const nodeOptions: Record<FlowNode['kind'], string[]> = {
  trigger: ['Task marked complete', 'Task created', 'Project updated'],
  condition: ['Priority is High', 'Due date is Today', 'Project is Brand refresh'],
  action: ['Notify the team', 'Create follow-up task', 'Move task to Done'],
};
function Automations() {
  const { state, setState, announce } = useStore();
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [drag, setDrag] = useState('');
  const picked = state.nodes.find((n) => n.id === selected);
  function move(id: string, direction: number) {
    setState((s) => {
      const nodes = [...s.nodes];
      const index = nodes.findIndex((n) => n.id === id);
      const target = index + direction;
      if (target < 0 || target >= nodes.length) return s;
      [nodes[index], nodes[target]] = [nodes[target], nodes[index]];
      return { ...s, nodes };
    });
  }
  function run() {
    if (!state.nodes.length) {
      announce('Add a trigger and an action first.');
      return;
    }
    const actions = state.nodes.filter((n) => n.kind === 'action');
    if (!state.nodes.some((n) => n.kind === 'trigger') || !actions.length) {
      announce('Your flow needs a trigger and an action before it can run.');
      return;
    }
    const demoTask =
      state.tasks.find((t) => t.priority === 'High' && t.status !== 'Done') || state.tasks[0];
    if (!demoTask) {
      setLog(['No tasks available. Create a task before testing this flow.']);
      announce('Create a task before testing this flow.');
      return;
    }
    const conditionPass = state.nodes
      .filter((n) => n.kind === 'condition')
      .every((n) =>
        n.label === 'Priority is High'
          ? demoTask.priority === 'High'
          : n.label === 'Due date is Today'
            ? demoTask.due === 'Today'
            : demoTask.project === 'brand',
      );
    const results = [
      'Triggered with sample task: ' + demoTask.title,
      ...state.nodes
        .filter((n) => n.kind === 'condition')
        .map((n) => `${n.label} → ${conditionPass ? 'passed' : 'not matched'}`),
    ];
    if (conditionPass) {
      setState((s) => ({
        ...s,
        notifications: actions.some((n) => n.label === 'Notify the team')
          ? [`Automation ran for “${demoTask.title}”.`, ...s.notifications]
          : s.notifications,
        tasks: actions.some((n) => n.label === 'Create follow-up task')
          ? [
              {
                id: uid(),
                title: `Follow up: ${demoTask.title}`,
                project: demoTask.project,
                status: 'Todo',
                priority: 'Medium',
                assignee: s.name,
                due: 'Tomorrow',
              },
              ...s.tasks.map((t) =>
                actions.some((n) => n.label === 'Move task to Done') && t.id === demoTask.id
                  ? { ...t, status: 'Done' as const }
                  : t,
              ),
            ]
          : s.tasks.map((t) =>
              actions.some((n) => n.label === 'Move task to Done') && t.id === demoTask.id
                ? { ...t, status: 'Done' as const }
                : t,
            ),
      }));
      results.push(...actions.map((n) => `${n.label} → completed locally`));
    } else results.push('Actions skipped because the sample task did not match.');
    setLog(results);
    announce('Demo flow tested. See the run log.');
  }
  return (
    <>
      <PageHeading
        eyebrow="LESS REPETITION. MORE POSSIBILITY."
        title="Put the little things on autopilot."
        description="Connect a trigger, a condition and an action. Let good work flow."
      >
        <Button onClick={run}>
          <Play size={15} />
          Test flow
        </Button>
      </PageHeading>
      <div className="automation-toolbar panel">
        <div>
          <span className="workflow-symbol">
            <Workflow size={19} />
          </span>
          <div>
            <b>Celebrate the small wins</b>
            <small>{state.nodes.length} steps · Local simulation</small>
          </div>
        </div>
        <button
          className={`toggle ${state.automationActive ? 'on' : ''}`}
          role="switch"
          aria-checked={state.automationActive}
          aria-label="Enable local automation"
          onClick={() => {
            setState((s) => ({ ...s, automationActive: !s.automationActive }));
            announce(
              state.automationActive ? 'Automation paused.' : 'Flow enabled for local test runs.',
            );
          }}
        >
          <span />
        </button>
        <span className="muted text-sm">
          {state.automationActive ? 'Enabled for tests' : 'Paused'}
        </span>
      </div>
      <div className="automation-layout">
        <div className="flow-canvas">
          <div className="canvas-label">
            <span className="status-dot" />
            YOUR WORKFLOW
          </div>
          <div className="flow-line" />
          {state.nodes.map((node, i) => (
            <div
              className={`flow-node ${node.kind} ${selected === node.id ? 'selected' : ''}`}
              key={node.id}
              draggable
              onDragStart={(e) => {
                setDrag(node.id);
                e.dataTransfer.setData('flow-node', node.id);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('flow-node') || drag;
                setState((s) => {
                  const nodes = [...s.nodes];
                  const old = nodes.findIndex((n) => n.id === id);
                  if (old < 0) return s;
                  const [moved] = nodes.splice(old, 1);
                  nodes.splice(i, 0, moved);
                  return { ...s, nodes };
                });
                announce('Workflow step reordered.');
              }}
            >
              <button className="flow-node-content" onClick={() => setSelected(node.id)}>
                <span className="flow-node-icon">
                  {node.kind === 'trigger' ? (
                    <Zap size={19} />
                  ) : node.kind === 'condition' ? (
                    <Workflow size={19} />
                  ) : (
                    <Bell size={19} />
                  )}
                </span>
                <span>
                  <small>
                    {i + 1}.{' '}
                    {node.kind === 'trigger'
                      ? 'WHEN'
                      : node.kind === 'condition'
                        ? 'ONLY IF'
                        : 'THEN'}
                  </small>
                  <b>{node.label}</b>
                </span>
                <ChevronRight size={16} />
              </button>
              <div className="node-actions">
                <button
                  aria-label={`Move ${node.label} up`}
                  disabled={i === 0}
                  onClick={() => move(node.id, -1)}
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  aria-label={`Move ${node.label} down`}
                  disabled={i === state.nodes.length - 1}
                  onClick={() => move(node.id, 1)}
                >
                  <ArrowDown size={12} />
                </button>
                <button
                  aria-label={`Remove ${node.label}`}
                  onClick={() =>
                    setState((s) => ({ ...s, nodes: s.nodes.filter((n) => n.id !== node.id) }))
                  }
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
          <button className="add-node" onClick={() => setAdding(true)}>
            <Plus size={18} />
            Add a step
          </button>
          <p className="canvas-help">Drag to reorder · Arrow buttons work with a keyboard</p>
        </div>
        <aside className="panel flow-inspector">
          <div className="inspector-heading">
            <Settings size={17} />
            <h3>Step settings</h3>
          </div>
          {picked ? (
            <>
              <label className="form-stack">
                {picked.kind} behaviour
                <select
                  value={picked.label}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      nodes: s.nodes.map((n) =>
                        n.id === picked.id ? { ...n, label: e.target.value } : n,
                      ),
                    }))
                  }
                >
                  {nodeOptions[picked.kind].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </label>
              <p className="muted text-sm mt-4">
                Changes apply immediately to the local test flow.
              </p>
            </>
          ) : (
            <div className="inspector-empty">
              <Workflow size={35} />
              <h4>Every step has a purpose.</h4>
              <p>Select a node to fine-tune what happens next.</p>
            </div>
          )}
          <div className="flow-run-log">
            <h4>Run log</h4>
            {log.length ? (
              log.map((line, i) => (
                <p key={i}>
                  <Check size={12} />
                  {line}
                </p>
              ))
            ) : (
              <p className="muted">
                Test your flow to see what happens. Sample data is used; nothing is sent outside
                this browser.
              </p>
            )}
          </div>
        </aside>
      </div>
      <Modal
        open={adding}
        onOpenChange={setAdding}
        title="What happens next?"
        description="Choose a step to add to your automation."
      >
        <div className="node-options">
          {(['trigger', 'condition', 'action'] as const).map((kind) => (
            <button
              key={kind}
              onClick={() => {
                setState((s) => ({
                  ...s,
                  nodes: [...s.nodes, { id: uid(), kind, label: nodeOptions[kind][0] }],
                }));
                setAdding(false);
                announce(`${kind} step added.`);
              }}
            >
              <span>
                {kind === 'trigger' ? <Zap /> : kind === 'condition' ? <Workflow /> : <Bell />}
              </span>
              <div>
                <b>
                  {kind === 'trigger'
                    ? 'A trigger'
                    : kind === 'condition'
                      ? 'A condition'
                      : 'An action'}
                </b>
                <p>
                  {kind === 'trigger'
                    ? 'Start when something happens'
                    : kind === 'condition'
                      ? 'Continue only when it matches'
                      : 'Make something useful happen'}
                </p>
              </div>
              <Plus size={17} />
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}

function Analytics() {
  const { state, announce } = useStore();
  const [range, setRange] = useState('week');
  const done = state.tasks.filter((t) => t.status === 'Done').length;
  function exportData() {
    const content =
      'Project,Total tasks,Completed\n' +
      state.projects
        .map(
          (p) =>
            `"${p.name.replace(/"/g, '""')}",${state.tasks.filter((t) => t.project === p.id).length},${state.tasks.filter((t) => t.project === p.id && t.status === 'Done').length}`,
        )
        .join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nova-workspace-analytics.csv';
    a.click();
    URL.revokeObjectURL(url);
    announce('Analytics exported as CSV.');
  }
  return (
    <>
      <PageHeading
        eyebrow="SEE THE BIGGER PICTURE"
        title="Progress you can feel. And see."
        description="A clear view of where your team’s energy is going."
      >
        <div className="heading-button-group">
          <select
            aria-label="Analytics date range"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="week">This week</option>
            <option value="month">This month</option>
          </select>
          <Button variant="secondary" onClick={exportData}>
            <Download size={15} />
            Export report
          </Button>
        </div>
      </PageHeading>
      <div className="overview-stats">
        <Metric
          label="Total tasks"
          value={String(state.tasks.length)}
          foot="Across your workspace"
          icon={Folder}
        />
        <Metric
          label="Completion rate"
          value={`${Math.round(state.tasks.length ? (done / state.tasks.length) * 100 : 0)}%`}
          foot="Based on your current tasks"
          icon={CheckCheck}
        />
        <Metric
          label="High priority open"
          value={String(
            state.tasks.filter((t) => t.priority === 'High' && t.status !== 'Done').length,
          )}
          foot="Your biggest opportunities"
          icon={Target}
        />
        <Metric
          label="Active projects"
          value={String(state.projects.length)}
          foot="Ideas with momentum"
          icon={Zap}
        />
      </div>
      <ActivityChart wide range={range} />
      <div className="analytics-bottom">
        <div className="panel project-breakdown">
          <div className="section-heading">
            <h2>Progress by project</h2>
            <span className="muted text-xs">Live workspace data</span>
          </div>
          {state.projects.map((p) => {
            const tasks = state.tasks.filter((t) => t.project === p.id);
            const complete = tasks.filter((t) => t.status === 'Done').length;
            return (
              <div className="breakdown-row" key={p.id}>
                <div>
                  <i style={{ background: p.color }} />
                  <b>{p.name}</b>
                  <span>
                    {complete} / {tasks.length}
                  </span>
                </div>
                <div className="progress-track">
                  <span
                    style={{
                      background: p.color,
                      width: `${tasks.length ? (complete / tasks.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="panel status-breakdown">
          <div className="section-heading">
            <h2>Where things stand</h2>
          </div>
          {(['Todo', 'In progress', 'Done'] as const).map((status, i) => (
            <div key={status}>
              <span>
                <i style={{ background: ['#6d6b7b', '#a496ff', '#7dd3c7'][i] }} />
                {status}
              </span>
              <b>{state.tasks.filter((t) => t.status === status).length}</b>
            </div>
          ))}
          <p className="muted text-xs mt-6">
            The momentum chart uses illustrative sample history. Task and project metrics reflect
            your local workspace.
          </p>
        </div>
      </div>
    </>
  );
}

const integrationData = [
  {
    id: 'slack',
    name: 'Slack',
    letter: '#',
    color: '#dca7da',
    text: 'Keep the conversation close to the work.',
    category: 'Communication',
  },
  {
    id: 'figma',
    name: 'Figma',
    letter: 'F',
    color: '#edac90',
    text: 'Bring your best ideas into view.',
    category: 'Design',
  },
  {
    id: 'github',
    name: 'GitHub',
    letter: '⌘',
    color: '#d2d0dc',
    text: 'A home for everything you’re building.',
    category: 'Engineering',
  },
  {
    id: 'notion',
    name: 'Notion',
    letter: 'N',
    color: '#dedbe8',
    text: 'Your knowledge, right where you need it.',
    category: 'Productivity',
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    letter: '31',
    color: '#82abe2',
    text: 'Make time for what really matters.',
    category: 'Productivity',
  },
  {
    id: 'linear',
    name: 'Linear',
    letter: '◒',
    color: '#a39cec',
    text: 'Turn the next step into a clear plan.',
    category: 'Engineering',
  },
];
function Integrations() {
  const { state, setState, announce } = useStore();
  const [filter, setFilter] = useState('All apps');
  return (
    <>
      <PageHeading
        eyebrow="YOUR TOOLS. BETTER TOGETHER."
        title="Good company for your workspace."
        description="Read public GitHub milestones or explore how other tools could fit into your workflow."
      />
      <div className="integration-intro">
        <Globe size={28} />
        <div>
          <h3>One workspace. Endless possibilities.</h3>
          <p>GitHub reads live public data. Other connections are local previews.</p>
        </div>
        <span>{state.integrations.filter((id) => id !== 'github').length} demo connections</span>
      </div>
      <div className="tab-bar integration-tabs">
        {['All apps', 'Communication', 'Design', 'Engineering', 'Productivity'].map((item) => (
          <button
            className={filter === item ? 'selected' : ''}
            key={item}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="integration-grid">
        {integrationData
          .filter((item) => filter === 'All apps' || item.category === filter)
          .map((item) => {
            const connected = item.id !== 'github' && state.integrations.includes(item.id);
            return (
              <article className="integration-card panel" key={item.id}>
                <div className="integration-card-header">
                  <span className="app-symbol" style={{ color: item.color }}>
                    {item.letter}
                  </span>
                  <span className="muted text-xs">{item.category}</span>
                </div>
                <h3>{item.name}</h3>
                <p>{item.text}</p>
                {item.id === 'github' ? (
                  <Link href="/app/github" className="button button-secondary">
                    <CodeXml size={15} />
                    Open GitHub workspace
                  </Link>
                ) : (
                  <button
                    className={`button ${connected ? 'button-secondary' : 'button-ghost'}`}
                    onClick={() => {
                      setState((s) => ({
                        ...s,
                        integrations: connected
                          ? s.integrations.filter((id) => id !== item.id)
                          : [...s.integrations, item.id],
                      }));
                      announce(
                        connected
                          ? `${item.name} demo connection removed.`
                          : `${item.name} demo connection added. No external account is connected.`,
                      );
                    }}
                  >
                    {connected ? <Check size={15} /> : <Plus size={15} />}{' '}
                    {connected ? 'Demo connected' : 'Try demo connection'}
                  </button>
                )}
              </article>
            );
          })}
      </div>
      <p className="integration-disclosure">
        <CircleHelp size={15} />
        GitHub reads public repositories and milestones without signing in. Other cards demonstrate
        connection states; no external account is connected.
      </p>
    </>
  );
}

import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { OperationsLanding } from './OperationsLanding';
import {
  ArrowRight,
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  ExternalLink,
  LayoutDashboard,
  LayoutGrid,
  List,
  ListTodo,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { Button, Dialog, Input, Select, Switch } from './components/ui';
import {
  dateLabel,
  departments,
  initials,
  loadState,
  locations,
  owners,
  persistState,
  seed,
  shiftOptions,
  statuses,
} from './data';
import type { Notice, Settings, State, Status, Task } from './data';
import { GitHubQueue } from './GitHubQueue';
import type { GitHubIssue } from './github';
import { isSupportedDate } from './storage';

const OperationsConsole = lazy(() =>
  import('./OperationsConsole').then((module) => ({ default: module.OperationsConsole })),
);

const navigation = [
  { path: 'overview', label: 'Overview', icon: LayoutDashboard },
  { path: 'tasks', label: 'Task management', icon: ListTodo },
  { path: 'github', label: 'GitHub queue', icon: ExternalLink },
  { path: 'coverage', label: 'Team coverage', icon: Users },
  { path: 'notifications', label: 'Notifications', icon: Bell },
];
const statusColours = ['#7b8da4', '#3c7bda', '#9f80cf', '#549b84'];
const freshTask = (): Task => ({
  id: `OPS-${Date.now().toString().slice(-6)}`,
  title: '',
  description: '',
  department: 'Operations',
  priority: 'Medium',
  status: 'Backlog',
  owner: 'Olivia Chen',
  due: '2026-10-14',
  location: 'London',
});
const routeFromHash = () => window.location.hash.replace(/^#\/?/, '') || 'landing';
function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand ${light ? 'brand-light' : ''}`}>
      <span className="brand-mark">
        <svg width="23" height="25" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M10 54 32 10l22 44H40l-8-17-8 17Z" fill="currentColor" />
          <path d="m32 10 10 20-10 7-10-7Z" fill={light ? '#e9a575' : '#e9a575'} />
        </svg>
      </span>
      <strong>
        ATLAS<span>ops</span>
      </strong>
    </span>
  );
}
function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <span
      className={`avatar ${small ? 'avatar-small' : ''} avatar-${Math.abs(name.charCodeAt(0)) % 5}`}
      aria-label={name}
    >
      {initials(name)}
    </span>
  );
}
function Badge({ children, type }: { children: string; type?: string }) {
  return (
    <span className={`badge badge-${(type || children).toLowerCase().replaceAll(' ', '-')}`}>
      {children === 'High' && <span className="priority-dots">!!!</span>}
      {children === 'Medium' && <span className="priority-dots">!!</span>}
      {children === 'Low' && <span className="priority-dots">!</span>}
      {children}
    </span>
  );
}

export default function App() {
  const [state, setState] = useState<State>(loadState);
  const [route, setRoute] = useState(routeFromHash);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const navigationOpener = useRef<HTMLButtonElement>(null);
  const navigationPanel = useRef<HTMLElement>(null);
  const navigationWasOpen = useRef(false);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const unread = state.notices.filter((n) => !n.read).length;
  const go = (path: string) => {
    window.location.hash = `/${path}`;
    setMobileNav(false);
    window.scrollTo({ top: 0 });
  };
  const notify = (message: string) => setToast(message);
  useEffect(() => {
    const handler = () => {
      setRoute(routeFromHash());
      setMobileNav(false);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  useEffect(() => {
    if (!mobileNav) {
      if (navigationWasOpen.current) navigationOpener.current?.focus();
      navigationWasOpen.current = false;
      return;
    }
    navigationWasOpen.current = true;
    const panel = navigationPanel.current;
    const focusable = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') || [],
      ).filter((element) => element.getClientRects().length > 0);
    focusable()[0]?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileNav(false);
      }
      if (event.key === 'Tab') {
        const controls = focusable();
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
    };
  }, [mobileNav]);
  useEffect(() => {
    try {
      persistState(state);
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    document.title = `ATLAS Ops · ${route === 'landing' ? 'Operational clarity' : route[0]?.toUpperCase() + route.slice(1)}`;
  }, [route]);
  const addNotice = (title: string, detail: string, kind: Notice['kind'] = 'task'): Notice => ({
    id: crypto.randomUUID(),
    title,
    detail,
    kind,
    read: false,
    time: new Date().toISOString(),
  });
  const editTask = (task: Task | null) => {
    setEditingTask(task);
    setTaskOpen(true);
  };
  const saveTask = (task: Task) => {
    const existing = !!editingTask?.id;
    setState((s) => ({
      ...s,
      tasks: existing ? s.tasks.map((t) => (t.id === task.id ? task : t)) : [task, ...s.tasks],
      notices: [
        addNotice(existing ? 'Task updated' : 'New task created', `${task.title} · ${task.status}`),
        ...s.notices,
      ],
    }));
    setTaskOpen(false);
    notify(existing ? 'Task changes saved' : 'Task added to your workspace');
  };
  const moveTask = (id: string, status: Status) => {
    const task = state.tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
      notices: [
        addNotice(
          `${task.title} moved to ${status.toLowerCase()}`,
          `${task.id} · Updated in Task management`,
        ),
        ...s.notices,
      ],
    }));
    notify(`Task moved to ${status.toLowerCase()}`);
  };
  const importIssue = (issue: GitHubIssue, repository: string) => {
    if (state.tasks.some((task) => task.source?.issueId === issue.id)) {
      notify('This issue is already in your local tasks');
      return;
    }
    const importedAt = new Date().toISOString();
    const due = new Date();
    due.setUTCDate(due.getUTCDate() + 7);
    const task: Task = {
      ...freshTask(),
      id: `GH-${issue.id}`,
      title: issue.title.slice(0, 100),
      description: (issue.body || `Review GitHub issue #${issue.number} from ${repository}.`).slice(
        0,
        500,
      ),
      due: due.toISOString().slice(0, 10),
      source: {
        kind: 'github',
        issueId: issue.id,
        issueNumber: issue.number,
        repository,
        url: issue.url,
        importedAt,
      },
    };
    const notice = addNotice(
      'GitHub issue added to local tasks',
      `${repository} #${issue.number} · ${task.title}`,
    );
    setState((current) =>
      current.tasks.some((existing) => existing.source?.issueId === issue.id)
        ? current
        : {
            ...current,
            tasks: [task, ...current.tasks],
            notices: [notice, ...current.notices],
          },
    );
    notify(`Issue #${issue.number} added to your local backlog`);
  };
  const mainRoute = navigation.some((n) => n.path === route) || route === 'settings';
  return (
    <>
      {route === 'landing' || (!mainRoute && route !== 'login') ? (
        <OperationsLanding go={go} />
      ) : route === 'login' ? (
        <Login
          go={go}
          onEnter={(name, email) => {
            setState((s) => ({ ...s, settings: { ...s.settings, name, email } }));
            go('overview');
            notify('Welcome to your demo workspace');
          }}
        />
      ) : (
        <div
          className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''} ${state.settings.compact ? 'density-compact' : ''}`}
        >
          <a
            className="console-skip"
            href="#main-content"
            onClick={(event) => {
              event.preventDefault();
              document.getElementById('main-content')?.focus();
            }}
          >
            Skip to main content
          </a>
          {mobileNav && (
            <button
              aria-label="Close navigation"
              className="mobile-scrim"
              onClick={() => setMobileNav(false)}
            />
          )}
          <aside
            ref={navigationPanel}
            id="atlas-navigation"
            className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}
            aria-label="Workspace navigation"
          >
            <a
              href="#/overview"
              className="brand-link"
              aria-label="ATLAS Ops overview"
              onClick={() => setMobileNav(false)}
            >
              <Logo light />
            </a>
            <button
              className="workspace-picker"
              onClick={() => go('settings')}
              aria-label="Edit workspace settings"
            >
              <span className="workspace-icon">A</span>
              <span className="workspace-name">
                <strong>{state.settings.workspace}</strong>
                <small>
                  Operations <span className="plan-label">DEMO</span>
                </small>
              </span>
              <ChevronDown size={15} />
            </button>
            <p className="nav-label">CONTROL MODULES</p>
            <nav>
              {navigation.map(({ path, label, icon: Icon }, index) => (
                <a
                  key={path}
                  aria-label={label}
                  href={`#/${path}`}
                  className={`nav-item ${route === path ? 'active' : ''}`}
                  aria-current={route === path ? 'page' : undefined}
                  title={collapsed ? label : undefined}
                  onClick={() => setMobileNav(false)}
                >
                  <Icon size={19} />
                  <span>{label}</span>
                  <b className="nav-index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </b>
                  {path === 'notifications' && unread > 0 && <b className="nav-count">{unread}</b>}
                </a>
              ))}
            </nav>
            <div className="sidebar-secondary">
              <p className="nav-label">CONFIGURATION</p>
              <a
                href="#/settings"
                onClick={() => setMobileNav(false)}
                className={`nav-item ${route === 'settings' ? 'active' : ''}`}
                aria-current={route === 'settings' ? 'page' : undefined}
                title={collapsed ? 'Settings' : undefined}
              >
                <Settings2 size={19} />
                <span>Settings</span>
              </a>
              <button
                className="nav-item"
                onClick={() => {
                  setMobileNav(false);
                  setHelpOpen(true);
                }}
                title={collapsed ? 'Help and shortcuts' : undefined}
              >
                <CircleHelp size={19} />
                <span>Help & shortcuts</span>
                <ExternalLink size={13} />
              </button>
            </div>
            <div className="sidebar-bottom">
              <div className="workspace-health">
                <span className="pulse-dot" />
                <span>Browser workspace ready</span>
              </div>
              <button
                className="profile"
                onClick={() => go('settings')}
                aria-label="Open profile settings"
              >
                <Avatar name={state.settings.name} />
                <span>
                  <strong>{state.settings.name}</strong>
                  <small>Workspace admin</small>
                </span>
                <MoreHorizontal size={18} />
              </button>
              <button
                className="collapse-toggle"
                onClick={() => setCollapsed((v) => !v)}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? (
                  <ChevronRight size={17} />
                ) : (
                  <>
                    <ChevronLeft size={17} />
                    <span>Collapse sidebar</span>
                  </>
                )}
              </button>
            </div>
          </aside>
          <div className="workspace-main">
            <header className="topbar">
              <div className="breadcrumb">
                <button
                  ref={navigationOpener}
                  className="icon-button mobile-menu"
                  aria-label="Open navigation"
                  aria-expanded={mobileNav}
                  aria-controls="atlas-navigation"
                  onClick={() => setMobileNav(true)}
                >
                  <Menu size={21} />
                </button>
                <span>ATLAS / CTRL</span>
                <ChevronRight size={14} />
                <strong>{navigation.find((n) => n.path === route)?.label || 'Settings'}</strong>
              </div>
              <div className="top-actions">
                <form
                  className="global-search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    go('tasks');
                  }}
                >
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search tasks..."
                    aria-label="Search workspace tasks"
                  />
                  <kbd>↵</kbd>
                </form>
                <button
                  className="icon-button notification-button"
                  aria-label={`Open notifications, ${unread} unread`}
                  onClick={() => go('notifications')}
                >
                  <Bell size={19} />
                  {unread > 0 && <i />}
                </button>
                <Avatar name={state.settings.name} small />
              </div>
            </header>
            <main id="main-content" className="content" tabIndex={-1}>
              {storageError && (
                <div className="storage-notice" role="status">
                  Browser storage is unavailable. Your edits will last until this tab is closed.
                </div>
              )}
              {route === 'overview' && (
                <Suspense fallback={<p role="status">Loading operational overview…</p>}>
                  <OperationsConsole
                    state={state}
                    go={go}
                    editTask={editTask}
                    onTargets={(settings) => {
                      setState((s) => ({ ...s, settings }));
                      notify('Chart targets updated');
                    }}
                    notify={notify}
                  />
                </Suspense>
              )}
              {route === 'tasks' && (
                <Tasks
                  tasks={state.tasks}
                  query={query}
                  setQuery={setQuery}
                  editTask={editTask}
                  moveTask={moveTask}
                />
              )}
              {route === 'github' && (
                <GitHubQueue tasks={state.tasks} onImport={importIssue} go={go} />
              )}
              {route === 'coverage' && (
                <CoveragePage
                  state={state}
                  update={(id, day, shift) => {
                    const person = state.coverage.find((p) => p.id === id)!;
                    setState((s) => ({
                      ...s,
                      coverage: s.coverage.map((p) =>
                        p.id === id
                          ? { ...p, shifts: p.shifts.map((v, i) => (i === day ? shift : v)) }
                          : p,
                      ),
                      notices: [
                        addNotice(
                          `${person.name}'s coverage updated`,
                          `${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][day]} · ${shift}`,
                          'coverage',
                        ),
                        ...s.notices,
                      ],
                    }));
                    notify('Coverage schedule saved');
                  }}
                  notify={notify}
                />
              )}
              {route === 'notifications' && (
                <Notifications
                  state={state}
                  markRead={(id) =>
                    setState((s) => ({
                      ...s,
                      notices: s.notices.map((n) =>
                        !id || n.id === id ? { ...n, read: true } : n,
                      ),
                    }))
                  }
                  go={go}
                  clearRead={() => {
                    setState((s) => ({ ...s, notices: s.notices.filter((n) => !n.read) }));
                    notify('Read notifications cleared');
                  }}
                />
              )}
              {route === 'settings' && (
                <SettingsPage
                  settings={state.settings}
                  onSave={(settings) => {
                    setState((s) => ({ ...s, settings }));
                    notify('Workspace settings saved');
                  }}
                  reset={() => setResetOpen(true)}
                  exit={() => go('landing')}
                />
              )}
            </main>
            <footer className="app-footer">
              <span>
                ATLAS Ops <span>·</span> Command center / Sample operations
              </span>
              <span>
                <span className="tiny-dot" />
                Local demo workspace
              </span>
            </footer>
          </div>
        </div>
      )}
      <TaskEditor
        open={taskOpen}
        setOpen={setTaskOpen}
        task={editingTask}
        save={saveTask}
        remove={(id) => {
          setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
          setTaskOpen(false);
          notify('Task deleted');
        }}
      />
      <Dialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset your demo workspace?"
        description="This restores the original tasks, schedules, notifications and settings. Your current demo edits will be removed."
      >
        <div className="dialog-actions">
          <Button variant="secondary" onClick={() => setResetOpen(false)}>
            Keep my changes
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setState(structuredClone(seed));
              setResetOpen(false);
              notify('Demo data restored');
            }}
          >
            Reset demo data
          </Button>
        </div>
      </Dialog>
      <Dialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        title="Make yourself at home"
        description="ATLAS is an interactive portfolio demo. Workspace records are fictional; the GitHub queue reads live public issues. Your task edits stay in this browser."
      >
        <div className="help-list">
          <p>
            <Search size={18} />
            <span>Search in the top bar and press Enter to find a task.</span>
          </p>
          <p>
            <LayoutGrid size={18} />
            <span>Drag cards between columns, or use the status selector on each card.</span>
          </p>
          <p>
            <SlidersHorizontal size={18} />
            <span>Edit chart targets, adjust team shifts and save workspace preferences.</span>
          </p>
          <p>
            <ShieldCheck size={18} />
            <span>No account, password, payment or server is required.</span>
          </p>
        </div>
        <Button className="w-full" onClick={() => setHelpOpen(false)}>
          Got it
        </Button>
      </Dialog>
      <div className={`toast ${toast ? 'toast-visible' : ''}`} role="status" aria-live="polite">
        {toast && (
          <>
            <span>
              <Check size={16} />
            </span>
            {toast}
            <button
              className="icon-button"
              aria-label="Dismiss notification"
              onClick={() => setToast('')}
            >
              <X size={16} />
            </button>
          </>
        )}
      </div>
    </>
  );
}

function Login({
  go,
  onEnter,
}: {
  go: (path: string) => void;
  onEnter: (name: string, email: string) => void;
}) {
  const [name, setName] = useState('Olivia Chen');
  const [email, setEmail] = useState('olivia@example.com');
  return (
    <div className="login-page">
      <div className="login-art">
        <Logo light />
        <div>
          <span className="eyebrow">A CLEARER WAY FORWARD</span>
          <h1>
            A little clarity.
            <br />A lot of possibility.
          </h1>
          <p>Your business, brought together in one place.</p>
          <div className="login-graphic">
            <div>
              <TrendingUp size={30} />
              <strong>£84,280</strong>
              <span>Revenue, moving in the right direction.</span>
            </div>
            <div>
              <CheckCheck size={28} />
              <strong>All in sync.</strong>
              <span>People. Priorities. Progress.</span>
            </div>
          </div>
        </div>
        <small>ATLAS Ops · Independent portfolio project</small>
      </div>
      <main className="login-form-wrap">
        <button className="back-link" onClick={() => go('landing')}>
          <ChevronLeft size={16} />
          Back to ATLAS
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onEnter(name.trim(), email.trim());
          }}
        >
          <span className="login-icon">
            <LayoutDashboard size={26} />
          </span>
          <h2>Welcome to your workspace.</h2>
          <p>
            Personalise the demo with a name and email.
            <br />
            No password or real account is required.
          </p>
          <label htmlFor="demo-name">Your name</label>
          <Input
            id="demo-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={60}
            autoComplete="name"
          />
          <label htmlFor="demo-email">Email address</label>
          <Input
            id="demo-email"
            type="email"
            maxLength={320}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Button className="w-full" type="submit">
            Enter demo workspace <ArrowRight size={17} />
          </Button>
          <div className="local-privacy">
            <ShieldCheck size={16} />
            These details stay in your browser.
          </div>
        </form>
        <small>Fictional business data. Real interactions.</small>
      </main>
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function Tasks({
  tasks,
  query,
  setQuery,
  editTask,
  moveTask,
}: {
  tasks: Task[];
  query: string;
  setQuery: (q: string) => void;
  editTask: (t: Task | null) => void;
  moveTask: (id: string, status: Status) => void;
}) {
  const [view, setView] = useState('board');
  const [priority, setPriority] = useState('All priorities');
  const [department, setDepartment] = useState('All departments');
  const [sort, setSort] = useState('due');
  const [dragged, setDragged] = useState('');
  const filtered = tasks
    .filter(
      (t) =>
        `${t.title} ${t.id} ${t.owner} ${t.description}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (priority === 'All priorities' || t.priority === priority) &&
        (department === 'All departments' || t.department === department),
    )
    .sort((a, b) =>
      sort === 'due'
        ? a.due.localeCompare(b.due)
        : sort === 'title'
          ? a.title.localeCompare(b.title)
          : ['High', 'Medium', 'Low'].indexOf(a.priority) -
            ['High', 'Medium', 'Low'].indexOf(b.priority),
    );
  return (
    <>
      <PageHeading
        eyebrow="DISPATCH / WORK QUEUE"
        title="Task management"
        description="Assign, prioritise and dispatch operational work."
        action={
          <Button onClick={() => editTask(null)}>
            <Plus size={17} />
            Create task
          </Button>
        }
      />
      <div className="task-summary">
        <span>
          <strong>{tasks.filter((t) => t.status !== 'Complete').length}</strong> open tasks
        </span>
        <span>
          <strong>
            {tasks.filter((t) => t.priority === 'High' && t.status !== 'Complete').length}
          </strong>{' '}
          high priority
        </span>
        <span>
          <strong>{tasks.filter((t) => t.status === 'Complete').length}</strong> completed
        </span>
      </div>
      <div className="task-toolbar">
        <div className="search-field">
          <Search size={16} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks or people..."
            aria-label="Search tasks"
          />
          {query && (
            <button
              className="icon-button"
              aria-label="Clear task search"
              onClick={() => setQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <Select
          aria-label="Filter task priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option>All priorities</option>
          {['High', 'Medium', 'Low'].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </Select>
        <Select
          aria-label="Filter task department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option>All departments</option>
          {departments.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </Select>
        <Select aria-label="Sort tasks" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="due">Due date</option>
          <option value="priority">Priority</option>
          <option value="title">Task name</option>
        </Select>
        <div className="segmented view-toggle">
          <button
            aria-label="Board view"
            aria-pressed={view === 'board'}
            className={view === 'board' ? 'selected' : ''}
            onClick={() => setView('board')}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            aria-label="List view"
            aria-pressed={view === 'list'}
            className={view === 'list' ? 'selected' : ''}
            onClick={() => setView('list')}
          >
            <List size={16} />
          </button>
        </div>
      </div>
      <div className="filter-caption">
        <span>
          Showing {filtered.length} of {tasks.length} tasks
        </span>
        <span>Drag to move · Or choose a status on any card</span>
      </div>
      {filtered.length === 0 ? (
        <div className="panel empty-state">
          <Search size={30} />
          <strong>No tasks match your filters.</strong>
          <p>Try another search, or clear your filters to see all tasks.</p>
          <Button
            variant="secondary"
            onClick={() => {
              setQuery('');
              setPriority('All priorities');
              setDepartment('All departments');
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : view === 'board' ? (
        <div className="kanban">
          {statuses.map((status, i) => (
            <section
              key={status}
              className={`kanban-column ${dragged ? 'drop-available' : ''}`}
              aria-label={`${status} tasks`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                moveTask(e.dataTransfer.getData('text/plain') || dragged, status);
                setDragged('');
              }}
            >
              <div className="column-header">
                <span>
                  <i style={{ background: statusColours[i] }} />
                  {status}
                  <b>{filtered.filter((t) => t.status === status).length}</b>
                </span>
                <button
                  className="icon-button"
                  aria-label={`Add task to ${status}`}
                  onClick={() => editTask({ ...freshTask(), status, id: '' })}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="column-cards">
                {filtered
                  .filter((t) => t.status === status)
                  .map((t) => (
                    <article
                      className={`task-card ${dragged === t.id ? 'dragging' : ''}`}
                      key={t.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', t.id);
                        setDragged(t.id);
                      }}
                      onDragEnd={() => setDragged('')}
                    >
                      <div className="task-card-top">
                        <span className={`department-label dep-${t.department.toLowerCase()}`}>
                          {t.department}
                        </span>
                        <button
                          className="icon-button"
                          aria-label={`Edit ${t.title}`}
                          onClick={() => editTask(t)}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                      <button className="card-title" onClick={() => editTask(t)}>
                        {t.title}
                      </button>
                      <p>{t.description}</p>
                      {t.source && (
                        <a
                          className="task-source"
                          href={t.source.url}
                          target="_blank"
                          rel="noreferrer"
                          draggable={false}
                        >
                          GitHub #{t.source.issueNumber}
                          <ExternalLink size={12} />
                        </a>
                      )}
                      <Badge>{t.priority}</Badge>
                      <div className="task-card-foot">
                        <span>
                          <Clock3 size={12} />
                          {dateLabel(t.due)}
                        </span>
                        <Avatar name={t.owner} small />
                      </div>
                      <Select
                        aria-label={`Status for ${t.title}`}
                        value={t.status}
                        onChange={(e) => moveTask(t.id, e.target.value as Status)}
                      >
                        {statuses.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </Select>
                    </article>
                  ))}
                <button
                  className="add-column-task"
                  onClick={() => editTask({ ...freshTask(), status, id: '' })}
                >
                  <Plus size={15} />
                  Add task
                </button>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="panel table-scroll">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th>Due date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>
                    <button className="task-title-button" onClick={() => editTask(t)}>
                      <span>
                        <strong>{t.title}</strong>
                        <small>
                          {t.id} · {t.department}
                        </small>
                      </span>
                    </button>
                  </td>
                  <td>
                    <span className="person-cell">
                      <Avatar name={t.owner} small />
                      {t.owner}
                    </span>
                  </td>
                  <td>
                    <Badge>{t.priority}</Badge>
                  </td>
                  <td>{dateLabel(t.due)}</td>
                  <td>
                    <Select
                      aria-label={`Status for ${t.title}`}
                      value={t.status}
                      onChange={(e) => moveTask(t.id, e.target.value as Status)}
                    >
                      {statuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function TaskEditor({
  open,
  setOpen,
  task,
  save,
  remove,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  task: Task | null;
  save: (task: Task) => void;
  remove: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Task>(freshTask);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const isExisting = !!task?.id;
  useEffect(() => {
    if (open) {
      setDraft(task ? { ...task, id: task.id || freshTask().id } : freshTask());
      setDeleteConfirm(false);
    }
  }, [open, task]);
  const field = <K extends keyof Task>(key: K, value: Task[K]) =>
    setDraft((s) => ({ ...s, [key]: value }));
  const validateDue = (input: HTMLInputElement) => {
    input.setCustomValidity(
      isSupportedDate(input.value) ? '' : 'Choose a valid date with a year from 0001 to 9999.',
    );
    return input.checkValidity();
  };
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={isExisting ? 'Edit task' : 'Create a new task'}
      description={
        isExisting
          ? `${task?.id} · Keep the details up to date.`
          : 'Give the next priority a home in your workspace.'
      }
    >
      <form
        className="dialog-form"
        onSubmit={(e) => {
          e.preventDefault();
          const dueInput = e.currentTarget.querySelector<HTMLInputElement>('#task-due');
          if (dueInput && !validateDue(dueInput)) {
            dueInput.reportValidity();
            return;
          }
          if (draft.title.trim()) save({ ...draft, title: draft.title.trim() });
        }}
      >
        <label htmlFor="task-title">Task name</label>
        <Input
          id="task-title"
          placeholder="What needs to be done?"
          value={draft.title}
          onChange={(e) => field('title', e.target.value)}
          maxLength={100}
          required
          autoFocus
        />
        <label htmlFor="task-description">Description</label>
        <textarea
          id="task-description"
          className="input"
          placeholder="Add a little context..."
          value={draft.description}
          onChange={(e) => field('description', e.target.value)}
          maxLength={500}
          rows={3}
        />
        {draft.source && (
          <a className="task-source" href={draft.source.url} target="_blank" rel="noreferrer">
            Source: {draft.source.repository} #{draft.source.issueNumber}
            <ExternalLink size={13} />
          </a>
        )}
        <div className="form-grid">
          <div>
            <label htmlFor="task-department">Department</label>
            <Select
              id="task-department"
              value={draft.department}
              onChange={(e) => field('department', e.target.value)}
            >
              {departments.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="task-priority">Priority</label>
            <Select
              id="task-priority"
              value={draft.priority}
              onChange={(e) => field('priority', e.target.value as Task['priority'])}
            >
              {['High', 'Medium', 'Low'].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="task-owner">Assignee</label>
            <Select
              id="task-owner"
              value={draft.owner}
              onChange={(e) => field('owner', e.target.value)}
            >
              {owners.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="task-due">Due date</label>
            <Input
              id="task-due"
              type="date"
              max="9999-12-31"
              required
              value={draft.due}
              onChange={(e) => {
                validateDue(e.currentTarget);
                field('due', e.target.value);
              }}
            />
          </div>
          <div>
            <label htmlFor="task-status">Status</label>
            <Select
              id="task-status"
              value={draft.status}
              onChange={(e) => field('status', e.target.value as Status)}
            >
              {statuses.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="task-location">Location</label>
            <Select
              id="task-location"
              value={draft.location}
              onChange={(e) => field('location', e.target.value)}
            >
              {locations.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
          </div>
        </div>
        {deleteConfirm && (
          <div className="delete-confirm">
            <p>Delete this task from your workspace?</p>
            <Button type="button" variant="danger" onClick={() => remove(draft.id)}>
              Confirm delete
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDeleteConfirm(false)}>
              Keep task
            </Button>
          </div>
        )}
        <div className="dialog-actions">
          {isExisting && (
            <button type="button" className="delete-link" onClick={() => setDeleteConfirm(true)}>
              Delete task
            </button>
          )}
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit">{isExisting ? 'Save changes' : 'Create task'}</Button>
        </div>
      </form>
    </Dialog>
  );
}

function CoveragePage({
  state,
  update,
  notify,
}: {
  state: State;
  update: (id: string, day: number, shift: string) => void;
  notify: (message: string) => void;
}) {
  const [location, setLocation] = useState('All locations');
  const people = state.coverage.filter(
    (c) => location === 'All locations' || c.location === location,
  );
  const scheduled = people
    .flatMap((p) => p.shifts)
    .filter((s) => !['Leave', 'Off'].includes(s)).length;
  const percentage = Math.round((scheduled / Math.max(people.length * 5, 1)) * 100);
  const exportSchedule = () => {
    downloadCsv('atlas-coverage-5-oct.csv', [
      ['Team member', 'Location', 'Mon 5', 'Tue 6', 'Wed 7', 'Thu 8', 'Fri 9'],
      ...people.map((p) => [p.name, p.location, ...p.shifts]),
    ]);
    notify('Coverage schedule exported');
  };
  return (
    <>
      <PageHeading
        eyebrow="CAPACITY / REGIONAL ALLOCATION"
        title="Team coverage"
        description="Inspect the sample week and allocate regional team coverage."
        action={
          <Button variant="secondary" onClick={exportSchedule}>
            <Download size={16} />
            Export schedule
          </Button>
        }
      />
      <div className="coverage-cards">
        <article className="panel">
          <span className="metric-top">
            Scheduled coverage
            <Users size={17} />
          </span>
          <strong>{percentage}%</strong>
          <p>
            {scheduled} of {people.length * 5} weekday shifts covered
          </p>
        </article>
        <article className="panel">
          <span className="metric-top">
            Team members
            <ShieldCheck size={17} />
          </span>
          <strong>{people.length}</strong>
          <p>Across {location === 'All locations' ? 'three locations' : location}</p>
        </article>
        <article className="panel">
          <span className="metric-top">
            Open shifts
            <Clock3 size={17} />
          </span>
          <strong>{people.length * 5 - scheduled}</strong>
          <p>Leave and off days to keep an eye on</p>
        </article>
      </div>
      <section className="panel schedule-panel">
        <div className="panel-heading">
          <div>
            <h2>Week of 5–9 October 2026</h2>
            <p>Select any shift to adjust coverage. Changes save automatically.</p>
          </div>
          <Select
            aria-label="Filter coverage location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option>All locations</option>
            {locations.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </Select>
        </div>
        <div className="table-scroll">
          <table className="coverage-table">
            <thead>
              <tr>
                <th>Team member</th>
                {['Mon 5', 'Tue 6', 'Wed 7', 'Thu 8', 'Fri 9'].map((d) => (
                  <th className={d === 'Wed 7' ? 'today-col' : ''} key={d}>
                    {d}
                    {d === 'Wed 7' && <span>TODAY</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="person-cell">
                      <Avatar name={p.name} />
                      <span>
                        <strong>{p.name}</strong>
                        <small>
                          {p.role} · {p.location}
                        </small>
                      </span>
                    </div>
                  </td>
                  {p.shifts.map((shift, i) => (
                    <td className={i === 2 ? 'today-col' : ''} key={i}>
                      <Select
                        className={`shift-select shift-${['Leave', 'Off'].includes(shift) ? 'away' : shift === 'On call' ? 'call' : 'active'}`}
                        aria-label={`${p.name} ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][i]} shift`}
                        value={shift}
                        onChange={(e) => update(p.id, i, e.target.value)}
                      >
                        {shiftOptions.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </Select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Daily coverage</td>
                {[0, 1, 2, 3, 4].map((i) => {
                  const count = people.filter(
                    (p) => !['Leave', 'Off'].includes(p.shifts[i]),
                  ).length;
                  return (
                    <td key={i}>
                      <span className={count === people.length ? 'coverage-full' : 'coverage-gap'}>
                        {count} / {people.length} scheduled
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="schedule-legend">
          <span>
            <i className="legend-active" />
            Scheduled
          </span>
          <span>
            <i className="legend-call" />
            On call
          </span>
          <span>
            <i className="legend-away" />
            Leave / off
          </span>
          <span>All shifts shown in {state.settings.timezone}</span>
        </div>
      </section>
      <div className="coverage-tip">
        <span>
          <CircleHelp size={19} />
        </span>
        <div>
          <strong>A little room for the unexpected.</strong>
          <p>
            Use “On call” for flexible coverage. This sample schedule is for one week; exporting it
            creates a CSV you can keep.
          </p>
        </div>
      </div>
    </>
  );
}

function Notifications({
  state,
  markRead,
  go,
  clearRead,
}: {
  state: State;
  markRead: (id?: string) => void;
  go: (path: string) => void;
  clearRead: () => void;
}) {
  const [filter, setFilter] = useState('all');
  const [kind, setKind] = useState('all');
  const unread = state.notices.filter((n) => !n.read).length;
  const notices = state.notices.filter(
    (n) => (filter === 'all' || !n.read) && (kind === 'all' || n.kind === kind),
  );
  return (
    <>
      <PageHeading
        eyebrow="EVENT LOG / WORKSPACE UPDATES"
        title="Notifications"
        description="Inspect task, coverage and local workspace events."
        action={
          <Button variant="secondary" disabled={unread === 0} onClick={() => markRead()}>
            <CheckCheck size={16} />
            Mark all as read
          </Button>
        }
      />
      <div className="notifications-toolbar">
        <div className="segmented">
          <button
            className={filter === 'all' ? 'selected' : ''}
            aria-pressed={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            All activity <span>{state.notices.length}</span>
          </button>
          <button
            className={filter === 'unread' ? 'selected' : ''}
            aria-pressed={filter === 'unread'}
            onClick={() => setFilter('unread')}
          >
            Unread <span>{unread}</span>
          </button>
        </div>
        <div>
          <Select
            aria-label="Filter notification category"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="all">All categories</option>
            <option value="task">Tasks</option>
            <option value="coverage">Coverage</option>
            <option value="system">System</option>
          </Select>
          <Button variant="ghost" disabled={!state.notices.some((n) => n.read)} onClick={clearRead}>
            Clear read
          </Button>
        </div>
      </div>
      <div className="panel notification-list">
        {notices.length === 0 ? (
          <div className="empty-state">
            <Bell size={30} />
            <strong>A little quiet is a good thing.</strong>
            <p>
              You’re all caught up on {filter === 'unread' ? 'unread updates' : 'this category'}.
            </p>
          </div>
        ) : (
          notices.map((n) => (
            <article key={n.id} className={`notice-row ${n.read ? '' : 'notice-unread'}`}>
              <span className={`activity-icon activity-${n.kind}`}>
                {n.kind === 'coverage' ? (
                  <Users size={20} />
                ) : n.kind === 'task' ? (
                  <ListTodo size={20} />
                ) : (
                  <Zap size={20} />
                )}
              </span>
              <div className="notice-copy">
                <div>
                  <strong>{n.title}</strong>
                  {!n.read && <span className="unread-label">NEW</span>}
                </div>
                <p>{n.detail}</p>
                <span>
                  {new Date(n.time).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: state.settings.timezone,
                  })}{' '}
                  · {n.kind[0].toUpperCase() + n.kind.slice(1)}
                </span>
                <button
                  className="text-button"
                  onClick={() => {
                    markRead(n.id);
                    go(
                      n.kind === 'coverage' ? 'coverage' : n.kind === 'task' ? 'tasks' : 'overview',
                    );
                  }}
                >
                  View{' '}
                  {n.kind === 'coverage' ? 'coverage' : n.kind === 'task' ? 'tasks' : 'overview'}
                  <ArrowRight size={13} />
                </button>
              </div>
              {!n.read && (
                <button
                  className="icon-button"
                  aria-label={`Mark ${n.title} as read`}
                  onClick={() => markRead(n.id)}
                >
                  <Check size={18} />
                </button>
              )}
            </article>
          ))
        )}
      </div>
      <p className="demo-note">
        Updates are generated by changes you make in this local demo. No external services are
        connected.
      </p>
    </>
  );
}

function SettingsPage({
  settings,
  onSave,
  reset,
  exit,
}: {
  settings: Settings;
  onSave: (settings: Settings) => void;
  reset: () => void;
  exit: () => void;
}) {
  const [draft, setDraft] = useState(settings);
  useEffect(() => setDraft(settings), [settings]);
  const field = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setDraft((s) => ({ ...s, [key]: value }));
  return (
    <>
      <PageHeading
        eyebrow="CONFIGURATION / WORKSPACE"
        title="Workspace settings"
        description="Configure local operator details, targets and display preferences."
      />
      <form
        className="settings-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.name.trim() && draft.workspace.trim())
            onSave({ ...draft, name: draft.name.trim(), workspace: draft.workspace.trim() });
        }}
      >
        <section className="panel settings-section">
          <div className="settings-description">
            <h2>Workspace details</h2>
            <p>The name and defaults for your team’s shared space.</p>
          </div>
          <div className="settings-fields">
            <label htmlFor="workspace-name">Workspace name</label>
            <Input
              id="workspace-name"
              value={draft.workspace}
              onChange={(e) => field('workspace', e.target.value)}
              required
              maxLength={40}
            />
            <label htmlFor="settings-timezone">Display timezone</label>
            <Select
              id="settings-timezone"
              value={draft.timezone}
              onChange={(e) => field('timezone', e.target.value)}
            >
              <option value="Europe/London">London · Europe/London</option>
              <option value="Europe/Amsterdam">Amsterdam · Europe/Amsterdam</option>
              <option value="Europe/Berlin">Berlin · Europe/Berlin</option>
              <option value="Asia/Kolkata">Kolkata · Asia/Kolkata</option>
              <option value="America/New_York">New York · America/New_York</option>
            </Select>
            <p className="field-hint">
              Used to display notification timestamps. The seeded coverage week stays fixed.
            </p>
          </div>
        </section>
        <section className="panel settings-section">
          <div className="settings-description">
            <h2>Your profile</h2>
            <p>A familiar name and face in your demo workspace.</p>
          </div>
          <div className="settings-fields">
            <div className="profile-preview">
              <Avatar name={draft.name || 'Your Name'} />
              <span>
                <strong>{draft.name || 'Your name'}</strong>
                <small>Workspace administrator</small>
              </span>
            </div>
            <div className="form-grid">
              <div>
                <label htmlFor="profile-name">Full name</label>
                <Input
                  id="profile-name"
                  required
                  maxLength={60}
                  value={draft.name}
                  onChange={(e) => field('name', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="profile-email">Email address</label>
                <Input
                  id="profile-email"
                  type="email"
                  maxLength={320}
                  required
                  value={draft.email}
                  onChange={(e) => field('email', e.target.value)}
                />
              </div>
            </div>
            <p className="field-hint">
              <ShieldCheck size={13} />
              Profile details are stored only in this browser.
            </p>
          </div>
        </section>
        <section className="panel settings-section">
          <div className="settings-description">
            <h2>Preferences</h2>
            <p>Small adjustments that make the everyday work better.</p>
          </div>
          <div className="settings-fields">
            <div className="switch-row">
              <div>
                <strong>Compact workspace</strong>
                <p>Use a more concise layout for cards and tables.</p>
              </div>
              <Switch
                label="Compact workspace"
                checked={draft.compact}
                onCheckedChange={(v) => field('compact', v)}
              />
            </div>
            <div className="switch-row">
              <div>
                <strong>Weekly digest preference</strong>
                <p>Store your preference for a weekly summary. Demo email is not sent.</p>
              </div>
              <Switch
                label="Weekly digest preference"
                checked={draft.emailDigest}
                onCheckedChange={(v) => field('emailDigest', v)}
              />
            </div>
            <div className="switch-row">
              <div>
                <strong>Coverage alerts preference</strong>
                <p>Save your preference for coverage gap notifications.</p>
              </div>
              <Switch
                label="Coverage alerts preference"
                checked={draft.coverageAlerts}
                onCheckedChange={(v) => field('coverageAlerts', v)}
              />
            </div>
          </div>
        </section>
        <div className="settings-save">
          <span>Changes take effect when you save.</span>
          <Button type="submit">
            <Check size={16} />
            Save settings
          </Button>
        </div>
      </form>
      <section className="panel settings-section demo-controls">
        <div className="settings-description">
          <h2>Demo controls</h2>
          <p>A clean slate whenever you need it.</p>
        </div>
        <div className="settings-fields">
          <div className="reset-row">
            <div>
              <strong>Reset demo data</strong>
              <p>Restore the original tasks, coverage and settings.</p>
            </div>
            <Button variant="secondary" onClick={reset}>
              Reset demo
            </Button>
          </div>
          <div className="reset-row">
            <div>
              <strong>Return to the landing page</strong>
              <p>Your workspace changes will be kept in this browser.</p>
            </div>
            <Button variant="ghost" onClick={exit}>
              <LogOut size={16} />
              Exit workspace
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
    .join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

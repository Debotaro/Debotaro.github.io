import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  Clock3,
  Command,
  Download,
  FileImage,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Loader2,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { useRelay } from "./useRelay";
import {
  canManageProjects,
  canManageTasks,
  canReview,
  canUpload,
  createId,
} from "./domain";
import type {
  RelayAction as Action,
  Actor,
  Asset,
  Comment,
  Project,
  Role,
  Task,
  Workspace,
} from "./domain";

type View =
  | "overview"
  | "projects"
  | "tasks"
  | "review"
  | "activity"
  | "settings";
type Editor =
  | { kind: "project"; item?: Project }
  | { kind: "task"; item?: Task }
  | { kind: "feedback"; point?: { x: number; y: number } }
  | {
      kind: "delete";
      target: "project" | "task" | "asset";
      id: string;
      name: string;
    }
  | null;
const roleNames: Record<Role, string> = {
  admin: "Admin",
  pm: "Project manager",
  designer: "Designer",
  client: "Client",
};
const statusNames: Record<Task["status"], string> = {
  todo: "To do",
  in_progress: "In progress",
  review: "In review",
  done: "Done",
};
const assetNames: Record<Asset["status"], string> = {
  draft: "Draft",
  review: "Needs review",
  changes: "Changes requested",
  approved: "Approved",
};
const navigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "review", label: "Design review", icon: FileImage },
  { id: "activity", label: "Activity", icon: Clock3 },
  { id: "settings", label: "Settings", icon: Settings2 },
] as const;
function currentView(): View {
  const part = location.hash.replace(/^#\/?/, "").split("?")[0];
  return navigation.some((item) => item.id === part)
    ? (part as View)
    : "overview";
}
function dateLabel(value: string | null) {
  if (!value) return "No due date";
  return new Date(
    value.length === 10 ? value + "T12:00:00Z" : value,
  ).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "R"
  );
}
function percent(tasks: Task[]) {
  return tasks.length
    ? Math.round(
        (tasks.filter((task) => task.status === "done").length / tasks.length) *
          100,
      )
    : 0;
}
function Pill({ status }: { status: string }) {
  return (
    <span className={`pill pill-${status}`}>
      {assetNames[status as Asset["status"]] ||
        statusNames[status as Task["status"]] ||
        status}
    </span>
  );
}
function Modal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const previous = useRef(document.activeElement as HTMLElement | null);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className="modal"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            // Radix closes focus scopes asynchronously. A newly opened dialog
            // owns focus even if this older scope finishes closing afterward.
            if (!document.querySelector('[role="dialog"]'))
              previous.current?.focus();
          }}
        >
          <div className="modal-heading">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>{description}</Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label="Close dialog">
              <X size={19} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
function Empty({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="empty-state">
      <Sparkles size={28} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export default function App() {
  const relay = useRelay();
  const { state, actor, mode, ready, busy, error, storageStatus } = relay;
  const [view, setView] = useState<View>(currentView);
  const [navOpen, setNavOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [editor, setEditor] = useState<Editor>(null);
  const [palette, setPaletteState] = useState(false);
  const paletteOpen = useRef(false);
  function setPalette(value: boolean | ((current: boolean) => boolean)) {
    const next =
      typeof value === "function" ? value(paletteOpen.current) : value;
    paletteOpen.current = next;
    setPaletteState(next);
  }
  const [imageRatios, setImageRatios] = useState<Record<string, number>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [taskQuery, setTaskQuery] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");
  const [pinMode, setPinMode] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState("");
  const [toast, setToast] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("relay-theme") || "light";
    } catch {
      return "light";
    }
  });
  const searchButton = useRef<HTMLButtonElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (navOpen)
      document.querySelector<HTMLAnchorElement>(".sidebar nav a")?.focus();
  }, [navOpen]);
  useEffect(() => {
    const changed = () => {
      setView(currentView());
      setNavOpen(false);
      setEditor(null);
    };
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette((open) => !open);
      }
      if (event.key === "Escape") {
        if (document.querySelector(".sidebar.is-open"))
          menuButton.current?.focus();
        setNavOpen(false);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("relay-theme", theme);
    } catch {}
  }, [theme]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    setSelectedFeedback("");
    setPinMode(false);
  }, [projectId]);
  function go(next: View) {
    location.hash = "/" + next;
    setView(next);
    setNavOpen(false);
    setPalette(false);
    setSearch("");
  }
  const project =
    state.projects.find((item) => item.id === projectId) || state.projects[0];
  const assets = state.assets
    .filter((item) => item.projectId === project?.id)
    .sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt) || b.version - a.version,
    );
  const asset = assets.find((item) => item.id === assetId) || assets[0];
  const comments = state.comments.filter(
    (comment) => comment.assetId === asset?.id,
  );
  const activeProjects = state.projects.filter(
    (item) => item.status === "active",
  );
  const superseded = new Set(
    state.assets.map((item) => item.previousId).filter(Boolean),
  );
  const latestAsset = !!asset && !superseded.has(asset.id);
  const pendingReviews = state.assets.filter(
    (item) => item.status === "review" && !superseded.has(item.id),
  );
  const openTasks = state.tasks.filter((task) => task.status !== "done");
  const projectTasks = state.tasks.filter(
    (task) => task.projectId === project?.id,
  );
  async function act(action: Action, message: string) {
    try {
      await relay.dispatch(action);
      setToast(message);
      return true;
    } catch (reason) {
      setToast(
        reason instanceof Error
          ? reason.message
          : "That change could not be saved.",
      );
      return false;
    }
  }
  async function upload(file: File | undefined, revision = false) {
    if (!file || !project) return;
    try {
      await relay.uploadFile(
        file,
        project.id,
        revision ? asset?.id : undefined,
      );
      setAssetId("");
      setToast(
        revision
          ? "New revision uploaded. Earlier feedback stays with its version."
          : "Design uploaded and ready for feedback.",
      );
    } catch (reason) {
      setToast(
        reason instanceof Error
          ? reason.message
          : "The file could not be uploaded.",
      );
    }
  }
  function selectProject(id: string, next: View) {
    setAssetId("");
    setProjectId(id);
    go(next);
  }
  function newTask() {
    if (!state.projects.length) {
      setToast("Create a project before adding a task.");
      return;
    }
    if (!activeProjects.length) {
      setToast("Restore an active project before adding a task.");
      return;
    }
    setEditor({ kind: "task" });
  }
  function pin(x = 0.5, y = 0.5) {
    if (!pinMode) return;
    setEditor({ kind: "feedback", point: { x, y } });
    setPinMode(false);
  }
  const notice = relay.notice;
  if (!ready)
    return (
      <div className="loading-screen">
        <img src={import.meta.env.BASE_URL + "relay.svg"} alt="" />
        <Loader2 className="spin" />
        <p>Making room for your next move…</p>
      </div>
    );
  if (!actor) return <AccountScreen relay={relay} />;
  const editable = canManageTasks(actor.role);
  const manageProjects = canManageProjects(actor.role);
  const uploadAllowed = canUpload(actor.role);
  const filteredTasks = state.tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(taskQuery.toLowerCase()) &&
      (taskFilter === "all" || task.status === taskFilter),
  );
  const query = search.trim().toLowerCase();
  const searchResults = [
    ...state.projects.map((item) => ({
      label: item.title,
      type: "Project",
      run: () => selectProject(item.id, "projects"),
    })),
    ...state.tasks.map((item) => ({
      label: item.title,
      type: "Task",
      run: () => {
        setTaskQuery(item.title);
        setTaskFilter("all");
        go("tasks");
      },
    })),
    ...state.assets.map((item) => ({
      label: item.name,
      type: "Design",
      run: () => {
        setProjectId(item.projectId);
        go("review");
        setAssetId(item.id);
      },
    })),
    ...navigation.map((item) => ({
      label: item.label,
      type: "Navigate",
      run: () => go(item.id),
    })),
  ]
    .filter((item) => !query || item.label.toLowerCase().includes(query))
    .slice(0, 18);
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          const main = document.getElementById("main-content");
          main?.focus();
          main?.scrollIntoView({ block: "start" });
        }}
      >
        Skip to workspace
      </a>
      {navOpen && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => {
            setNavOpen(false);
            menuButton.current?.focus();
          }}
        />
      )}
      <aside className={`sidebar ${navOpen ? "is-open" : ""}`}>
        <a className="wordmark" href="#/overview">
          <img src={import.meta.env.BASE_URL + "relay.svg"} alt="" />
          <span>
            RELAY<span className="wordmark-os">OS</span>
            <small>FROM FEEDBACK TO FORWARD.</small>
          </span>
        </a>
        <div className="workspace-name">
          <span className="workspace-avatar">D</span>
          <div>
            Debotaro Studio<small>Creative workspace</small>
          </div>
          <ChevronDown size={15} />
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav aria-label="Workspace navigation">
          {navigation.map((item) => (
            <a
              key={item.id}
              href={"#/" + item.id}
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => setNavOpen(false)}
            >
              <item.icon size={18} />
              {item.label}
              {item.id === "review" && pendingReviews.length > 0 && (
                <span className="nav-counter">{pendingReviews.length}</span>
              )}
            </a>
          ))}
        </nav>
        <div className="sidebar-projects">
          <span className="nav-label">IN MOTION</span>
          {activeProjects.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => selectProject(item.id, "review")}
            >
              <i style={{ background: item.color }} />
              <span>{item.title}</span>
              <ArrowUpRight size={12} />
            </button>
          ))}
          {!activeProjects.length && <p>No active projects yet.</p>}
        </div>
        <div className="sidebar-note">
          <span className="tiny-star">✳</span>
          <h3>
            Good work travels
            <br />
            better together.
          </h3>
          <p>A clearer handoff. A calmer day.</p>
          <a href="../">
            Debotaro’s portfolio <ArrowUpRight size={14} />
          </a>
        </div>
        <button className="profile-card" onClick={() => go("settings")}>
          <span className="avatar avatar-orange">{initials(actor.name)}</span>
          <span>
            {actor.name}
            <small>
              {roleNames[actor.role]}
              {mode === "demo" ? " · Demo role" : ""}
            </small>
          </span>
          <MoreHorizontal size={17} />
        </button>
      </aside>
      <div className="workspace-content">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              ref={menuButton}
              aria-label="Open navigation"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((open) => !open)}
            >
              <Menu size={20} />
            </button>
            <span>Debotaro Studio</span>
            <span className="breadcrumb-slash">/</span>
            <b>{navigation.find((item) => item.id === view)?.label}</b>
          </div>
          <div className="topbar-actions">
            <span className={`connection ${online ? "" : "offline"}`}>
              {online ? <i /> : <WifiOff size={13} />}{" "}
              {mode === "cloud" ? "Cloud workspace" : "Local demo"}
            </span>
            <button
              ref={searchButton}
              className="search-trigger"
              onClick={() => {
                setSearch("");
                setPalette(true);
              }}
              aria-label="Search workspace"
            >
              <Search size={16} />
              <span>Find anything</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className="icon-button notification-button"
              aria-label="View workspace activity"
              onClick={() => go("activity")}
            >
              <Bell size={19} />
              {state.activity.length > 0 && <i />}
            </button>
            <button
              className="avatar avatar-orange header-avatar"
              aria-label="Workspace settings"
              onClick={() => go("settings")}
            >
              {initials(actor.name)}
            </button>
          </div>
        </header>
        {!online && (
          <div className="notice-bar">
            <WifiOff size={15} />
            {mode === "demo"
              ? "You’re offline. Your open demo workspace still saves on this device."
              : "You’re offline. Reconnect before saving cloud changes, then refresh."}
          </div>
        )}
        {(error || notice || storageStatus === "session") && (
          <div
            className={`notice-bar ${error ? "notice-error" : ""}`}
            role={error ? "alert" : "status"}
          >
            <CircleHelp size={16} />
            {error ||
              notice ||
              (storageStatus === "session"
                ? "Browser storage is unavailable. Changes last only for this session."
                : "")}
          </div>
        )}
        <main id="main-content" tabIndex={-1}>
          {view === "overview" && (
            <>
              <div className="page-heading overview-heading">
                <div>
                  <span className="eyebrow">
                    YOUR WORK, WITH A LITTLE MORE FLOW
                  </span>
                  <h1>
                    Less back-and-forth.
                    <br />
                    More <em>forward.</em>
                    <span className="headline-spark">✳</span>
                  </h1>
                  <p>
                    A shared direction for every project, every detail, every
                    next step.
                  </p>
                </div>
                <div className="heading-actions">
                  <span className="date-chip">
                    {new Date().toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                  {manageProjects && (
                    <button
                      className="button primary"
                      onClick={() => setEditor({ kind: "project" })}
                    >
                      <Plus size={16} />
                      New project
                    </button>
                  )}
                </div>
              </div>
              <section className="metrics" aria-label="Workspace summary">
                <Metric
                  label="Projects in motion"
                  value={String(activeProjects.length).padStart(2, "0")}
                  detail="Ideas becoming something"
                  icon={<FolderKanban size={18} />}
                  color="orange"
                />
                <Metric
                  label="Next steps"
                  value={String(openTasks.length).padStart(2, "0")}
                  detail={`${state.tasks.filter((task) => task.status === "done").length} tasks already complete`}
                  icon={<ArrowUpRight size={19} />}
                  color="green"
                />
                <Metric
                  label="Ready for a fresh eye"
                  value={String(pendingReviews.length).padStart(2, "0")}
                  detail="Versions awaiting review"
                  icon={<MessageCircle size={18} />}
                  color="purple"
                />
                <Metric
                  label="Moving forward"
                  value={percent(state.tasks) + "%"}
                  detail="Of your local task plan"
                  icon={<CheckCheck size={18} />}
                  color="yellow"
                />
              </section>
              <div className="overview-grid">
                <section className="panel spotlight">
                  <div className="section-header">
                    <span className="eyebrow">IN THE SPOTLIGHT</span>
                    <button
                      className="text-button"
                      onClick={() => go("review")}
                    >
                      All design reviews <ArrowUpRight size={15} />
                    </button>
                  </div>
                  {project && asset ? (
                    <>
                      <button
                        className="spotlight-image"
                        onClick={() => go("review")}
                        aria-label={`Review ${asset.name}`}
                      >
                        <img
                          src={asset.url}
                          alt={`Design preview for ${project.title}`}
                        />
                        <span className="image-caption">
                          <span className="pill pill-review">
                            Design handoff
                          </span>
                          <span>
                            V{asset.version.toString().padStart(2, "0")}{" "}
                            <ArrowUpRight size={18} />
                          </span>
                        </span>
                        <span className="mock-pin mock-pin-one">1</span>
                        <span className="mock-pin mock-pin-two">2</span>
                      </button>
                      <div className="spotlight-meta">
                        <div>
                          <h2>{project.title}</h2>
                          <p>
                            {project.client} <span>•</span> {asset.name}
                          </p>
                        </div>
                        <button
                          className="round-button"
                          aria-label="Open design review"
                          onClick={() => go("review")}
                        >
                          <ArrowUpRight size={21} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <Empty title="Your next idea starts here">
                      Create a project and upload a design to start the
                      conversation.
                    </Empty>
                  )}
                </section>
                <section className="panel next-steps">
                  <div className="section-header">
                    <div>
                      <span className="eyebrow">A LITTLE MOMENTUM</span>
                      <h2>Next up.</h2>
                    </div>
                    {editable && (
                      <button
                        className="icon-button"
                        aria-label="New task"
                        onClick={newTask}
                      >
                        <Plus size={19} />
                      </button>
                    )}
                  </div>
                  <div className="next-list">
                    {openTasks.slice(0, 5).map((task) => (
                      <div className="next-task" key={task.id}>
                        <button
                          className="task-check"
                          disabled={
                            !editable ||
                            busy ||
                            state.projects.find(
                              (item) => item.id === task.projectId,
                            )?.status !== "active"
                          }
                          aria-label={`Complete ${task.title}`}
                          onClick={() =>
                            act(
                              {
                                type: "update_task",
                                id: task.id,
                                patch: { status: "done" },
                              },
                              "One less thing. Task completed.",
                            )
                          }
                        >
                          <Check size={13} />
                        </button>
                        <div>
                          <button
                            className="task-title"
                            onClick={() => {
                              setTaskQuery(task.title);
                              go("tasks");
                            }}
                          >
                            {task.title}
                          </button>
                          <span>
                            {
                              state.projects.find(
                                (item) => item.id === task.projectId,
                              )?.title
                            }{" "}
                            <b>·</b> {dateLabel(task.dueDate)}
                          </span>
                        </div>
                        <span
                          className={`priority-dot priority-${task.priority}`}
                          aria-label={`${task.priority} priority`}
                        />
                      </div>
                    ))}
                    {!openTasks.length && (
                      <Empty title="A little breathing room">
                        Your task plan is complete. Make room for the next idea.
                      </Empty>
                    )}
                  </div>
                  <button className="next-footer" onClick={() => go("tasks")}>
                    See the whole picture <ArrowRight size={16} />
                  </button>
                  <div className="handoff-note">
                    <span>↗</span>
                    <p>
                      Feedback is a beginning.
                      <br />
                      <b>Give it a clear next step.</b>
                    </p>
                  </div>
                </section>
              </div>
              <section className="panel project-strip">
                <div className="section-header">
                  <div>
                    <span className="eyebrow">THE BIG PICTURE</span>
                    <h2>A few things taking shape.</h2>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => go("projects")}
                  >
                    All projects <ArrowUpRight size={15} />
                  </button>
                </div>
                <div className="compact-projects">
                  {activeProjects.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectProject(item.id, "projects")}
                    >
                      <i style={{ background: item.color }} />
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.client}</p>
                        <Progress
                          value={percent(
                            state.tasks.filter(
                              (task) => task.projectId === item.id,
                            ),
                          )}
                        />
                      </div>
                      <span>
                        {percent(
                          state.tasks.filter(
                            (task) => task.projectId === item.id,
                          ),
                        )}
                        %
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
          {view === "projects" && (
            <>
              <PageHeading
                eyebrow="KEEP THE BIG PICTURE CLOSE"
                title={
                  <>
                    Good ideas. <em>In motion.</em>
                  </>
                }
                description="A home for the work, the people and the details that connect them."
              >
                {manageProjects && (
                  <button
                    className="button primary"
                    onClick={() => setEditor({ kind: "project" })}
                  >
                    <Plus size={16} />
                    New project
                  </button>
                )}
              </PageHeading>
              <div className="project-grid">
                {state.projects.map((item) => {
                  const tasks = state.tasks.filter(
                    (task) => task.projectId === item.id,
                  );
                  return (
                    <article className="panel project-card" key={item.id}>
                      <div className="project-card-top">
                        <span
                          className="project-monogram"
                          style={{
                            background: item.color + "22",
                            color: item.color,
                          }}
                        >
                          {item.title[0]}
                        </span>
                        <Pill status={item.status} />
                      </div>
                      <button
                        className="project-title"
                        onClick={() => selectProject(item.id, "review")}
                      >
                        <h2>{item.title}</h2>
                        <ArrowUpRight size={19} />
                      </button>
                      <span className="client-label">{item.client}</span>
                      <p>{item.description}</p>
                      <div className="project-progress-label">
                        <span>
                          {
                            tasks.filter((task) => task.status === "done")
                              .length
                          }{" "}
                          of {tasks.length} steps complete
                        </span>
                        <b>{percent(tasks)}%</b>
                      </div>
                      <Progress value={percent(tasks)} />
                      <div className="project-card-footer">
                        <span
                          className="avatar-stack"
                          aria-label={
                            mode === "demo"
                              ? "Sample collaborators"
                              : actor.name
                          }
                        >
                          <span className="avatar">{initials(actor.name)}</span>
                          {mode === "demo" && (
                            <>
                              <span className="avatar sage">SK</span>
                              <span className="avatar lilac">AT</span>
                            </>
                          )}
                        </span>
                        <div>
                          {manageProjects && (
                            <>
                              <button
                                className="icon-button"
                                aria-label={`Edit ${item.title}`}
                                onClick={() =>
                                  setEditor({ kind: "project", item })
                                }
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                className="icon-button"
                                aria-label={`Delete ${item.title}`}
                                onClick={() =>
                                  setEditor({
                                    kind: "delete",
                                    target: "project",
                                    id: item.id,
                                    name: item.title,
                                  })
                                }
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                          <button
                            className="text-button"
                            onClick={() => selectProject(item.id, "review")}
                          >
                            Review <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              {!state.projects.length && (
                <Empty title="Start something worth sharing">
                  Add your first project to make a home for tasks and designs.
                </Empty>
              )}
            </>
          )}
          {view === "tasks" && (
            <>
              <PageHeading
                eyebrow="MAKE THE NEXT STEP CLEAR"
                title={
                  <>
                    Small steps. <em>Good progress.</em>
                  </>
                }
                description="Turn the conversation into a plan you can actually move through."
              >
                {editable && (
                  <button className="button primary" onClick={newTask}>
                    <Plus size={16} />
                    New task
                  </button>
                )}
              </PageHeading>
              <div className="task-toolbar">
                <label className="input-with-icon">
                  <Search size={17} />
                  <input
                    aria-label="Search tasks"
                    value={taskQuery}
                    onChange={(event) => setTaskQuery(event.target.value)}
                    placeholder="Find a next step…"
                  />
                </label>
                <label className="filter-label">
                  Status
                  <select
                    aria-label="Filter task status"
                    value={taskFilter}
                    onChange={(event) => setTaskFilter(event.target.value)}
                  >
                    <option value="all">All steps</option>
                    {Object.entries(statusNames).map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <span>
                  {filteredTasks.length}{" "}
                  {filteredTasks.length === 1 ? "step" : "steps"}
                </span>
              </div>
              <section className="panel task-table" aria-label="Project tasks">
                <div className="task-table-head">
                  <span>NEXT STEP</span>
                  <span>PROJECT</span>
                  <span>STATUS</span>
                  <span>ASSIGNED TO</span>
                  <span>DUE</span>
                  <span />
                </div>
                {filteredTasks.map((task) => (
                  <article className="task-row" key={task.id}>
                    <div className="task-name-cell">
                      <span
                        className={`priority-line priority-${task.priority}`}
                      />
                      <div>
                        <h3>{task.title}</h3>
                        <small>{task.priority} priority</small>
                      </div>
                    </div>
                    <span className="task-project-name">
                      {
                        state.projects.find(
                          (item) => item.id === task.projectId,
                        )?.title
                      }
                    </span>
                    <select
                      className={`status-select status-${task.status}`}
                      aria-label={`Status for ${task.title}`}
                      disabled={
                        !editable ||
                        busy ||
                        state.projects.find(
                          (item) => item.id === task.projectId,
                        )?.status !== "active"
                      }
                      value={task.status}
                      onChange={(event) =>
                        act(
                          {
                            type: "update_task",
                            id: task.id,
                            patch: {
                              status: event.target.value as Task["status"],
                            },
                          },
                          "Task status updated.",
                        )
                      }
                    >
                      {Object.entries(statusNames).map(([id, label]) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <span className="assignee">
                      <span className="avatar tiny">
                        {initials(task.assignee)}
                      </span>
                      {task.assignee}
                    </span>
                    <span className="task-due">{dateLabel(task.dueDate)}</span>
                    <div className="task-actions">
                      {editable &&
                        state.projects.find(
                          (item) => item.id === task.projectId,
                        )?.status === "active" && (
                          <>
                            <button
                              className="icon-button"
                              aria-label={`Edit ${task.title}`}
                              onClick={() =>
                                setEditor({ kind: "task", item: task })
                              }
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              className="icon-button"
                              aria-label={`Delete ${task.title}`}
                              onClick={() =>
                                setEditor({
                                  kind: "delete",
                                  target: "task",
                                  id: task.id,
                                  name: task.title,
                                })
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                    </div>
                  </article>
                ))}
                {!filteredTasks.length && (
                  <Empty title="A clear page, a clear head">
                    {taskQuery || taskFilter !== "all"
                      ? "Try another search or status."
                      : "Add a next step, or create one directly from design feedback."}
                  </Empty>
                )}
              </section>
            </>
          )}
          {view === "review" && (
            <>
              <PageHeading
                eyebrow="GOOD FEEDBACK GOES SOMEWHERE"
                title={
                  <>
                    A fresh eye. <em>A clear direction.</em>
                  </>
                }
                description="Pin a thought, connect a next step and keep every version in context."
              >
                {uploadAllowed && project && (
                  <label
                    className={`button primary file-button ${busy ? "disabled" : ""}`}
                  >
                    <Upload size={16} />
                    Upload design
                    <input
                      aria-label="Upload design"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={busy || project?.status !== "active"}
                      onChange={(event) => {
                        upload(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                  </label>
                )}
              </PageHeading>
              {project?.status === "archived" && (
                <p className="archived-note" role="status">
                  This project is archived. Restore it in Projects before
                  changing tasks or designs.
                </p>
              )}
              <div className="review-toolbar">
                <label>
                  Project
                  <select
                    aria-label="Review project"
                    value={project?.id || ""}
                    onChange={(event) => {
                      setAssetId("");
                      setProjectId(event.target.value);
                    }}
                  >
                    {state.projects.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </label>
                <span>
                  Images only · {mode === "demo" ? "1" : "3"} MB maximum
                </span>
                {asset && (
                  <label>
                    Version
                    <select
                      aria-label="Design version"
                      value={asset.id}
                      onChange={(event) => {
                        setAssetId(event.target.value);
                        setSelectedFeedback("");
                      }}
                    >
                      {assets.map((item) => (
                        <option key={item.id} value={item.id}>
                          V{item.version} · {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              {asset ? (
                <div className="review-layout">
                  <section className="panel design-panel">
                    <div className="design-header">
                      <div>
                        <FileImage size={18} />
                        <span>{asset.name}</span>
                        <Pill status={asset.status} />
                      </div>
                      <button
                        className={`button small ${pinMode ? "primary" : "secondary"}`}
                        disabled={busy || project?.status !== "active"}
                        aria-pressed={pinMode}
                        onClick={() => setPinMode((value) => !value)}
                      >
                        <Plus size={15} />
                        {pinMode ? "Cancel pin" : "Add a pin"}
                      </button>
                    </div>
                    <div
                      className={`design-stage ${pinMode ? "pin-mode" : ""}`}
                      style={{ aspectRatio: imageRatios[asset.id] || 4 / 3 }}
                    >
                      <img
                        className="review-image"
                        src={asset.url}
                        alt={`Design version ${asset.version}: ${asset.name}`}
                        onLoad={(event) => {
                          const image = event.currentTarget;
                          if (image.naturalWidth && image.naturalHeight) {
                            setImageRatios((current) => ({
                              ...current,
                              [asset.id]:
                                image.naturalWidth / image.naturalHeight,
                            }));
                            setFailedImages((current) => ({
                              ...current,
                              [asset.id]: false,
                            }));
                          }
                        }}
                        onError={() =>
                          setFailedImages((current) => ({
                            ...current,
                            [asset.id]: true,
                          }))
                        }
                      />
                      <button
                        className="canvas-target"
                        disabled={
                          !!failedImages[asset.id] ||
                          project?.status !== "active"
                        }
                        aria-label="Design canvas"
                        aria-describedby="canvas-hint"
                        onClick={(event) => {
                          const rect =
                            event.currentTarget.getBoundingClientRect();
                          pin(
                            event.detail
                              ? Math.max(
                                  0,
                                  Math.min(
                                    1,
                                    (event.clientX - rect.left) / rect.width,
                                  ),
                                )
                              : 0.5,
                            event.detail
                              ? Math.max(
                                  0,
                                  Math.min(
                                    1,
                                    (event.clientY - rect.top) / rect.height,
                                  ),
                                )
                              : 0.5,
                          );
                        }}
                      />
                      {comments
                        .filter((item) => item.x !== null && item.y !== null)
                        .map((comment, index) => (
                          <button
                            key={comment.id}
                            className={`feedback-pin ${comment.resolved ? "resolved" : ""} ${selectedFeedback === comment.id ? "selected" : ""}`}
                            style={{
                              left: `${comment.x! * 100}%`,
                              top: `${comment.y! * 100}%`,
                            }}
                            aria-label={`Feedback pin ${index + 1}`}
                            aria-pressed={selectedFeedback === comment.id}
                            onClick={() => {
                              setSelectedFeedback(comment.id);
                              document
                                .getElementById("feedback-" + comment.id)
                                ?.scrollIntoView({
                                  behavior: "instant",
                                  block: "nearest",
                                });
                            }}
                          >
                            {index + 1}
                          </button>
                        ))}
                    </div>
                    {failedImages[asset.id] && (
                      <p className="archived-note" role="alert">
                        This image preview is unavailable. Upload a valid
                        revision to continue image feedback.
                      </p>
                    )}
                    <div className="design-footer">
                      <p id="canvas-hint">
                        {pinMode
                          ? "Click the design to place feedback. Press Enter on the canvas to place a centered pin."
                          : "Every thought has its place. Select a pin to find its conversation."}
                      </p>
                      <span>
                        VERSION {asset.version.toString().padStart(2, "0")}
                      </span>
                    </div>
                    <div className="approval-bar">
                      <div>
                        <ShieldCheck size={18} />
                        <p>
                          {!latestAsset
                            ? "A newer revision exists. This version keeps its original feedback and decision."
                            : asset.status === "approved"
                              ? "This version is approved. New work starts with a new revision."
                              : asset.status === "review"
                                ? "A fresh eye makes good work better. Ready for a decision."
                                : asset.status === "changes"
                                  ? "Feedback received. Upload a revision when the next version is ready."
                                  : "The details are taking shape. Send this version for a fresh eye."}
                        </p>
                      </div>
                      <div className="approval-actions">
                        {latestAsset &&
                          uploadAllowed &&
                          asset.status !== "approved" &&
                          asset.status !== "review" && (
                            <button
                              className="button small secondary"
                              disabled={busy || project?.status !== "active"}
                              onClick={() =>
                                act(
                                  {
                                    type: "set_approval",
                                    id: asset.id,
                                    status: "review",
                                  },
                                  "Version submitted for review.",
                                )
                              }
                            >
                              Request review <ArrowUpRight size={13} />
                            </button>
                          )}
                        {latestAsset &&
                          canReview(actor.role) &&
                          asset.status === "review" && (
                            <>
                              <button
                                className="button small secondary"
                                disabled={busy || project?.status !== "active"}
                                onClick={() =>
                                  act(
                                    {
                                      type: "set_approval",
                                      id: asset.id,
                                      status: "changes",
                                    },
                                    "Changes requested. Feedback stays attached to this version.",
                                  )
                                }
                              >
                                Request changes
                              </button>
                              <button
                                className="button small primary"
                                disabled={busy || project?.status !== "active"}
                                onClick={() =>
                                  act(
                                    {
                                      type: "set_approval",
                                      id: asset.id,
                                      status: "approved",
                                    },
                                    "Version approved. Decision recorded in activity.",
                                  )
                                }
                              >
                                <Check size={14} />
                                Approve version
                              </button>
                            </>
                          )}
                        {latestAsset && uploadAllowed && (
                          <label
                            className={`button small secondary file-button ${busy ? "disabled" : ""}`}
                          >
                            <Upload size={14} />
                            Upload revision
                            <input
                              aria-label="Upload revision"
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              disabled={busy || project?.status !== "active"}
                              onChange={(event) => {
                                upload(event.target.files?.[0], true);
                                event.target.value = "";
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </section>
                  <aside
                    className="panel feedback-panel"
                    aria-label="Design feedback"
                  >
                    <div className="feedback-heading">
                      <div>
                        <span className="eyebrow">THE CONVERSATION</span>
                        <h2>
                          Feedback <span>{comments.length}</span>
                        </h2>
                      </div>
                      <button
                        className="icon-button"
                        aria-label="Add general feedback"
                        disabled={busy || project?.status !== "active"}
                        onClick={() => setEditor({ kind: "feedback" })}
                      >
                        <Plus size={19} />
                      </button>
                    </div>
                    <div className="feedback-list">
                      {comments.map((comment, index) => (
                        <article
                          id={"feedback-" + comment.id}
                          key={comment.id}
                          className={`feedback-card ${selectedFeedback === comment.id ? "is-selected" : ""} ${comment.resolved ? "is-resolved" : ""}`}
                        >
                          <div className="feedback-author">
                            <span className="avatar tiny">
                              {initials(comment.author)}
                            </span>
                            <div>
                              <b>{comment.author}</b>
                              <small>{dateLabel(comment.createdAt)}</small>
                            </div>
                            <span className="feedback-number">
                              {comment.x !== null ? "#" + (index + 1) : "NOTE"}
                            </span>
                          </div>
                          <p>{comment.body}</p>
                          {comment.resolved && (
                            <span className="resolved-label">
                              <CheckCheck size={13} />
                              Resolved
                            </span>
                          )}
                          <div className="feedback-actions">
                            {editable && (
                              <button
                                className="text-button"
                                disabled={
                                  !!comment.taskId ||
                                  busy ||
                                  project?.status !== "active"
                                }
                                aria-label={`Create task from feedback ${comment.id}`}
                                onClick={() =>
                                  act(
                                    {
                                      type: "convert_comment",
                                      id: comment.id,
                                      task: {
                                        id: createId(),
                                        projectId: comment.projectId,
                                        title: comment.body.slice(0, 120),
                                        status: "todo",
                                        priority: "medium",
                                        assignee: actor.name,
                                        dueDate: null,
                                        createdAt: new Date().toISOString(),
                                      },
                                    },
                                    "Feedback became a next step. One task, linked to this conversation.",
                                  )
                                }
                              >
                                <ListTodo size={13} />
                                {comment.taskId ? "Task linked" : "Create task"}
                              </button>
                            )}
                            {(canManageTasks(actor.role) ||
                              comment.author === actor.name) && (
                              <button
                                className="text-button"
                                aria-label={`${comment.resolved ? "Reopen" : "Resolve"} feedback ${comment.id}`}
                                disabled={busy || project?.status !== "active"}
                                onClick={() =>
                                  act(
                                    {
                                      type: "resolve_comment",
                                      id: comment.id,
                                      resolved: !comment.resolved,
                                    },
                                    comment.resolved
                                      ? "Feedback reopened."
                                      : "Feedback resolved.",
                                  )
                                }
                              >
                                <Check size={13} />
                                {comment.resolved ? "Reopen" : "Resolve"}
                              </button>
                            )}
                          </div>
                        </article>
                      ))}
                      {!comments.length && (
                        <Empty title="Start the conversation">
                          Add a pin or leave general feedback for this version.
                        </Empty>
                      )}
                    </div>
                    <button
                      className="feedback-bottom"
                      onClick={() => setEditor({ kind: "feedback" })}
                    >
                      <MessageCircle size={15} />
                      Leave a thought <Plus size={16} />
                    </button>
                  </aside>
                </div>
              ) : (
                <Empty title="Make room for a fresh eye">
                  {project
                    ? "Upload a PNG, JPEG or WebP design to start a review."
                    : "Create a project first, then add the design you want to share."}
                </Empty>
              )}
              {!!assets.length && (
                <section className="panel version-history">
                  <div className="section-header">
                    <div>
                      <span className="eyebrow">NOTHING GETS LOST</span>
                      <h2>The work, as it evolves.</h2>
                    </div>
                    <span className="muted">
                      {assets.length}{" "}
                      {assets.length === 1 ? "version" : "versions"}
                    </span>
                  </div>
                  <div className="version-list">
                    {assets.map((item) => (
                      <div
                        key={item.id}
                        className={item.id === asset?.id ? "current" : ""}
                      >
                        <button
                          className="version-button"
                          onClick={() => setAssetId(item.id)}
                        >
                          <span className="version-id">
                            V{item.version.toString().padStart(2, "0")}
                          </span>
                          <img src={item.url} alt="" />
                          <span>
                            <b>{item.name}</b>
                            <small>
                              {dateLabel(item.createdAt)} ·{" "}
                              {
                                state.comments.filter(
                                  (comment) => comment.assetId === item.id,
                                ).length
                              }{" "}
                              feedback notes
                            </small>
                          </span>
                          <Pill status={item.status} />
                        </button>
                        {uploadAllowed && (
                          <button
                            className="icon-button"
                            aria-label={`Delete design ${item.name} version ${item.version}`}
                            disabled={busy || project?.status !== "active"}
                            onClick={() =>
                              setEditor({
                                kind: "delete",
                                target: "asset",
                                id: item.id,
                                name: item.name + " version " + item.version,
                              })
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
          {view === "activity" && (
            <>
              <PageHeading
                eyebrow="THE THREAD THAT CONNECTS IT ALL"
                title={
                  <>
                    Every step. <em>A little story.</em>
                  </>
                }
                description="A record of decisions, feedback and the work moving forward."
              >
                <button
                  className="button secondary"
                  onClick={() => {
                    const blob = new Blob(
                      [JSON.stringify(state.activity, null, 2)],
                      { type: "application/json" },
                    );
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = "relay-workspace-activity.json";
                    link.click();
                    URL.revokeObjectURL(url);
                    setToast("Activity exported.");
                  }}
                >
                  <Download size={15} />
                  Export activity
                </button>
              </PageHeading>
              <div className="activity-layout">
                <section className="panel activity-panel">
                  <div className="section-header">
                    <h2>The latest moves.</h2>
                    <span className="muted">
                      {mode === "demo" ? "On this device" : "In this workspace"}
                    </span>
                  </div>
                  {state.activity.length ? (
                    <ol className="activity-list">
                      {state.activity.map((entry) => (
                        <li key={entry.id}>
                          <span className="activity-dot">
                            <ArrowUpRight size={15} />
                          </span>
                          <div>
                            <p>{entry.body}</p>
                            <small>
                              {entry.projectId
                                ? state.projects.find(
                                    (item) => item.id === entry.projectId,
                                  )?.title + " · "
                                : ""}
                              {new Date(entry.at).toLocaleString("en-GB", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </small>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <Empty title="The story starts with a step">
                      Project changes, feedback and decisions will appear here.
                    </Empty>
                  )}
                </section>
                <section className="panel activity-progress">
                  <span className="eyebrow">WHERE THE WORK STANDS</span>
                  <h2>
                    Progress with
                    <br />
                    <em>perspective.</em>
                  </h2>
                  <div
                    className="progress-ring"
                    style={{
                      background: `conic-gradient(var(--accent) ${percent(state.tasks)}%,var(--line) 0)`,
                    }}
                  >
                    <div>
                      <b>{percent(state.tasks)}%</b>
                      <span>steps complete</span>
                    </div>
                  </div>
                  {Object.entries(statusNames).map(([status, label]) => (
                    <div className="progress-legend" key={status}>
                      <span>
                        <i className={"legend-" + status} />
                        {label}
                      </span>
                      <b>
                        {
                          state.tasks.filter((task) => task.status === status)
                            .length
                        }
                      </b>
                    </div>
                  ))}
                </section>
              </div>
            </>
          )}
          {view === "settings" && (
            <>
              <PageHeading
                eyebrow="A WORKSPACE THAT FEELS LIKE YOURS"
                title={
                  <>
                    A few details. <em>A better fit.</em>
                  </>
                }
                description="Understand the workspace, try a different perspective and make yourself at home."
              />
              <div className="settings-grid">
                <section className="panel settings-panel">
                  <span className="eyebrow">YOUR PERSPECTIVE</span>
                  <h2>
                    {mode === "demo"
                      ? "Four roles. One shared direction."
                      : "Your workspace account."}
                  </h2>
                  <p>
                    {mode === "demo"
                      ? "Explore how a project manager, designer, client and admin move the work forward. These role previews are local simulations."
                      : "Your permissions come from your verified workspace membership, enforced by database policies."}
                  </p>
                  <div className="account-details">
                    <span className="avatar avatar-orange">
                      {initials(actor.name)}
                    </span>
                    <div>
                      <h3>{actor.name}</h3>
                      <p>{roleNames[actor.role]}</p>
                    </div>
                  </div>
                  {mode === "demo" ? (
                    <label className="field">
                      Demo role
                      <select
                        aria-label="Demo role"
                        value={actor.role}
                        onChange={(event) => {
                          relay.setDemoRole(event.target.value as Role);
                          setToast(
                            "Demo perspective changed. This does not authenticate an account.",
                          );
                        }}
                      >
                        {Object.entries(roleNames).map(([id, name]) => (
                          <option key={id} value={id}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <button
                      className="button secondary"
                      onClick={() =>
                        relay
                          .signOut()
                          .catch((reason) => setToast(String(reason)))
                      }
                    >
                      Sign out
                    </button>
                  )}
                  <div className="role-matrix">
                    <h3>Who moves what?</h3>
                    <p>
                      <b>Admin / PM</b> Manage projects, tasks and reviews.
                    </p>
                    <p>
                      <b>Designer</b> Add designs, create tasks and request
                      reviews.
                    </p>
                    <p>
                      <b>Client</b> Leave feedback and approve or request
                      changes.
                    </p>
                  </div>
                </section>
                <section className="panel settings-panel">
                  <span className="eyebrow">THE EVERYDAY DETAILS</span>
                  <h2>Make a little room.</h2>
                  <label className="setting-row">
                    <span>
                      <b>Appearance</b>
                      <small>A light desk or an evening workspace.</small>
                    </span>
                    <select
                      aria-label="Appearance"
                      value={theme}
                      onChange={(event) => setTheme(event.target.value)}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </label>
                  <div className="setting-row">
                    <span>
                      <b>Workspace data</b>
                      <small>
                        {mode === "demo"
                          ? storageStatus === "saved"
                            ? "Saved in this browser."
                            : "Session only; saving unavailable."
                          : "Shared through your Supabase workspace."}
                      </small>
                    </span>
                    <span className="pill pill-active">
                      {mode === "demo" ? "Local" : "Cloud"}
                    </span>
                  </div>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() =>
                      relay
                        .refresh()
                        .then(() =>
                          setToast(
                            mode === "demo"
                              ? "Local workspace restored."
                              : "Workspace refreshed.",
                          ),
                        )
                        .catch((reason) => setToast(String(reason)))
                    }
                  >
                    <ArrowDown size={15} />
                    Refresh workspace
                  </button>
                  <div className="scope-note">
                    <ShieldCheck size={21} />
                    <div>
                      <h3>A clear view of the scope.</h3>
                      <p>
                        {mode === "demo"
                          ? "This public demo saves only on your device. People, roles and team activity are demonstration content. No emails are sent and no cloud accounts are connected."
                          : "This configured workspace uses Supabase Auth, database policies and private image storage. Refresh reads the latest workspace data."}
                      </p>
                      <p>
                        Built by Deboraj Sarkar (Debotaro) through an
                        AI-assisted development workflow.
                      </p>
                      <a
                        href="https://github.com/Debotaro/Debotaro.github.io/tree/main/relay-os"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Read the source and backend setup{" "}
                        <ArrowUpRight size={13} />
                      </a>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </main>
        <footer className="workspace-footer">
          <span>
            <i />
            {mode === "demo"
              ? storageStatus === "saved"
                ? "Your demo, saved on this device."
                : "Session only · Browser saving unavailable."
              : "A shared workspace. A clearer direction."}
          </span>
          <span>
            RELAY OS <b>↗</b> BY DEBOTARO
          </span>
        </footer>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCheck size={17} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {editor && (
        <EditorModal
          editor={editor}
          state={state}
          actor={actor}
          project={project}
          asset={asset}
          busy={busy}
          error={error}
          onClose={() => setEditor(null)}
          submit={async (action, message) => {
            if (await act(action, message)) setEditor(null);
          }}
        />
      )}
      {palette && (
        <Dialog.Root open onOpenChange={setPalette}>
          <Dialog.Portal>
            <Dialog.Overlay className="modal-overlay" />
            <Dialog.Content
              className="command-palette"
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                if (
                  !paletteOpen.current &&
                  !document.querySelector('[role="dialog"]')
                )
                  searchButton.current?.focus();
              }}
            >
              <Dialog.Title className="sr-only">
                Find your next move
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Search projects, tasks, designs and workspace pages.
              </Dialog.Description>
              <div className="command-input">
                <Search size={20} />
                <input
                  autoFocus
                  aria-label="Search RELAY"
                  placeholder="Projects, next steps, designs…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <Dialog.Close className="escape-key">esc</Dialog.Close>
              </div>
              <div className="command-results">
                {searchResults.map((item, index) => (
                  <button key={item.type + index} onClick={item.run}>
                    <span>
                      {item.type === "Project" ? (
                        <FolderKanban size={17} />
                      ) : item.type === "Task" ? (
                        <ListTodo size={17} />
                      ) : (
                        <ArrowUpRight size={17} />
                      )}
                    </span>
                    <b>{item.label}</b>
                    <small>{item.type}</small>
                    <ArrowRight size={15} />
                  </button>
                ))}
                {!searchResults.length && (
                  <Empty title="Nothing here just yet">
                    Try another title or a workspace page.
                  </Empty>
                )}
              </div>
              <div className="command-footer">
                <Command size={13} />
                <span>Tab to a result. Enter to open. Escape to close.</span>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  icon,
  color,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  color: string;
}) {
  return (
    <div className={"metric metric-" + color}>
      <div>
        <span>{label}</span>
        <i>{icon}</i>
      </div>
      <b>{value}</b>
      <small>{detail}</small>
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
  title: ReactNode;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children && <div className="heading-actions">{children}</div>}
    </div>
  );
}
function Progress({ value }: { value: number }) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label="Task completion"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: value + "%" }} />
    </div>
  );
}

function EditorModal({
  editor,
  state,
  actor,
  project,
  asset,
  busy,
  error,
  onClose,
  submit,
}: {
  editor: NonNullable<Editor>;
  state: Workspace;
  actor: Actor;
  project: Project | undefined;
  asset: Asset | undefined;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  submit: (action: Action, message: string) => Promise<void>;
}) {
  const [validation, setValidation] = useState("");
  const [attempted, setAttempted] = useState(false);
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) || "").trim();
    const at = new Date().toISOString();
    setValidation("");
    setAttempted(true);
    if (editor.kind === "project") {
      const title = value("title");
      if (!title) {
        setValidation("Give your project a name.");
        return;
      }
      const fields = {
        title,
        client: value("client") || "Independent project",
        description: value("description"),
        color: value("color") || "#71836c",
        status: (value("status") as Project["status"]) || "active",
      };
      submit(
        editor.item
          ? { type: "update_project", id: editor.item.id, patch: fields }
          : {
              type: "create_project",
              project: { id: createId(), ...fields, createdAt: at },
            },
        editor.item
          ? "Project details updated."
          : "A new project. A clear place to start.",
      );
    }
    if (editor.kind === "task") {
      const title = value("title");
      const destination = editor.item?.projectId || value("projectId");
      if (!title || !state.projects.some((item) => item.id === destination)) {
        setValidation("Add a task name and choose an existing project.");
        return;
      }
      const fields = {
        title,
        assignee: value("assignee") || actor.name,
        priority: value("priority") as Task["priority"],
        dueDate: value("dueDate") || null,
      };
      submit(
        editor.item
          ? { type: "update_task", id: editor.item.id, patch: fields }
          : {
              type: "create_task",
              task: {
                id: createId(),
                projectId: destination,
                ...fields,
                status: "todo",
                createdAt: at,
              },
            },
        editor.item ? "Next step updated." : "A new next step, ready to move.",
      );
    }
    if (editor.kind === "feedback") {
      if (!asset || !project) return;
      const body = value("body");
      if (!body) {
        setValidation("Add a thought before posting feedback.");
        return;
      }
      const comment: Comment = {
        id: createId(),
        assetId: asset.id,
        projectId: project.id,
        author: actor.name,
        body,
        x: editor.point?.x ?? null,
        y: editor.point?.y ?? null,
        resolved: false,
        taskId: null,
        createdAt: at,
      };
      submit(
        { type: "add_comment", comment },
        editor.point
          ? "Feedback pinned to this version."
          : "Feedback added to the conversation.",
      );
    }
  }
  if (editor.kind === "delete")
    return (
      <Modal
        title={"Delete " + editor.target + "?"}
        description={`“${editor.name}” will be removed from this workspace.`}
        onClose={onClose}
      >
        <p className="delete-explanation">
          {editor.target === "project"
            ? "Its tasks, design versions and feedback will also be removed."
            : editor.target === "asset"
              ? "This version, any later revisions based on it, and all their feedback will be removed."
              : "Any linked feedback remains, and can become a new task later."}
        </p>
        {attempted && error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button className="button secondary" onClick={onClose}>
            Keep it
          </button>
          <button
            className="button danger"
            disabled={busy}
            onClick={() => {
              setAttempted(true);
              submit(
                {
                  type:
                    editor.target === "project"
                      ? "delete_project"
                      : editor.target === "task"
                        ? "delete_task"
                        : "delete_asset",
                  id: editor.id,
                },
                `${editor.target[0].toUpperCase() + editor.target.slice(1)} deleted.`,
              );
            }}
          >
            <Trash2 size={15} />
            Delete {editor.target}
          </button>
        </div>
      </Modal>
    );
  const title =
    editor.kind === "project"
      ? editor.item
        ? "Edit project"
        : "Make room for a good idea"
      : editor.kind === "task"
        ? editor.item
          ? "Edit next step"
          : "One clear next step"
        : editor.point
          ? "Pin a little direction"
          : "Leave a thought";
  return (
    <Modal
      title={title}
      description={
        editor.kind === "feedback"
          ? "Be specific. A useful thought makes the next version better."
          : "A few details now make the handoff easier later."
      }
      onClose={onClose}
    >
      <form onSubmit={onSubmit}>
        {editor.kind === "project" && (
          <>
            <label className="field">
              Project name
              <input
                name="title"
                maxLength={100}
                required
                defaultValue={editor.item?.title}
                placeholder="What’s taking shape?"
                autoFocus
              />
            </label>
            <label className="field">
              Client
              <input
                name="client"
                maxLength={100}
                defaultValue={editor.item?.client}
                placeholder="A person, a studio, an idea…"
              />
            </label>
            <label className="field">
              Description
              <textarea
                name="description"
                maxLength={1000}
                defaultValue={editor.item?.description}
                placeholder="A little context for the work ahead."
                rows={3}
              />
            </label>
            <div className="form-grid">
              <label className="field">
                Project colour
                <select
                  name="color"
                  defaultValue={editor.item?.color || "#71836c"}
                >
                  <option value="#71836c">Sage</option>
                  <option value="#b47563">Terracotta</option>
                  <option value="#8980a1">Lilac</option>
                  <option value="#578297">Ocean</option>
                </select>
              </label>
              <label className="field">
                Project status
                <select
                  name="status"
                  defaultValue={editor.item?.status || "active"}
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            </div>
          </>
        )}
        {editor.kind === "task" && (
          <>
            <label className="field">
              Task name
              <input
                name="title"
                maxLength={120}
                required
                defaultValue={editor.item?.title}
                placeholder="Make the next move specific."
                autoFocus
              />
            </label>
            {!editor.item && (
              <label className="field">
                Project
                <select
                  name="projectId"
                  defaultValue={
                    (project?.status === "active" ? project.id : undefined) ||
                    state.projects.find((item) => item.status === "active")?.id
                  }
                >
                  {state.projects
                    .filter((item) => item.status === "active")
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <label className="field">
              Assignee
              <input
                name="assignee"
                maxLength={100}
                defaultValue={editor.item?.assignee || actor.name}
              />
            </label>
            <div className="form-grid">
              <label className="field">
                Priority
                <select
                  name="priority"
                  defaultValue={editor.item?.priority || "medium"}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label className="field">
                Due date
                <input
                  name="dueDate"
                  type="date"
                  defaultValue={editor.item?.dueDate || ""}
                />
              </label>
            </div>
          </>
        )}
        {editor.kind === "feedback" && (
          <>
            <span className="feedback-context">
              <FileImage size={15} />
              {asset?.name} · Version {asset?.version}
              {editor.point && <span>PINNED FEEDBACK</span>}
            </span>
            <label className="field">
              Feedback
              <textarea
                name="body"
                maxLength={1200}
                required
                rows={5}
                placeholder="What would make this a little better?"
                autoFocus
              />
            </label>
          </>
        )}
        {(validation || (attempted && error)) && (
          <p role="alert" className="form-error">
            {validation || error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" type="submit" disabled={busy}>
            {busy ? (
              <Loader2 size={16} className="spin" />
            ) : (
              <ArrowRight size={16} />
            )}{" "}
            {editor.kind === "project"
              ? editor.item
                ? "Save project"
                : "Create project"
              : editor.kind === "task"
                ? editor.item
                  ? "Save task"
                  : "Create task"
                : "Post feedback"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AccountScreen({ relay }: { relay: ReturnType<typeof useRelay> }) {
  const [signup, setSignup] = useState(false);
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setLocalError("");
    try {
      const email = String(form.get("email"));
      const password = String(form.get("password"));
      if (signup) await relay.signUp(email, password, String(form.get("name")));
      else await relay.signIn(email, password);
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : "Unable to connect. Try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="account-screen">
      <a className="wordmark" href="../">
        <img src={import.meta.env.BASE_URL + "relay.svg"} alt="" />
        <span>
          RELAY<span className="wordmark-os">OS</span>
        </span>
      </a>
      <section className="panel login-panel">
        <span className="eyebrow">GOOD WORK TRAVELS BETTER TOGETHER</span>
        <h1>
          {signup ? (
            <>
              Make room for
              <br />
              <em>your next idea.</em>
            </>
          ) : (
            <>
              Pick up where
              <br />
              <em>you left off.</em>
            </>
          )}
        </h1>
        <p>Sign in to your configured shared workspace.</p>
        <form onSubmit={submit}>
          {signup && (
            <label className="field">
              Your name
              <input name="name" maxLength={100} required autoComplete="name" />
            </label>
          )}
          <label className="field">
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label className="field">
            Password
            <input
              name="password"
              type="password"
              minLength={8}
              required
              autoComplete={signup ? "new-password" : "current-password"}
            />
          </label>
          {(localError || relay.error) && (
            <p role="alert" className="form-error">
              {localError || relay.error}
            </p>
          )}
          {relay.notice && <p role="status">{relay.notice}</p>}
          <button className="button primary" disabled={pending}>
            {pending ? (
              <Loader2 className="spin" size={16} />
            ) : (
              <ArrowRight size={16} />
            )}{" "}
            {signup ? "Create account" : "Sign in"}
          </button>
        </form>
        <button
          className="text-button login-switch"
          onClick={() => setSignup((value) => !value)}
        >
          {signup
            ? "Already have an account? Sign in"
            : "New here? Create a workspace"}
        </button>
        <p className="login-scope">
          <ShieldCheck size={14} />
          Supabase Auth. Server-enforced workspace permissions.
        </p>
      </section>
      <a className="text-button" href="../">
        Back to Debotaro’s portfolio <ArrowUpRight size={14} />
      </a>
    </main>
  );
}

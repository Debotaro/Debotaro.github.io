import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Bell,
  ListTodo,
  Radar,
  SlidersHorizontal,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from './components/ui';

function AtlasMark() {
  return (
    <span className="brand brand-light">
      <span className="brand-mark">
        <svg width="23" height="25" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M10 54 32 10l22 44H40l-8-17-8 17Z" fill="currentColor" />
          <path d="m32 10 10 20-10 7-10-7Z" fill="#ef9b66" />
        </svg>
      </span>
      <strong>
        ATLAS<span>ops</span>
      </strong>
    </span>
  );
}

export function OperationsLanding({ go }: { go: (path: string) => void }) {
  return (
    <div className="atlas-landing">
      <header className="atlas-landing-nav">
        <a href="#/landing" aria-label="ATLAS Ops home">
          <AtlasMark />
        </a>
        <span className="landing-system-tag">OPERATIONS CONTROL SYSTEM / 01</span>
        <div>
          <a href="#features">Capabilities</a>
          <Button variant="secondary" onClick={() => go('login')}>
            Demo sign in
            <ArrowUpRight size={14} />
          </Button>
        </div>
      </header>
      <main>
        <section className="atlas-hero">
          <div className="atlas-hero-copy">
            <div className="atlas-hero-kicker">
              <span className="signal-dot" />
              LOCAL WORKSPACE · LIVE PUBLIC GITHUB QUEUE
            </div>
            <h1>
              Stay ahead
              <br />
              of the <span>signal.</span>
            </h1>
            <p>
              Your operations deserve a command center. Trace the numbers, direct the work, and keep
              regional coverage in view.
            </p>
            <div className="atlas-hero-actions">
              <Button onClick={() => go('overview')}>
                Explore the demo
                <ArrowRight size={18} />
              </Button>
              <button
                onClick={() =>
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Inspect capabilities
                <ArrowDown size={15} />
              </button>
            </div>
            <div className="atlas-hero-foot">
              <span>01 / PERFORMANCE</span>
              <span>02 / DISPATCH</span>
              <span>03 / CAPACITY</span>
            </div>
          </div>
          <div
            className="atlas-system-preview"
            aria-label="Illustrative operations console preview"
          >
            <div className="preview-command-line">
              <span>
                <Radar size={15} />
                ATLAS / MONITOR
              </span>
              <span>
                DEMO DATA
                <Bell size={14} />
              </span>
            </div>
            <div className="preview-main-signal">
              <div>
                <span>REGIONAL OPERATIONS</span>
                <strong>Command overview</strong>
              </div>
              <b>
                <span className="signal-dot" />
                SAMPLE
              </b>
            </div>
            <div className="preview-signal-strip">
              <div>
                <span>REVENUE</span>
                <strong>£60,798</strong>
              </div>
              <div>
                <span>OPEN TASKS</span>
                <strong>08</strong>
              </div>
              <div>
                <span>COVERAGE</span>
                <strong>
                  93<span>%</span>
                </strong>
              </div>
            </div>
            <div className="preview-monitor">
              <div>
                <span>FINANCIAL SIGNAL / GBP</span>
                <span>30-DAY SAMPLE</span>
              </div>
              <svg
                viewBox="0 0 540 190"
                role="img"
                aria-label="Illustrative financial performance chart"
              >
                <defs>
                  <linearGradient id="atlas-landing-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#65a9f1" stopOpacity=".35" />
                    <stop offset="100%" stopColor="#65a9f1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[35, 75, 115, 155].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="540"
                    y2={y}
                    stroke="#283a4b"
                    strokeDasharray="2 5"
                  />
                ))}
                <line x1="0" y1="45" x2="540" y2="45" stroke="#c68151" strokeDasharray="5 5" />
                <path
                  d="M0 157L42 132L86 141L130 104L174 119L217 81L260 97L304 59L348 73L390 38L434 51L478 22L520 33L540 14V190H0Z"
                  fill="url(#atlas-landing-fill)"
                />
                <path
                  d="M0 157L42 132L86 141L130 104L174 119L217 81L260 97L304 59L348 73L390 38L434 51L478 22L520 33L540 14"
                  fill="none"
                  stroke="#65a9f1"
                  strokeWidth="2.5"
                />
                <circle cx="540" cy="14" r="4" fill="#65a9f1" />
              </svg>
              <div className="preview-signal-axis">
                <span>08 SEP</span>
                <span>22 SEP</span>
                <span>07 OCT</span>
              </div>
            </div>
            <div className="preview-dispatch">
              <div>
                <span>PRIORITY DISPATCH</span>
                <span>REF / STATE</span>
              </div>
              <p>
                <i />
                Supplier contract review<small>OPS-101</small>
                <b>HIGH</b>
              </p>
              <p>
                <i />
                Q4 capacity planning<small>OPS-102</small>
                <b>HIGH</b>
              </p>
            </div>
          </div>
        </section>
        <div className="atlas-landing-scope">
          <span>INDEPENDENT PORTFOLIO PROJECT</span>
          <p>
            Fictional operations data. Persistent local workflows. Live read-only GitHub issues.
          </p>
          <span>DESIGNED BY DEBOTARO</span>
        </div>
        <section id="features" className="atlas-capabilities">
          <div className="atlas-section-heading">
            <span className="eyebrow">CONTROL LAYER / CAPABILITIES</span>
            <h2>
              Every decision.
              <br />
              Better information.
            </h2>
            <p>Purpose-built views for the people running the operation.</p>
          </div>
          <div className="atlas-capability-grid">
            {[
              {
                number: '01',
                icon: TrendingUp,
                title: 'Monitor the signal',
                text: 'Inspect revenue and operating costs. Set chart targets, change scope and export the underlying sample series.',
                route: 'overview',
                tag: 'PERFORMANCE MONITOR',
              },
              {
                number: '02',
                icon: ListTodo,
                title: 'Direct the work',
                text: 'Dispatch priority tasks through board and list views. Bring live public GitHub issues into a local backlog.',
                route: 'tasks',
                tag: 'TASK DISPATCH',
              },
              {
                number: '03',
                icon: Users,
                title: 'Balance capacity',
                text: 'Read the regional shift matrix, find gaps and adjust a five-day team schedule across three locations.',
                route: 'coverage',
                tag: 'COVERAGE PLANNING',
              },
            ].map(({ number, icon: Icon, title, text, route, tag }) => (
              <article key={number}>
                <div>
                  <span>{number}</span>
                  <Icon size={25} />
                </div>
                <span className="capability-tag">{tag}</span>
                <h3>{title}</h3>
                <p>{text}</p>
                <button onClick={() => go(route)}>
                  Open module
                  <ArrowUpRight size={16} />
                </button>
              </article>
            ))}
          </div>
        </section>
        <section className="atlas-final-callout">
          <div>
            <span className="eyebrow">READY FOR YOUR NEXT MOVE</span>
            <h2>Take the controls.</h2>
            <p>Explore the whole operation. Every demo edit stays in your browser.</p>
          </div>
          <Button onClick={() => go('overview')}>
            Open the console
            <SlidersHorizontal size={17} />
          </Button>
        </section>
      </main>
      <footer className="atlas-landing-footer">
        <AtlasMark />
        <span>© 2026 ATLAS Ops · Portfolio demo</span>
        <a href="../index.html">
          Back to portfolio
          <ArrowUpRight size={14} />
        </a>
      </footer>
    </div>
  );
}

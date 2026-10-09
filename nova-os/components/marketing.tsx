import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { gsap } from 'gsap';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronRight,
  Command,
  Folder,
  Globe,
  Layers,
  Menu,
  MessageSquare,
  Moon,
  Play,
  Shield,
  Sparkles,
  Sun,
  TrendingUp,
  Workflow,
  X,
  type LucideIcon,
} from 'lucide-react';
import { NovaMark } from './workspace';
import { Button, Input } from './ui';
import { useStore } from './store';

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const { state, setState } = useStore();
  const [menu, setMenu] = useState(false);
  return (
    <div className="marketing">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="marketing-nav">
        <Link className="workspace-logo" href="/">
          <NovaMark />
          <strong>
            NOVA<span>OS</span>
          </strong>
        </Link>
        <nav className={menu ? 'open' : ''} aria-label="Main navigation">
          <Link href="/product" onClick={() => setMenu(false)}>
            Product
          </Link>
          <Link href="/about" onClick={() => setMenu(false)}>
            Our story
          </Link>
          <Link href="/pricing" onClick={() => setMenu(false)}>
            Pricing
          </Link>
        </nav>
        <div className="marketing-nav-actions">
          <button
            className="icon-button"
            aria-label="Switch colour theme"
            onClick={() =>
              setState((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))
            }
          >
            {state.theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link className="login-link" href="/login">
            Log in
          </Link>
          <Link href="/app" className="button button-primary button-small">
            Open workspace <ArrowUpRight size={14} />
          </Link>
          <button
            className="icon-button mobile-menu"
            aria-label={menu ? 'Close menu' : 'Open menu'}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="marketing-footer">
        <div>
          <Link className="workspace-logo" href="/">
            <NovaMark small />
            <strong>
              NOVA<span>OS</span>
            </strong>
          </Link>
          <p>
            A little less work.
            <br />A lot more possibility.
          </p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/product">Product</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/about">Our story</Link>
          <Link href="/contact">Say hello</Link>
        </nav>
        <div className="footer-bottom">
          <span>© 2026 NOVA OS · A portfolio project</span>
          <span>Interactive demo. No real accounts or payments.</span>
        </div>
      </footer>
    </div>
  );
}

export function Landing() {
  const section = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('.hero-reveal', { y: 28, duration: 0.85, stagger: 0.13, ease: 'power3.out' });
    }, section);
    return () => ctx.revert();
  }, []);
  return (
    <MarketingShell>
      <div ref={section}>
        <section className="landing-hero">
          <div className="hero-grid-lines" />
          <div className="hero-orb" aria-hidden="true">
            <div className="orb-core" />
            <div className="orb-ring ring-one" />
            <div className="orb-ring ring-two" />
          </div>
          <span className="floating-chip chip-one">
            <CheckCheck size={15} />
            Ideas → in motion
          </span>
          <span className="floating-chip chip-two">
            <Sparkles size={15} />A little more clarity
          </span>
          <div className="hero-copy">
            <div className="hero-reveal hero-pill">
              <span className="status-dot" />A new rhythm for good work <ArrowUpRight size={13} />
            </div>
            <h1 className="hero-reveal">
              Less busywork.
              <br />
              More <em>possibility.</em>
            </h1>
            <p className="hero-reveal">
              Your ideas deserve space to grow. Meet the calm workspace
              <br className="desktop-break" /> that brings your projects and next steps into focus.
            </p>
            <div className="hero-reveal hero-actions">
              <Link className="button button-primary" href="/app">
                Find your flow <ArrowUpRight size={17} />
              </Link>
              <Link className="button button-secondary" href="/product">
                <Play size={14} />
                Meet NOVA
              </Link>
            </div>
            <span className="hero-reveal hero-footnote">
              No sign-up needed. A workspace worth exploring.
            </span>
          </div>
          <div className="hero-reveal hero-preview-wrap">
            <div className="preview-window-bar">
              <span>
                <i />
                <i />
                <i />
              </span>
              <span>
                <Shield size={10} /> nova.os / workspace
              </span>
              <span>
                <Command size={12} />
              </span>
            </div>
            <WorkspacePreview />
          </div>
          <div className="trusted-strip">
            <span>BUILT FOR TEAMS THAT MAKE THINGS HAPPEN</span>
            <div>
              <b>
                Layers<span>®</span>
              </b>
              <b>◈ Sisyphus</b>
              <b>circooles</b>
              <b>⌘ Catalog</b>
              <b>Quotient</b>
            </div>
            <small>Illustrative studio names for this portfolio concept</small>
          </div>
        </section>
        <section className="marketing-section features-section">
          <div className="section-kicker">SPACE TO DO YOUR BEST WORK</div>
          <div className="section-title-row">
            <h2>
              Everything flows.
              <br />
              Nothing falls through.
            </h2>
            <p>
              Less switching tabs. More moving forward.
              <br />
              Bring the important things into focus.
            </p>
          </div>
          <div className="feature-grid">
            <Feature
              icon={Layers}
              title="A home for every idea"
              text="Bring projects, people and priorities together. Give your best work the structure it needs."
              link="/app/projects"
            />
            <Feature
              icon={Sparkles}
              title="Clarity, on demand"
              text="Turn context into action with an assistant that helps you find your next best move."
              link="/app/assistant"
            />
            <Feature
              icon={Workflow}
              title="Momentum, on autopilot"
              text="Connect the little steps. Build simple flows that give your team time back."
              link="/app/automations"
            />
          </div>
        </section>
        <section className="marketing-section perspective-section">
          <div>
            <div className="section-kicker">THE BIGGER PICTURE, BEAUTIFULLY CLEAR</div>
            <h2>
              Good work.
              <br />
              <em>Great perspective.</em>
            </h2>
            <p>
              Know what’s moving, what’s next and where to focus.
              <br />A little visibility makes a world of difference.
            </p>
            <Link href="/app/analytics" className="text-link">
              See your momentum <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="perspective-art">
            <div className="art-caption">
              <span>
                <i className="status-dot" />
                WORKSPACE MOMENTUM
              </span>
              <TrendingUp size={19} />
            </div>
            <strong>Room to grow.</strong>
            <div className="art-bars">
              {[24, 43, 36, 62, 51, 75, 90].map((h, i) => (
                <div key={i} style={{ height: `${h}%` }}>
                  <span>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                </div>
              ))}
            </div>
            <span className="art-note">A little further, every day.</span>
          </div>
        </section>
        <CallToAction />
      </div>
    </MarketingShell>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
  link,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  link: string;
}) {
  return (
    <Link className="feature-card" href={link}>
      <span className="feature-icon">
        <Icon size={23} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      <span>
        Explore <ArrowUpRight size={16} />
      </span>
    </Link>
  );
}
export function WorkspacePreview() {
  return (
    <div
      className="nova-preview-space"
      role="img"
      aria-label="Preview of NOVA’s daily agenda, focus space and project notebooks"
    >
      <div className="nova-preview-ribbon">
        <NovaMark small />
        <b>NOVA OS</b>
        <span className="active">Today</span>
        <span>Projects</span>
        <span>Assistant</span>
        <span>Automations</span>
        <small>Studio North · Portfolio demo</small>
      </div>
      <div className="nova-preview-heading">
        <small>YOUR DAILY SPACE</small>
        <h2>A good day to make progress, Alex.</h2>
        <p>Make room for the work that matters. One thoughtful step at a time.</p>
      </div>
      <div className="nova-preview-columns">
        <div className="nova-preview-agenda">
          <div>
            <b>A little direction.</b>
            <span>2 due today</span>
          </div>
          <div className="nova-preview-agenda-tabs">
            <span>Today</span>
            <span>Next up</span>
            <span>All tasks</span>
          </div>
          {[
            ['Explore visual direction', 'Brand refresh · Alex · Today'],
            ['Review landing page concepts', 'Website 2.0 · Maya · Today'],
          ].map(([title, detail]) => (
            <div className="nova-preview-task" key={title}>
              <i />
              <span>
                {title}
                <small>{detail}</small>
              </span>
              <em>High</em>
            </div>
          ))}
          <p>＋ Capture a next step</p>
        </div>
        <div className="nova-preview-focus">
          <small>MAKE SPACE</small>
          <h3>
            One thing,
            <br />
            at a time.
          </h3>
          <p>A small place to begin. Pick up where you left off.</p>
          <span>Explore visual direction</span>
          <b>Continue in project ↗</b>
        </div>
      </div>
      <div className="nova-preview-notebooks">
        {[
          ['Brand refresh', '#ab9cff', '0 of 2 tasks completed'],
          ['Product launch', '#7dd3c7', '2 of 3 tasks completed'],
          ['Website 2.0', '#edb876', '1 of 3 tasks completed'],
        ].map(([title, color, detail], i) => (
          <div key={title} style={{ '--preview-color': color } as React.CSSProperties}>
            <small>NOTEBOOK / {String(i + 1).padStart(2, '0')}</small>
            <b>{title}</b>
            <span>{detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function CallToAction() {
  return (
    <section className="marketing-cta">
      <div className="section-kicker">YOUR NEXT CHAPTER STARTS HERE</div>
      <h2>
        Make space for <em>what’s next.</em>
      </h2>
      <p>Bring a little clarity to your day. And a lot of possibility to your work.</p>
      <Link className="button button-primary" href="/app">
        Step into your workspace <ArrowUpRight size={17} />
      </Link>
    </section>
  );
}

export function Product() {
  return (
    <MarketingShell>
      <section className="product-hero marketing-section">
        <div className="section-kicker">ONE WORKSPACE. MORE POSSIBILITY.</div>
        <h1>
          For the work
          <br />
          you <em>want to do.</em>
        </h1>
        <p>
          Projects with purpose. An assistant with context.
          <br />A team that moves together.
        </p>
        <Link href="/app" className="button button-primary">
          Explore the workspace <ArrowUpRight size={16} />
        </Link>
        <div className="product-preview">
          <WorkspacePreview />
        </div>
      </section>
      <section className="marketing-section">
        <div className="section-title-row">
          <h2>Made for your rhythm.</h2>
          <p>
            Every tool has a purpose.
            <br />
            Every interaction brings you closer.
          </p>
        </div>
        <div className="product-feature-grid">
          <Feature
            icon={Folder}
            title="Projects with perspective"
            text="Plan in a list. Move in a board. Search, filter and see every task in context."
            link="/app/projects"
          />
          <Feature
            icon={Sparkles}
            title="A co-pilot with context"
            text="Create and complete tasks, get a project summary, and find your focus with local demo AI."
            link="/app/assistant"
          />
          <Feature
            icon={Workflow}
            title="Little steps, connected"
            text="Build a flow with triggers, conditions and actions. Drag, reorder and test the outcome."
            link="/app/automations"
          />
          <Feature
            icon={TrendingUp}
            title="Progress, in plain sight"
            text="Understand your current workspace with project breakdowns, task metrics and CSV exports."
            link="/app/analytics"
          />
          <Feature
            icon={Command}
            title="A shortcut to everything"
            text="Use Ctrl or Command K to find a task, jump to a project or open any workspace page."
            link="/app"
          />
          <Feature
            icon={Globe}
            title="Tools in good company"
            text="Explore simulated connection states for the apps your team already knows."
            link="/app/integrations"
          />
        </div>
      </section>
      <CallToAction />
    </MarketingShell>
  );
}

export function Pricing() {
  const [annual, setAnnual] = useState(true);
  const plans = [
    {
      name: 'Personal',
      price: 0,
      text: 'A place for your next great idea.',
      items: [
        '3 personal projects',
        'Task lists and boards',
        'Workspace search',
        'Local demo assistant',
      ],
    },
    {
      name: 'Studio',
      price: annual ? 12 : 15,
      text: 'For teams that make things happen.',
      items: [
        'Unlimited projects',
        'Everything in Personal',
        'Workflow automations',
        'Workspace analytics',
        'Simulated integrations',
      ],
    },
    {
      name: 'Collective',
      price: annual ? 24 : 29,
      text: 'More room for your growing team.',
      items: [
        'Everything in Studio',
        'Shared team workspaces',
        'Project reporting',
        'Advanced workflow concepts',
        'Priority support concept',
      ],
    },
  ];
  return (
    <MarketingShell>
      <section className="pricing-section marketing-section">
        <div className="section-kicker">A LITTLE SPACE FOR EVERY TEAM</div>
        <h1>
          Big ideas.
          <br />
          <em>Thoughtful plans.</em>
        </h1>
        <p>Start where you are. Grow into what’s next.</p>
        <div className="billing-toggle">
          <button className={!annual ? 'selected' : ''} onClick={() => setAnnual(false)}>
            Monthly
          </button>
          <button className={annual ? 'selected' : ''} onClick={() => setAnnual(true)}>
            Yearly <span>Save 20%</span>
          </button>
        </div>
        <div className="pricing-grid">
          {plans.map((plan, i) => (
            <article key={plan.name} className={`pricing-card ${i === 1 ? 'featured' : ''}`}>
              {i === 1 && (
                <span className="popular-tag">
                  <Sparkles size={12} />
                  THE SWEET SPOT
                </span>
              )}
              <h2>{plan.name}</h2>
              <p>{plan.text}</p>
              <div className="plan-price">
                ${plan.price}
                <small>/ person / month</small>
              </div>
              <span className="billing-note">
                {plan.price === 0
                  ? 'Free to explore'
                  : annual
                    ? 'Billed yearly, concept pricing'
                    : 'Billed monthly, concept pricing'}
              </span>
              <Link
                href={`/signup?plan=${plan.name.toLowerCase()}`}
                className={`button ${i === 1 ? 'button-primary' : 'button-secondary'}`}
              >
                {i === 0 ? 'Start exploring' : `Try ${plan.name}`}
                <ArrowUpRight size={16} />
              </Link>
              <ul>
                {plan.items.map((item) => (
                  <li key={item}>
                    <Check size={15} />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="pricing-disclosure">
          Portfolio concept pricing. Every demo feature is available for free. No payment details or
          subscription is created.
        </p>
      </section>
      <section className="pricing-faq marketing-section">
        <h2>A little more clarity.</h2>
        {[
          [
            'Is this a real paid service?',
            'NOVA OS is an interactive portfolio project. Plans are illustrative and do not charge money or create subscriptions.',
          ],
          [
            'Where does my workspace data go?',
            'Your changes are saved in localStorage on this browser. Nothing is sent to a backend. You can reset the demo from onboarding.',
          ],
          [
            'How does the assistant work?',
            'It uses deterministic local rules to interpret supported prompts and update your sample tasks. No external AI service is connected.',
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>
              {q}
              <ChevronRight size={17} />
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
    </MarketingShell>
  );
}

export function About() {
  return (
    <MarketingShell>
      <section className="about-hero marketing-section">
        <div className="section-kicker">OUR POINT OF VIEW</div>
        <h1>
          Good work needs
          <br />
          <em>room to breathe.</em>
        </h1>
        <p>
          We believe the best tools get out of your way.
          <br />
          And leave a little more room for what makes you, you.
        </p>
        <div className="about-art">
          <div className="about-orbit" />
          <NovaMark />
          <span>
            Ideas, in orbit.
            <br />
            People, in focus.
          </span>
        </div>
      </section>
      <section className="about-story marketing-section">
        <div className="section-kicker">A MORE HUMAN WAY TO WORK</div>
        <div>
          <h2>
            Less noise.
            <br />
            More meaning.
          </h2>
          <p>
            NOVA began with a simple question: what would work feel like if everything had its
            place? Your projects. Your team. The small tasks that turn big ideas into something
            real.
          </p>
          <p>
            This portfolio concept explores that answer through considered product design and
            interactive frontend engineering. Every screen is built to make the next step feel
            clear.
          </p>
          <p>
            The assistant is simulated, but the intention is real: give people more time for the
            work they care about.
          </p>
          <Link href="/contact" className="text-link">
            Let’s start a conversation <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
      <CallToAction />
    </MarketingShell>
  );
}

export function Contact() {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState('');
  return (
    <MarketingShell>
      <section className="contact-section marketing-section">
        <div>
          <div className="section-kicker">GOOD THINGS START WITH A HELLO</div>
          <h1>
            What’s on
            <br />
            <em>your mind?</em>
          </h1>
          <p>
            A question, an idea, a little possibility.
            <br />
            We’re here for the conversation.
          </p>
          <div className="contact-note">
            <MessageSquare size={21} />
            <div>
              <b>A local demo enquiry</b>
              <p>
                This form creates a confirmation on this page.
                <br />
                No email or message is sent.
              </p>
            </div>
          </div>
        </div>
        <div className="contact-form panel">
          {sent ? (
            <div className="contact-success">
              <span>
                <CheckCheck size={28} />
              </span>
              <h2>Thanks for stopping by, {name}.</h2>
              <p>Your demo enquiry is complete. Nothing was sent or stored outside this page.</p>
              <Button variant="secondary" onClick={() => setSent(false)}>
                Write another enquiry
              </Button>
            </div>
          ) : (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <label>
                Your name
                <Input
                  required
                  maxLength={50}
                  placeholder="Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label>
                Email address
                <Input required type="email" placeholder="alex@yourstudio.com" />
              </label>
              <label>
                What’s on your mind?
                <select>
                  <option>A little product curiosity</option>
                  <option>A team workspace question</option>
                  <option>Feedback on the portfolio</option>
                  <option>Something else</option>
                </select>
              </label>
              <label>
                Your message
                <textarea
                  required
                  maxLength={1200}
                  rows={5}
                  placeholder="Tell us a little about it…"
                />
              </label>
              <Button type="submit">
                Preview enquiry confirmation <ArrowUpRight size={16} />
              </Button>
              <p className="muted text-xs">
                Demo only. Please avoid entering sensitive information.
              </p>
            </form>
          )}
        </div>
      </section>
    </MarketingShell>
  );
}

export function Auth({ signup = false }: { signup?: boolean }) {
  const router = useRouter();
  const { setState } = useStore();
  const [busy, setBusy] = useState(false);
  return (
    <div className="auth-page">
      <Link className="workspace-logo" href="/">
        <NovaMark />
        <strong>
          NOVA<span>OS</span>
        </strong>
      </Link>
      <div className="auth-layout">
        <div className="auth-story">
          <div className="section-kicker">MAKE SPACE FOR GOOD WORK</div>
          <h1>
            Your next chapter.
            <br />
            <em>All in one place.</em>
          </h1>
          <p>A little less work. A lot more possibility.</p>
          <div className="auth-orb" aria-hidden="true">
            <div />
            <Sparkles size={48} />
          </div>
          <span className="auth-bottom">A thoughtful workspace for teams with big ideas.</span>
        </div>
        <div className="auth-form-wrap">
          <span className="feature-icon">
            <Sparkles size={24} />
          </span>
          <h2>{signup ? 'Start something good.' : 'A little clarity awaits.'}</h2>
          <p>
            {signup ? 'Set up your local demo workspace.' : 'Step back into your demo workspace.'}
          </p>
          {router.query.plan && (
            <span className="auth-plan">
              Exploring the {String(router.query.plan)} plan · No charge
            </span>
          )}
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              setBusy(true);
              const data = new FormData(e.currentTarget);
              const email = String(data.get('email'));
              setState((s) => ({
                ...s,
                name: signup
                  ? String(data.get('name')).trim().split(' ')[0] || 'Alex'
                  : email.split('@')[0].split(/[._-]/)[0] || 'Alex',
              }));
              router.push(signup ? '/onboarding' : '/app');
            }}
          >
            {signup && (
              <label>
                Your name
                <Input
                  name="name"
                  required
                  maxLength={40}
                  autoComplete="given-name"
                  placeholder="Alex Morgan"
                />
              </label>
            )}
            <label>
              Email address
              <Input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="alex@yourstudio.com"
              />
            </label>
            <label>
              Demo password
              <Input
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete={signup ? 'new-password' : 'current-password'}
                placeholder="At least 6 characters"
              />
            </label>
            <Button type="submit" disabled={busy}>
              {busy
                ? 'Opening workspace…'
                : signup
                  ? 'Create demo workspace'
                  : 'Enter demo workspace'}
              <ArrowUpRight size={16} />
            </Button>
          </form>
          <p className="auth-switch">
            {signup ? 'Already exploring?' : 'New to NOVA?'}{' '}
            <Link href={signup ? '/login' : '/signup'}>
              {signup ? 'Log in to the demo' : 'Start a demo workspace'}
            </Link>
          </p>
          <div className="auth-demo-note">
            <Shield size={16} />
            <p>
              Simulated authentication. No real account is created. Passwords are not saved or sent.
              Use made-up details.
            </p>
          </div>
          <Link href="/app" className="text-link">
            Explore without a form <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Onboarding() {
  const { state, setState, reset } = useStore();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [team, setTeam] = useState(state.team);
  const [purpose, setPurpose] = useState('Design studio');
  return (
    <div className="onboarding-page">
      <Link className="workspace-logo" href="/">
        <NovaMark />
        <strong>
          NOVA<span>OS</span>
        </strong>
      </Link>
      <div className="onboarding-card panel">
        <div className="onboarding-steps">
          {[0, 1, 2].map((n) => (
            <span key={n} className={n <= step ? 'active' : ''} />
          ))}
        </div>
        <div className="section-kicker">A LITTLE ROOM FOR POSSIBILITY · {step + 1} OF 3</div>
        <h1>
          {step === 0
            ? 'Give your team a home.'
            : step === 1
              ? 'Find your kind of flow.'
              : 'You’re ready for good work.'}
        </h1>
        <p>
          {step === 0
            ? 'A name makes it yours.'
            : step === 1
              ? 'Choose what feels like your team.'
              : 'Your sample projects and tasks are waiting.'}
        </p>
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (step === 0) {
              setState((s) => ({ ...s, team: team.trim() || 'Studio North' }));
              setStep(1);
            } else if (step === 1) setStep(2);
            else router.push('/app');
          }}
        >
          {step === 0 ? (
            <label>
              Workspace name
              <Input
                required
                value={team}
                maxLength={40}
                onChange={(e) => setTeam(e.target.value)}
              />
            </label>
          ) : step === 1 ? (
            <div className="purpose-options">
              {['Design studio', 'Product team', 'Creative collective', 'Just me, for now'].map(
                (item) => (
                  <button
                    type="button"
                    key={item}
                    className={purpose === item ? 'selected' : ''}
                    onClick={() => setPurpose(item)}
                  >
                    {item}
                    {purpose === item && <Check size={16} />}
                  </button>
                ),
              )}
            </div>
          ) : (
            <div className="onboarding-ready">
              <CheckCheck size={32} />
              <b>{state.team}</b>
              <span>
                {purpose} · {state.projects.length} sample projects
              </span>
              <button type="button" className="text-link" onClick={reset}>
                Reset sample data
              </button>
            </div>
          )}
          <Button type="submit">
            {step === 2 ? 'Step into your workspace' : 'Continue'}
            <ArrowRight size={16} />
          </Button>
          {step > 0 && (
            <Button variant="ghost" type="button" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
        </form>
        <span className="muted text-xs">Demo setup · Saved only on this device</span>
      </div>
    </div>
  );
}

# NOVA OS

An interactive AI workspace portfolio concept built with Next.js Pages router, React, TypeScript, Tailwind, Radix Dialog, CVA, Lucide and GSAP.

## Run

```powershell
npm install
npm run dev
```

Open http://localhost:3101. `npm run typecheck` checks TypeScript. `npm run build` creates a static export in `out/`.

The root portfolio build sets `PORTFOLIO_BASE_PATH=/nova-os`. Standalone builds default to an empty base path. All Next links honour this setting.

## Explore

- Marketing: landing, product, pricing, story and contact.
- Demo authentication: login, signup and three-step onboarding; no real accounts, password storage, or payments.
- Workspace: overview, projects, task list and draggable boards, AI assistant, automation builder, analytics and simulated integrations.
- Command palette: Ctrl/Cmd K searches pages, projects and tasks.
- Tasks and projects can be added and completed. Data and the dark/light preference persist in this browser's localStorage.
- Automation nodes can be dragged, reordered with arrow buttons, edited and tested against a sample task. Actions update only the local workspace.
- Analytics uses current tasks for summary metrics and project progress, with illustrative historical trend data. CSV export is real.
- Integrations illustrate connection states; no external accounts connect.

## Assistant examples

- `Summarise Brand refresh`
- `What should I focus on today?`
- `Create task: Plan the launch`
- `Complete Explore visual direction`

The assistant applies deterministic local rules and updates actual demo tasks. No AI API or backend is used. Authentication and enquiries remain local simulations. Reset sample data from onboarding. No deployment or Git operations are required to explore this project.

## Design and accessibility

Responsive layouts, semantic landmarks, a skip link, visible focus, reduced motion support, descriptive control labels, keyboard alternatives for drag interactions, accessible Radix modals and live status announcements. The hero is CSS art and the charts are SVG, so no placeholder photography is needed. All studio names, activity and plan pricing are fictional sample content.

export type Status = 'Backlog' | 'In progress' | 'In review' | 'Complete';
export type Priority = 'High' | 'Medium' | 'Low';
export type TaskSource = { kind: 'github'; issueId: number; issueNumber: number; repository: string; url: string; importedAt: string };
export type Task = { id: string; title: string; description: string; department: string; priority: Priority; status: Status; owner: string; due: string; location: string; source?: TaskSource };
export type Notice = { id: string; title: string; detail: string; kind: 'task' | 'coverage' | 'system'; read: boolean; time: string };
export type Settings = { workspace: string; name: string; email: string; timezone: string; compact: boolean; emailDigest: boolean; coverageAlerts: boolean; target: number; costBudget: number };
export type Coverage = { id: string; name: string; initials: string; role: string; location: string; shifts: string[] };
export type State = { version: 1; tasks: Task[]; notices: Notice[]; settings: Settings; coverage: Coverage[] };
export const statuses: Status[] = ['Backlog', 'In progress', 'In review', 'Complete'];
export const departments = ['Operations', 'Finance', 'People', 'Logistics'];
export const owners = ['Olivia Chen', 'Marcus Wright', 'Sofia Patel', 'James Miller', 'Ava Thompson'];
export const locations = ['London', 'Amsterdam', 'Berlin'];
export const shiftOptions = ['09:00–17:00', '08:00–16:00', '10:00–18:00', 'On call', 'Leave', 'Off'];
export const seed: State = {
  version: 1,
  settings: { workspace: 'Acme Studio', name: 'Olivia Chen', email: 'olivia@example.com', timezone: 'Europe/London', compact: false, emailDigest: true, coverageAlerts: true, target: 6000, costBudget: 3200 },
  tasks: [
    { id: 'OPS-101', title: 'Review supplier contracts', description: 'Compare renewal terms with the procurement brief and document the preferred supplier.', department: 'Operations', priority: 'High', status: 'In progress', owner: 'Olivia Chen', due: '2026-10-09', location: 'London' },
    { id: 'OPS-102', title: 'Q4 capacity planning', description: 'Align regional team capacity with the October delivery forecast.', department: 'People', priority: 'High', status: 'In progress', owner: 'Marcus Wright', due: '2026-10-08', location: 'Amsterdam' },
    { id: 'OPS-103', title: 'October expense reconciliation', description: 'Match the first week of receipts and flag unallocated expenses.', department: 'Finance', priority: 'Medium', status: 'In review', owner: 'Sofia Patel', due: '2026-10-10', location: 'London' },
    { id: 'OPS-104', title: 'Update fulfilment playbook', description: 'Add the new dispatch checklist and share with the Berlin team.', department: 'Logistics', priority: 'Medium', status: 'Backlog', owner: 'James Miller', due: '2026-10-13', location: 'Berlin' },
    { id: 'OPS-105', title: 'Onboard two new specialists', description: 'Prepare access, buddy introductions and first-week schedules.', department: 'People', priority: 'High', status: 'Backlog', owner: 'Ava Thompson', due: '2026-10-12', location: 'Amsterdam' },
    { id: 'OPS-106', title: 'Warehouse quality audit', description: 'Complete the monthly inventory and quality audit checklist.', department: 'Logistics', priority: 'Low', status: 'Complete', owner: 'James Miller', due: '2026-10-06', location: 'Berlin' },
    { id: 'OPS-107', title: 'Approve regional travel budget', description: 'Review the revised travel allocation for Q4 customer visits.', department: 'Finance', priority: 'Medium', status: 'In review', owner: 'Sofia Patel', due: '2026-10-09', location: 'Amsterdam' },
    { id: 'OPS-108', title: 'Publish October team schedule', description: 'Confirm shift swaps and publish coverage to the team.', department: 'Operations', priority: 'Low', status: 'Complete', owner: 'Olivia Chen', due: '2026-10-07', location: 'London' },
    { id: 'OPS-109', title: 'Consolidate customer handover', description: 'Collect pending handover notes for the enterprise operations team.', department: 'Operations', priority: 'Medium', status: 'In progress', owner: 'Marcus Wright', due: '2026-10-14', location: 'Amsterdam' },
    { id: 'OPS-110', title: 'Refresh access permissions', description: 'Audit access for the operations workspace and archive old accounts.', department: 'People', priority: 'Low', status: 'Backlog', owner: 'Ava Thompson', due: '2026-10-16', location: 'London' },
  ],
  notices: [
    { id: 'n1', title: 'Supplier review needs your attention', detail: 'OPS-101 is due on 9 October. The procurement team has added the revised contract.', kind: 'task', read: false, time: '2026-10-07T09:42:00Z' },
    { id: 'n2', title: 'Thursday coverage is below target', detail: 'Amsterdam has only one scheduled specialist on Thursday. Adjust a shift in Coverage.', kind: 'coverage', read: false, time: '2026-10-07T09:15:00Z' },
    { id: 'n3', title: 'October schedule published', detail: 'Olivia Chen has published the London team schedule for this week.', kind: 'coverage', read: true, time: '2026-10-07T08:30:00Z' },
    { id: 'n4', title: 'Weekly operations report is ready', detail: 'Revenue grew 12.8% in the seeded monthly dataset. Explore the overview to see the trend.', kind: 'system', read: true, time: '2026-10-06T17:00:00Z' },
  ],
  coverage: [
    { id: 'c1', name: 'Olivia Chen', initials: 'OC', role: 'Operations lead', location: 'London', shifts: ['09:00–17:00', '09:00–17:00', '09:00–17:00', '09:00–17:00', '09:00–17:00'] },
    { id: 'c2', name: 'Marcus Wright', initials: 'MW', role: 'Team coordinator', location: 'Amsterdam', shifts: ['08:00–16:00', '08:00–16:00', '08:00–16:00', 'Leave', '08:00–16:00'] },
    { id: 'c3', name: 'Sofia Patel', initials: 'SP', role: 'Finance specialist', location: 'London', shifts: ['09:00–17:00', '09:00–17:00', '09:00–17:00', '09:00–17:00', '09:00–17:00'] },
    { id: 'c4', name: 'James Miller', initials: 'JM', role: 'Logistics manager', location: 'Berlin', shifts: ['08:00–16:00', '08:00–16:00', 'Off', '08:00–16:00', '08:00–16:00'] },
    { id: 'c5', name: 'Ava Thompson', initials: 'AT', role: 'People partner', location: 'Amsterdam', shifts: ['10:00–18:00', '10:00–18:00', '10:00–18:00', '10:00–18:00', 'On call'] },
    { id: 'c6', name: 'Noah Williams', initials: 'NW', role: 'Operations specialist', location: 'Berlin', shifts: ['09:00–17:00', '09:00–17:00', '09:00–17:00', '09:00–17:00', '09:00–17:00'] },
  ],
};
export const initials = (name: string) => name.split(' ').map(s => s[0]).join('').slice(0, 2);
export const money = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);
export const dateLabel = (s: string) => new Date(`${s}T12:00:00Z`).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', timeZone: 'UTC' });
export function chartData(days: number, location: string) {
  const count = days === 7 ? 7 : days === 30 ? 12 : 18;
  const scale = location === 'All locations' ? 1 : location === 'London' ? .46 : location === 'Amsterdam' ? .32 : .22;
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC(2026, 9, 7)); date.setUTCDate(date.getUTCDate() - Math.round((count - 1 - i) * days / count));
    const revenue = Math.round((4100 + i * 175 + Math.sin(i * .85) * 870) * scale);
    return { date: date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', timeZone: 'UTC' }), revenue, costs: Math.round((2350 + i * 53 + Math.sin(i * .85) * 270) * scale) };
  });
}
export function loadState(): State {
  try { const parsed = JSON.parse(localStorage.getItem('atlas-ops-v1') || 'null') as State | null; if (parsed?.version === 1 && Array.isArray(parsed.tasks) && Array.isArray(parsed.notices) && parsed.settings?.workspace && Array.isArray(parsed.coverage)) return parsed; } catch { /* Storage may be unavailable; retain a working demo. */ }
  return structuredClone(seed);
}

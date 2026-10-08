import { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, CalendarDays, Check, Download, ListTodo, Plus, SlidersHorizontal, Users, Zap } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button, Dialog, Input, Select } from './components/ui';
import { chartData, dateLabel, initials, locations, money, statuses } from './data';
import type { Settings, State, Task } from './data';

const statusColours = ['#73869c', '#61a6ee', '#b495ea', '#56b5a1'];

export function OperationsConsole({ state, go, editTask, onTargets, notify }: {
  state: State;
  go: (path: string) => void;
  editTask: (task: Task | null) => void;
  onTargets: (settings: Settings) => void;
  notify: (message: string) => void;
}) {
  const [days, setDays] = useState(30);
  const [location, setLocation] = useState('All locations');
  const [metric, setMetric] = useState('revenue');
  const [targetsOpen, setTargetsOpen] = useState(false);
  const [target, setTarget] = useState(state.settings.target);
  const [costBudget, setCostBudget] = useState(state.settings.costBudget);
  const data = useMemo(() => chartData(days, location), [days, location]);
  const selectedTasks = state.tasks.filter(task => location === 'All locations' || task.location === location);
  const revenue = data.reduce((total, point) => total + point.revenue, 0);
  const costs = data.reduce((total, point) => total + point.costs, 0);
  const done = selectedTasks.filter(task => task.status === 'Complete').length;
  const open = selectedTasks.length - done;
  const high = selectedTasks.filter(task => task.status !== 'Complete' && task.priority === 'High').length;
  const coverage = state.coverage.filter(person => location === 'All locations' || person.location === location);
  const shifts = coverage.flatMap(person => person.shifts);
  const scheduled = shifts.filter(shift => !['Leave', 'Off'].includes(shift)).length;
  const coveragePercent = Math.round(scheduled / Math.max(shifts.length, 1) * 100);
  const chartStatuses = statuses.map((name, index) => ({ name, value: selectedTasks.filter(task => task.status === name).length, fill: statusColours[index] }));
  const priorityTasks = selectedTasks.filter(task => task.status !== 'Complete').sort((a, b) => ['High', 'Medium', 'Low'].indexOf(a.priority) - ['High', 'Medium', 'Low'].indexOf(b.priority) || a.due.localeCompare(b.due)).slice(0, 5);
  const unread = state.notices.filter(notice => !notice.read).length;

  const exportData = () => {
    const rows = [['Date', 'Revenue GBP', 'Operating costs GBP'], ...data.map(point => [point.date, String(point.revenue), String(point.costs)])];
    const csv = rows.map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'atlas-performance.csv';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('Performance data exported as CSV');
  };

  return <div className="operations-console">
    <div className="console-heading">
      <div><span className="eyebrow">COMMAND / OVERVIEW</span><h1>Operations console<span className="console-heading-dot">.</span></h1><p>Monitor performance. Allocate capacity. Move critical work.</p></div>
      <div className="console-heading-actions"><span className="console-window">07 OCT 2026<span>FIXED SAMPLE WINDOW</span></span><Button onClick={() => editTask(null)}><Plus size={16}/>Create task</Button></div>
    </div>

    <section className="console-status" aria-label="Operational status">
      <span className="console-status-label"><span className="signal-dot"/>LOCAL CONSOLE</span>
      <span><b>{open}</b> active tasks</span><span className={high ? 'signal-attention' : ''}><b>{high}</b> high priority</span>
      <span><b>{shifts.length - scheduled}</b> unscheduled shifts</span>
      <button onClick={() => go('notifications')}>{unread} unread updates<ArrowUpRight size={13}/></button>
    </section>

    <div className="console-controls">
      <span><i/>Fictional workspace records <span>·</span> Editable in your browser</span>
      <div><label className="filter-select"><Users size={14}/><Select aria-label="Filter dashboard location" value={location} onChange={event => setLocation(event.target.value)}><option>All locations</option>{locations.map(item => <option key={item}>{item}</option>)}</Select></label><label className="filter-select"><CalendarDays size={14}/><Select aria-label="Chart date range" value={days} onChange={event => setDays(Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></Select></label><Button variant="secondary" onClick={exportData}><Download size={14}/>Export</Button></div>
    </div>

    <section className="telemetry-strip" aria-label="Key operational metrics">
      <div><span>01 / REVENUE</span><strong>{money(revenue)}</strong><small>{days}-day sample total</small></div>
      <div><span>02 / OPERATING COSTS</span><strong>{money(costs)}</strong><small>{money(revenue - costs)} remaining margin</small></div>
      <div><span>03 / TASKS COMPLETED</span><strong>{done}<span> / {selectedTasks.length}</span></strong><small>{Math.round(done / Math.max(selectedTasks.length, 1) * 100)}% of selected tasks</small></div>
      <div><span>04 / TEAM COVERAGE</span><strong className={coveragePercent < 90 ? 'signal-attention' : ''}>{coveragePercent}<span>%</span></strong><small>{scheduled} of {shifts.length} shifts scheduled</small></div>
    </section>

    <div className="monitor-grid">
      <section className="panel signal-panel">
        <div className="panel-heading"><div><span className="panel-index">MONITOR 01</span><h2>Financial performance</h2><p>Fictional performance series · GBP</p></div><button className="icon-button" aria-label="Edit chart targets" onClick={() => { setTarget(state.settings.target); setCostBudget(state.settings.costBudget); setTargetsOpen(true); }}><SlidersHorizontal size={18}/></button></div>
        <div className="chart-toolbar"><div className="segmented" aria-label="Chart metric"><button className={metric === 'revenue' ? 'selected' : ''} onClick={() => setMetric('revenue')} aria-pressed={metric === 'revenue'}>Revenue</button><button className={metric === 'costs' ? 'selected' : ''} onClick={() => setMetric('costs')} aria-pressed={metric === 'costs'}>Operating costs</button></div><div className="chart-key"><i className={metric === 'costs' ? 'key-costs' : ''}/>{metric === 'revenue' ? 'Revenue' : 'Costs'}<span>—</span>Target</div></div>
        <div className="main-chart" role="img" aria-label={`${metric === 'revenue' ? 'Revenue' : 'Operating costs'} chart over ${days} days. Data table follows.`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 16, right: 8, left: -15, bottom: 0 }}><defs><linearGradient id="console-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={metric === 'costs' ? '#56b5a1' : '#65a9f1'} stopOpacity={.3}/><stop offset="100%" stopColor="#65a9f1" stopOpacity={.01}/></linearGradient></defs><CartesianGrid strokeDasharray="2 5" vertical={false} stroke="#26384a"/><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#8da4bb', fontSize: 10 }} minTickGap={24} dy={10}/><YAxis tickFormatter={value => `£${value / 1000}k`} axisLine={false} tickLine={false} tick={{ fill: '#8da4bb', fontSize: 10 }} domain={[0, 'auto']}/><Tooltip formatter={value => money(Number(value))} labelStyle={{ color: '#dce7f1', fontWeight: 600 }} contentStyle={{ background: '#132334', color: '#dce7f1', borderRadius: 3, border: '1px solid #354c63', fontSize: 12 }}/><ReferenceLine ifOverflow="extendDomain" y={metric === 'revenue' ? state.settings.target : state.settings.costBudget} stroke="#d58a55" strokeDasharray="5 5"/><Area type="monotone" dataKey={metric} name={metric === 'revenue' ? 'Revenue' : 'Costs'} stroke={metric === 'costs' ? '#56b5a1' : '#65a9f1'} strokeWidth={2} fill="url(#console-gradient)" animationDuration={600}/></AreaChart></ResponsiveContainer></div>
        <details className="chart-data"><summary>View chart data</summary><div className="table-scroll"><table><thead><tr><th>Date</th><th>Revenue</th><th>Costs</th></tr></thead><tbody>{data.map(point => <tr key={point.date}><td>{point.date}</td><td>{money(point.revenue)}</td><td>{money(point.costs)}</td></tr>)}</tbody></table></div></details>
      </section>

      <section className="panel flow-panel">
        <div className="panel-heading"><div><span className="panel-index">MONITOR 02</span><h2>Workload distribution</h2><p>{selectedTasks.length} records in the selected scope</p></div><button className="icon-button" onClick={() => go('tasks')} aria-label="Open task management"><ArrowUpRight size={18}/></button></div>
        <div className="workload-bars">{chartStatuses.map(status => <div key={status.name}><div><span><i style={{ background: status.fill }}/>{status.name}</span><b>{status.value}<small>{Math.round(status.value / Math.max(selectedTasks.length, 1) * 100)}%</small></b></div><span className="workload-track"><i style={{ width: `${status.value / Math.max(selectedTasks.length, 1) * 100}%`, background: status.fill }}/></span></div>)}</div>
        <div className="flow-caption"><Zap size={14}/><span>{high > 0 ? `${high} high-priority tasks remain open.` : 'No open high-priority tasks.'}</span><button onClick={() => go('tasks')}>Inspect queue<ArrowRight size={13}/></button></div>
      </section>
    </div>

    <div className="dispatch-grid">
      <section className="panel dispatch-panel"><div className="panel-heading"><div><span className="panel-index">DISPATCH / PRIORITY ORDER</span><h2>Intervention queue <span className="count-chip">{priorityTasks.length}</span></h2><p>Open tasks ranked by priority, then due date.</p></div><button className="text-button" onClick={() => go('tasks')}>View all tasks<ArrowRight size={14}/></button></div><div className="table-scroll"><table className="priority-table"><thead><tr><th>Task / reference</th><th>Assignee</th><th>Priority</th><th>Due date</th><th><span className="sr-only">Edit</span></th></tr></thead><tbody>{priorityTasks.map(task => <tr key={task.id}><td><button className="task-title-button" onClick={() => editTask(task)}><span className={`table-status ${task.status === 'In review' ? 'review' : ''}`}/><span><strong>{task.title}</strong><small>{task.id} · {task.department}</small></span></button></td><td><span className="queue-owner" aria-label={task.owner}>{initials(task.owner)}</span></td><td><span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span></td><td><span className="date-cell">{dateLabel(task.due)}</span></td><td><button className="icon-button" aria-label={`Edit ${task.title}`} onClick={() => editTask(task)}><ArrowUpRight size={16}/></button></td></tr>)}</tbody></table>{priorityTasks.length === 0 && <div className="empty-state"><Check size={24}/><strong>No open tasks in this scope.</strong><p>Create a task or select another location.</p></div>}</div></section>

      <section className="panel regional-panel"><div className="panel-heading"><div><span className="panel-index">CAPACITY / WEEK 41</span><h2>Regional coverage</h2><p>Scheduled weekday shifts</p></div><button className="icon-button" onClick={() => go('coverage')} aria-label="Open team coverage"><ArrowUpRight size={18}/></button></div><div className="regional-coverage">{locations.filter(region => location === 'All locations' || region === location).map(region => {
        const people = state.coverage.filter(person => person.location === region);
        const regionalShifts = people.flatMap(person => person.shifts);
        const covered = regionalShifts.filter(shift => !['Leave', 'Off'].includes(shift)).length;
        return <div key={region}><div><span>{region}</span><b>{covered}<small>/{regionalShifts.length}</small></b></div><div className="coverage-matrix" aria-label={`${region}: ${covered} of ${regionalShifts.length} shifts scheduled`}>{regionalShifts.map((shift, index) => <i key={index} className={['Leave', 'Off'].includes(shift) ? 'matrix-gap' : shift === 'On call' ? 'matrix-call' : ''} title={`${people[Math.floor(index / 5)]?.name}: ${shift}`}/>)}</div></div>;
      })}</div><div className="matrix-legend"><span><i/>Scheduled</span><span><i className="matrix-gap"/>Leave / off</span></div></section>
    </div>

    <section className="panel event-log"><div className="panel-heading"><div><span className="panel-index">EVENT LOG</span><h2>Recent activity</h2></div><button className="text-button" onClick={() => go('notifications')}>View all activity<ArrowRight size={14}/></button></div><div>{state.notices.slice(0, 3).map((notice, index) => <div key={notice.id}><span className="event-sequence">{String(index + 1).padStart(2, '0')}</span><span className={`event-kind event-${notice.kind}`}>{notice.kind === 'coverage' ? <Users size={14}/> : notice.kind === 'task' ? <ListTodo size={14}/> : <Zap size={14}/>} {notice.kind}</span><strong>{notice.title}</strong><small>{notice.detail}</small></div>)}</div>{state.notices.length === 0 && <p className="event-empty">No workspace events. Task and coverage changes appear here.</p>}</section>

    <Dialog open={targetsOpen} onOpenChange={setTargetsOpen} title="Set performance targets" description="Set a target per chart point. Your target line updates immediately after saving. Values are in GBP."><form onSubmit={event => { event.preventDefault(); onTargets({ ...state.settings, target, costBudget }); setTargetsOpen(false); }} className="dialog-form"><label htmlFor="revenue-target">Revenue target (£ per point)</label><Input id="revenue-target" type="number" min={0} max={1000000} step={100} required value={target} onChange={event => setTarget(Number(event.target.value))}/><label htmlFor="cost-budget">Operating cost budget (£ per point)</label><Input id="cost-budget" type="number" min={0} max={1000000} step={100} required value={costBudget} onChange={event => setCostBudget(Number(event.target.value))}/><div className="dialog-actions"><Button type="button" variant="secondary" onClick={() => setTargetsOpen(false)}>Cancel</Button><Button type="submit">Save targets</Button></div></form></Dialog>
  </div>;
}

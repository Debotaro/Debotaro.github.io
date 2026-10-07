import type { Message, State } from './store';

export type AssistantRequest = { id: string; taskId: string; text: string };
export type AssistantReply = Message & { requestId: string; action: string };

/** Apply a delayed command to the state supplied by React, never a send-time snapshot. */
export function applyAssistantRequest(state: State, request: AssistantRequest): State {
  const { text } = request;
  const lower = text.toLowerCase();
  let tasks = state.tasks;
  let answer = '';
  let action = '';
  if (lower.startsWith('create task:') || lower.startsWith('add task:')) {
    const title = text.slice(text.indexOf(':') + 1).trim();
    const project = state.projects[0];
    if (title && project) {
      tasks = [{ id: request.taskId, title, project: project.id, status: 'Todo', priority: 'Medium', assignee: state.name, due: 'Tomorrow' }, ...tasks];
      answer = `Done. I’ve created “${title}” in ${project.name}, due tomorrow. You’ll find it in your project workspace.`;
      action = 'Task created';
    } else answer = title ? 'Create a project first, then I can add a task to it.' : 'Add a title after “Create task:” and I’ll create it for you.';
  } else if (lower.startsWith('complete ') || lower.startsWith('finish ')) {
    const part = lower.replace(/^(complete|finish)\s+/, '').trim();
    const match = tasks.find(task => task.title.toLowerCase().includes(part) && part.length > 2);
    if (match) {
      tasks = tasks.map(task => task.id === match.id ? { ...task, status: 'Done' } : task);
      answer = `“${match.title}” is now complete. Your project progress has been updated. Nice work.`;
      action = 'Task completed';
    } else answer = 'I couldn’t find that task. Try “Complete Explore visual direction” or use the command palette to find its name.';
  } else if (lower.includes('summar') || lower.includes('progress') || lower.includes('status')) {
    const project = state.projects.find(project => lower.includes(project.name.toLowerCase()));
    const scoped = project ? tasks.filter(task => task.project === project.id) : tasks;
    const done = scoped.filter(task => task.status === 'Done').length;
    answer = `${project ? project.name : 'Your workspace'} has ${scoped.length} tasks: ${done} completed, ${scoped.filter(task => task.status === 'In progress').length} in progress and ${scoped.filter(task => task.status === 'Todo').length} to do. Next up: ${scoped.find(task => task.status !== 'Done')?.title || 'everything is complete'}.`;
  } else if (lower.includes('priorit') || lower.includes('today') || lower.includes('focus')) {
    const due = tasks.filter(task => task.status !== 'Done' && (task.priority === 'High' || task.due === 'Today'));
    answer = due.length ? `Here’s your focus list: ${due.map(task => task.title).join('; ')}. Start with ${due[0].title}. When you’re ready, ask “Complete ${due[0].title}”.` : 'You’re clear of high priority and due today tasks. Pick a project and explore what’s next.';
  } else answer = 'I can help with your actual demo tasks. Try “Summarise Brand refresh”, “What should I focus on today?”, “Create task: Plan the launch”, or “Complete Explore visual direction”. This assistant uses local rules, so no prompt leaves your device.';
  const reply: AssistantReply = { role: 'assistant', text: answer, requestId: request.id, action };
  return { ...state, tasks, messages: [...state.messages, { role: 'user', text }, reply] };
}

export function assistantReply(message: Message | undefined, requestId: string): AssistantReply | null {
  if (!message || message.role !== 'assistant') return null;
  const reply = message as Partial<AssistantReply>;
  return reply.requestId === requestId && typeof reply.action === 'string' ? reply as AssistantReply : null;
}

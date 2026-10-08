import { createContext, useContext, useEffect, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { parseStoredWorkspace } from './workspace-data';

export type GitHubProjectSource = {kind:'github-repository';id:number;fullName:string;url:string;importedAt:string};
export type GitHubMilestoneSource = {kind:'github-milestone';id:number;number:number;repository:string;url:string;importedAt:string};
export type Task = {id:string;title:string;project:string;status:'Todo'|'In progress'|'Done';priority:'High'|'Medium'|'Low';assignee:string;due:string;description?:string;dueDate?:string;createdAt?:string;updatedAt?:string;completedAt?:string;source?:GitHubMilestoneSource};
export type Project = {id:string;name:string;description:string;color:string;createdAt?:string;updatedAt?:string;source?:GitHubProjectSource};
export type Message = {role:'assistant'|'user';text:string;requestId?:string;action?:string};
export type FlowNode = {id:string;kind:'trigger'|'condition'|'action';label:string};
export type ActivityEntry = {id:string;at:string;message:string;taskId?:string;projectId?:string};
export type State = { name:string;team:string;theme:'dark'|'light';tasks:Task[];projects:Project[];messages:Message[];nodes:FlowNode[];integrations:string[];notifications:string[];automationActive:boolean;activity?:ActivityEntry[] };
export const seed: State = {
 name:'Alex',team:'Studio North',theme:'light',
 projects:[{id:'brand',name:'Brand refresh',description:'A new chapter for Studio North',color:'#ab9cff'},{id:'product',name:'Product launch',description:'Introducing something worth waiting for',color:'#7dd3c7'},{id:'website',name:'Website 2.0',description:'Make the first impression count',color:'#edb876'}],
 tasks:[{id:'t1',title:'Explore visual direction',project:'brand',status:'In progress',priority:'High',assignee:'Alex',due:'Today'},{id:'t2',title:'Review landing page concepts',project:'website',status:'Todo',priority:'High',assignee:'Maya',due:'Today'},{id:'t3',title:'Finalise product messaging',project:'product',status:'In progress',priority:'Medium',assignee:'Leo',due:'Tomorrow'},{id:'t4',title:'Build component library',project:'website',status:'In progress',priority:'Medium',assignee:'Alex',due:'Fri, 9 Oct'},{id:'t5',title:'Export brand guidelines',project:'brand',status:'Todo',priority:'Low',assignee:'Maya',due:'Mon, 12 Oct'},{id:'t6',title:'Map onboarding journey',project:'product',status:'Done',priority:'Medium',assignee:'Leo',due:'Yesterday'},{id:'t7',title:'Gather customer insights',project:'product',status:'Done',priority:'High',assignee:'Maya',due:'Yesterday'},{id:'t8',title:'Audit the existing experience',project:'website',status:'Done',priority:'Low',assignee:'Alex',due:'Tue, 6 Oct'}],
 messages:[{role:'assistant',text:'Good morning, Alex. I’ve organised your workspace. You have 2 tasks due today. Ask me to summarise a project, create a task, or complete a task by name.'}],
 nodes:[{id:'n1',kind:'trigger',label:'Task marked complete'},{id:'n2',kind:'condition',label:'Priority is High'},{id:'n3',kind:'action',label:'Notify the team'}],integrations:[],notifications:['Maya added feedback to Brand refresh.','Website 2.0 has 2 tasks waiting for your review.'],automationActive:false
};
type Store = {state:State;setState:Dispatch<SetStateAction<State>>;ready:boolean;toast:string;announce:(text:string)=>void;reset:()=>void;storageStatus:'loading'|'saved'|'unavailable';storageError:string};
const Context = createContext<Store | null>(null);
export function StoreProvider({children}:{children:ReactNode}){
 const [state,setState]=useState<State>(seed); const [ready,setReady]=useState(false); const [toast,setToast]=useState('');
 const [storageStatus,setStorageStatus]=useState<Store['storageStatus']>('loading'); const [storageError,setStorageError]=useState('');
 useEffect(()=>{
  try {
   const saved=localStorage.getItem('nova-os-v1');
   if(saved!==null){
    const parsed=parseStoredWorkspace(saved);
    if(parsed.ok)setState(parsed.state);
    else setToast('Saved workspace data was invalid. The sample workspace has been restored.');
   }
  } catch {
   setStorageStatus('unavailable');setStorageError('Browser storage is unavailable. Changes last only for this session.');setToast('Browser storage is unavailable. Changes last only for this session.');
  }
  setReady(true);
 },[]);
 useEffect(()=>{
  if(!ready)return;
  document.documentElement.dataset.theme=state.theme;
  try {
   const parsed=parseStoredWorkspace(state);
   if(!parsed.ok)throw new Error('This workspace exceeds the supported storage limits. Changes last only for this session.');
   const serialized=JSON.stringify(parsed.state);
   if(serialized.length>2_000_000)throw new Error('This workspace exceeds the storage size limit. Changes last only for this session.');
   localStorage.setItem('nova-os-v1',serialized);
   setStorageStatus('saved');setStorageError('');
  } catch(error) {
   const message=error instanceof Error && error.message.startsWith('This workspace')?error.message:'Browser storage is unavailable. Changes last only for this session.';
   setStorageStatus('unavailable');setStorageError(message);setToast(message);
  }
 },[state,ready]);
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),4200);return()=>clearTimeout(timer);},[toast]);
 return <Context.Provider value={{state,setState,ready,toast,announce:setToast,storageStatus,storageError,reset:()=>{setState(seed);setToast('Demo workspace reset.');}}}>{children}<div className={`toast ${toast?'visible':''}`} role="status" aria-live="polite">{toast}</div></Context.Provider>;
}
export function useStore(){const store=useContext(Context);if(!store)throw new Error('StoreProvider is required');return store;}
export function uid(){return `item-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;}

import { createContext, useContext, useEffect, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react';

export type Task = {id:string;title:string;project:string;status:'Todo'|'In progress'|'Done';priority:'High'|'Medium'|'Low';assignee:string;due:string};
export type Project = {id:string;name:string;description:string;color:string};
export type Message = {role:'assistant'|'user';text:string};
export type FlowNode = {id:string;kind:'trigger'|'condition'|'action';label:string};
export type State = { name:string;team:string;theme:'dark'|'light';tasks:Task[];projects:Project[];messages:Message[];nodes:FlowNode[];integrations:string[];notifications:string[];automationActive:boolean };
export const seed: State = {
 name:'Alex',team:'Studio North',theme:'dark',
 projects:[{id:'brand',name:'Brand refresh',description:'A new chapter for Studio North',color:'#ab9cff'},{id:'product',name:'Product launch',description:'Introducing something worth waiting for',color:'#7dd3c7'},{id:'website',name:'Website 2.0',description:'Make the first impression count',color:'#edb876'}],
 tasks:[{id:'t1',title:'Explore visual direction',project:'brand',status:'In progress',priority:'High',assignee:'Alex',due:'Today'},{id:'t2',title:'Review landing page concepts',project:'website',status:'Todo',priority:'High',assignee:'Maya',due:'Today'},{id:'t3',title:'Finalise product messaging',project:'product',status:'In progress',priority:'Medium',assignee:'Leo',due:'Tomorrow'},{id:'t4',title:'Build component library',project:'website',status:'In progress',priority:'Medium',assignee:'Alex',due:'Fri, 9 Oct'},{id:'t5',title:'Export brand guidelines',project:'brand',status:'Todo',priority:'Low',assignee:'Maya',due:'Mon, 12 Oct'},{id:'t6',title:'Map onboarding journey',project:'product',status:'Done',priority:'Medium',assignee:'Leo',due:'Yesterday'},{id:'t7',title:'Gather customer insights',project:'product',status:'Done',priority:'High',assignee:'Maya',due:'Yesterday'},{id:'t8',title:'Audit the existing experience',project:'website',status:'Done',priority:'Low',assignee:'Alex',due:'Tue, 6 Oct'}],
 messages:[{role:'assistant',text:'Good morning, Alex. I’ve organised your workspace. You have 2 tasks due today. Ask me to summarise a project, create a task, or complete a task by name.'}],
 nodes:[{id:'n1',kind:'trigger',label:'Task marked complete'},{id:'n2',kind:'condition',label:'Priority is High'},{id:'n3',kind:'action',label:'Notify the team'}],integrations:[],notifications:['Maya added feedback to Brand refresh.','Website 2.0 has 2 tasks waiting for your review.'],automationActive:false
};
type Store = {state:State;setState:Dispatch<SetStateAction<State>>;ready:boolean;toast:string;announce:(text:string)=>void;reset:()=>void};
const Context = createContext<Store | null>(null);
export function StoreProvider({children}:{children:ReactNode}){
 const [state,setState]=useState<State>(seed); const [ready,setReady]=useState(false); const [toast,setToast]=useState('');
 useEffect(()=>{try{const saved=localStorage.getItem('nova-os-v1');if(saved){const data=JSON.parse(saved);if(Array.isArray(data.tasks)&&data.tasks.every((t:Task)=>typeof t.title==='string'&&['Todo','In progress','Done'].includes(t.status))&&Array.isArray(data.projects)&&Array.isArray(data.nodes)&&Array.isArray(data.messages))setState({...seed,...data});}}catch{/* Storage can be unavailable in private contexts. */}setReady(true);},[]);
 useEffect(()=>{if(!ready)return;document.documentElement.dataset.theme=state.theme;try{localStorage.setItem('nova-os-v1',JSON.stringify(state));}catch{}},[state,ready]);
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),4200);return()=>clearTimeout(timer);},[toast]);
 return <Context.Provider value={{state,setState,ready,toast,announce:setToast,reset:()=>{setState(seed);setToast('Demo workspace reset.');}}}>{children}<div className={`toast ${toast?'visible':''}`} role="status" aria-live="polite">{toast}</div></Context.Provider>;
}
export function useStore(){const store=useContext(Context);if(!store)throw new Error('StoreProvider is required');return store;}
export function uid(){return `item-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;}

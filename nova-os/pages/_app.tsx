import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { StoreProvider } from '../components/store';
import '../styles/globals.css';
export default function App({Component,pageProps}:AppProps){const router=useRouter();return <StoreProvider><Head><title>NOVA OS — A little less work. A lot more possibility.</title><meta name="description" content="An interactive AI workspace portfolio demo. Projects, tasks, automations, analytics and a deterministic assistant."/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="theme-color" content="#0c0c12"/><link rel="icon" type="image/svg+xml" href={`${router.basePath}/favicon.svg`}/></Head><Component {...pageProps}/></StoreProvider>;}

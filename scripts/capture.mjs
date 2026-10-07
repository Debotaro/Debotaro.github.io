import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cpSync } from 'node:fs';
const root=fileURLToPath(new URL('../',import.meta.url));
const browser=await chromium.launch();
const projects=[['relay','relay-os/'],['nova','nova-os/app/'],['atlas','atlas-ops/#/overview'],['nila','nila-ledger/#/dashboard'],['aura','aura/'],['vanta','vanta/'],['rasa','rasa/']];
const only=process.argv[2];
for(const [name,route] of projects.filter(([n])=>!only||only==='static'?(!only||['aura','vanta','rasa'].includes(n)):n===only)){
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://localhost:4173/'+route,{waitUntil:'networkidle',timeout:45000});
  if(response.status()!==200)throw new Error(`${name} returned ${response.status()}`);
  await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(root,'previews',name+'.png')});
  console.log(name,JSON.stringify({errors,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),title:await page.title()}));
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.screenshot({path:path.join(root,'previews',name+'-mobile.png'),fullPage:true});console.log(name+' mobile overflow',await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));await page.close();
}
if(!only||only==='portfolio'){
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
  await page.goto('http://localhost:4173/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:path.join(root,'previews','portfolio-cover.png'),clip:{x:0,y:0,width:1440,height:810}});
  cpSync(path.join(root,'previews','portfolio-cover.png'),path.join(root,'dist','previews','portfolio-cover.png'));
  await page.reload({waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:path.join(root,'previews','portfolio.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.screenshot({path:path.join(root,'previews','portfolio-mobile.png'),fullPage:true});
  for(const name of ['portfolio.png','portfolio-mobile.png']) cpSync(path.join(root,'previews',name),path.join(root,'dist','previews',name));
  console.log('Portfolio desktop/mobile screenshots captured.');await page.close();
}
await browser.close();

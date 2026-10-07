import {test,expect} from '@playwright/test';

test('Personal portfolio presents the supplied identity and contacts, with its own project first',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/',{waitUntil:'networkidle'});
  await expect(page).toHaveTitle('Deboraj Sarkar (Debotaro) — Frontend Developer');
  await expect(page.locator('.hero .eyebrow')).toHaveText('Deboraj Sarkar / Frontend Developer');
  await expect(page.locator('.hero-intro')).toContainText('AI-assisted development workflows');
  await expect(page.locator('.availability')).toHaveText('Open to remote frontend roles and relocation for the right opportunity.');
  expect(await page.locator('.featured-project').evaluate(feature=>Boolean(feature.compareDocumentPosition(document.querySelector('.grid')!)&Node.DOCUMENT_POSITION_FOLLOWING))).toBeTruthy();
  await expect(page.locator('[data-case]')).toHaveCount(8);
  await expect(page.locator('.card')).toHaveCount(7);
  await expect(page.locator('.card').first()).toHaveAttribute('href','relay-os/');
  for(const [name,href] of [['GitHub','https://github.com/Debotaro'],['LinkedIn','https://www.linkedin.com/in/deborajsarkar/'],['Dribbble','https://dribbble.com/Debotaro']]){
    const link=page.locator('.socials').getByRole('link',{name:new RegExp(name)});
    await expect(link).toHaveAttribute('href',href);await expect(link).toHaveAttribute('rel','noopener noreferrer');
  }
  await expect(page.locator('.email')).toHaveAttribute('href','mailto:mail.deborajsarkar@gmail.com');
  await expect(page.locator('a[download][href="downloads/Deboraj-Sarkar-Resume.pdf"]')).toHaveCount(2);
  for(const image of await page.locator('img').all()){
    await image.scrollIntoViewIfNeeded();
    await expect.poll(()=>image.evaluate(element=>(element as HTMLImageElement).complete&&(element as HTMLImageElement).naturalWidth>0)).toBeTruthy();
  }
  expect(errors).toEqual([]);
});

test('Eight case studies expose their working details, demo scope and keyboard focus restoration',async({page})=>{
  await page.goto('/');
  const cases=[['portfolio','Debotaro Portfolio'],['relay','RELAY OS'],['nova','NOVA OS'],['atlas','ATLAS Ops'],['nila','NILA Ledger'],['aura','AURA Reserve'],['vanta','VANTA Atelier'],['rasa','RASA Experience']];
  for(const [id,title] of cases){
    const trigger=page.locator(`[data-case="${id}"]`);await trigger.click();
    const dialog=page.getByRole('dialog',{name:title,exact:true});await expect(dialog).toBeVisible();
    await expect(dialog.locator('.case-role')).toContainText('Project direction and AI-assisted frontend development');
    await expect(dialog.locator('.case-highlights li')).toHaveCount(4);
    await expect(dialog.locator('.case-limitations')).toContainText('Personal concept project');
    await expect(dialog.getByRole('link',{name:'View source code'})).toHaveAttribute('href',new RegExp('^https://github.com/Debotaro/Debotaro\\.github\\.io'));
    if(id==='nova')await expect(dialog.locator('.case-limitations')).toContainText('deterministic rules');
    if(id==='relay'){
      await expect(dialog.getByRole('link',{name:'Explore the demo'})).toHaveAttribute('href','relay-os/');
      await expect(dialog.getByRole('link',{name:'View source code'})).toHaveAttribute('href','https://github.com/Debotaro/Debotaro.github.io/tree/main/relay-os');
      await expect(dialog.locator('.case-limitations')).toContainText('browser');
    }
    await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();
  }
  await page.locator('[data-case="portfolio"]').click();
  await page.getByRole('button',{name:'Close case study',exact:true}).click();
  await expect(page.locator('[data-case="portfolio"]')).toBeFocused();
  await page.locator('[data-case="portfolio"]').click();
  await page.getByRole('link',{name:'Back to portfolio'}).click();await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button',{name:'Brand experiences',exact:true}).click();
  await expect(page.locator('.featured-project')).toBeVisible();await expect(page.locator('.card:visible')).toHaveCount(3);
});

test('Résumé download serves a real PDF and the printable résumé retains the supplied contacts',async({page,request})=>{
  const response=await request.get('/downloads/Deboraj-Sarkar-Resume.pdf');
  expect(response.ok()).toBeTruthy();expect(response.headers()['content-type']).toBe('application/pdf');
  expect((await response.body()).subarray(0,5).toString()).toBe('%PDF-');
  await page.goto('/');
  const downloading=page.waitForEvent('download');await page.locator('.contact-details').getByRole('link',{name:'Résumé PDF'}).click();
  expect((await downloading).suggestedFilename()).toBe('Deboraj-Sarkar-Resume.pdf');
  await page.goto('/downloads/Deboraj-Sarkar-Resume.html');
  await expect(page.getByRole('heading',{name:'Deboraj Sarkar',exact:true})).toBeVisible();
  await expect(page.locator('main')).toContainText('AI-assisted');
  await expect(page.getByRole('link',{name:'mail.deborajsarkar@gmail.com',exact:true})).toHaveAttribute('href','mailto:mail.deborajsarkar@gmail.com');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});

test('Narrow-screen navigation, modal layout, reduced motion and copy-email work',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.setViewportSize({width:320,height:844});await page.goto('/',{waitUntil:'networkidle'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await expect(page.locator('body')).not.toHaveClass(/motion-ready/);
  const menu=page.getByRole('button',{name:'Menu',exact:true});
  await menu.click();await expect(menu).toHaveAttribute('aria-expanded','true');
  await page.keyboard.press('Escape');await expect(menu).toHaveAttribute('aria-expanded','false');await expect(menu).toBeFocused();
  await menu.click();await page.getByRole('navigation').getByRole('link',{name:'About',exact:true}).click();
  await expect(menu).toHaveAttribute('aria-expanded','false');
  await page.locator('[data-case="nova"]').click();
  expect(await page.getByRole('dialog').evaluate(element=>element.scrollWidth<=element.clientWidth)).toBeTruthy();
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Copy email',exact:true}).click();
  await expect(page.locator('#toast')).toContainText('Email copied');
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('mail.deborajsarkar@gmail.com');
  await menu.click();await page.setViewportSize({width:900,height:900});await expect(page.locator('#menu-toggle')).toHaveAttribute('aria-expanded','false');
});

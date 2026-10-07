import { test, expect } from '@playwright/test';
test('AURA enquiry validates a stay and completes a demo reservation',async({page})=>{
  await page.goto('/aura/');
  const start=new Date();start.setDate(start.getDate()+4);
  while([0,1,2].some(n=>{const d=new Date(start);d.setDate(d.getDate()+n);return d.getDate()%11===0;})) start.setDate(start.getDate()+1);
  const end=new Date(start);end.setDate(end.getDate()+3);
  const fmt=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  await page.locator('#arrival').fill(fmt(start));await page.locator('#departure').fill(fmt(end));await page.locator('#guests').selectOption('4');
  await page.getByRole('button',{name:'Explore stays',exact:true}).click();
  await expect(page.locator('#residence')).toHaveValue('garden');await expect(page.locator('#quote-total')).toHaveText('£2,670');
  await page.getByLabel('Your name',{exact:true}).fill('Alex Morgan');await page.getByLabel('Email address',{exact:true}).fill('alex@example.com');
  await page.getByRole('button',{name:'Send demo enquiry'}).click();await expect(page.getByText('Your escape starts here.')).toBeVisible();await expect(page.locator('#success-copy')).toContainText('No reservation or email has been sent');
  await page.getByRole('button',{name:'Return to the island'}).click();await expect(page.locator('#booking-dialog')).not.toBeVisible();
});
test('AURA gallery supports keyboard navigation',async({page})=>{
  await page.goto('/aura/');await page.getByRole('button',{name:'Open gallery: The shoreline'}).click();
  await expect(page.locator('#gallery-caption')).toContainText('1 / 3');await page.keyboard.press('ArrowRight');await expect(page.locator('#gallery-caption')).toContainText('2 / 3');await page.keyboard.press('Escape');await expect(page.locator('#gallery-dialog')).not.toBeVisible();
});
test('VANTA filters products and persists the bag through checkout',async({page})=>{
  await page.goto('/vanta/');await page.getByRole('button',{name:'Outerwear',exact:true}).click();await expect(page.locator('.product')).toHaveCount(2);
  await page.getByRole('button',{name:'Choose size for The Volume Jacket'}).click();await page.locator('#sizes').getByRole('button',{name:'M',exact:true}).click();await page.getByRole('button',{name:'Add to bag',exact:true}).click();await expect(page.locator('#bag-count')).toHaveText('1');
  await page.reload();await expect(page.locator('#bag-count')).toHaveText('1');await page.getByRole('button',{name:'Open shopping bag'}).click();await page.getByRole('button',{name:'Increase The Volume Jacket quantity'}).click();await expect(page.locator('#cart-view .cart-line.total')).toContainText('£570');
  await page.getByRole('button',{name:'Continue to demo checkout'}).click();await page.getByLabel('Full name',{exact:true}).fill('Alex Morgan');await page.getByLabel('Email address',{exact:true}).fill('alex@example.com');await page.getByLabel('Delivery address',{exact:true}).fill('24 Sample Street, London');await page.getByRole('button',{name:'Place demo order'}).click();await expect(page.locator('#order-message')).toContainText('£570 demo order');await expect(page.locator('#bag-count')).toHaveText('0');
});
test('RASA destination selection, quiz, itinerary and plan download work',async({page})=>{
  await page.goto('/rasa/');await page.locator('#destination-tabs').getByRole('button',{name:'Kyoto',exact:true}).click();await expect(page.locator('#destination-detail')).toContainText('The art of paying attention.');await expect(page.locator('#plan-destination')).toHaveValue('kyoto');
  await page.getByRole('button',{name:'See this journey'}).click();await expect(page.locator('#itinerary-days .day')).toHaveCount(5);await page.getByRole('button',{name:'Make this my journey'}).click();
  await page.getByRole('button',{name:'Find my travel style'}).click();await page.getByRole('button',{name:/Salt air & slow mornings/}).click();await page.getByRole('button',{name:/Just me & my curiosity/}).click();await page.getByRole('button',{name:/With room to linger/}).click();await expect(page.locator('#quiz-title')).toContainText('Amalfi Coast');await page.getByRole('button',{name:'Explore my journey'}).click();await expect(page.locator('#itinerary-days .day')).toHaveCount(6);await page.getByRole('button',{name:'Make this my journey'}).click();
  await page.getByLabel('Your name',{exact:true}).fill('Alex Morgan');await page.getByLabel('Email address',{exact:true}).fill('alex@example.com');await page.getByRole('button',{name:'Create my sample journey'}).click();await expect(page.locator('#plan-summary')).toContainText('6 days in Amalfi Coast');
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download my sample plan'}).click();const download=await downloadPromise;expect(download.suggestedFilename()).toBe('rasa-sample-journey.txt');
});
test('VANTA preserves keyboard focus on size and quantity controls',async({page})=>{
  await page.goto('/vanta/');await page.getByRole('button',{name:'Choose size for The Volume Jacket'}).click();
  await page.locator('#sizes').getByRole('button',{name:'S',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.locator('#sizes').getByRole('button',{name:'S',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Add to bag',exact:true}).click();await page.getByRole('button',{name:'Open shopping bag'}).click();
  const increase=page.getByRole('button',{name:'Increase The Volume Jacket quantity'});await increase.focus();await page.keyboard.press('Enter');await expect(increase).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('#bag-count')).toHaveText('3');
});
test('Essential experiences work when optional animation and WebGL CDN is unavailable',async({page})=>{
  await page.route(/cdn\.jsdelivr\.net/,route=>route.abort());
  await page.goto('/rasa/');await page.locator('#destination-tabs').getByRole('button',{name:'Sri Lanka',exact:true}).click();await page.getByRole('button',{name:'See this journey'}).click();await expect(page.locator('#itinerary-days .day')).toHaveCount(7);
  await page.goto('/aura/');await page.getByRole('button',{name:'Reserve your stay',exact:true}).click();await expect(page.locator('#booking-dialog')).toBeVisible();
});
for(const project of ['aura','vanta','rasa'])test(`${project} renders without runtime errors or document overflow`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`/${project}/`,{waitUntil:'networkidle'});await expect(page.locator('main')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();expect(errors).toEqual([]);
});

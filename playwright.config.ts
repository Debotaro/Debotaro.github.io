import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir:'./tests',
  timeout:45000,
  expect:{timeout:10000},
  fullyParallel:true,
  workers:3,
  reporter:[['list'],['html',{open:'never'}]],
  use:{baseURL:'http://localhost:4173',trace:'retain-on-failure',screenshot:'only-on-failure',reducedMotion:'reduce'},
  webServer:{command:'npm run preview',url:'http://localhost:4173',reuseExistingServer:!process.env.CI,timeout:15000},
  projects:[{name:'desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:1000}}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}]
});

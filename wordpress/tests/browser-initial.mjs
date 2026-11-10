// Initial genuine-WordPress checks. WooCommerce tests intentionally not included until official ZIP is supplied.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import bin, { inflate, setupLambdaEnvironment } from '@sparticuz/chromium';
await inflate('node_modules/@sparticuz/chromium/bin/al2023.tar.br');setupLambdaEnvironment('/tmp/al2023/lib');
const browser=await chromium.launch({executablePath:await bin.executablePath(),args:bin.args.filter(x=>!x.includes('single-process')&&!x.includes('disable-web-security')&&!x.includes('allow-running-insecure-content')),headless:true});
const base=`https://9400-${process.env.E2B_SANDBOX_ID}.e2b.app`;
const results=[];const errors=[];const network=[];
const context=await browser.newContext({ignoreHTTPSErrors:true});
await context.route(base+'/**',async route=>{
 const url=new URL(route.request().url());
 const response=await route.fetch({url:'http://127.0.0.1:9400'+url.pathname+url.search,maxRedirects:0});
 await route.fulfill({response});
});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/'))network.push(r.url());});
const assert=(name,pass,detail=null)=>{results.push({name,pass:Boolean(pass),detail});};
try{
 for(const width of [1920,1366,768,390,360]){
  await page.setViewportSize({width,height:900});await page.goto(base+'/',{waitUntil:'networkidle'});
  assert(`Home ${width}: no horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert(`Home ${width}: 17 original sections`,await page.locator('.home>section').count()===17);
  assert(`Home ${width}: Persian RTL`,await page.locator('html').getAttribute('lang')==='fa-IR'&&await page.locator('html').getAttribute('dir')==='rtl');
  if(width===1366||width===390)await page.screenshot({path:`wordpress/.runtime/home-${width}.png`,fullPage:true});
  await page.goto(base+'/contact/',{waitUntil:'networkidle'});
  assert(`Contact ${width}: no overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await page.goto(base+'/',{waitUntil:'networkidle'});
 const title=await page.locator('.hero h1').innerText();await page.locator('#hero-next').click();assert('Hero next slide operates',await page.locator('.hero h1').innerText()!==title);
 await page.locator('#hero-pause').click();assert('Hero pause accessible label',await page.locator('#hero-pause').getAttribute('aria-label')==='پخش اسلایدر');
 await page.locator('#mobile-menu').click();assert('Mobile menu opens',await page.locator('#mobile-menu').getAttribute('aria-expanded')==='true');await page.keyboard.press('Escape');assert('Escape closes menu',await page.locator('#mobile-menu').getAttribute('aria-expanded')==='false');
 await page.goto(base+'/contact/',{waitUntil:'networkidle'});
 assert('Sample contacts never link out',await page.locator('.mhc-contact a[href]').count()===0);
 const form=page.locator('.contact-layout .mhc-form');await form.locator('[name=name]').fill('آزمون مرورگر');await form.locator('[name=email]').fill('browser@example.test');await form.locator('[name=message]').fill('پیام آزمایشی از مرورگر وردپرس؛ ذخیره واقعی بررسی می‌شود.');await form.locator('[name=consent]').check();
 await form.locator('button[type=submit]').click();await page.waitForLoadState('networkidle');assert('Real HTTP form save success',await page.locator('body').innerText().then(t=>t.includes('پیام شما ذخیره شد.')));
 const invalid=await context.request.post('http://127.0.0.1:9400/wp-admin/admin-post.php',{form:{action:'mhc_submit',type:'contact',mhc_nonce:'invalid'}});assert('HTTP forged nonce rejected',invalid.status()===403,invalid.status());
 const unauthorized=await context.request.post('http://127.0.0.1:9400/wp-admin/admin-post.php',{form:{action:'mhc_export'}});assert('Anonymous CSV export denied',unauthorized.status()!==200,unauthorized.status());
 const missing=await page.goto(base+'/does-not-exist/',{waitUntil:'networkidle'});assert('WordPress 404 status',missing.status()===404,missing.status());assert('Approved Persian 404 template',await page.locator('h1').innerText()==='این مسیر به هشتگ نمی‌رسد.');
 assert('No JavaScript errors',errors.length===0,errors);assert('No legacy Express API used',network.length===0,network);
}catch(error){results.push({name:'Browser execution',pass:false,detail:error.stack});}
await browser.close();
const report={scope:'Initial theme and Core checks on WordPress 7.1.4 / PHP-WASM 8.3.36; WooCommerce not installed',passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length,results};
fs.writeFileSync('wordpress/docs/reports/browser-initial.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));process.exit(report.failed?1:0);

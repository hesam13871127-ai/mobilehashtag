import fs from 'node:fs';import {base,launch,context,login} from './final-browser-support.mjs';
const browser=await launch(),c=await context(browser),page=await c.newPage();page.setDefaultTimeout(30000);const checks=[];const check=(name,pass,detail=null)=>{checks.push({name,pass:!!pass,detail});console.log(pass?'PASS':'FAIL',name);};
try{
 await login(page);
 for(const kind of ['plugin','theme']){
  const name=kind==='plugin'?'mobile-hashtag-core-plugin.zip':'mobile-hashtag-wordpress-theme.zip';
  await page.goto(base+'/wp-admin/'+(kind==='plugin'?'plugin-install.php?tab=upload':'theme-install.php?upload'),{waitUntil:'networkidle'});
  const file=page.locator('input[type=file]');if(!await file.isVisible()){await page.locator('.upload-view-toggle, .upload').first().click();}
  await file.setInputFiles('wordpress/packages/'+name);await page.locator('#install-'+kind+'-submit').click();await page.waitForLoadState('networkidle',{timeout:60000});
  const overwrite=page.locator('a[href*="overwrite=update-"]').first();if(await overwrite.count()){await overwrite.click();await page.waitForLoadState('networkidle',{timeout:60000});}
  const text=await page.locator('body').innerText();const success=/successfully|با موفقیت/.test(text)&&!/Installation failed|نصب ناموفق/.test(text);check('Dashboard ZIP upload and install: '+kind,success,text.slice(-1800));await page.screenshot({path:'wordpress/docs/reports/screenshots/dashboard-install-'+kind+'.png'});
 }
 await page.goto(base+'/wp-admin/plugins.php',{waitUntil:'networkidle'});check('Core remains active after dashboard ZIP installation',await page.locator('tr[data-slug="mobile-hashtag-core"].active').count()===1);
 const wc=page.locator('tr[data-plugin="woocommerce/woocommerce.php"]');await wc.locator('.deactivate a').click();await page.waitForLoadState('networkidle');check('Persian missing-WooCommerce admin notice',(await page.locator('body').innerText()).includes('افزونهٔ رسمی WooCommerce را از مخزن وردپرس نصب و فعال کنید'));
 const guest=await context(browser),home=await guest.newPage();const response=await home.goto(base+'/',{waitUntil:'networkidle'});check('Theme degrades without WooCommerce, no fatal',response.status()===200&&(await home.locator('body').innerText()).includes('برای نمایش محصولات، ووکامرس را فعال کنید.'));await guest.close();
 await page.goto(base+'/wp-admin/plugins.php',{waitUntil:'networkidle'});await page.locator('tr[data-plugin="woocommerce/woocommerce.php"] .activate a').click();await page.waitForLoadState('networkidle');check('Official WooCommerce reactivated',await page.locator('tr[data-plugin="woocommerce/woocommerce.php"].active').count()===1);
}catch(e){check('Dashboard installation execution',false,e.message);await page.screenshot({path:'wordpress/.runtime/final-dashboard-failure.png'}).catch(()=>{});}
finally{try{await page.goto(base+'/wp-admin/plugins.php',{waitUntil:'networkidle'});const activate=page.locator('tr[data-plugin="woocommerce/woocommerce.php"] .activate a');if(await activate.count()){await activate.click();await page.waitForLoadState('networkidle');}}catch{}await browser.close();}
const report={scope:'Actual browser WordPress upload/install screens for the ZIP packages; same-version replacement on isolated installation; WooCommerce absence notice and reactivation',passed:checks.filter(r=>r.pass).length,failed:checks.filter(r=>!r.pass).length,checks};fs.writeFileSync('wordpress/docs/reports/final-dashboard-install.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,failed:report.failed}));process.exit(report.failed?1:0);

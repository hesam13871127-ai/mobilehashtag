// Development/test harness only; never included in the installable packages.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadNodeRuntime, createNodeFsMountHandler } from '@php-wasm/node';
import { bootWordPressAndRequestHandler } from '@wp-playground/wordpress';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runtime=path.join(root,'.runtime');
const site=process.env.WP_SITE_PATH?path.resolve(process.env.WP_SITE_PATH):path.join(runtime,'WordPress-7.1.4');
const port=Number(process.env.WP_PORT||9400);
const siteUrl=process.env.WP_SITE_URL||(process.env.E2B_SANDBOX_ID?`https://${port}-${process.env.E2B_SANDBOX_ID}.e2b.app`:`http://localhost:${port}`);
const mounts=[
 [site,'/wordpress'],
 ...(process.env.MHC_INSTALLED==='1'?[]:[
 [path.join(root,'plugin/mobile-hashtag-core'),'/wordpress/wp-content/plugins/mobile-hashtag-core'],
 [path.join(root,'theme/mobile-hashtag'),'/wordpress/wp-content/themes/mobile-hashtag']]),
 [path.join(root,'packages'),'/packages'],
 [path.join(root,'tests'),'/tests'],
];
// WC must be supplied as the official built distribution; never fake/mocked.
const wc=path.join(runtime,'woocommerce');
if(process.env.WC_INSTALLED!=='1' && fs.existsSync(path.join(wc,'woocommerce.php'))) mounts.push([wc,'/wordpress/wp-content/plugins/woocommerce']);
const handler=await bootWordPressAndRequestHandler({
 createPhpRuntime:()=>loadNodeRuntime('8.3',{emscriptenOptions:{processId:1}}), phpVersion:'8.3', maxPhpInstances:1,
 siteUrl, documentRoot:'/wordpress', cookieStore:false,
 wordpressInstallMode:'install-from-existing-files-if-needed',
 sqliteIntegrationPluginZip:new File([fs.readFileSync(path.join(runtime,'sqlite.zip'))],'sqlite.zip'),
 phpIniEntries:{memory_limit:'512M',max_execution_time:'120',display_errors:'0',log_errors:'1'},
 constants:{WPLANG:'fa_IR',WP_DEBUG:true,WP_DEBUG_LOG:true,WP_DEBUG_DISPLAY:false,DISABLE_WP_CRON:true,WP_ENVIRONMENT_TYPE:'local'},
 hooks:{beforeWordPressFiles:async php=>{for(const [host,virtual] of mounts){php.mkdir(virtual);await php.mount(virtual,createNodeFsMountHandler(host));}}},
 onProgress:console.log,
});
const php=await handler.getPrimaryPhp();
const credentialsFile=path.join(runtime,'admin.json');
const credentials=fs.existsSync(credentialsFile)?JSON.parse(fs.readFileSync(credentialsFile,'utf8')):{user:'admin',password:crypto.randomBytes(24).toString('base64url')};
fs.writeFileSync(credentialsFile,JSON.stringify(credentials),{mode:0o600});
const result=await php.run({code:`<?php
require '/wordpress/wp-load.php';
require_once ABSPATH.'wp-admin/includes/plugin.php';
wp_set_password(${JSON.stringify(credentials.password)},1);
wp_set_current_user(1);
update_option('blogname','موبایل هشتگ');update_option('WPLANG','fa_IR');update_option('timezone_string','Asia/Tehran');
// Development transport only: PHP-WASM's raw deflate probe is not Node's HTTP compression.
update_site_option('can_compress_scripts',0);
activate_plugin('mobile-hashtag-core/mobile-hashtag-core.php');
if(file_exists(WP_PLUGIN_DIR.'/woocommerce/woocommerce.php')){activate_plugin('woocommerce/woocommerce.php');}
echo json_encode(['wordpress'=>get_bloginfo('version'),'php'=>PHP_VERSION,'plugins'=>get_option('active_plugins')]);
`});
console.log('BOOT',result.text,result.errors);
if(process.argv.includes('--test')){
 const test=process.argv[process.argv.indexOf('--test')+1];
 let response;
 try{response=await php.run({scriptPath:'/tests/'+test});}catch(error){if(!error.response)throw error;response=error.response;}
 console.log(response.text);if(response.errors)console.error(response.errors);
 process.exit(response.exitCode||0);
}
let queue=Promise.resolve();
const server=http.createServer((req,res)=>{
 let pathname;
 try{pathname=decodeURIComponent(new URL(req.url,siteUrl).pathname);}catch{res.writeHead(400);res.end('Bad request');return;}
 if(/(^|\/)\.|\/wp-content\/database(?:\/|$)|\/debug\.log$|\/wp-config\.php$|\/phpinfo\.php$/i.test(pathname)){
  res.writeHead(403,{'Content-Type':'text/plain'});res.end('Forbidden');return;
 }
 queue=queue.then(async()=>{
  try{
   const chunks=[];for await(const chunk of req)chunks.push(chunk);
   const body=Buffer.concat(chunks);
   const headers={...req.headers,host:new URL(siteUrl).host};
   // CGI needs the length after Node has decoded a chunked HTTP request (XHR/fetch included).
   delete headers['transfer-encoding'];if(body.length||['POST','PUT','PATCH'].includes(req.method)){headers['content-length']=String(body.length);}
   const response=await handler.request({url:new URL(req.url,siteUrl).href,method:req.method,headers,...(body.length?{body}: {})});
   res.writeHead(response.httpStatusCode,response.headers);res.end(Buffer.from(response.bytes));
  }catch(e){console.error(e);res.writeHead(500,{'Content-Type':'text/plain'});res.end('Development runtime error');}
 });
});
server.listen(port,'0.0.0.0',()=>console.log(`WordPress preview listening on 0.0.0.0:${port}`));

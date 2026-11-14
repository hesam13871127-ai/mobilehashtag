// Development-only QA server for Mobile Hashtag: real WordPress + real WooCommerce on PHP-WASM.
// Never distributed inside the theme or plugin packages.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { loadNodeRuntime, createNodeFsMountHandler } from '@php-wasm/node';
import { bootWordPressAndRequestHandler } from '@wp-playground/wordpress';

const SITE = process.env.WP_SITE_PATH || '/tmp/wpsite';
const PORT = Number(process.env.WP_PORT || 9500);
const SQLITE = process.env.SQLITE_ZIP || '/tmp/sqlite.zip';
const QA_DIR = process.env.QA_DIR || '/tmp/qa';
const SITE_URL = process.env.WP_SITE_URL || (process.env.E2B_SANDBOX_ID ? `https://${PORT}-${process.env.E2B_SANDBOX_ID}.e2b.app` : `http://localhost:${PORT}`);

const handler = await bootWordPressAndRequestHandler({
  createPhpRuntime: () => loadNodeRuntime('8.3', { emscriptenOptions: { processId: 1 } }),
  phpVersion: '8.3',
  maxPhpInstances: 1,
  siteUrl: SITE_URL,
  documentRoot: '/wordpress',
  cookieStore: false,
  wordpressInstallMode: 'install-from-existing-files-if-needed',
  sqliteIntegrationPluginZip: new File([fs.readFileSync(SQLITE)], 'sqlite.zip'),
  phpIniEntries: { memory_limit: '512M', max_execution_time: '300', display_errors: '0', log_errors: '1', 'error_log': '/wordpress/wp-content/debug.log' },
  constants: {
    WPLANG: 'fa_IR',
    WP_DEBUG: true,
    WP_DEBUG_LOG: true,
    WP_DEBUG_DISPLAY: false,
    DISABLE_WP_CRON: true,
    WP_ENVIRONMENT_TYPE: 'local',
    WP_HOME: SITE_URL,
    WP_SITEURL: SITE_URL,
  },
  hooks: {
    beforeWordPressFiles: async (php) => {
      php.mkdir('/wordpress');
      await php.mount('/wordpress', createNodeFsMountHandler(SITE));
      php.mkdir('/qa');
      await php.mount('/qa', createNodeFsMountHandler(QA_DIR));
    },
  },
  onProgress: (m) => console.log('BOOT', m),
});

const php = await handler.getPrimaryPhp();
const credFile = '/tmp/qa-admin.json';
const creds = fs.existsSync(credFile) ? JSON.parse(fs.readFileSync(credFile, 'utf8')) : { user: 'admin', password: crypto.randomBytes(18).toString('base64url') };
fs.writeFileSync(credFile, JSON.stringify(creds), { mode: 0o600 });

const bootstrap = `
require '/wordpress/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/plugin.php';
wp_set_password(${JSON.stringify(creds.password)}, 1);
wp_set_current_user(1);
echo json_encode(['wp' => get_bloginfo('version'), 'php' => PHP_VERSION, 'active' => get_option('active_plugins')]);
`;
const result = await php.run({ code: `<?php ${bootstrap}` });
console.log('BOOTSTRAP', result.text, result.errors || '');

if (process.argv.includes('--run')) {
  const script = process.argv[process.argv.indexOf('--run') + 1];
  let response;
  try {
    response = await php.run({ code: fs.readFileSync(script,'utf8') });
  } catch (error) {
    if (!error.response) throw error;
    response = error.response;
  }
  console.log(response.text);
  if (response.errors) console.error(response.errors);
  process.exit(response.exitCode || 0);
}

let queue = Promise.resolve();
const server = http.createServer((req, res) => {
  queue = queue.then(async () => {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks);
      const headers = { ...req.headers, host: new URL(SITE_URL).host };
      delete headers['transfer-encoding'];
      if (body.length || ['POST', 'PUT', 'PATCH'].includes(req.method)) headers['content-length'] = String(body.length);
      const response = await handler.request({ url: new URL(req.url, SITE_URL).href, method: req.method, headers, ...(body.length ? { body } : {}) });
      res.writeHead(response.httpStatusCode, response.headers);
      res.end(Buffer.from(response.bytes));
    } catch (e) {
      console.error(e);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('QA runtime error');
    }
  });
});
server.listen(PORT, '0.0.0.0', () => console.log(`QA WordPress on 0.0.0.0:${PORT} -> ${SITE_URL}`));

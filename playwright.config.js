import { defineConfig } from '@playwright/test';
let launchOptions = {};
if (process.env.ARENA_BROWSER === '1') {
  const { default: bin, inflate, setupLambdaEnvironment } = await import('@sparticuz/chromium');
  await inflate('node_modules/@sparticuz/chromium/bin/al2023.tar.br');
  setupLambdaEnvironment('/tmp/al2023/lib');
  launchOptions = {
    executablePath: await bin.executablePath(),
    args: bin.args.filter(
      (x) =>
        !x.includes('disable-web-security') &&
        !x.includes('allow-running-insecure-content') &&
        !x.includes('single-process')
    ),
  };
}
export default defineConfig({
  testDir: './tests',
  testMatch: 'ui.spec.js',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  reporter: [['list'], ['json', { outputFile: 'test-results/ui-report.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:3100',
    headless: true,
    launchOptions,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node tests/ui-server.js',
    url: 'http://127.0.0.1:3100/health',
    reuseExistingServer: false,
    timeout: 30000,
  },
});

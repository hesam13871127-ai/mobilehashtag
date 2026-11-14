// Development-only PHP CLI bridge (PHP-WASM). Not part of any installable package.
// Usage: node php-run.mjs <host-dir> <virtual-dir> <script.php|script.phar> [args...]
import { loadNodeRuntime, createNodeFsMountHandler } from '@php-wasm/node';
import { PHP, sandboxedSpawnHandlerFactory } from '@php-wasm/universal';
import path from 'node:path';

const [hostDir, virtualDir, ...rest] = process.argv.slice(2);
const php = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: 91 } }));
php.setSapiName('cli');
await php.setSpawnHandler(sandboxedSpawnHandlerFactory());
await php.mkdir(virtualDir);
await php.mount(virtualDir, createNodeFsMountHandler(path.resolve(hostDir)));
const script = rest[0];
const argv = [script, ...rest.slice(1)];
const r = await php.run({
  code: `<?php chdir(${JSON.stringify(virtualDir)}); $_SERVER['argv']=$argv=${JSON.stringify(argv)}; $_SERVER['argc']=$argc=count($argv); $_SERVER['SCRIPT_NAME']=$argv[0]; $_SERVER['PWD']=${JSON.stringify(virtualDir)}; require $argv[0];`,
  env: { HOME: virtualDir, COMPOSER_HOME: virtualDir + '/.composer-home', CI: '1' },
});
process.stdout.write(r.text);
if (r.errors) process.stderr.write(r.errors);
process.exit(r.exitCode || 0);

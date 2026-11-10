// Development-only PHP CLI bridge for Composer; no WordPress core modification.
import {loadNodeRuntime,createNodeFsMountHandler} from '@php-wasm/node';
import {PHP,sandboxedSpawnHandlerFactory} from '@php-wasm/universal';
import path from 'node:path';
const php=new PHP(await loadNodeRuntime('8.3',{emscriptenOptions:{processId:73}}));
php.setSapiName('cli');
await php.setSpawnHandler(sandboxedSpawnHandlerFactory());
await php.mount('/workspace',createNodeFsMountHandler('/home/user/mobilehashtag/wordpress/.runtime'));
const args=process.argv.slice(2);const cwd=process.env.PHP_CWD||'/workspace';
const r=await php.run({code:`<?php chdir(${JSON.stringify(cwd)}); $_SERVER['argv']=$argv=${JSON.stringify(args)};$_SERVER['argc']=$argc=count($argv);require $argv[0];`,env:{CI:'1',HOME:'/workspace'}});
process.stdout.write(r.text);if(r.errors)process.stderr.write(r.errors);process.exit(r.exitCode||0);

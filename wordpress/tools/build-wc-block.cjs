// Memory-bounded invocation of one UNMODIFIED official WooCommerce webpack config.
// Only concurrency is reduced; no PHP/JS source or feature is removed.
const path=require('node:path');
const base=path.resolve(__dirname,'../.runtime/wc-build');
const dir=path.join(base,'plugins/woocommerce/client/blocks');
process.chdir(dir);
process.env.NODE_ENV='production';process.env.BABEL_ENV='default';process.env.WP_EXPERIMENTAL_MODULES='true';
const webpack=require(path.join(base,'node_modules/webpack'));
const configs=require(path.join(dir,'webpack.config.js'));
const index=Number(process.argv[2]);if(!Number.isInteger(index)||!configs[index])throw Error('Invalid compiler index');
const config=configs[index];config.parallelism=8;
for(const minimizer of config.optimization?.minimizer||[]){if(minimizer?.options&&'parallel' in minimizer.options)minimizer.options.parallel=false;}
const compiler=webpack(config);
compiler.run((error,stats)=>{
 if(error){console.error(error);process.exitCode=1;}else{console.log('COMPILER '+index+' '+stats.toString({all:false,errors:true,warnings:true,timings:true,assets:false}));if(stats.hasErrors())process.exitCode=1;}
 compiler.close(()=>process.exit(process.exitCode||0));
});

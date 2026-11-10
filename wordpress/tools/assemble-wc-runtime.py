"""Assemble the source-built official WooCommerce test runtime, never a customer deliverable."""
from pathlib import Path
import shutil, json, hashlib, subprocess
root=Path(__file__).resolve().parents[1]
source=root/'.runtime/wc-build/plugins/woocommerce'
dest=root/'.runtime/woocommerce'
if dest.exists():
    raise SystemExit('Runtime already exists; refusing to discard it. Sync deliberate changed build assets separately.')
required=['vendor/autoload_packages.php','assets/js/frontend/checkout.min.js','assets/css/woocommerce.css','assets/client/admin/app/index.js','assets/client/blocks/blocks-json.php']
for f in required:
    if not (source/f).is_file():raise SystemExit('Missing build output: '+f)
dest.mkdir()
ignore=shutil.ignore_patterns('node_modules','tests','test-results','changelog','docs','.git','*.map','*.lock','phpunit*','phpcs*','composer.json','package.json','setup.sh')
for name in ['assets','i18n','includes','lib','packages','patterns','src','templates','vendor','woocommerce.php','uninstall.php','license.txt','readme.txt']:
    p=source/name
    if p.is_dir():shutil.copytree(p,dest/name,ignore=ignore)
    elif p.is_file():shutil.copy2(p,dest/name)
changes=subprocess.check_output(['git','-C',str(source.parents[1]),'diff','--name-only'],text=True).splitlines()
report={'version':'11.2.2','source_repository':'https://github.com/woocommerce/woocommerce','tag':'11.2.2','commit':'8ab82808f207c420703863c8ecec62e2fdc834a4','provenance':'Local build of official source and exact locked dependencies; NOT a hash-identical official release ZIP','tracked_changes':changes,'note':'Only pnpm Node-version pin removed to use available Node 24.18. No WooCommerce PHP/JS source altered. Webpack compilers run sequentially to fit 4GB RAM. Composer official 2.9.8 and Jetpack generated production autoloaders.','runtime_files':sum(1 for p in dest.rglob('*') if p.is_file()),'required_assets':{f:hashlib.sha256((dest/f).read_bytes()).hexdigest() for f in required}}
(root/'docs/reports/woocommerce-build.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))

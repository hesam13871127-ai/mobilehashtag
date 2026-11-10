"""Build-only dependency bootstrap from the official WooCommerce lockfile.
Downloads only exact GitHub dist references from that lockfile. Composer itself
then generates the production autoloader with the official Jetpack plugin.
Nothing here is distributed in the Mobile Hashtag theme/Core ZIPs.
"""
from pathlib import Path
import json, urllib.request, zipfile, io, shutil, concurrent.futures, hashlib
ROOT=Path(__file__).resolve().parents[1]
WC=ROOT/'.runtime/wc-build/plugins/woocommerce'
LOCK=json.loads((WC/'composer.lock').read_text())
CACHE=ROOT/'.runtime/composer-dist';CACHE.mkdir(exist_ok=True)
def install(p):
    name=p['name'];special=name in ['woocommerce/action-scheduler','woocommerce/blueprint','woocommerce/email-editor']
    dest=WC/('packages/'+name.split('/')[1] if special else 'vendor/'+name)
    dest.mkdir(parents=True,exist_ok=True)
    dist=p['dist']
    if dist['type']=='path':
        shutil.copytree((WC/dist['url']).resolve(),dest,dirs_exist_ok=True)
        digest='local official monorepo '+dist['reference']
    else:
        url=dist['url'];assert url.startswith('https://api.github.com/repos/')
        repo=url.split('/repos/')[1].split('/zipball/')[0]
        download=f"https://codeload.github.com/{repo}/zip/{dist['reference']}"
        cache=CACHE/(name.replace('/','-')+'-'+dist['reference']+'.zip')
        if not cache.exists():
            req=urllib.request.Request(download,headers={'User-Agent':'Mobile-Hashtag-Build'})
            cache.write_bytes(urllib.request.urlopen(req,timeout=90).read())
        digest=hashlib.sha256(cache.read_bytes()).hexdigest()
        with zipfile.ZipFile(cache) as z:
            prefix=z.namelist()[0].split('/')[0]+'/'
            for item in z.infolist():
                relative=item.filename.removeprefix(prefix)
                if not relative or item.is_dir():continue
                path=dest/relative
                assert path.resolve().is_relative_to(dest.resolve())
                path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(z.read(item))
    record=dict(p);record['installation-source']='dist';record['install-path']=('../../packages/'+name.split('/')[1]) if special else '../'+name
    print(name,p['version'],flush=True)
    return record,{'name':name,'version':p['version'],'source':dist,'archive_sha256':digest}
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    pairs=list(pool.map(install,LOCK['packages']))
composer=WC/'vendor/composer';composer.mkdir(parents=True,exist_ok=True)
(composer/'installed.json').write_text(json.dumps({'packages':[p[0] for p in pairs],'dev':False,'dev-package-names':[]},indent=2))
(ROOT/'docs/reports/wc-source-dependencies.json').write_text(json.dumps({'official_tag':'11.2.2','official_commit':'8ab82808f207c420703863c8ecec62e2fdc834a4','packages':[p[1] for p in pairs]},indent=2))

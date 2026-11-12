"""Reproducible install ZIPs, allowlisted source only. Never includes WP/WC/runtime/secrets."""
from pathlib import Path
import zipfile, hashlib, json, re
root=Path(__file__).resolve().parents[1]
output=root/'packages';output.mkdir(exist_ok=True)
report=[]
for source,name,entry in [
 ('theme/mobile-hashtag','mobile-hashtag-wordpress-theme.zip','style.css'),
 ('plugin/mobile-hashtag-core','mobile-hashtag-core-plugin.zip','mobile-hashtag-core.php')]:
 source=root/source;zip_path=output/name;files=sorted(p for p in source.rglob('*') if p.is_file())
 for p in files:
  if p.is_symlink():raise RuntimeError(f'Symlink not allowed: {p}')
  if any(s in p.parts for s in ['node_modules','.git','.runtime']) or p.suffix in ['.sqlite','.db','.log','.zip','.env']:raise RuntimeError(f'Unexpected file: {p}')
 with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for p in files:
   info=zipfile.ZipInfo(source.name+'/'+p.relative_to(source).as_posix(),date_time=(2026,11,9,0,0,0));info.external_attr=0o100644<<16;info.compress_type=zipfile.ZIP_DEFLATED
   z.writestr(info,p.read_bytes())
  for doc in ['INSTALL-FA.md','WOOCOMMERCE-FA.md','CONTACT-SMTP-FA.md','MIGRATION-FA.md','KNOWN-LIMITATIONS.md','QA-PROGRESS.md','CHANGELOG.md','PORTABILITY-FA.md','FINAL-QA-FA.md','PAGES-FA.md']:
   info=zipfile.ZipInfo(source.name+'/docs/'+doc,date_time=(2026,11,9,0,0,0));info.external_attr=0o100644<<16;info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,(root/'docs'/doc).read_bytes())
  for report_name in ['v1.0.2/onboarding.json','v1.0.2/onboarding-recheck.json','v1.0.2/portability-and-preservation.json','v1.0.2/setup-safety.txt','v1.0.2/fresh-install.txt','v1.0.2/customizer.json','v1.0.2/store-interactions.json','v1.0.2/browser-commerce.json','v1.0.2/browser-workflows.json','v1.0.2/cart-responsive.json','v1.0.2/final-acceptance.json','v1.0.2/core.txt','v1.0.2/core-management.txt','v1.0.2/commerce.txt','v1.0.2/lint.txt','v1.0.2/migration.txt']:
   proof=root/'docs/reports'/report_name
   if not proof.is_file():raise RuntimeError('Missing required QA evidence: '+report_name)
   info=zipfile.ZipInfo(source.name+'/docs/reports/'+report_name,date_time=(2026,11,9,0,0,0));info.external_attr=0o100644<<16;info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,proof.read_bytes())
 with zipfile.ZipFile(zip_path) as z:
  names=z.namelist();assert z.testzip() is None;assert {n.split('/')[0] for n in names}=={source.name};assert source.name+'/'+entry in names
  assert all(not n.startswith('/') and '..' not in n.split('/') and not any(b in n for b in ['wp-config.php','admin.json','node_modules/','vendor/','woocommerce.php','database/']) for n in names)
  assert len(set(names))==len(names)
  assert 'Version: 1.0.3' in z.read(source.name+'/'+entry).decode()
  for p in files:assert z.read(source.name+'/'+p.relative_to(source).as_posix())==p.read_bytes()
  report.append({'file':str(zip_path.relative_to(root)),'version':'1.0.3','root':source.name+'/','entry_point':source.name+'/'+entry,'bytes':zip_path.stat().st_size,'sha256':hashlib.sha256(zip_path.read_bytes()).hexdigest(),'files':len(names),'crc_check':'PASS','single_root':'PASS','source_byte_match':'PASS','no_runtime_core_or_secrets':'PASS','installation_test':'See reports/v1.0.3/release-install.txt and dashboard-install.json; exact final artifacts are installed and hashed after packaging.'})
(root/'docs/reports/package-verification.json').write_text(json.dumps({'packages':report},indent=2)+'\n')
print(json.dumps(report,indent=2))

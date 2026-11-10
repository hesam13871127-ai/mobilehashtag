"""Read-only SQLite -> public, allowlisted migration snapshot. Never exports customers or orders.
Run from anywhere: python3 wordpress/tools/export-catalog.py
The original Node store and SQLite file are never modified.
"""
from pathlib import Path
import sqlite3
import json
import shutil
import hashlib

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / 'wordpress/plugin/mobile-hashtag-core/data'
DB = ROOT / 'database/store.sqlite'
conn = sqlite3.connect(DB.as_uri() + '?mode=ro', uri=True)
conn.row_factory = sqlite3.Row
# A read transaction gives one consistent catalog snapshot, even when the Node preview is running.
conn.execute('BEGIN')
data = {table: [dict(row) for row in conn.execute(f'SELECT * FROM {table} ORDER BY rowid')]
        for table in ('categories', 'products', 'product_categories', 'posts')}
conn.rollback()
conn.close()
data.update(format_version=1, source_commit='44e0ff3', currency='IRT')
DEST.mkdir(parents=True, exist_ok=True)
(DEST / 'catalog.json').write_text(json.dumps(data, ensure_ascii=False, indent=2))
paths = {row['image'] for row in data['categories'] + data['posts']}
for product in data['products']:
    paths.add(product['image'])
    paths.update(json.loads(product['gallery']))
paths.add('/assets/images/banners/hero-phone.webp')
images_root = (ROOT / 'frontend/assets/images').resolve()
report = {'tables': {table: len(data[table]) for table in ('categories', 'products', 'product_categories', 'posts')}, 'media': []}
for asset in sorted(paths):
    if not asset.startswith('/assets/images/'):
        raise ValueError(f'Unexpected asset: {asset}')
    source = (ROOT / 'frontend' / asset.lstrip('/')).resolve()
    if not source.is_relative_to(images_root) or not source.is_file():
        raise ValueError(f'Missing/unsafe source: {asset}')
    target = DEST / 'media' / source.relative_to(images_root)
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    report['media'].append({'source': asset, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
(ROOT / 'wordpress/docs/export-manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
print(json.dumps({'tables': report['tables'], 'distinct_media_paths': len(paths), 'private_tables_exported': []}, ensure_ascii=False))

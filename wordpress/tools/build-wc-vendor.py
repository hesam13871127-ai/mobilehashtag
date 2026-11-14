"""Build a Composer-compatible vendor/ tree for the official WooCommerce plugin source.

Downloads exactly the packages pinned in plugins/woocommerce/composer.lock from the
official GitHub dist URLs, then generates a PSR-4/classmap/files autoloader equivalent
to what `composer install --no-dev` would produce. No WooCommerce PHP source is edited.
"""
from __future__ import annotations

import json
import os
import shutil
import ssl
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/wcclone')
WC = ROOT / 'plugins/woocommerce'
CACHE = Path('/tmp/composer-dist')
CACHE.mkdir(exist_ok=True)
CA = '/usr/local/share/ca-certificates/e2b-ca.crt'
CTX = ssl.create_default_context(cafile=CA)

INSTALLER_PATHS = {
    'woocommerce/action-scheduler': 'packages/action-scheduler',
    'woocommerce/email-editor': 'packages/email-editor',
    'woocommerce/blueprint': 'packages/blueprint',
}


def fetch(url: str, dest: Path) -> bytes:
    if dest.exists():
        return dest.read_bytes()
    import urllib.request

    req = urllib.request.Request(url, headers={'User-Agent': 'mobile-hashtag-build'})
    with urllib.request.urlopen(req, context=CTX, timeout=120) as response:
        data = response.read()
    dest.write_bytes(data)
    return data


def extract_zip(data: bytes, dest: Path) -> None:
    import io

    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        names = archive.namelist()
        prefix = names[0].split('/')[0] + '/'
        for item in archive.infolist():
            if item.is_dir():
                continue
            relative = item.filename[len(prefix):]
            if not relative or relative.startswith('..'):
                continue
            target = dest / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(archive.read(item))


def main() -> None:
    lock = json.loads((WC / 'composer.lock').read_text())
    vendor = WC / 'vendor'
    if vendor.exists():
        shutil.rmtree(vendor)
    vendor.mkdir(parents=True)

    psr4: dict[str, list[str]] = {}
    psr0: dict[str, list[str]] = {}
    classmap: list[str] = []
    files: list[str] = []
    installed = []

    for package in lock['packages']:
        name = package['name']
        dist = package['dist']
        if dist.get('type') == 'path':
            source = (WC / dist['url']).resolve()
            target_rel = INSTALLER_PATHS.get(name)
            if not target_rel:
                raise SystemExit(f'Unexpected path package without installer path: {name}')
            target = WC / target_rel
            if target.exists():
                shutil.rmtree(target)
            shutil.copytree(source, target, ignore=shutil.ignore_patterns('.git', 'node_modules', 'tests'))
            installed.append({'name': name, 'version': package['version'], 'path': target_rel, 'source': 'local monorepo path package'})
            package_json = json.loads((target / 'composer.json').read_text()) if (target / 'composer.json').exists() else {}
            package_dir_rel = target_rel
        else:
            url = dist['url']
            assert url.startswith('https://api.github.com/repos/'), url
            repo, ref = url.split('/repos/')[1].split('/zipball/')
            codeload = f'https://codeload.github.com/{repo}/zip/{ref}' if not ref.startswith('v') or True else url
            cache_file = CACHE / f"{name.replace('/', '-')}-{ref[:12]}.zip"
            data = fetch(codeload, cache_file)
            target_rel = INSTALLER_PATHS.get(name, f'vendor/{name}')
            target = WC / target_rel
            if target.exists():
                shutil.rmtree(target)
            target.mkdir(parents=True)
            extract_zip(data, target)
            installed.append({'name': name, 'version': package['version'], 'path': target_rel, 'source': codeload, 'sha256': __import__('hashlib').sha256(data).hexdigest()})
            package_json = json.loads((target / 'composer.json').read_text()) if (target / 'composer.json').exists() else {}
            package_dir_rel = target_rel

        autoload = package_json.get('autoload', {}) or {}
        for prefix, paths in (autoload.get('psr-4') or {}).items():
            psr4.setdefault(prefix, []).extend(f'{package_dir_rel}/{p}'.rstrip('/') for p in (paths if isinstance(paths, list) else [paths]))
        for prefix, paths in (autoload.get('psr-0') or {}).items():
            psr0.setdefault(prefix, []).extend(f'{package_dir_rel}/{p}'.rstrip('/') for p in (paths if isinstance(paths, list) else [paths]))
        for entry in autoload.get('classmap') or []:
            classmap.append(f'{package_dir_rel}/{entry}'.rstrip('/'))
        for entry in autoload.get('files') or []:
            files.append(f'{package_dir_rel}/{entry}')

    # WooCommerce's own autoload configuration (from plugins/woocommerce/composer.json).
    own = json.loads((WC / 'composer.json').read_text())
    own_autoload = own.get('autoload', {})
    for prefix, paths in (own_autoload.get('psr-4') or {}).items():
        psr4.setdefault(prefix, []).extend(p if p else '.' for p in (paths if isinstance(paths, list) else [paths]))
    for prefix, paths in (own_autoload.get('psr-0') or {}).items():
        psr0.setdefault(prefix, []).extend(p if p else '.' for p in (paths if isinstance(paths, list) else [paths]))
    for entry in own_autoload.get('classmap') or []:
        classmap.append(entry)
    for entry in own_autoload.get('files') or []:
        files.append(entry)
    exclude = own_autoload.get('exclude-from-classmap') or []

    # Build the classmap for directories that Composer would scan.
    classmap_entries: dict[str, str] = {}
    for entry in classmap:
        path = WC / entry
        targets = [path] if path.is_file() else sorted(path.rglob('*.php')) if path.is_dir() else []
        for php_file in targets:
            rel = php_file.relative_to(WC).as_posix()
            if any(rel.startswith(ex.lstrip('/')) for ex in exclude):
                continue
            for cls in scan_classes(php_file):
                classmap_entries[cls] = rel

    php_prefix = "dirname(__DIR__)"  # vendor/autoload.php -> plugin root is dirname(dirname)
    lines = ['<?php', '// Generated for the Mobile Hashtag QA build of official WooCommerce {0}. Do not edit.'.format(own.get('version')), 'namespace Composer\\Autoload;', '']
    lines.append('class MhClassLoader {')
    lines.append('    public $psr4 = ' + php_export({k: v for k, v in psr4.items()}) + ';')
    lines.append('    public $psr0 = ' + php_export({k: v for k, v in psr0.items()}) + ';')
    lines.append('    public $classmap = ' + php_export(classmap_entries) + ';')
    lines.append('    public $root;')
    lines.append('    public function __construct($root) { $this->root = rtrim($root, "/"); }')
    lines.append('    public function load($class) {')
    lines.append('        if (isset($this->classmap[$class])) { $f = $this->root . "/" . $this->classmap[$class]; if (is_file($f)) { require $f; return true; } }')
    lines.append('        foreach ($this->psr4 as $prefix => $dirs) { $len = strlen($prefix); if (strncmp($class, $prefix, $len) !== 0) { continue; } $rest = substr($class, $len); foreach ($dirs as $dir) { $f = $this->root . "/" . trim($dir, "/") . "/" . str_replace("\\\\", "/", $rest) . ".php"; if (is_file($f)) { require $f; return true; } } }')
    lines.append('        foreach ($this->psr0 as $prefix => $dirs) { $pos = strrpos($class, "\\\\"); $ns = $pos === false ? "" : substr($class, 0, $pos); $short = $pos === false ? $class : substr($class, $pos + 1); foreach ($dirs as $dir) { $f = $this->root . "/" . trim($dir, "/") . "/" . str_replace("\\\\", "/", ($ns === "" ? "" : $ns . "/") . $short) . ".php"; if (is_file($f)) { require $f; return true; } } }')
    lines.append('        return false;')
    lines.append('    }')
    lines.append('}')
    lines.append('')
    lines.append('$GLOBALS["__mh_autoloader"] = new MhClassLoader(dirname(__DIR__));')
    lines.append('spl_autoload_register([$GLOBALS["__mh_autoloader"], "load"]);')
    lines.append('foreach (' + php_export(files) + ' as $__mh_file) { $__mh_path = dirname(__DIR__) . "/" . $__mh_file; if (is_file($__mh_path)) { require_once $__mh_path; } }')
    lines.append('return $GLOBALS["__mh_autoloader"];')
    (vendor / 'autoload.php').write_text('\n'.join(lines) + '\n')

    # Jetpack's autoloader entry point that WooCommerce requires.
    (vendor / 'autoload_packages.php').write_text('<?php\n// Minimal stand-in for Jetpack Autoloader in this QA build: the generated autoloader above covers all locked packages.\nreturn require __DIR__ . "/autoload.php";\n')

    meta = {'packages': installed, 'classmap_size': len(classmap_entries), 'psr4_prefixes': len(psr4), 'files': files}
    (Path('/tmp/wc-vendor-report.json')).write_text(json.dumps(meta, indent=2))
    print(json.dumps({k: meta[k] for k in ('classmap_size', 'psr4_prefixes')}, indent=2))
    print('packages:', len(installed))


def scan_classes(path: Path) -> list[str]:
    import re

    try:
        text = path.read_text(errors='ignore')
    except OSError:
        return []
    if 'class ' not in text and 'interface ' not in text and 'trait ' not in text:
        return []
    namespace = ''
    ns = re.search(r'^namespace\s+([^;{]+)[;{]', text, re.M)
    if ns:
        namespace = ns.group(1).strip()
    out = []
    for match in re.finditer(r'^\s*(?:final\s+|abstract\s+|readonly\s+)*(class|interface|trait|enum)\s+([A-Za-z_][A-Za-z0-9_]*)', text, re.M):
        out.append((namespace + '\\' if namespace else '') + match.group(2))
    return out


def php_export(value) -> str:
    if isinstance(value, dict):
        return 'array(' + ', '.join(f'{php_export(str(k))} => {php_export(v)}' for k, v in value.items()) + ')'
    if isinstance(value, list):
        return 'array(' + ', '.join(php_export(v) for v in value) + ')'
    return "'" + str(value).replace('\\', '\\\\').replace("'", "\\'") + "'"


main()

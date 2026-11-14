"""Reproducible install ZIPs for Mobile Hashtag 1.0.6.

Allowlisted sources only: never WordPress, WooCommerce, the QA runtime, databases,
logs or secrets. Verifies a single root folder, entry point, byte-identical contents,
and the declared version before writing hashes.
"""
from pathlib import Path
import zipfile
import hashlib
import json

VERSION = "1.0.6"
ZIP_DATE = (2026, 11, 14, 0, 0, 0)
root = Path(__file__).resolve().parents[1]
output = root / "packages"
output.mkdir(exist_ok=True)

PACKAGES = [
    ("theme/mobile-hashtag", "mobile-hashtag-wordpress-theme.zip", "style.css", f"Version: {VERSION}"),
    ("plugin/mobile-hashtag-core", "mobile-hashtag-core-plugin.zip", "mobile-hashtag-core.php", f"Version: {VERSION}"),
]

# Shipped documentation; everything referenced must exist or packaging fails.
DOCS = [
    "INSTALL-FA.md", "WOOCOMMERCE-FA.md", "IMPORT-FA.md",
    "CONTACT-SMTP-FA.md", "TEST-REPORT-FA.md", "CHANGELOG-FA.md",
]
EXCLUDE_DIRS = {"node_modules", ".git", ".runtime", "__pycache__"}
EXCLUDE_SUFFIX = {".sqlite", ".db", ".log", ".zip", ".env", ".pyc"}
FORBIDDEN_NAMES = {"wp-config.php", "admin.json", "woocommerce.php"}

report = []
for source_rel, zip_name, entry, version_marker in PACKAGES:
    source = root / source_rel
    if not source.is_dir():
        raise SystemExit(f"missing source: {source}")

    files = sorted(p for p in source.rglob("*") if p.is_file())
    for p in files:
        if p.is_symlink():
            raise SystemExit(f"symlink not allowed: {p}")
        if any(part in EXCLUDE_DIRS for part in p.parts):
            raise SystemExit(f"excluded directory leaked: {p}")
        if p.suffix in EXCLUDE_SUFFIX:
            raise SystemExit(f"unexpected file type: {p}")
        if p.name in FORBIDDEN_NAMES:
            raise SystemExit(f"forbidden file: {p}")

    zip_path = output / zip_name
    root_name = source.name

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        def write(arcname: str, data: bytes) -> None:
            info = zipfile.ZipInfo(arcname, date_time=ZIP_DATE)
            info.external_attr = 0o100644 << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(info, data)

        for p in files:
            write(f"{root_name}/{p.relative_to(source).as_posix()}", p.read_bytes())

        for doc in DOCS:
            doc_path = root / "docs" / doc
            if not doc_path.is_file():
                raise SystemExit(f"missing required document: {doc}")
            write(f"{root_name}/docs/{doc}", doc_path.read_bytes())

    # ---- verification ----
    with zipfile.ZipFile(zip_path) as z:
        if z.testzip() is not None:
            raise SystemExit(f"CRC failure in {zip_name}")
        names = z.namelist()
        assert len(names) == len(set(names)), f"duplicate entries in {zip_name}"
        assert {n.split("/")[0] for n in names} == {root_name}, f"multiple roots in {zip_name}"
        assert f"{root_name}/{entry}" in names, f"missing entry point in {zip_name}"
        assert all(
            not n.startswith("/") and ".." not in n.split("/") for n in names
        ), f"unsafe path in {zip_name}"
        header = z.read(f"{root_name}/{entry}").decode("utf-8", "replace")
        assert version_marker in header, f"version marker {version_marker!r} missing in {zip_name}"
        for p in files:
            assert z.read(f"{root_name}/{p.relative_to(source).as_posix()}") == p.read_bytes(), (
                f"byte mismatch after packaging: {p}"
            )
        for doc in DOCS:
            assert z.read(f"{root_name}/docs/{doc}") == (root / "docs" / doc).read_bytes()

    report.append({
        "file": zip_name,
        "version": VERSION,
        "root": f"{root_name}/",
        "entry_point": f"{root_name}/{entry}",
        "bytes": zip_path.stat().st_size,
        "sha256": hashlib.sha256(zip_path.read_bytes()).hexdigest(),
        "entries": len(names),
        "source_files": len(files),
        "docs": len(DOCS),
        "crc_check": "PASS",
        "single_root": "PASS",
        "version_marker": "PASS",
        "source_byte_match": "PASS",
        "no_core_or_secrets": "PASS",
    })

(output / "package-verification.json").write_text(
    json.dumps({"version": VERSION, "packages": report}, indent=2, ensure_ascii=False) + "\n",
    encoding="utf-8",
)

# Checksums live outside the archives: the docs inside the ZIPs cannot contain the hash
# of the ZIP that contains them.
(output / "SHA256SUMS.txt").write_text(
    "".join(f"{p['sha256']}  {p['file']}\n" for p in report), encoding="utf-8"
)
print(json.dumps({"version": VERSION, "packages": report}, indent=2, ensure_ascii=False))

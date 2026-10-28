#!/usr/bin/env python3
"""Build a complete preview site whose HOME is the LCARS design.

The production build (build.py -> dist/) is untouched: this writes to dist-lcars/.
Everything else - project pages, assets, CNAME - comes from the normal build, so
the preview is a working site, not a loose HTML file.

Usage:
    python scripts/build_lcars_preview.py
"""
from __future__ import annotations

import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "out" / "opendesign"
DIST = ROOT / "dist"
OUT = ROOT / "dist-lcars"


def main() -> int:
    if not (SRC / "index.html").is_file():
        print(f"missing {SRC / 'index.html'}", file=sys.stderr)
        return 1
    build = subprocess.run([sys.executable, str(ROOT / "build.py")], cwd=ROOT,
                           capture_output=True, text=True)
    if build.returncode:
        sys.stderr.write(build.stderr)
        return build.returncode
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(DIST, OUT)

    lcars = OUT / "assets" / "lcars"
    lcars.mkdir(parents=True, exist_ok=True)
    for name in ("app.css", "app.js", "fonts.css"):
        shutil.copy2(SRC / name, lcars / name)
    shutil.copy2(SRC / "lcars" / "lcars.css", lcars / "lcars.css")
    shutil.copytree(SRC / "fonts", lcars / "fonts", dirs_exist_ok=True)
    shutil.copytree(SRC / "vendor", lcars / "vendor", dirs_exist_ok=True)

    page = (SRC / "index.html").read_text(encoding="utf-8")
    page = page.replace('href="app.css"', 'href="/assets/lcars/app.css"')
    page = page.replace('href="lcars/lcars.css"', 'href="/assets/lcars/lcars.css"')
    page = page.replace('href="fonts.css"', 'href="/assets/lcars/fonts.css"')
    page = page.replace('src="vendor/', 'src="/assets/lcars/vendor/')
    page = page.replace('src="app.js"', 'src="/assets/lcars/app.js"')

    (OUT / "index.html").write_text(
        re.sub(r'href="(/work/)', 'href="/work/', page), encoding="utf-8")
    (OUT / "ru").mkdir(parents=True, exist_ok=True)
    (OUT / "ru" / "index.html").write_text(
        re.sub(r'href="(/work/)', 'href="/ru/work/', page), encoding="utf-8")

    print("LCARS preview site: %s" % OUT)
    print("  home  / and /ru/  (LCARS)")
    print("  case studies are the normal YAML-driven pages")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

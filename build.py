#!/usr/bin/env python3
"""Build the site.

The console is assembled by build/build.mjs: the slot table (content/home-table.json)
plus the frame and the page templates in src2/ become dist/.
The workflow calls this file, so the build stays one command.

Usage:
    python build.py
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def main() -> int:
    # dist/ is generated: start from an empty folder, or the files of the
    # previous build survive and the checks pass on stale output
    shutil.rmtree(ROOT / "dist", ignore_errors=True)

    result = subprocess.run(["node", "build/build.mjs"], cwd=ROOT)
    if result.returncode != 0:
        return result.returncode

    dist = ROOT / "dist"
    assets = dist / "assets"
    assets.mkdir(parents=True, exist_ok=True)

    # the CV files live in the content folder
    for name in ("cv-en.pdf", "cv-ru.pdf"):
        src = ROOT / "content" / "cv" / name
        if src.exists():
            shutil.copy2(src, assets / name)
        else:
            print(f"WARNING: missing {src}")

    pages = len(list(dist.rglob("*.html")))
    print(f"BUILD OK: {pages} pages in dist/")
    return 0


if __name__ == "__main__":
    sys.exit(main())

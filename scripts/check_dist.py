#!/usr/bin/env python3
"""Post-build checks for dist/: internal links, alt text, titles, sitemap.

Usage:
    python scripts/check_dist.py
"""

from __future__ import annotations

import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
FORBIDDEN = [
    "hermes-reform",
    "294682165",
    "NeuralForge",
    "DataRoot",
    "ITech",
    "parallel practice",
    "B1–B2",
    "B1-B2",
    "Продвинутый",
    "2018",
    "7 лет",
    "7 years",
    "+375",
]


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.lang = ""
        self.title = ""
        self.description = ""
        self.canonical = ""
        self.h1 = 0
        self.links: list[str] = []
        self.images: list[tuple[str, str]] = []
        self._in_title = False

    def handle_starttag(self, tag: str, attrs) -> None:
        a = dict(attrs)
        if tag == "html":
            self.lang = a.get("lang", "")
        elif tag == "title":
            self._in_title = True
        elif tag == "meta" and a.get("name") == "description":
            self.description = a.get("content", "")
        elif tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href", "")
        elif tag == "h1":
            self.h1 += 1
        elif tag == "a" and a.get("href"):
            self.links.append(a["href"])
        elif tag == "img":
            self.images.append((a.get("src", ""), a.get("alt", "")))

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data


def resolve_internal(page: Path, raw: str) -> Path | None:
    raw = raw.split("#", 1)[0].split("?", 1)[0]
    if not raw or raw.startswith(("mailto:", "http://", "https://", "data:", "tel:")):
        return None
    if raw.startswith("/"):
        target = DIST / raw.lstrip("/")
    else:
        target = page.parent / raw
    if raw.endswith("/") or target.is_dir():
        target = target / "index.html"
    return target


def main() -> int:
    if not DIST.exists():
        print("ERROR: dist/ does not exist; run build.py first")
        return 1

    errors: list[str] = []
    pages = sorted(DIST.rglob("*.html"))
    if not pages:
        errors.append("dist/: no HTML files")

    for page in pages:
        rel = page.relative_to(DIST)
        text = page.read_text(encoding="utf-8")
        parser = PageParser()
        parser.feed(text)

        if parser.lang not in ("en", "ru"):
            errors.append(f"{rel}: missing/unknown <html lang>")
        if not parser.title.strip():
            errors.append(f"{rel}: empty <title>")
        if not parser.description.strip():
            errors.append(f"{rel}: empty meta description")
        if not parser.canonical.strip():
            errors.append(f"{rel}: missing canonical")
        if parser.h1 != 1:
            errors.append(f"{rel}: expected exactly one <h1>, found {parser.h1}")

        for src, alt in parser.images:
            if not src:
                errors.append(f"{rel}: <img> without src")
            if not alt.strip():
                errors.append(f"{rel}: <img src={src!r}> without alt")

        for href in parser.links:
            target = resolve_internal(page, href)
            if target is not None and not target.exists():
                errors.append(f"{rel}: broken internal link {href!r} -> {target}")

        low = text.lower()
        for token in FORBIDDEN:
            if token.lower() in low:
                errors.append(f"{rel}: forbidden token {token!r}")

    sitemap = DIST / "sitemap.xml"
    if not sitemap.exists():
        errors.append("dist/sitemap.xml is missing")
    else:
        sm = sitemap.read_text(encoding="utf-8")
        for loc in [line.split("<loc>")[1].split("</loc>")[0] for line in sm.splitlines() if "<loc>" in line]:
            path = urlparse(loc).path
            target = DIST / path.lstrip("/")
            if path.endswith("/") or target.is_dir():
                target = target / "index.html"
            if not target.exists():
                errors.append(f"sitemap: {loc} has no file")

    for required in ["index.html", "ru/index.html", "404.html", "robots.txt", "_headers", "_redirects",
                     "assets/lcars/app.css", "assets/lcars/fonts.css",
                     "assets/lcars/app.js", "assets/lcars/vendor/gsap.min.js",
                     "assets/lcars/vendor/ScrollTrigger.min.js",
                     "assets/lcars/assets/linac.svg", "assets/lcars/assets/isodose.svg",
                     "assets/lcars/assets/mlc.svg", "assets/lcars/assets/wave.svg",
    "assets/cv-en.pdf", "assets/cv-ru.pdf"]:
        if not (DIST / required).exists():
            errors.append(f"dist/{required} is missing")

    if errors:
        print(f"DIST CHECK FAILED: {len(errors)} error(s)")
        for err in errors:
            print(f"  - {err}")
        return 1

    print(f"DIST CHECK OK: {len(pages)} pages, links/images/titles/sitemap verified")
    return 0


if __name__ == "__main__":
    sys.exit(main())

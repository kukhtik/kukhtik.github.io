#!/usr/bin/env python3
"""Build the static site from content/*.yaml into dist/.

Usage:
    python build.py

Content is the only thing an editor/agent should touch. Templates and CSS are
the design layer; the build never edits content.
"""

from __future__ import annotations

import re
import shutil
import struct
import sys
from datetime import date
from pathlib import Path

import yaml
from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).resolve().parent
CONTENT = ROOT / "content"
TEMPLATES = ROOT / "templates"
STATIC = ROOT / "static"
DIST = ROOT / "dist"
YEAR = 2026
LANGS = ("en", "ru")
ALLOWED_STATUS = {"public", "nda", "commercial", "rnd"}


def load_yaml(path: Path) -> dict:
    with path.open(encoding="utf-8") as fh:
        data = yaml.safe_load(fh)
    if not isinstance(data, dict):
        raise SystemExit(f"{path}: expected a mapping at the top level")
    return data


def L(value, lang: str) -> str:
    """Return a localized string from either a string or an {en, ru} mapping."""
    if isinstance(value, dict):
        return str(value.get(lang) or value.get("en") or "")
    return "" if value is None else str(value)


def image_size(path: Path) -> tuple[int | None, int | None]:
    """Intrinsic image size from the file header (PNG or WebP, no Pillow needed)."""
    try:
        with path.open("rb") as fh:
            head = fh.read(40)
    except OSError:
        return None, None
    if head[:8] == b"\x89PNG\r\n\x1a\n":
        width, height = struct.unpack(">II", head[16:24])
        return width, height
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        kind = head[12:16]
        if kind == b"VP8X":
            return (int.from_bytes(head[24:27], "little") + 1,
                    int.from_bytes(head[27:30], "little") + 1)
        if kind == b"VP8L":
            bits = int.from_bytes(head[21:25], "little")
            return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
        if kind == b"VP8 " and head[23:26] == b"\x9d\x01\x2a":
            return (int.from_bytes(head[26:28], "little") & 0x3FFF,
                    int.from_bytes(head[28:30], "little") & 0x3FFF)
    return None, None


def srcset_for(folder: Path, url: str) -> str:
    """Build a width-descriptor srcset from sibling `<stem>-<w>.webp` variants."""
    stem = Path(url).stem
    prefix = url.rsplit("/", 1)[0]
    found: list[tuple[int, str]] = []
    for w in (640, 800, 960, 1200, 1600):
        if (folder / f"{stem}-{w}.webp").exists():
            found.append((w, f"{prefix}/{stem}-{w}.webp"))
    if len(found) < 2:
        return ""
    found.sort()
    return ", ".join(f"{u} {w}w" for w, u in found)


def minify_css(css: str) -> str:
    """Strip comments and redundant whitespace. Sources stay readable; dist/ ships lean."""
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    css = re.sub(r"\s+", " ", css)
    css = re.sub(r"\s*([{};:,>])\s*", r"\1", css)
    css = re.sub(r";}", "}", css)
    return css.strip()


def metric_parts(value: str) -> tuple[str | None, str, str]:
    """Split a metric like "21,214" or "130 ms" into (number, suffix, fmt) for counters.

    Values with an arrow ("4 h -> 15 min") are semantic, not countable — they stay text.
    """
    text = str(value)
    match = re.match(r"^(\d{1,3}(?:[ \u00a0]\d{3})+|\d[\d,.]*)(.*)$", text)
    if not match:
        return None, text, ""
    head, tail = match.group(1), match.group(2)
    if "→" in tail or len(tail) > 8:
        return None, text, ""
    digits = re.sub(r"[\s,.]", "", head)
    if not digits.isdigit():
        return None, text, ""
    fmt = "int" if len(digits) > 3 else ""
    return digits, tail, fmt


def truncate(text: str, limit: int = 160) -> str:
    text = " ".join(str(text).split())
    if len(text) <= limit:
        return text
    cut = text[: limit - 1].rsplit(" ", 1)[0]
    return cut + "…"


def main() -> int:
    site = load_yaml(CONTENT / "site.yaml")
    ui = load_yaml(CONTENT / "ui.yaml")

    project_dirs = sorted(
        (p for p in (CONTENT / "projects").iterdir() if (p / "project.yaml").exists()),
        key=lambda p: p.name,
    )
    projects = []
    for pdir in project_dirs:
        project = load_yaml(pdir / "project.yaml")
        slug = project.get("slug") or pdir.name
        images = project.get("images") or []
        gallery = []
        img_dir = pdir / "images"
        for img in images:
            src = str(img.get("src", ""))
            name = Path(src).name
            width, height = image_size(pdir / src)
            url = f"/assets/projects/{slug}/{name}"
            gallery.append({**img, "url": url, "w": width or 1600, "h": height or 1000,
                            "srcset": srcset_for(img_dir, url)})
        project["slug"] = slug
        project["gallery_all"] = gallery
        project["cover"] = gallery[0]["url"] if gallery else "/assets/placeholder.svg"
        project["cover_srcset"] = gallery[0]["srcset"] if gallery else ""
        project["cover_w"] = gallery[0]["w"] if gallery else 1600
        project["cover_h"] = gallery[0]["h"] if gallery else 1000
        project["gallery"] = gallery[1:]
        project["url_en"] = f"/work/{slug}/"
        project["url_ru"] = f"/ru/work/{slug}/"
        projects.append(project)

    for project in projects:
        for result in project.get("results") or []:
            num, suffix, fmt = metric_parts(result.get("value", ""))
            result["num"] = num
            result["suffix"] = suffix
            result["fmt"] = fmt

    projects.sort(key=lambda p: (int(p.get("order", 999)), p["slug"]))
    projects = [p for p in projects if p.get("published", True)]
    if not projects:
        raise SystemExit("No published projects: set published: true on at least one project")
    featured = [p for p in projects if p.get("featured", True)]

    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES)),
        autoescape=select_autoescape(["html", "xml"]),
    )

    stack_all: list[str] = []
    for project in projects:
        for tech in project.get("stack") or []:
            if tech not in stack_all:
                stack_all.append(tech)
    stack_all = stack_all[:20]

    domain = str(site.get("domain", "")).rstrip("/")
    status_labels = site.get("status_labels", {})

    def status_label(status: str, lang: str) -> str:
        return L(status_labels.get(status, status), lang)

    def base_ctx(lang: str, other_url: str, **extra):
        other_lang = "ru" if lang == "en" else "en"
        other_home = "/ru/" if lang == "en" else "/"
        return {
            "site": site,
            "ui": ui,
            "lang": lang,
            "other_lang": other_lang,
            "other_url": other_url,
            "other_home_url": other_home,
            "other_lang_label": other_lang.upper(),
            "year": YEAR,
            "t": L,
            "status_label": status_label,
            **extra,
        }

    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True)

    # --- home pages -----------------------------------------------------
    # The home is the LCARS build: one static page that reads its locale from
    # the path, so / is the English build and /ru/ the Russian one.
    home_src = ROOT / "src" / "lcars-home.html"
    home_html = home_src.read_text(encoding="utf-8")
    for lang in LANGS:
        home_url = "/" if lang == "en" else "/ru/"
        out = DIST / ("index.html" if lang == "en" else "ru/index.html")
        out.parent.mkdir(parents=True, exist_ok=True)
        canonical = "https://kukhto.is-a.dev" + home_url
        page = home_html.replace('lang="en"', 'lang="%s"' % lang, 1)
        # the locale the page's own script reads on start, and absolute links
        page = re.sub(r'(<html[^>]*?)\blang="en"', r'\1lang="%s"' % lang, page, count=1)
        page = re.sub(r'(<html[^>]*?)\bdata-lang="en"', r'\1data-lang="%s"' % lang, page, count=1)
        page = re.sub(r'<a class="railblock__langbtn" id="lang-en"[^>]*>', '<a class="railblock__langbtn" id="lang-en" href="/" data-lang="en" hreflang="en">', page)
        page = re.sub(r'<a class="railblock__langbtn" id="lang-ru"[^>]*>', '<a class="railblock__langbtn" id="lang-ru" href="/ru/" data-lang="ru" hreflang="ru">', page)
        if "data-design-system" not in page:
            page = page.replace("<html", '<html data-design-system="lcars"', 1)
        page = page.replace("__CANONICAL__", canonical)
        out.write_text(page, encoding="utf-8")

    # --- project pages --------------------------------------------------
    for index, project in enumerate(projects):
        next_project = projects[(index + 1) % len(projects)]
        for lang in LANGS:
            home_url = "/" if lang == "en" else "/ru/"
            url = project["url_en"] if lang == "en" else project["url_ru"]
            canonical = domain + url
            ctx = base_ctx(
                lang,
                other_url=project["url_ru"] if lang == "en" else project["url_en"],
                home_url=home_url,
                canonical=canonical,
                alternate_en=domain + project["url_en"],
                alternate_ru=domain + project["url_ru"],
                seo_title=f"{L(project['title'], lang)} — {L(site['name'], lang)}",
                seo_description=truncate(L(project["summary"], lang)),
                og_image=project["cover"],
                project=project,
                next_project=next_project,
            )
            out = DIST / (url.lstrip("/") + "index.html")
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(env.get_template("project_lcars.html").render(**ctx), encoding="utf-8")

    # --- 404 ------------------------------------------------------------
    ctx = base_ctx(
        "en",
        other_url="/ru/",
        home_url="/",
        canonical=domain + "/404.html",
        alternate_en=domain + "/404.html",
        alternate_ru=domain + "/ru/",
        seo_title=f"404 — {L(site['name'], 'en')}",
        seo_description="Page not found.",
        og_image=featured[0]["cover"] if featured else "/assets/placeholder.svg",
    )
    (DIST / "404.html").write_text(env.get_template("404_lcars.html").render(**ctx), encoding="utf-8")

    # --- assets ---------------------------------------------------------
    shutil.copytree(STATIC, DIST / "assets")
    for css_file in (DIST / "assets").rglob("*.css"):
        css_file.write_text(minify_css(css_file.read_text(encoding="utf-8")), encoding="utf-8")
    cv_dir = CONTENT / "cv"
    if cv_dir.exists():
        for f in cv_dir.iterdir():
            if f.is_file():
                shutil.copy2(f, DIST / "assets" / f.name)

    for project in projects:
        src = CONTENT / "projects" / project["slug"] / "images"
        if src.exists():
            shutil.copytree(src, DIST / "assets" / "projects" / project["slug"])

    # --- sitemap / robots / headers ------------------------------------
    urls = [domain + "/", domain + "/ru/"]
    for project in projects:
        urls.append(domain + project["url_en"])
        urls.append(domain + project["url_ru"])
    today = date.today().isoformat()
    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for url in urls:
        sitemap.append(f"  <url><loc>{url}</loc><lastmod>{today}</lastmod></url>")
    sitemap.append("</urlset>")
    (DIST / "sitemap.xml").write_text("\n".join(sitemap) + "\n", encoding="utf-8")

    cname = ROOT / "CNAME"
    if cname.exists():
        shutil.copy2(cname, DIST / "CNAME")

    (DIST / "robots.txt").write_text(
        "User-agent: *\nAllow: /\nSitemap: " + domain + "/sitemap.xml\n",
        encoding="utf-8",
    )

    (DIST / "_headers").write_text(
        "/*\n"
        "  X-Content-Type-Options: nosniff\n"
        "  Referrer-Policy: strict-origin-when-cross-origin\n"
        "  Permissions-Policy: camera=(), microphone=(), geolocation=()\n"
        "  Content-Security-Policy: default-src 'self'; img-src 'self' data:; "
        "style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; "
        "base-uri 'self'; form-action 'self'\n"
        "\n"
        "/assets/*\n"
        "  Cache-Control: public, max-age=31536000, immutable\n",
        encoding="utf-8",
    )

    (DIST / "_redirects").write_text(
        "/cv /assets/cv-en.pdf 302\n"
        "/cv/ /assets/cv-en.pdf 302\n"
        "/ru/cv /assets/cv-ru.pdf 302\n"
        "/ru/cv/ /assets/cv-ru.pdf 302\n",
        encoding="utf-8",
    )

    print(f"Built {len(projects)} projects, {len(LANGS)} locales")
    print(f"  home:     /  and  /ru/")
    print(f"  projects: {', '.join(p['slug'] for p in projects)}")
    print(f"  dist:     {DIST}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

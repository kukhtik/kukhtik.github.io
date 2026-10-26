#!/usr/bin/env python3
"""Build the static site from content/*.yaml into dist/.

Usage:
    python build.py

Content is the only thing an editor/agent should touch. Templates and CSS are
the design layer; the build never edits content.
"""

from __future__ import annotations

import shutil
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
        for img in images:
            src = str(img.get("src", ""))
            name = Path(src).name
            gallery.append({**img, "url": f"/assets/projects/{slug}/{name}"})
        project["slug"] = slug
        project["gallery_all"] = gallery
        project["cover"] = gallery[0]["url"] if gallery else "/assets/placeholder.svg"
        project["gallery"] = gallery[1:]
        project["url_en"] = f"/work/{slug}/"
        project["url_ru"] = f"/ru/work/{slug}/"
        projects.append(project)

    projects.sort(key=lambda p: (int(p.get("order", 999)), p["slug"]))
    projects = [p for p in projects if p.get("published", True)]
    if not projects:
        raise SystemExit("No published projects: set published: true on at least one project")
    featured = [p for p in projects if p.get("featured", True)]

    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES)),
        autoescape=select_autoescape(["html", "xml"]),
    )

    domain = str(site.get("domain", "")).rstrip("/")
    status_labels = site.get("status_labels", {})

    def status_label(status: str, lang: str) -> str:
        return L(status_labels.get(status, status), lang)

    def base_ctx(lang: str, **extra):
        other_lang = "ru" if lang == "en" else "en"
        other_home = "/ru/" if lang == "en" else "/"
        return {
            "site": site,
            "ui": ui,
            "lang": lang,
            "other_lang": other_lang,
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
    for lang in LANGS:
        home_url = "/" if lang == "en" else "/ru/"
        canonical = domain + home_url
        ctx = base_ctx(
            lang,
            home_url=home_url,
            canonical=canonical,
            alternate_en=domain + "/",
            alternate_ru=domain + "/ru/",
            seo_title=L(site["seo"]["title"], lang),
            seo_description=L(site["seo"]["description"], lang),
            og_image=featured[0]["cover"] if featured else "/assets/placeholder.svg",
            projects=featured,
        )
        out = DIST / ("index.html" if lang == "en" else "ru/index.html")
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(env.get_template("home.html").render(**ctx), encoding="utf-8")

    # --- project pages --------------------------------------------------
    for project in projects:
        for lang in LANGS:
            home_url = "/" if lang == "en" else "/ru/"
            url = project["url_en"] if lang == "en" else project["url_ru"]
            canonical = domain + url
            ctx = base_ctx(
                lang,
                home_url=home_url,
                canonical=canonical,
                alternate_en=domain + project["url_en"],
                alternate_ru=domain + project["url_ru"],
                seo_title=f"{L(project['title'], lang)} — {L(site['name'], lang)}",
                seo_description=truncate(L(project["summary"], lang)),
                og_image=project["cover"],
                project=project,
            )
            out = DIST / (url.lstrip("/") + "index.html")
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(env.get_template("project.html").render(**ctx), encoding="utf-8")

    # --- 404 ------------------------------------------------------------
    ctx = base_ctx(
        "en",
        home_url="/",
        canonical=domain + "/404.html",
        alternate_en=domain + "/404.html",
        alternate_ru=domain + "/ru/",
        seo_title=f"404 — {L(site['name'], 'en')}",
        seo_description="Page not found.",
        og_image=featured[0]["cover"] if featured else "/assets/placeholder.svg",
    )
    (DIST / "404.html").write_text(env.get_template("404.html").render(**ctx), encoding="utf-8")

    # --- assets ---------------------------------------------------------
    shutil.copytree(STATIC, DIST / "assets")
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

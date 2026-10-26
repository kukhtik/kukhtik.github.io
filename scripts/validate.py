#!/usr/bin/env python3
"""Validate content before build. Exits non-zero on the first error set.

Usage:
    python scripts/validate.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
LANGS = ("en", "ru")
ALLOWED_STATUS = {"public", "nda", "commercial", "rnd"}

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

REQUIRED_UI = [
    "nav.label",
    "nav.lang_label",
    "nav.status",
    "nav.home",
    "nav.work",
    "nav.about",
    "nav.contact",
    "actions.skip",
    "actions.download_cv",
    "actions.email",
    "actions.github",
    "actions.linkedin",
    "actions.view_case",
    "actions.back_to_work",
    "actions.back_home",
    "actions.email_about",
    "sections.selected_work",
    "sections.selected_work_note",
    "sections.what_i_do",
    "sections.what_i_do_note",
    "sections.about",
    "sections.contact",
    "sections.contact_note",
    "sections.more",
    "sections.record",
    "sections.instrument_note",
    "sections.record_note",
    "sections.problem",
    "sections.approach",
    "sections.results",
    "sections.stack",
    "sections.links",
    "sections.gallery",
    "sections.confidentiality",
    "meta.role",
    "meta.year",
    "meta.status",
    "footer.rights",
    "footer.built",
    "not_found.title",
    "not_found.text",
]

REQUIRED_SITE = [
    "name",
    "role",
    "location",
    "timezone",
    "availability",
    "email",
    "github",
    "linkedin",
    "cv",
    "domain",
    "seo",
    "hero",
    "about",
    "facts",
    "services",
    "status_labels",
]


def load_yaml(path: Path) -> dict:
    with path.open(encoding="utf-8") as fh:
        data = yaml.safe_load(fh)
    if not isinstance(data, dict):
        raise ValueError(f"{path}: expected a mapping")
    return data


def get_path(obj, dotted: str):
    cur = obj
    for part in dotted.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return None
        cur = cur[part]
    return cur


def check_localized(value, where: str, errors: list[str]) -> None:
    if isinstance(value, dict) and ("en" in value or "ru" in value):
        for lang in LANGS:
            v = value.get(lang)
            if v is None or (isinstance(v, str) and not v.strip()) or (isinstance(v, list) and not v):
                errors.append(f"{where}: missing or empty '{lang}'")
    elif isinstance(value, dict):
        for key, child in value.items():
            check_localized(child, f"{where}.{key}", errors)
    elif isinstance(value, list):
        for i, child in enumerate(value):
            check_localized(child, f"{where}[{i}]", errors)


def check_string_list(value, where: str, errors: list[str]) -> None:
    if not isinstance(value, list) or not value:
        errors.append(f"{where}: expected a non-empty list")
        return
    for i, item in enumerate(value):
        if not isinstance(item, str) or not item.strip():
            errors.append(f"{where}[{i}]: expected a non-empty string")


def main() -> int:
    errors: list[str] = []

    site_path = CONTENT / "site.yaml"
    ui_path = CONTENT / "ui.yaml"
    if not site_path.exists():
        print(f"ERROR: missing {site_path}")
        return 1
    if not ui_path.exists():
        print(f"ERROR: missing {ui_path}")
        return 1

    site = load_yaml(site_path)
    ui = load_yaml(ui_path)

    for key in REQUIRED_SITE:
        if key not in site:
            errors.append(f"site.yaml: missing '{key}'")

    check_localized(site, "site", errors)

    for key in REQUIRED_UI:
        value = get_path(ui, key)
        if not isinstance(value, dict):
            errors.append(f"ui.yaml: missing '{key}'")
        else:
            for lang in LANGS:
                if not str(value.get(lang, "")).strip():
                    errors.append(f"ui.yaml: '{key}' has no '{lang}'")

    # CV files
    for lang in LANGS:
        cv_rel = get_path(site, f"cv.{lang}")
        if not cv_rel:
            errors.append(f"site.yaml: cv.{lang} is missing")
        else:
            cv_path = CONTENT / "cv" / Path(str(cv_rel)).name
            if not cv_path.exists():
                errors.append(f"site.yaml: cv.{lang} points to missing file {cv_path}")

    # Domain
    domain = str(site.get("domain", ""))
    if not domain.startswith("https://"):
        errors.append("site.yaml: domain must start with https://")

    # Projects
    projects_dir = CONTENT / "projects"
    if not projects_dir.exists():
        errors.append("content/projects: directory is missing")
        project_dirs = []
    else:
        project_dirs = sorted(p for p in projects_dir.iterdir() if (p / "project.yaml").exists())

    if not project_dirs:
        errors.append("content/projects: no project.yaml found")

    slugs: set[str] = set()
    orders: set[int] = set()
    featured_count = 0
    published_count = 0

    for pdir in project_dirs:
        try:
            p = load_yaml(pdir / "project.yaml")
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{pdir}/project.yaml: {exc}")
            continue

        where = f"project[{pdir.name}]"
        required = [
            "slug",
            "order",
            "featured",
            "status",
            "year",
            "title",
            "summary",
            "problem",
            "approach",
            "results",
            "stack",
            "confidentiality",
            "links",
            "images",
        ]
        for key in required:
            if key not in p:
                errors.append(f"{where}: missing '{key}'")

        slug = str(p.get("slug", ""))
        if slug != pdir.name:
            errors.append(f"{where}: slug '{slug}' does not match folder name")
        if slug in slugs:
            errors.append(f"{where}: duplicate slug '{slug}'")
        slugs.add(slug)

        try:
            order = int(p.get("order"))
            if order in orders:
                errors.append(f"{where}: duplicate order {order}")
            orders.add(order)
        except (TypeError, ValueError):
            errors.append(f"{where}: order must be an integer")

        status = str(p.get("status", ""))
        if status not in ALLOWED_STATUS:
            errors.append(f"{where}: status '{status}' not in {sorted(ALLOWED_STATUS)}")

        published = p.get("published", True)
        if not isinstance(published, bool):
            errors.append(f"{where}: published must be true/false")
            published = True
        elif published:
            published_count += 1

        if not isinstance(p.get("featured"), bool):
            errors.append(f"{where}: featured must be true/false")
        elif p["featured"] and published:
            featured_count += 1

        if not str(p.get("year", "")).strip():
            errors.append(f"{where}: year is empty")

        check_localized(p.get("title"), f"{where}.title", errors)
        check_localized(p.get("summary"), f"{where}.summary", errors)
        check_localized(p.get("problem"), f"{where}.problem", errors)
        check_localized(p.get("confidentiality"), f"{where}.confidentiality", errors)

        approach = p.get("approach")
        if not isinstance(approach, dict):
            errors.append(f"{where}.approach: expected a mapping with en/ru")
        else:
            for lang in LANGS:
                check_string_list(approach.get(lang), f"{where}.approach.{lang}", errors)

        results = p.get("results")
        if not isinstance(results, list) or not results:
            errors.append(f"{where}.results: expected a non-empty list")
        else:
            for i, r in enumerate(results):
                if not isinstance(r, dict):
                    errors.append(f"{where}.results[{i}]: expected a mapping")
                    continue
                if not str(r.get("value", "")).strip():
                    errors.append(f"{where}.results[{i}].value: empty")
                check_localized(r.get("label"), f"{where}.results[{i}].label", errors)

        stack = p.get("stack")
        check_string_list(stack, f"{where}.stack", errors)

        links = p.get("links")
        if not isinstance(links, list) or not links:
            errors.append(f"{where}.links: expected a non-empty list")
        else:
            for i, link in enumerate(links):
                if not isinstance(link, dict):
                    errors.append(f"{where}.links[{i}]: expected a mapping")
                    continue
                check_localized(link.get("label"), f"{where}.links[{i}].label", errors)
                url = str(link.get("url", ""))
                if not re.match(r"^(https?://|mailto:)", url):
                    errors.append(f"{where}.links[{i}].url: must start with http(s):// or mailto:")

        images = p.get("images")
        if not isinstance(images, list) or not images:
            errors.append(f"{where}.images: expected at least one image")
        else:
            for i, img in enumerate(images):
                if not isinstance(img, dict):
                    errors.append(f"{where}.images[{i}]: expected a mapping")
                    continue
                src = str(img.get("src", ""))
                if not src:
                    errors.append(f"{where}.images[{i}].src: empty")
                    continue
                img_path = pdir / src
                if not img_path.exists():
                    errors.append(f"{where}.images[{i}]: missing file {img_path}")
                check_localized(img.get("alt"), f"{where}.images[{i}].alt", errors)
                check_localized(img.get("caption"), f"{where}.images[{i}].caption", errors)

    if featured_count == 0:
        errors.append("content/projects: no published project has featured: true")

    if published_count == 0:
        errors.append("content/projects: no published project (set published: true on at least one)")

    # Forbidden claims / stale values across all content
    for path in sorted(CONTENT.rglob("*.yaml")):
        text = path.read_text(encoding="utf-8")
        low = text.lower()
        for token in FORBIDDEN:
            if token.lower() in low:
                errors.append(f"{path}: forbidden token {token!r}")

    if errors:
        print(f"VALIDATION FAILED: {len(errors)} error(s)")
        for err in errors:
            print(f"  - {err}")
        return 1

    print(f"VALIDATION OK: {len(project_dirs)} projects, {len(REQUIRED_UI)} UI labels")
    return 0


if __name__ == "__main__":
    sys.exit(main())

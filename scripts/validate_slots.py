#!/usr/bin/env python3
"""Validate the slot table before the build.

The table (content/home-table.json) is the content contract of the console:
every entry carries both languages, every string stays inside the limit
declared next to it (limit_title, limit_text, limit_summary, ...), and no
forbidden claim sneaks in.

Usage:
    python scripts/validate_slots.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TABLE = ROOT / "content" / "home-table.json"

FORBIDDEN = [
    "hermes-reform", "294682165", "NeuralForge", "DataRoot", "ITech",
    "parallel practice", "B1-B2", "\u041f\u0440\u043e\u0434\u0432\u0438\u043d\u0443\u0442\u044b\u0439",
    "2018", "7 \u043b\u0435\u0442", "7 years", "+375",
]

# field -> the limit key that carries its maximum length
FIELD_LIMIT = {
    "title": ("limit_title", 60),
    "text": ("limit_text", 240),
    "summary": ("limit_summary", 240),
    "problem": ("limit_problem", 420),
    "approach": ("limit_approach", 640),
    "label": ("limit", 120),
    "value": ("limit", 120),
    "subtitle": ("limit_summary", 120),
}


def check_localized(value, where: str, errors: list[str]) -> None:
    if isinstance(value, dict):
        if "en" in value or "ru" in value:
            for lang in ("en", "ru"):
                text = value.get(lang)
                if text is None or (isinstance(text, str) and not text.strip()):
                    errors.append(f"{where}: missing or empty '{lang}'")
            return
        for key, child in value.items():
            check_localized(child, f"{where}.{key}", errors)
    elif isinstance(value, list):
        for i, child in enumerate(value):
            check_localized(child, f"{where}[{i}]", errors)


def check_limits(entry: dict, where: str, errors: list[str]) -> None:
    for field, (limit_key, default) in FIELD_LIMIT.items():
        value = entry.get(field)
        if value is None:
            continue
        limit = entry.get(limit_key, default)
        if isinstance(value, dict):
            for lang, text in value.items():
                if isinstance(text, str) and len(text) > limit:
                    errors.append(f"{where}.{field}.{lang}: {len(text)} chars > {limit}")
        elif isinstance(value, str) and len(value) > limit:
            errors.append(f"{where}.{field}: {len(value)} chars > {limit}")


def main() -> int:
    if not TABLE.exists():
        print(f"ERROR: {TABLE} is missing")
        return 1

    raw = TABLE.read_text(encoding="utf-8")
    table = json.loads(raw)
    errors: list[str] = []

    slots = table.get("slots", {})
    for group, entries in slots.items():
        if not isinstance(entries, list):
            continue
        for entry in entries:
            if not isinstance(entry, dict) or "id" not in entry:
                errors.append(f"{group}: an entry without an id")
                continue
            where = entry["id"]
            check_localized(entry, where, errors)
            check_limits(entry, where, errors)

            for shot in entry.get("images", []) or []:
                for key in ("src", "thumb", "alt"):
                    if not str(shot.get(key, "")).strip():
                        errors.append(f"{where}: an image without '{key}'")
                src = str(shot.get("src", ""))
                if src.startswith("/assets/media-full/"):
                    local = ROOT / "src" / src.replace("/assets/", "")
                    if not local.exists():
                        errors.append(f"{where}: missing image file {local}")

    projects = slots.get("mid.projects", [])
    if len(projects) != 14:
        errors.append(f"mid.projects: expected 14 cases, found {len(projects)}")

    for project in projects:
        pid = project.get("id", "?")
        if not project.get("results"):
            errors.append(f"{pid}: no measured results")
        for metric in project.get("results", []) or []:
            value = str(metric.get("value", ""))
            label = metric.get("label", {})
            if not value.strip():
                errors.append(f"{pid}: a result without a value")
            limit_value = project.get("limit_metric_value", 14)
            limit_label = project.get("limit_metric_label", 30)
            if len(value) > limit_value:
                errors.append(f"{pid}: metric value {value!r} > {limit_value}")
            if isinstance(label, dict):
                for lang, text in label.items():
                    if len(str(text)) > limit_label:
                        errors.append(f"{pid}: metric label {lang} {len(str(text))} > {limit_label}")
        if not project.get("links"):
            errors.append(f"{pid}: no source link")
        if not project.get("images") and project.get("public_visuals") is not False:
            errors.append(f"{pid}: no screenshots")

    low = raw.lower()
    for token in FORBIDDEN:
        if token.lower() in low:
            errors.append(f"forbidden token {token!r} in the slot table")

    if errors:
        print(f"SLOT VALIDATION FAILED: {len(errors)} error(s)")
        for err in errors:
            print(f"  - {err}")
        return 1

    print(f"SLOT VALIDATION OK: {len(slots)} groups, {len(projects)} cases")
    return 0


if __name__ == "__main__":
    sys.exit(main())

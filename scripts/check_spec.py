#!/usr/bin/env python3
"""Check that the CSS still agrees with the design code documents.

docs/lcars-code-design/lcars-spec.json is the machine-readable form of the
design code. This gate reads the tokens from it and looks for them in the
stylesheets, so the code and the documents cannot drift apart.

Usage:
    python scripts/check_spec.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SPEC = ROOT / "docs" / "lcars-code-design" / "lcars-spec.json"
CSS = [ROOT / "src2" / "console.css", ROOT / "src2" / "lcars.css"]


def main() -> int:
    if not SPEC.exists():
        print(f"ERROR: {SPEC} is missing")
        return 1
    spec = json.loads(SPEC.read_text(encoding="utf-8"))
    tokens = spec["tokens"]
    fails: list[str] = []

    css = "\n".join(p.read_text(encoding="utf-8") for p in CSS if p.exists())
    for group, values in tokens.items():
        for name, value in values.items():
            if isinstance(value, str) and value.startswith("#") and value.lower() not in css.lower():
                fails.append(f"the token {group}.{name} ({value}) is not in the stylesheets")

    for role, definition in spec["roles"].items():
        selector = definition.get("selector")
        if not selector:
            continue
        # every class of the selector must exist in the stylesheets
        for name in re.findall(r"\.([A-Za-z][\w-]*)", selector):
            if name.endswith("-N"):
                continue          # a pattern, not a class
            if f".{name}" not in css:
                fails.append(f"the role {role} has no rule for .{name}")

    for component in spec["components"]:
        marker = component["markup"].split(">")[0].strip().strip("<")
        if marker and marker not in css and marker.split()[0] not in css:
            fails.append(f"the component {component['id']} is not in the stylesheets ({marker})")

    if fails:
        print(f"SPEC DRIFT: {len(fails)} problem(s)")
        for fail in fails:
            print(f"  - {fail}")
        return 1
    print(f"SPEC OK: {len(tokens)} token groups, {len(spec['roles'])} roles, {len(spec['components'])} components")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Check the console frame against the measured LCARS rules.

The rules are in docs/lcars-code-design/reference/measured-rules.json.
What this gate proves, on the running page:

  * the nav is a row of cells of equal height with 8 px gutters
  * the readout field is the template's 24 x 7 grid, with no empty cell
  * the spine has one block per section, and NO block carries an inline
    height - the template's geometry owns that, and an inline height is
    what broke the frame three times
  * the frame edge is 31 px
  * one h1, and no sideways scroll
"""

from __future__ import annotations

import sys
from playwright.sync_api import sync_playwright

GUTTER = 8
CELL = 40
ELBOW = 20
EDGE = 31
COLUMNS = 24


def main() -> int:
    url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8765/"
    fails: list[str] = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            executable_path=r"C:\Users\Nitro\AppData\Local\ms-playwright\chromium-1243\chrome-win64\chrome.exe"
        )
        page = browser.new_context(viewport={"width": 1440, "height": 900}).new_page()
        errors: list[str] = []
        page.on("pageerror", lambda e: errors.append(str(e)[:90]))
        page.goto(url, wait_until="load", timeout=45000)
        page.wait_for_timeout(2200)
        data = page.evaluate(
            """() => {
          const R = e => { const b = e.getBoundingClientRect();
            return {x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height)}; };
          const nav = [...document.querySelectorAll('.console__nav a')].map(R);
          const panels = [...document.querySelectorAll('.spine [data-target]')].map(e => ({
            r: R(e), inline: e.getAttribute('style') || '', target: e.getAttribute('data-target'),
            radius: getComputedStyle(e).borderRadius }));
          const sections = [...document.querySelectorAll('main .lcars-text-bar[id]')].map(e => e.id);
          const cells = [...document.querySelectorAll('.data-cascade-wrapper .data-column > div')];
          const cols = document.querySelectorAll('.data-cascade-wrapper .data-column').length;
          const rows = document.querySelector('.data-cascade-wrapper .data-column')?.children.length ?? 0;
          const empty = cells.filter(e => !e.textContent.trim() && !e.hasAttribute('data-live')).length;
          const edge = R(document.querySelector('.console__edge'));
          const title = document.querySelector('.console__title');
          return {nav, panels, sections, cols, rows, empty, edge, h1: document.querySelectorAll('h1').length,
                  titleTag: title ? title.tagName : null,
                  over: document.documentElement.scrollWidth > 1440};
        }"""
        )
        browser.close()

    # the nav: equal cells, 8 px gutters
    heights = {n["h"] for n in data["nav"]}
    if len(heights) > 1:
        fails.append(f"the nav cells have different heights: {sorted(heights)}")
    elif heights and heights.pop() != CELL:
        fails.append(f"a nav cell is {list(heights)[0]}px thick, not {CELL}")
    for a, b in zip(data["nav"], data["nav"][1:]):
        gap = b["x"] - (a["x"] + a["w"])
        if not (GUTTER - 1 <= gap <= GUTTER + 1):
            fails.append(f"the gutter between two nav cells is {gap}px, not {GUTTER}")

    # the readout field
    if data["cols"] != COLUMNS:
        fails.append(f"the readout field has {data['cols']} columns, not {COLUMNS}")
    if data["rows"] != 7:
        fails.append(f"the readout field has {data['rows']} rows, not 7")
    if data["empty"]:
        fails.append(f"{data['empty']} empty cells in the readout field")

    # the spine: one block per section, and no inline geometry
    if len(data["panels"]) != len(data["sections"]):
        fails.append(f"{len(data['panels'])} spine blocks for {len(data['sections'])} sections")
    for panel in data["panels"]:
        if "height" in panel["inline"] or "width" in panel["inline"]:
            fails.append(f"a spine block carries an inline size: {panel['inline']}")
        rounded = [p for p in panel["radius"].split() if p != "0px"]
        if len(rounded) > 2:
            fails.append(f"a spine block has {len(rounded)} rounded corners: {panel['radius']}")

    # the edge
    if data["edge"] and data["edge"]["w"] != EDGE:
        fails.append(f"the frame edge is {data['edge']['w']}px, not {EDGE}")

    # the page
    if data["h1"] != 1:
        fails.append(f"the page has {data['h1']} h1 elements, not 1")
    if data["titleTag"] != "H1":
        fails.append(f"the frame title is a {data['titleTag']}, not an H1")
    if data["over"]:
        fails.append("the page scrolls sideways")
    if errors:
        fails.append(f"page errors: {errors[:3]}")

    if fails:
        print(f"FRAME RULES FAILED: {len(fails)} problem(s)")
        for fail in fails:
            print(f"  - {fail}")
        return 1
    print(f"FRAME RULES OK: nav {CELL}px/{GUTTER}px, field {COLUMNS}x7, spine {len(data['panels'])} blocks, edge {EDGE}px")
    return 0


if __name__ == "__main__":
    sys.exit(main())

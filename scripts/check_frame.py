#!/usr/bin/env python3
"""Check the console frame against the measured LCARS rules.

The rules were measured in pixels from the canonical lcarsde desktop
screenshots:

  * every block is separated from the next by an 8 px black gutter
  * a cell is 40 px thick
  * a cell has ONE rounded end, with a radius of about half its thickness
  * the frame edge is a strip of 31 px segments

Usage:
    python scripts/check_frame.py <url>
"""

from __future__ import annotations

import sys
from playwright.sync_api import sync_playwright

GUTTER = 8
CELL = 40
ELBOW = 20


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
          const cells = [...document.querySelectorAll('.cell')];
          const status = [...document.querySelectorAll('.status > *')].map(R);
          const menu = [...document.querySelectorAll('.menu > *')].map(R);
          const radii = [...new Set(cells.map(c => getComputedStyle(c).borderRadius))];
          const heights = [...new Set(cells.map(c => R(c).h))];
          return {status, menu, radii, heights,
                  edge: R(document.querySelector('.edge')),
                  over: document.documentElement.scrollWidth > 1440,
                  h1: document.querySelectorAll('h1').length,
                  errors: []};
        }"""
        )
        browser.close()

    # the gutters between the neighbours of the status bar
    status = data["status"]
    for a, b in zip(status, status[1:]):
        gap = b["x"] - (a["x"] + a["w"])
        if not (GUTTER - 1 <= gap <= GUTTER + 1):
            fails.append(f"the gutter between two status cells is {gap}px, not {GUTTER}")
    # the menu: the cells are 40 px, the gaps are 8
    menu = data["menu"]
    for cell in menu[:-1]:
        if abs(cell["h"] - CELL) > 1:
            fails.append(f"a menu cell is {cell['h']}px thick, not {CELL}")
    for a, b in zip(menu, menu[1:]):
        gap = b["y"] - (a["y"] + a["h"])
        if not (GUTTER - 1 <= gap <= GUTTER + 1):
            fails.append(f"the gutter between two menu cells is {gap}px, not {GUTTER}")
    # one rounded end, radius = half the thickness
    for radius in data["radii"]:
        parts = radius.split()
        rounded = [p for p in parts if p != "0px"]
        if len(rounded) > 2:
            fails.append(f"a cell has {len(rounded)} rounded corners: {radius}")
        if rounded and rounded[0] not in (f"{ELBOW}px", f"{ELBOW - 1}px"):
            fails.append(f"the elbow radius is {rounded[0]}, not {ELBOW}px")
    if data["edge"] and data["edge"]["w"] != 31:
        fails.append(f"the frame edge is {data['edge']['w']}px, not 31")
    if data["over"]:
        fails.append("the page scrolls sideways")
    if data["h1"] != 1:
        fails.append(f"the page has {data['h1']} h1 elements, not 1")
    if errors:
        fails.append(f"page errors: {errors[:3]}")

    if fails:
        print(f"FRAME RULES FAILED: {len(fails)} problem(s)")
        for fail in fails:
            print(f"  - {fail}")
        return 1
    print(f"FRAME RULES OK: gutters {GUTTER}px, cells {CELL}px, elbow {ELBOW}px, edge 31px")
    return 0


if __name__ == "__main__":
    sys.exit(main())

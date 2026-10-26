#!/usr/bin/env python3
"""Render the built site in Chromium and record measured numbers.

Usage:
    python scripts/shoot.py [--base URL] [--out DIR]

For every page in PAGES and every viewport in VIEWPORTS it writes a full-page
screenshot plus a measured row: page weight (transferred bytes), CSS/JS bytes,
DOM size, horizontal overflow at 360px, images without alt, h1 count,
first-contentful-paint style timings.

Exit code 1 if a hard check fails (h-scroll at 360px, missing alt, h1 != 1).
Requires: playwright (system Python 3.12), chromium installed.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

PAGES = [
    ("/", "home-en"),
    ("/ru/", "home-ru"),
    ("/work/engineer-companion/", "case-en"),
    ("/ru/work/engineer-companion/", "case-ru"),
]
VIEWPORTS = [("desktop", 1280, 900), ("mobile", 390, 844)]
NARROW = 360

MEASURE = """
() => {
  const nav = performance.getEntriesByType('navigation')[0] || {};
  const res = performance.getEntriesByType('resource');
  const transfer = res.reduce((s, r) => s + (r.transferSize || 0), 0) + (nav.transferSize || 0);
  const css = res.filter(r => r.name.endsWith('.css')).reduce((s, r) => s + (r.encodedBodySize || 0), 0);
  const js = res.filter(r => r.name.endsWith('.js')).reduce((s, r) => s + (r.encodedBodySize || 0), 0);
  const imgs = [...document.images];
  return {
    transferred: transfer,
    cssBytes: css,
    jsBytes: js,
    domNodes: document.getElementsByTagName('*').length,
    images: imgs.length,
    imagesWithoutAlt: imgs.filter(i => !i.getAttribute('alt')).length,
    imagesWithDimensions: imgs.filter(i => i.getAttribute('width') && i.getAttribute('height')).length,
    h1: document.querySelectorAll('h1').length,
    h2: document.querySelectorAll('h2').length,
    docWidth: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
    load: Math.round(nav.loadEventEnd || 0),
    lang: document.documentElement.lang,
    title: document.title,
  };
}
"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://127.0.0.1:8000")
    ap.add_argument("--out", default=str(Path(__file__).resolve().parent.parent / "out"))
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    rows = []
    failures = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for vp_name, width, height in VIEWPORTS:
            ctx = browser.new_context(viewport={"width": width, "height": height},
                                      is_mobile=vp_name == "mobile", has_touch=vp_name == "mobile",
                                      reduced_motion="reduce")
            page = ctx.new_page()
            for path, slug in PAGES:
                url = args.base.rstrip("/") + path
                page.goto(url, wait_until="load")
                # scroll the whole page so lazy images load and reveal animations fire,
                # then return to the top before capturing
                page.evaluate("""async () => {
                    const step = Math.round(window.innerHeight * 0.8);
                    for (let y = 0; y < document.body.scrollHeight; y += step) {
                        window.scrollTo(0, y);
                        await new Promise(r => setTimeout(r, 90));
                    }
                    window.scrollTo(0, 0);
                    await new Promise(r => setTimeout(r, 250));
                    await Promise.all([...document.images]
                        .filter(i => !i.complete)
                        .map(i => new Promise(r => { i.addEventListener('load', r, {once:true});
                                                     i.addEventListener('error', r, {once:true}); })));
                }""")
                page.wait_for_timeout(350)
                shot = out / f"{slug}-{vp_name}.png"
                for attempt in range(3):
                    try:
                        page.screenshot(path=str(shot), full_page=True, timeout=30_000)
                        break
                    except Exception:
                        if attempt == 2:
                            failures.append(f"{path} [{vp_name}]: screenshot failed")
                        page.wait_for_timeout(500)
                m = page.evaluate(MEASURE)
                m.update({"page": path, "viewport": vp_name, "width": width})
                rows.append(m)
                if m["imagesWithoutAlt"]:
                    failures.append(f"{path} [{vp_name}]: {m['imagesWithoutAlt']} img without alt")
                if m["h1"] != 1:
                    failures.append(f"{path} [{vp_name}]: {m['h1']} h1")
            # narrow-width overflow probe
            page.set_viewport_size({"width": NARROW, "height": 800})
            for path, slug in PAGES:
                page.goto(args.base.rstrip("/") + path, wait_until="load")
                page.wait_for_timeout(200)
                overflow = page.evaluate(
                    "() => [document.documentElement.scrollWidth, window.innerWidth]")
                if overflow[0] > overflow[1] + 1:
                    failures.append(f"{path} [{NARROW}px]: horizontal overflow "
                                    f"{overflow[0]} > {overflow[1]}")
            ctx.close()
        browser.close()

    (out / "report.json").write_text(json.dumps({"rows": rows, "failures": failures}, indent=2),
                                    encoding="utf-8")

    print(f"{'page':28s} {'vp':8s} {'weight':>8s} {'css':>7s} {'js':>6s} {'dom':>5s} "
          f"{'img':>4s} {'noalt':>5s} {'h1':>3s} {'dcl':>5s} {'load':>5s}")
    for m in rows:
        print(f"{m['page']:28s} {m['viewport']:8s} {m['transferred']/1024:7.1f}K "
              f"{m['cssBytes']/1024:6.1f}K {m['jsBytes']/1024:5.1f}K {m['domNodes']:5d} "
              f"{m['images']:4d} {m['imagesWithoutAlt']:5d} {m['h1']:3d} "
              f"{m['domContentLoaded']:5d} {m['load']:5d}")
    print(f"\nscreenshots: {out}")
    if failures:
        print(f"\nFAILURES ({len(failures)}):")
        for f in failures:
            print("  -", f)
        return 1
    print("RENDER OK: no overflow at 360px, alt text and h1 verified")
    return 0


if __name__ == "__main__":
    sys.exit(main())

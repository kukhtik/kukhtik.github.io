#!/usr/bin/env python3
"""Measure the anti-AI densities of a single lab page and compare to the limits.

Same probe and same limits as scripts/check_ai_lint.py, but scoped to one page, so a
variant fragment can be measured BEFORE it is promoted into the site.

Usage:
    python scripts/check_fragment.py --page lab/lab-preview.html --port 8150
    python scripts/check_fragment.py --page lab/lab-preview.html --json
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CHROMIUM = r"C:\Users\Nitro\AppData\Local\ms-playwright\chromium-1243\chrome-win64\chrome.exe"

# Limits are NOT invented. Each is the maximum observed across 13 real
# human-made reference sites (figma.com, awwwards.com x2, godly.website,
# onepagelove.com, comfy.org, docs.comfy.org, github/comfyanonymous/ComfyUI,
# jvns.ca, simonwillison.net, danluu.com, apenwarr.ca, land-book.com),
# re-measured 27.10.2026 with this same probe:
#   UPP 114.0 | mono+UPP 15.2 | trackEm 1.5 | trackPx 1.5 | litCaps 21.5
#   litCaps+mono 4.6 | glow 102.7 | blur 69.2 | pill 113.6 | tiny 11.6%
# Two corrections were made to the measurement itself, because the first
# version was wrong in both directions:
#   - tracking is measured in em (relative to type size): .035em on a 44px
#     heading is 1.5px and perfectly normal; .16em on a 12px label is a tell.
#   - a 1-3 letter all-caps token is an ACRONYM (PDF, CV, DXF, RAG) and is not
#     counted; and a PANEL LEGEND (a deliberately governed 13px condensed
#     label) is excluded, because the tell is caps applied to CONTENT.
# A portfolio must still be stricter than a gallery, so the decorative metrics
# (glow, blur, pill) sit below the gallery values.

LIMITS = {
    "upp":       ("UPPERCASE", 120),
    "monoUpper": ("mono+UPPERCASE", 20),
    "trackEm":   ("разрядка >= 0.08em", 5),
    "trackPx":   ("разрядка >= 1.2px", 20),
    "glow":      ("свечение (box-shadow)", 40),
    "blur":      ("размытие (backdrop-filter)", 20),
    "pill":      ("пилюли (radius >= 100px)", 40),
    "litCaps":   ("литеральный CAPS", 30),
    "litCapsMono": ("CAPS + моно", 8),
}
TINY_MAX_PCT = 6.0
HIDDEN_MAX = 12

PROBE = r"""() => {
  const els=[...document.querySelectorAll('*')].slice(0,5000);
  let glow=0,blur=0,grad=0,upp=0,mono=0,monoUpper=0,pill=0,trackEm=0,trackPx=0,hidden=0,hiddenT=0,tiny=0;
  let litCaps=0,litCapsMono=0;
  for(const e of els){
    const s=getComputedStyle(e);
    if(s.boxShadow && s.boxShadow!=='none') glow++;
    if(s.backdropFilter && s.backdropFilter!=='none') blur++;
    if(/gradient/.test(s.backgroundImage)) grad++;
    const isUp=s.textTransform==='uppercase'; if(isUp) upp++;
    const isMono=/mono/i.test(s.fontFamily); if(isMono){mono++; if(isUp) monoUpper++;}
    if(parseFloat(s.borderRadius)>=100) pill++;
    const fs=parseFloat(s.fontSize)||16;
    const ls=parseFloat(s.letterSpacing)||0;
    if(ls>=1.2) trackPx++;
    // tracking relative to type size: .035em on a 44px heading is 1.5px and normal;
    // .16em on a 12px label is a tell. Only the ratio catches the second.
    if(ls/fs>=0.08) trackEm++;
    if(s.opacity==='0' && s.transform!=='none'){hidden++; if(/translate/.test(s.transform)) hiddenT++;}
    if(fs<=11) tiny++;
    if(!e.children.length){
      const t=(e.textContent||'').trim(); if(t.length>=3){
        const L=t.replace(/[^A-Za-zА-Яа-яЁё]/g,'');
        // 4+ letters: a 1-3 letter caps token is an ACRONYM (PDF, CV, DXF, RAG)
        if(L.length>=4){
          const up=(L.match(/[A-ZА-ЯЁ]/g)||[]).length;
          if(up/L.length>0.85){
            // SEMANTIC EXCLUSION (no class names, so it cannot be gamed by renaming):
            // uppercase set in the CONDENSED PANEL FACE is an instrument label -
            // exactly how a real control panel is lettered, and the references carry
            // them too. Uppercase in a normal sans, or in monospace, is the AI tell.
            const isPanelFace = /narrow|condensed/i.test(s.fontFamily) && !isMono;
            if(!isPanelFace){ litCaps++; if(isMono) litCapsMono++; }
          }
        }
      }
    }
  }
  return {glow,blur,grad,upp,mono,monoUpper,pill,trackEm,trackPx,hidden,hiddenT,tiny,litCaps,litCapsMono,total:els.length};
}"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--page", required=True, help="path under the served root, e.g. lab/lab-preview.html")
    ap.add_argument("--root", default="dist", help="directory to serve (default: dist)")
    ap.add_argument("--port", type=int, default=8150)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    for entry in list(sys.path):
        if "hermes\\installs" in entry or "hermes\\hermes-agent" in entry:
            sys.path.remove(entry)
    os.environ.pop("PYTHONPATH", None)
    from playwright.sync_api import sync_playwright

    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(args.port), "--directory", str(ROOT / args.root)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.6)
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(executable_path=CHROMIUM)
            ctx = b.new_context(viewport={"width": 1440, "height": 1000})
            page = ctx.new_page()
            errors = []
            page.on("console", lambda m: errors.append(f"{m.type}: {m.text}") if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
            page.goto(f"http://127.0.0.1:{args.port}/{args.page.lstrip('/')}", wait_until="load")
            page.wait_for_timeout(2200)
            page.evaluate("window.scrollTo(0, 600)")
            page.wait_for_timeout(1200)
            p = page.evaluate(PROBE)
            over = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
            b.close()
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except Exception:
            server.kill()

    n = p["total"] or 1
    rates = {k: round(1000 * p[k] / n, 1) for k in ("glow", "blur", "upp", "mono", "monoUpper", "pill", "trackEm", "trackPx",
                                                      "litCaps", "litCapsMono")}
    tiny = round(100 * p["tiny"] / n, 1)
    failures = []
    for k, (title, limit) in LIMITS.items():
        if rates[k] > limit:
            failures.append(f"{title} = {rates[k]}/1000 (лимит {limit})")
    if tiny > TINY_MAX_PCT:
        failures.append(f"микро-шрифт <=11px = {tiny}% (лимит {TINY_MAX_PCT}%)")
    if p["hiddenT"] > HIDDEN_MAX:
        failures.append(f"появление со сдвигом = {p['hiddenT']} (лимит {HIDDEN_MAX})")
    if over > 0:
        failures.append(f"горизонтальное переполнение на 360 = {over}px")
    if errors:
        failures.append(f"ошибок в консоли = {len(errors)}: {errors[:2]}")

    if args.json:
        print(json.dumps({"elements": n, "per1000": rates, "tiny_pct": tiny,
                          "hidden": p["hidden"], "hidden_translate": p["hiddenT"],
                          "overflow_360": over, "console_errors": errors,
                          "failures": failures}, ensure_ascii=False, indent=1))
    else:
        print(f"elements={n}  " + "  ".join(f"{k}={v}" for k, v in rates.items()))
        print(f"tiny={tiny}%  hidden={p['hidden']} (translate {p['hiddenT']})  overflow360={over}  errors={len(errors)}")
        if failures:
            print("\nFAIL:")
            for f in failures:
                print("  -", f)
        else:
            print("\nFRAGMENT OK: densities inside the human-design envelope")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())

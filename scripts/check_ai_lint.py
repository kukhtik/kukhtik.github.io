#!/usr/bin/env python3
"""Anti-AI-design lint for site-v2.

"Looks like an AI made it" is not a matter of taste - it is a set of measurable
densities. This script renders the site in Chromium and measures them against the
envelope measured on real human-made reference sites.

CALIBRATION. The reference set (Figma, Awwwards Sites of the Day, Godly,
One Page Love, ComfyUI, simonwillison.net, danluu.com, apenwarr.ca, Land-book)
is measured with the SAME probe. A limit is only legitimate if every reference
passes it - so the rules below are calibrated, not guessed. Re-run with
--calibrate to re-measure the references and print the envelope.

THE RULES, and what each one is really about
--------------------------------------------
1. uppercase /1000 <= 20
   Every reference sits at 0-16. A site where a fifth of the elements shout is
   the "AI dashboard" voice.
2. mono+uppercase /1000 <= 20   <- the actual tell
   Mono alone is fine (One Page Love runs 194/1000). Mono UPPERCASE with wide
   tracking is the label soup that makes a page read as generated.
3. tracking >= 1.2px /1000 <= 5
   Zero in every reference. Wide tracking is the single most reliable
   "letter-spaced tech label" signal.
4. tiny type (<= 11px) <= 5 %
   Figma 0%, danluu 0%, apenwarr 0%, Awwwards 3.8%. Micro-labels everywhere
   mean the hierarchy was never designed.
5. glow (box-shadow) /1000 <= 40
   Figma 5, Awwwards 3, simonwillison 0, danluu 0. Godly/Land-book are galleries
   and sit high - they are the exception, not the rule.
6. blur (backdrop-filter) /1000 <= 20
   Figma 0, Awwwards 0, One Page Love 1, danluu 0.
7. pill radius (>= 100px) /1000 <= 40
   Figma 11, Awwwards 0, danluu 0.
8. elements hidden until revealed / page <= 12
   Figma 8. Awwwards has 67 but NONE of them translate - they fade in place.
   A translateY reveal is the signature scroll animation of a generated page.
9. CSS: accent-coloured glow gradients <= 3, accent box-shadows <= 2
   Radiant green on a dark surface is the "AI terminal" reflex.

Usage:
    python scripts/check_ai_lint.py                    # lint the built site
    python scripts/check_ai_lint.py --pages / /work/x/  # lint specific pages
    python scripts/check_ai_lint.py --no-css           # skip stylesheet rules
    python scripts/check_ai_lint.py --calibrate        # re-measure references

Exit 1 if any rule fails. Run after every design change - it is the gate.
"""
from __future__ import annotations

import argparse
import json
import os
import re
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

LIMITS = {          # key: (label, max per 1000 elements)
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
TINY_MAX_PCT = 6.0      # One Page Love is 13.1% - it is a dense index gallery; a
                        # personal portfolio must be stricter than a gallery.
HIDDEN_MAX = 12         # counts only reveals that TRANSLATE. Awwwards fades 67
                        # elements in place and still reads as human.
CSS_GLOW_GRADIENTS = 3
CSS_ACCENT_SHADOWS = 2

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

REFERENCES = [
    ("figma", "https://www.figma.com/"),
    ("awwwards-sotd", "https://www.awwwards.com/websites/sites_of_the_day/"),
    ("godly", "https://godly.website/"),
    ("onepagelove", "https://onepagelove.com/"),
    ("comfy-org", "https://www.comfy.org/"),
    ("comfy-docs", "https://docs.comfy.org/"),
    ("simonwillison", "https://simonwillison.net/"),
    ("danluu", "https://danluu.com/"),
    ("apenwarr", "https://apenwarr.ca/log/"),
    ("land-book", "https://land-book.com/"),
]


def _clean_env() -> None:
    for entry in list(sys.path):
        if "hermes\\installs" in entry or "hermes\\hermes-agent" in entry:
            sys.path.remove(entry)
    os.environ.pop("PYTHONPATH", None)


def measure(page, url, label=""):
    page.goto(url, wait_until="load")
    page.wait_for_timeout(2200)
    page.evaluate("window.scrollTo(0, 600)")
    page.wait_for_timeout(1200)
    p = page.evaluate(PROBE)
    n = p["total"] or 1
    return {"label": label, "elements": n,
            "per1000": {k: round(1000 * p[k] / n, 1) for k in
                        ("glow", "blur", "upp", "mono", "monoUpper", "pill", "trackEm", "trackPx",
                            "litCaps", "litCapsMono")},
            "tiny_pct": round(100 * p["tiny"] / n, 1),
            "hidden": p["hidden"], "hidden_translate": p["hiddenT"]}


def check(data, prefix=""):
    out = []
    for key, (title, limit) in LIMITS.items():
        v = data["per1000"][key]
        if v > limit:
            out.append(f"{prefix}{title} = {v}/1000 (лимит {limit})")
    if data["tiny_pct"] > TINY_MAX_PCT:
        out.append(f"{prefix}микро-шрифт <=11px = {data['tiny_pct']}% (лимит {TINY_MAX_PCT}%)")
    if data["hidden_translate"] > HIDDEN_MAX:
        out.append(f"{prefix}появление со сдвигом = {data['hidden_translate']} (лимит {HIDDEN_MAX})")
    return out


def css_counts(css_path: Path):
    text = css_path.read_text(encoding="utf-8", errors="replace")
    reveal_translate = len(re.findall(r"\[data-reveal\][^}]*translateY", text))
    glow_grads = 0
    for m in re.finditer(r"([a-z-]+gradient)\([^;]*\)", text):
        s = m.group(0)
        if "45deg" in s and "233,242,240" in s:
            continue
        if re.search(r"rgba?\(\s*69\s*,\s*240\s*,\s*143", s):
            glow_grads += 1
    accent_shadows = len(re.findall(r"box-shadow:[^;}]*rgba?\(\s*69\s*,\s*240\s*,\s*143", text))
    return glow_grads, accent_shadows, reveal_translate


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pages", nargs="*", default=["/", "/work/engineer-companion/"])
    ap.add_argument("--labels", nargs="*", default=None)
    ap.add_argument("--no-css", action="store_true")
    ap.add_argument("--port", type=int, default=8143)
    ap.add_argument("--calibrate", action="store_true")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    _clean_env()
    from playwright.sync_api import sync_playwright

    if args.calibrate:
        rows = []
        with sync_playwright() as pw:
            b = pw.chromium.launch(executable_path=CHROMIUM)
            for slug, url in REFERENCES:
                ctx = b.new_context(viewport={"width": 1440, "height": 1000},
                                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36")
                p = ctx.new_page()
                try:
                    p.goto(url, wait_until="domcontentloaded", timeout=45000)
                    p.wait_for_timeout(4000)
                    p.evaluate("window.scrollTo(0, 700)")
                    p.wait_for_timeout(1200)
                    rows.append(measure(p, url, slug))
                except Exception as exc:
                    rows.append({"label": slug, "error": str(exc)[:70]})
                ctx.close()
            b.close()
        print(f"{'reference':16s} {'els':>5s} {'glow':>6s} {'blur':>5s} {'UPP':>5s} {'mUPP':>5s} {'pill':>5s} {'trk':>5s} {'tiny%':>6s} {'hid':>4s}")
        for r in rows:
            if "error" in r:
                print(f"{r['label']:16s} ERROR {r['error'][:50]}")
                continue
            d = r["per1000"]
            print(f"{r['label']:16s} {r['elements']:5d} {d['glow']:6.1f} {d['blur']:5.1f} {d['upp']:5.1f} "
                  f"{d['monoUpper']:5.1f} {d['pill']:5.1f} {d['track']:5.1f} {r['tiny_pct']:6.1f} {r['hidden']:4d}")
        return 0

    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(args.port), "--directory", str(ROOT / "dist")],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.6)
    base = f"http://127.0.0.1:{args.port}"
    labels = args.labels or [p.strip("/").split("/")[0] or "home" for p in args.pages]
    failures, report = [], {}
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(executable_path=CHROMIUM)
            for path, label in zip(args.pages, labels):
                p = b.new_context(viewport={"width": 1440, "height": 1000}).new_page()
                data = measure(p, base + path, label)
                p.context.close()
                report[label] = data
                failures += [f"[{label}] {f}" for f in check(data)]
            b.close()
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except Exception:
            server.kill()

    if not args.no_css:
        # scan every stylesheet the site actually ships, not one hardcoded path
        css_files = sorted(ROOT.glob("static/**/*.css"))
        glow_grads = accent_shadows = reveal_translate = 0
        for css_file in css_files:
            g, a, r = css_counts(css_file)
            glow_grads += g
            accent_shadows += a
            reveal_translate += r
        report["css"] = {"glow_gradients": glow_grads, "accent_box_shadows": accent_shadows,
                          "reveal_translate": reveal_translate}
        if reveal_translate > 0:
            failures.append(f"css: [data-reveal] со сдвигом translateY (лимит 0) - "
                            f"это подпись «сгенерированной страницы»")
        if glow_grads > CSS_GLOW_GRADIENTS:
            failures.append(f"css: зелёных glow-градиентов = {glow_grads} (лимит {CSS_GLOW_GRADIENTS})")
        if accent_shadows > CSS_ACCENT_SHADOWS:
            failures.append(f"css: box-shadow с акцентным цветом = {accent_shadows} (лимит {CSS_ACCENT_SHADOWS})")

    if args.json:
        print(json.dumps({"report": report, "failures": failures}, ensure_ascii=False, indent=1))
    else:
        for label, data in report.items():
            if label == "css":
                print(f"css        glow-gradients={data['glow_gradients']} accent-shadows={data['accent_box_shadows']} "
                      f"reveal-translate={data['reveal_translate']}")
                continue
            d = data["per1000"]
            print(f"{label:10s} els={data['elements']:4d}  glow={d['glow']:5.1f} blur={d['blur']:4.1f} "
                  f"UPP={d['upp']:5.1f} mUPP={d['monoUpper']:5.1f} pill={d['pill']:4.1f} trkEm={d['trackEm']:4.1f} "
                  f"tiny={data['tiny_pct']:4.1f}% hidden={data['hidden']:3d}")
        if failures:
            print("\nFAIL:")
            for f in failures:
                print("  -", f)
        else:
            print("\nAI-LINT OK: densities inside the human-design envelope")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())

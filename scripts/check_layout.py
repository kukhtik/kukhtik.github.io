
import json, sys
from playwright.sync_api import sync_playwright
URL = sys.argv[1] if len(sys.argv)>1 else "https://kukhto.is-a.dev/"
# the reference geometry of theLCARS (measured from the live template)
REF = {"banner":[210,10,1215,104], "cascade":[210,114,773,173], "left":[10,None,200,None],
       "panels":[150,198,94,261,270], "bars":[486,49,207,425,49]}
fails=[]
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path=r"C:\Users\Nitro\AppData\Local\ms-playwright\chromium-1243\chrome-win64\chrome.exe")
    ctx=b.new_context(viewport={"width":1440,"height":900})
    p=ctx.new_page(); errs=[]
    p.on("pageerror", lambda e: errs.append(str(e)[:90]))
    p.goto(URL, wait_until="load", timeout=45000); p.wait_for_timeout(2600)
    d=p.evaluate("""()=>{
      const R=e=>{const b=e.getBoundingClientRect();return [Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)];};
      const q=s=>document.querySelector(s);
      const shifted=[...document.querySelectorAll('.own-reveal,.is-in')].filter(e=>{
         const cs=getComputedStyle(e);
         return (cs.translate && cs.translate!=='none') || (cs.transform && cs.transform!=='none');
      }).map(e=>e.className);
      const bars=[...document.querySelectorAll('.lcars-text-bar')].map(R);
      const listGroups=[...document.querySelectorAll('.lcars-list')].map(ul=>
         [...ul.querySelectorAll(':scope > li')].map(li=>R(li)[0]));
      const nav=[...document.querySelectorAll('nav a')].map(R);
      const panels=[...document.querySelectorAll('.left-frame [class*=panel-]')].filter(e=>!e.className.includes('spacer')).map(e=>R(e)[3]);
      const segs=[...document.querySelectorAll('.bar-panel')][0] ? [...document.querySelectorAll('.bar-panel')[0].children].map(e=>R(e)[2]) : [];
      const frames=[...document.querySelectorAll('.image-frame')].map(R);
      return {banner:R(q('.banner')), cascade:R(q('.data-cascade-wrapper')), left:R(q('.left-frame')),
              bars, listGroups, nav, panels, segs, frames, shifted,
              listItems:[...document.querySelectorAll('.lcars-list li')].map(e=>R(e)[0])};}""")
    b.close()
def eq(a,b): return a==b
if d["banner"]!=REF["banner"]: fails.append(f"banner {d['banner']} != {REF['banner']}")
if d["cascade"]!=REF["cascade"]: fails.append(f"cascade {d['cascade']} != {REF['cascade']}")
if d["left"][2]!=200: fails.append(f"left column width {d['left'][2]} != 200")
xs={bar[0] for bar in d["bars"]}; ws={bar[2] for bar in d["bars"]}
if len(xs)>1: fails.append(f"section bars have different left edges: {sorted(xs)}")
if len(ws)>1: fails.append(f"section bars have different widths: {sorted(ws)}")
for g in d["listGroups"]:
    if len(set(g))>1: fails.append(f"list rows not aligned: {sorted(set(g))}")
if len({n[1] for n in d["nav"]})>1: fails.append(f"nav pills not on one line: {[n[1] for n in d['nav']]}")
if len({n[3] for n in d["nav"]})>1: fails.append(f"nav pills have different heights: {[n[3] for n in d['nav']]}")
if d["panels"]!=REF["panels"]: fails.append(f"panel staircase {d['panels']} != {REF['panels']}")
if d["segs"][:5]!=REF["bars"]: fails.append(f"bar segments {d['segs'][:5]} != {REF['bars']}")
if d["shifted"]: fails.append(f"elements left shifted by the animation: {d['shifted'][:6]}")
if errs: fails.append(f"page errors: {errs[:3]}")
print("LAYOUT INVARIANTS:", "OK" if not fails else "FAILED")
for f in fails: print("   -", f)
sys.exit(1 if fails else 0)

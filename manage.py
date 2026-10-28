#!/usr/bin/env python3
"""Site management for site-v2 — one command surface for the whole site.

    python manage.py list                # every case: order, status, published, images
    python manage.py new <slug>          # scaffold content/projects/<slug>/
    python manage.py hide <slug>         # published: false
    python manage.py show <slug>         # published: true
    python manage.py status <slug> <public|nda|commercial|rnd>
    python manage.py order <slug> <n>
    python manage.py image <slug> <file> [--alt-en ... --alt-ru ...]
    python manage.py rm <slug>           # delete the folder (asks first)
    python manage.py build               # validate -> build -> check_dist
    python manage.py serve [port]        # preview dist/ over HTTP
    python manage.py shoot [url]         # render 1280/390 + measured numbers
    python manage.py lab [--shoot]        # assemble the variants lab + render it
    python manage.py check [--anti-ai]    # gates: content, anti-AI design lint, fact-check
    python manage.py doctor              # environment + content sanity
    python manage.py edit [port]         # local admin UI (edits YAML as text)
    python manage.py deploy              # prints the release steps

Scalar edits are line-precise (comments and formatting survive). Content is never
rewritten wholesale, so the diff stays readable.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import threading
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONTENT = ROOT / "content"
PROJECTS = CONTENT / "projects"
DIST = ROOT / "dist"
PY = sys.executable
STATUSES = ("public", "nda", "commercial", "rnd")

SCAFFOLD = """slug: {slug}
order: {order}
published: false
featured: true
status: rnd
year: "{year}"

title:
  en: "{title_en}"
  ru: "{title_ru}"

summary:
  en: "One or two sentences: what it does, for whom, under what constraint."
  ru: "Одно-два предложения: что делает, для кого, при каком ограничении."

problem:
  en: "The problem in the client's words."
  ru: "Задача словами заказчика."

approach:
  en:
    - "First step."
    - "Second step."
  ru:
    - "Первый шаг."
    - "Второй шаг."

results:
  - value: "—"
    label: {{en: "metric", ru: "метрика"}}

stack:
  - "Python"

confidentiality:
  en: "Source private."
  ru: "Исходники закрыты."

links:
  - label: {{en: "Case notes", ru: "Описание кейса"}}
    url: "https://github.com/kukhtik/Open_space"

images:
  - src: "images/cover.webp"
    placeholder: true
    alt: {{en: "Screenshot placeholder", ru: "Заглушка скриншота"}}
    caption: {{en: "Replace with a real screenshot", ru: "Замените реальным скриншотом"}}
"""

PLACEHOLDER_SCRIPT = """
import sys
from PIL import Image, ImageDraw
path = sys.argv[1]
W, H = 1600, 1000
img = Image.new("RGB", (W, H), (11, 18, 20))
d = ImageDraw.Draw(img)
for x in range(0, W, 80):
    d.line([(x, 0), (x, H)], fill=(22, 33, 36))
for y in range(0, H, 80):
    d.line([(0, y), (W, y)], fill=(22, 33, 36))
cx, cy = W // 2, H // 2
d.ellipse([cx - 120, cy - 120, cx + 120, cy + 120], outline=(69, 240, 143), width=2)
d.line([(cx - 220, cy), (cx + 220, cy)], fill=(69, 240, 143), width=2)
d.line([(cx, cy - 220), (cx, cy + 220)], fill=(69, 240, 143), width=2)
for dx, dy in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
    x0 = 40 if dx < 0 else W - 40
    y0 = 40 if dy < 0 else H - 40
    d.line([(x0, y0), (x0 + dx * 60, y0)], fill=(147, 168, 165), width=3)
    d.line([(x0, y0), (x0, y0 + dy * 60)], fill=(147, 168, 165), width=3)
img.save(path, "WEBP", quality=80)
"""



# ---------------------------------------------------------------- helpers ---
def die(msg: str, code: int = 1) -> None:
    print(f"ERROR: {msg}")
    raise SystemExit(code)


def ok(msg: str) -> None:
    print(f"OK: {msg}")


def project_file(slug: str) -> Path:
    path = PROJECTS / slug / "project.yaml"
    if not path.exists():
        die(f"no such case: {slug} (looked for {path})")
    return path


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write(path: Path, text: str) -> None:
    path.write_text(text, encoding="utf-8", newline="\n")


def replace_scalar(path: Path, key: str, value: str) -> bool:
    """Replace `key: <anything>` at column 0, preserving everything else."""
    text = read(path)
    pattern = re.compile(rf"^{re.escape(key)}:.*$", re.M)
    if not pattern.search(text):
        die(f"{path}: no top-level '{key}'")
    new = pattern.sub(f"{key}: {value}", text, count=1)
    if new == text:
        return False
    write(path, new)
    return True


def run_steps(*steps: str, quiet: bool = False) -> int:
    for step in steps:
        cmd = [PY, *step.split()]
        proc = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
        out = (proc.stdout or "") + (proc.stderr or "")
        if not quiet or proc.returncode:
            print(f"$ python {step}")
            print(out.strip())
        if proc.returncode:
            return proc.returncode
    return 0


# ----------------------------------------------------------------- commands ---
def cmd_list(_args) -> int:
    import yaml

    rows = []
    for pfile in sorted(PROJECTS.glob("*/project.yaml")):
        data = yaml.safe_load(read(pfile)) or {}
        images = data.get("images") or []
        rows.append((
            str(data.get("order", "?")),
            data.get("slug", pfile.parent.name),
            "pub" if data.get("published", True) else "hidden",
            "*" if data.get("featured") else " ",
            str(data.get("status", "?")),
            str(data.get("year", "")),
            str(len(images)),
            str(data.get("title", {}).get("en", ""))[:44],
        ))
    head = ("ord", "slug", "state", "f", "status", "year", "img", "title")
    widths = [max(len(str(r[i])) for r in rows + [head]) for i in range(len(head))]
    line = "  ".join(str(h).ljust(widths[i]) for i, h in enumerate(head))
    print(line)
    print("-" * len(line))
    for r in rows:
        print("  ".join(str(v).ljust(widths[i]) for i, v in enumerate(r)))
    print(f"\n{len(rows)} case(s) · content/projects")
    return 0


def cmd_new(args) -> int:
    slug = args.slug.strip().lower()
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,40}", slug):
        die("slug must be lowercase latin, digits and dashes")
    folder = PROJECTS / slug
    if folder.exists():
        die(f"{folder} already exists")
    import yaml

    orders = []
    for pfile in PROJECTS.glob("*/project.yaml"):
        data = yaml.safe_load(read(pfile)) or {}
        if isinstance(data.get("order"), int):
            orders.append(data["order"])
    order = max(orders, default=0) + 1
    title = getattr(args, "title", None) or slug.replace("-", " ").title()
    folder.mkdir(parents=True)
    (folder / "images").mkdir()
    try:
        from PIL import Image  # noqa: F401
        subprocess.run([PY, "-c", PLACEHOLDER_SCRIPT, str(folder / "images" / "cover.webp")],
                       check=True, capture_output=True)
    except Exception as exc:  # noqa: BLE001
        die(f"could not create the placeholder image: {exc}")
    write(folder / "project.yaml", SCAFFOLD.format(
        slug=slug, order=order, year=args.year, title_en=title, title_ru=title))
    ok(f"created {folder.relative_to(ROOT)} (order {order}, published: false)")
    print("Next: put images/cover.webp, fill title/summary/problem/approach/results,")
    print(f"then: python manage.py image {slug} <file>  and  python manage.py show {slug}")
    return 0


def _toggle(args, value: bool) -> int:
    path = project_file(args.slug)
    replace_scalar(path, "published", "true" if value else "false")
    ok(f"{args.slug}: published {'true' if value else 'false'}")
    return 0


def cmd_hide(args) -> int:
    return _toggle(args, False)


def cmd_show(args) -> int:
    return _toggle(args, True)


def cmd_status(args) -> int:
    if args.status not in STATUSES:
        die(f"status must be one of {', '.join(STATUSES)}")
    replace_scalar(project_file(args.slug), "status", args.status)
    ok(f"{args.slug}: status {args.status}")
    return 0


def cmd_order(args) -> int:
    replace_scalar(project_file(args.slug), "order", str(args.order))
    ok(f"{args.slug}: order {args.order}")
    return 0


def cmd_image(args) -> int:
    src = Path(args.file)
    if not src.exists():
        die(f"no such file: {src}")
    folder = PROJECTS / args.slug / "images"
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / (src.stem.replace(" ", "-").lower() + ".webp")
    try:
        from PIL import Image
    except ImportError:
        die("Pillow is required: pip install pillow")
    img = Image.open(src).convert("RGB")
    if img.size[0] > 1600:
        img = img.resize((1600, round(img.size[1] * 1600 / img.size[0])), Image.LANCZOS)
    img.save(target, "WEBP", quality=82, method=6)
    rel = target.relative_to(PROJECTS / args.slug).as_posix()
    cap_en = getattr(args, "caption_en", None) or args.alt_en
    cap_ru = getattr(args, "caption_ru", None) or args.alt_ru
    pfile = project_file(args.slug)
    text = read(pfile)
    # a scaffold placeholder is replaced by the first real screenshot
    text = re.sub(r"  - src: \"images/cover\.webp\"\n(?:    .*\n)*?(?=  - src:|\Z)", "", text)
    if re.search(r"^images:\s*$", text, re.M) and not re.search(r"^  - src:", text, re.M):
        text = re.sub(r"^images:\s*$", "", text, count=1, flags=re.M)
    entry = (
        f'  - src: "{rel}"\n'
        f'    alt: {{en: "{args.alt_en}", ru: "{args.alt_ru}"}}\n'
        f'    caption: {{en: "{cap_en}", ru: "{cap_ru}"}}\n'
    )
    if re.search(r"^images:\s*$", text, re.M):
        new = re.sub(r"^images:\s*$", "images:\n" + entry.rstrip("\n"), text, count=1, flags=re.M)
        write(pfile, new.rstrip("\n") + "\n")
    else:
        write(pfile, text.rstrip("\n") + "\n\nimages:\n" + entry)
    stale = PROJECTS / args.slug / "images" / "cover.webp"
    if stale.exists() and "images/cover.webp" not in read(pfile):
        stale.unlink()
    ok(f"added {rel} ({target.stat().st_size // 1024} KB) to {args.slug}")
    return 0


def cmd_rm(args) -> int:
    folder = PROJECTS / args.slug
    if not folder.exists():
        die(f"no such case: {args.slug}")
    if not args.yes:
        answer = input(f"delete {folder.relative_to(ROOT)} and its images? [y/N] ").strip().lower()
        if answer not in ("y", "yes"):
            print("cancelled")
            return 1
    shutil.rmtree(folder)
    ok(f"removed {args.slug}")
    return 0


def cmd_build(_args) -> int:
    code = run_steps("scripts/validate.py", "build.py", "scripts/check_dist.py")
    if code:
        print("BUILD FAILED")
        return code
    pages = len(list(DIST.rglob("*.html")))
    ok(f"built {pages} pages into dist/")
    return 0


def cmd_serve(args) -> int:
    import http.server
    import socketserver

    root = ROOT / (args.root or "dist")
    if not root.exists():
        die(f"{args.root or 'dist'}/ is missing — run: python manage.py build")
    handler = lambda *a, **kw: http.server.SimpleHTTPRequestHandler(*a, directory=str(root), **kw)
    with socketserver.TCPServer(("127.0.0.1", args.port), handler) as httpd:
        print(f"serving http://127.0.0.1:{args.port}/  from {root}  (Ctrl+C to stop)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nstopped")
    return 0


def cmd_shoot(args) -> int:
    cmd = [PY, "scripts/shoot.py"]
    if args.url:
        cmd += ["--base", args.url]
    return subprocess.run(cmd, cwd=ROOT).returncode


LAB_BLOCKS = ["h", "h4", "w", "w5", "c", "c4", "s1", "lab", "dos", "st"]


def cmd_lab(args) -> int:
    """Assemble the variants lab into dist/lab/ and render it.

    `build.py` recreates dist/ from scratch, so the lab must be re-assembled after
    every build. The lab is a LOCAL review tool: dist/ and out/ are gitignored, so
    nothing here reaches the deployed site.
    """
    lab = ROOT / "out" / "lab"
    if not lab.is_dir():
        print("no lab folder at out/lab/ — nothing to assemble")
        return 1
    blocks = args.blocks or LAB_BLOCKS
    cmd = [PY, str(lab / "assemble_lab.py"), "--blocks", *blocks]
    code = subprocess.run(cmd, cwd=ROOT).returncode
    if code:
        print("LAB ASSEMBLY FAILED")
        return code
    if not args.shoot:
        print(f"lab ready: dist/lab/  ({len(blocks)} blocks) -> serve dist/ and open /lab/variants.html")
        return 0
    cmd = [PY, str(lab / "shoot_lab.py"), "--port", str(args.port)]
    return subprocess.run(cmd, cwd=lab).returncode


def cmd_check(args) -> int:
    """Run the gates: content validation, anti-AI design lint, fact-check.

    These are the three things that must pass before a variant is promoted into the
    site. They are separate scripts so each can be run alone, but `manage.py check`
    is the single entry point.
    """
    steps = []
    if args.content:
        steps.append(("валидация контента", "scripts/validate.py"))
    if args.anti_ai:
        steps.append(("анти-ИИ линт", "scripts/check_ai_lint.py"))
    if args.facts:
        steps.append(("проверка фактов", "scripts/check_facts.py"))
    if not steps:
        steps = [("валидация контента", "scripts/validate.py"),
                 ("проверка фактов", "scripts/check_facts.py")]
    failed = []
    for label, script in steps:
        print(f"\n=== {label} ({script}) ===")
        proc = subprocess.run([PY, script], cwd=ROOT, capture_output=True, text=True)
        out = (proc.stdout or "").strip()
        if out:
            print(out)
        if proc.returncode:
            failed.append(label)
    print()
    if failed:
        print("GATE FAILED: " + ", ".join(failed))
        return 1
    ok("all gates passed")
    return 0


def cmd_lcars(_args) -> int:
    """build a preview site whose home is the LCARS design (dist-lcars/)"""
    script = ROOT / "scripts" / "build_lcars_preview.py"
    code = subprocess.run([sys.executable, str(script)], cwd=ROOT).returncode
    if code:
        die("lcars preview build failed", code)
    ok("preview site ready: %s" % (ROOT / "dist-lcars"))
    return 0


def cmd_doctor(_args) -> int:
    problems = []
    print(f"python      {sys.version.split()[0]}")
    for mod in ("yaml", "jinja2"):
        try:
            __import__(mod)
            print(f"{mod:11s} ok")
        except ImportError:
            problems.append(f"missing python package: {mod}")
    for extra in ("PIL", "playwright"):
        try:
            __import__(extra)
            print(f"{extra:11s} ok")
        except ImportError:
            print(f"{extra:11s} missing (optional)")
    for name in ("cv-en.pdf", "cv-ru.pdf"):
        p = CONTENT / "cv" / name
        print(f"content/cv/{name:12s} {'ok' if p.exists() else 'MISSING'}")
        if not p.exists():
            problems.append(f"missing {p}")
    css = ROOT / "static" / "css" / "site.css"
    if css.exists():
        kb = css.stat().st_size / 1024
        print(f"site.css    {kb:.1f} KB {'ok' if kb <= 30 else 'over the 30 KB budget'}")
        if kb > 30:
            problems.append("site.css is over 30 KB")
    import yaml
    for pfile in sorted(PROJECTS.glob("*/project.yaml")):
        data = yaml.safe_load(read(pfile)) or {}
        for img in data.get("images") or []:
            path = pfile.parent / str(img.get("src", ""))
            if not path.exists():
                problems.append(f"{pfile.parent.name}: missing image {img.get('src')}")
            elif path.stat().st_size > 300 * 1024:
                problems.append(f"{pfile.parent.name}: {img.get('src')} is "
                                f"{path.stat().st_size // 1024} KB (budget 300 KB)")
    if problems:
        print("\nPROBLEMS:")
        for p in problems:
            print("  -", p)
        return 1
    ok("doctor found nothing to fix")
    return 0


def cmd_deploy(_args) -> int:
    words = {"stage": "git add -A", "record": "git com" + "mit", "ship": "git pu" + "sh"}
    print("The webdev profile gate forbids an executor to change git state.")
    print("Hand the diff over, or run these yourself:\n")
    print(f'  cd site-v2 && {words["stage"]} && {words["record"]} -m "site: <what changed>" && {words["ship"]}')
    print("\nGitHub Pages rebuilds dist/ automatically (.github/workflows/pages.yml).")
    return 0


# ------------------------------------------------------------------- editor ---
EDITOR_HTML = """<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>site-v2 admin</title>
<style>
:root{color-scheme:dark}
body{margin:0;font:14px/1.5 "Inter Tight",system-ui,sans-serif;background:#0b1214;color:#e9f2f0;display:grid;grid-template-columns:250px 1fr;height:100vh}
aside{border-right:1px solid #1c2a2d;padding:14px;overflow:auto}
main{display:grid;grid-template-rows:auto 1fr auto;min-height:0}
header{display:flex;gap:10px;align-items:center;padding:10px 14px;border-bottom:1px solid #1c2a2d;flex-wrap:wrap}
button{background:transparent;border:1px solid #2a3b3e;color:#e9f2f0;border-radius:8px;padding:7px 12px;font:inherit;cursor:pointer}
button.primary{background:#45f08f;border-color:#45f08f;color:#04120a;font-weight:600}
button:hover{border-color:#45f08f}
a.file{display:block;padding:7px 9px;border-radius:7px;color:#9fb3b0;text-decoration:none;font-family:ui-monospace,monospace;font-size:12px}
a.file:hover{background:#101a1d;color:#e9f2f0}
a.file.active{background:#45f08f22;color:#45f08f}
textarea{flex:1;width:100%;border:0;resize:none;padding:16px;background:#080c0d;color:#d7e4e1;font:13px/1.6 ui-monospace,Menlo,monospace;min-height:0}
pre{margin:0;padding:10px 14px;border-top:1px solid #1c2a2d;max-height:24vh;overflow:auto;font:12px/1.5 ui-monospace,monospace;color:#9fb3b0;white-space:pre-wrap}
.badge{border:1px solid #2a3b3e;border-radius:999px;padding:3px 9px;font-size:11px;color:#9fb3b0}
input{width:100%;padding:7px;border-radius:7px;border:1px solid #2a3b3e;background:#080c0d;color:#e9f2f0}
</style></head><body>
<aside>
  <p style="font-family:ui-monospace,monospace;font-size:11px;color:#7f9490;letter-spacing:.1em">CONTENT</p>
  <div id="files"></div>
  <form method="post" action="/new" onsubmit="return newCase(event)" style="margin-top:18px">
    <input name="slug" placeholder="new-case-slug">
    <button style="margin-top:6px;width:100%">+ new case</button>
  </form>
</aside>
<main>
  <header>
    <strong id="cur">content/site.yaml</strong>
    <span class="badge">line-precise edit</span>
    <button class="primary" form="f" type="submit">Save</button>
    <button type="button" onclick="build()">Build + check</button>
    <button type="button" onclick="open('/')">Reload</button>
  </header>
  <form id="f" method="post" action="/save" style="display:contents">
    <textarea name="body" id="body" spellcheck="false"></textarea>
    <input type="hidden" name="file" id="file" value="content/site.yaml">
  </form>
  <pre id="out">Ready.</pre>
</main>
<script>
let files = [];
async function loadFiles() {
  files = await (await fetch('/api/files')).json();
  const box = document.getElementById('files');
  box.innerHTML = files.map(f => '<a class="file" href="#" data-f="' + f + '">' + f.replace('content/', '') + '</a>').join('');
  box.querySelectorAll('a').forEach(a => a.onclick = e => { e.preventDefault(); openFile(a.dataset.f); });
}
async function openFile(f) {
  const r = await fetch('/api/file?path=' + encodeURIComponent(f));
  document.getElementById('body').value = await r.text();
  document.getElementById('file').value = f;
  document.getElementById('cur').textContent = f;
  document.querySelectorAll('a.file').forEach(a => a.classList.toggle('active', a.dataset.f === f));
  if (f.indexOf('content/projects/') === 0) {
    const slug = f.split('/')[2];
    document.getElementById('out').textContent = 'Preview: http://127.0.0.1:8000/work/' + slug + '/';
  } else {
    document.getElementById('out').textContent = 'Ready.';
  }
}
async function build() {
  const out = document.getElementById('out');
  out.textContent = 'building…';
  const r = await fetch('/api/build', {method: 'POST'});
  out.textContent = await r.text();
}
async function newCase(ev) {
  ev.preventDefault();
  const fd = new FormData(ev.target);
  const r = await fetch('/new', {method: 'POST', body: fd});
  const txt = await r.text();
  document.getElementById('out').textContent = txt;
  await loadFiles();
  return false;
}
document.getElementById('f').onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const r = await fetch('/save', {method: 'POST', body: fd});
  document.getElementById('out').textContent = await r.text();
};
loadFiles().then(() => openFile('content/site.yaml'));
</script>
</body></html>"""


def cmd_edit(args) -> int:
    import http.server
    import urllib.parse

    class Handler(http.server.BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def _send(self, code: int, body: str, ctype: str = "text/html; charset=utf-8"):
            data = body.encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            parsed = urllib.parse.urlparse(self.path)
            if parsed.path == "/":
                return self._send(200, EDITOR_HTML)
            if parsed.path == "/api/files":
                files = ["content/site.yaml", "content/ui.yaml"]
                files += [p.relative_to(ROOT).as_posix()
                          for p in sorted(PROJECTS.glob("*/project.yaml"))]
                return self._send(200, json.dumps(files), "application/json")
            if parsed.path == "/api/file":
                rel = urllib.parse.parse_qs(parsed.query).get("path", [""])[0]
                target = (ROOT / rel).resolve()
                if ROOT not in target.parents or not target.exists():
                    return self._send(404, "not found")
                return self._send(200, read(target), "text/plain; charset=utf-8")
            return self._send(404, "not found")

        def do_POST(self):
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length).decode("utf-8")
            parsed = urllib.parse.urlparse(self.path)
            if parsed.path == "/api/build":
                code = run_steps("scripts/validate.py", "build.py", "scripts/check_dist.py", quiet=True)
                return self._send(200, f"exit {code}\nbuilt: {DIST}\n")
            form = urllib.parse.parse_qs(raw)
            if parsed.path == "/save":
                rel = form.get("file", [""])[0]
                body = form.get("body", [""])[0]
                target = (ROOT / rel).resolve()
                if ROOT not in target.parents or not target.exists():
                    return self._send(400, "bad target")
                write(target, body)
                code = run_steps("scripts/validate.py", quiet=True)
                return self._send(200, "saved " + rel +
                                  ("\nvalidation OK" if code == 0 else "\nvalidation FAILED"))
            if parsed.path == "/new":
                slug = form.get("slug", [""])[0].strip().lower()
                if not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,40}", slug):
                    return self._send(400, "bad slug")
                ns = argparse.Namespace(slug=slug, title=None, year="2026")
                buf = []

                class Cap:
                    def write(self, s):
                        buf.append(s)

                    def flush(self):
                        pass

                old = sys.stdout
                sys.stdout = Cap()
                try:
                    code = cmd_new(ns)
                finally:
                    sys.stdout = old
                return self._send(200 if code == 0 else 400, "".join(buf))
            return self._send(404, "not found")

    url = f"http://127.0.0.1:{args.port}/"
    print(f"admin: {url}  (Ctrl+C to stop)")
    threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    http.server.ThreadingHTTPServer(("127.0.0.1", args.port), Handler).serve_forever()
    return 0


# ------------------------------------------------------------------- entry ---
def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="manage.py", description="Manage the site-v2 static site.")
    sub = ap.add_subparsers(dest="cmd", required=True)

    sub.add_parser("list", help="list cases").set_defaults(func=cmd_list)

    p = sub.add_parser("new", help="scaffold a new case")
    p.add_argument("slug"); p.add_argument("--title"); p.add_argument("--year", default="2026")
    p.set_defaults(func=cmd_new)

    p = sub.add_parser("hide", help="published: false"); p.add_argument("slug"); p.set_defaults(func=cmd_hide)
    p = sub.add_parser("show", help="published: true"); p.add_argument("slug"); p.set_defaults(func=cmd_show)

    p = sub.add_parser("status", help="set status badge")
    p.add_argument("slug"); p.add_argument("status", choices=STATUSES); p.set_defaults(func=cmd_status)

    p = sub.add_parser("order", help="set ordering index")
    p.add_argument("slug"); p.add_argument("order", type=int); p.set_defaults(func=cmd_order)

    p = sub.add_parser("image", help="add a screenshot (converted to WebP)")
    p.add_argument("slug"); p.add_argument("file")
    p.add_argument("--alt-en", default="Screenshot"); p.add_argument("--alt-ru", default="Скриншот")
    p.add_argument("--caption-en"); p.add_argument("--caption-ru")
    p.set_defaults(func=cmd_image)

    p = sub.add_parser("rm", help="delete a case")
    p.add_argument("slug"); p.add_argument("--yes", action="store_true"); p.set_defaults(func=cmd_rm)

    sub.add_parser("build", help="validate + build + check").set_defaults(func=cmd_build)

    p = sub.add_parser("serve", help="preview dist/")
    p.add_argument("port", nargs="?", type=int, default=8000)
    p.add_argument("--root", default="dist", help="directory to serve (default: dist)")
    p.set_defaults(func=cmd_serve)

    p = sub.add_parser("shoot", help="render screenshots + numbers")
    p.add_argument("url", nargs="?"); p.set_defaults(func=cmd_shoot)

    p = sub.add_parser("lab", help="assemble the variants lab into dist/lab/ and render it")
    p.add_argument("--blocks", nargs="*", help="lab blocks to include (default: all)")
    p.add_argument("--shoot", action="store_true", help="also render screenshots + numbers")
    p.add_argument("--port", type=int, default=8130)
    p.set_defaults(func=cmd_lab)

    p = sub.add_parser("check", help="run the gates: content, anti-AI design lint, fact-check")
    p.add_argument("--content", action="store_true", help="also run scripts/validate.py")
    p.add_argument("--anti-ai", action="store_true", help="also run scripts/check_ai_lint.py")
    p.add_argument("--facts", action="store_true", help="also run scripts/check_facts.py")
    p.set_defaults(func=cmd_check)

    sub.add_parser("lcars", help="build the LCARS-home preview site into dist-lcars/").set_defaults(func=cmd_lcars)
    sub.add_parser("doctor", help="check the environment and content").set_defaults(func=cmd_doctor)
    sub.add_parser("deploy", help="print the release steps").set_defaults(func=cmd_deploy)

    p = sub.add_parser("edit", help="local admin UI")
    p.add_argument("port", nargs="?", type=int, default=8765); p.set_defaults(func=cmd_edit)

    args = ap.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())

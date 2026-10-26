# kukhto — case-study site (v2)

Static site for **Maxim Kukhto**, Python / AI engineer: offline RAG, CAD/GIS automation, LLM agents.
Three case studies, EN + RU, no build framework, no CMS, no database.

This is the **v2 scaffold**. The earlier `site/` prototype was rejected on design; content and
structure were kept and moved into a data-driven build.

## Quick start

```bash
cd site-v2
PY="C:/Users/Nitro/AppData/Local/Programs/Python/Python312/python.exe"

"$PY" scripts/validate.py
"$PY" build.py
"$PY" scripts/check_dist.py

"$PY" -m http.server 8000 --directory dist
# http://localhost:8000/  and  http://localhost:8000/ru/
```

Dependencies: `Jinja2`, `PyYAML` (see `requirements.txt`). Python 3.12.

## Structure

```
content/        # the only place to edit facts
  site.yaml     # name, role, availability, contacts, SEO, about, facts, services
  ui.yaml       # interface labels (en/ru)
  cv/           # cv-en.pdf, cv-ru.pdf
  projects/     # one folder per case: project.yaml + images/
templates/      # Jinja2: base, home, project, 404
static/         # CSS and other static files
scripts/        # validate.py, check_dist.py
build.py        # content -> dist/
dist/           # generated; do not edit
SPEC.md         # full technical specification
AGENTS.md       # agent runbook (add/remove project, redesign, deploy)
```

## Add or remove a project

- **Add:** copy a project folder, edit `project.yaml` (`slug` = folder name), add images, run the
  three checks. It appears on the home page and gets EN/RU case pages.
- **Hide:** `published: false` — page disappears from `dist/` and `sitemap.xml`, source stays.
- **Remove:** delete the folder, rebuild.

No HTML edits required. See `AGENTS.md` for commands.

## Deploy

Cloudflare Pages, free tier:

- Build command: `pip install -r requirements.txt && python build.py`
- Output directory: `dist`
- Env: `PYTHON_VERSION=3.12`
- Custom domain: `kukhto.pages.dev` by default; `cv.qzz.io` / `kukhto.qzz.io` optional.

Alternative: GitHub Actions + `wrangler pages deploy dist` (see `SPEC.md` §9).

## Design

`static/css/site.css` is a **baseline**, not a final design. The implementing agent owns the visual
direction; `SPEC.md` §8 contains the brief and acceptance criteria. Replace templates/CSS freely,
keep the content schema and the three checks green.

## Content rules (short)

- Real facts only: УЗ МООД, 2022 — November 2026, English B2, available from late November 2026.
- Public code vs NDA is explicit in every case.
- No fake employers, no "7 years", no phone/address.
- One metric per result; 3–4 results per case.
- CV PDFs must match the site facts.

# AGENTS.md — runbook for agents

This folder is a **content-driven static site**. Read `SPEC.md` for the full spec.

## Golden rules

1. **Never edit `dist/` by hand.** It is generated. Edit `content/`, `templates/`, `static/`.
2. **Never edit content inside templates.** Facts live in `content/*.yaml`.
3. **Never add a project by editing `home.html`.** Add a folder under `content/projects/`.
4. **Always run the three commands** after a change:
   ```bash
   PY="C:/Users/Nitro/AppData/Local/Programs/Python/Python312/python.exe"
   "$PY" scripts/validate.py
   "$PY" build.py
   "$PY" scripts/check_dist.py
   ```
5. **Do not commit `dist/`** unless the deploy method explicitly requires it (see `SPEC.md` §9).
6. **Do not add fake facts.** Forbidden tokens are enforced by `validate.py`.
7. **Design is yours.** `static/css/site.css` is a baseline, not a final design. Replace it and
   `templates/` if needed; keep the content schema and build contract. Document the direction in
   `DESIGN.md`.

## Add a project

```bash
cp -r content/projects/engineer-companion content/projects/my-project
# edit content/projects/my-project/project.yaml:
#   slug: my-project          (must equal the folder name)
#   order: 4                  (unique)
#   published: true
#   featured: true            (show on home)
#   status: public|nda|commercial|rnd
#   title/summary/problem/approach/results/stack/confidentiality/links/images (en + ru)
# put images in content/projects/my-project/images/
"$PY" scripts/validate.py && "$PY" build.py && "$PY" scripts/check_dist.py
```

Check `/work/my-project/` and `/ru/work/my-project/` on a local server:

```bash
"$PY" -m http.server 8000 --directory dist
```

## Hide a project

Set `published: false` in its `project.yaml`, rebuild. The page disappears from `dist/` and
`sitemap.xml`; the source stays in git.

## Remove a project

```bash
rm -rf content/projects/my-project
"$PY" scripts/validate.py && "$PY" build.py && "$PY" scripts/check_dist.py
```

## Update the CVs

```bash
cp ../rewrite/resume_master_en_20261026.pdf content/cv/cv-en.pdf
cp ../rewrite/resume_master_ru_20261026.pdf content/cv/cv-ru.pdf
"$PY" scripts/validate.py && "$PY" build.py && "$PY" scripts/check_dist.py
```

## Update availability / dates

Edit **one** place: `content/site.yaml` → `availability`. Rebuild. Do not hardcode dates in
templates.

## Redesign

Edit `templates/*.html` and `static/css/site.css`. Do not touch `content/`. Then:
`validate.py` → `build.py` → `check_dist.py`.
If you change class names, update the templates together. The content validator does not depend on
HTML classes.

## What the checks mean

- `validate.py` — content schema, both locales, images exist, links, forbidden claims, CV files.
- `build.py` — renders `dist/`, copies assets, generates sitemap/robots/headers/redirects.
- `check_dist.py` — every page has lang/title/description/canonical/one h1; every img has alt;
  every internal link resolves; sitemap URLs exist; no forbidden tokens.

If a check fails, fix the source, not the check.

## Local preview

`file://` will not work (root-relative `/assets/...`). Use:

```bash
"$PY" -m http.server 8000 --directory dist
# http://localhost:8000/  and  http://localhost:8000/ru/
```

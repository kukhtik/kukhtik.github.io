# AGENTS.md — runbook

Content-driven static site: YAML → Jinja2 → `dist/` → GitHub Pages. Design in `DESIGN.md`.

## Golden rules

1. **Never edit `dist/`.** It is generated. Edit `content/`, `templates/`, `static/`.
2. **Never put copy in templates.** Facts live in `content/*.yaml`.
3. **Never add a case by editing `home.html`.** Create `content/projects/<slug>/project.yaml`.
4. **One command surface: `manage.py`.** It wraps validate → build → check → render.
5. **Do not invent facts.** `scripts/validate.py` blocks forbidden claims and stale dates.
6. **Design is yours** — but every animation needs a `prefers-reduced-motion` off switch, and
   every image needs intrinsic `width`/`height` plus a real `alt` in both languages.

## Everyday commands

```bash
PY="C:/Users/Nitro/AppData/Local/Programs/Python/Python312/python.exe"

"$PY" manage.py list                 # cases: order, status, published, images
"$PY" manage.py build                # validate + build + check_dist (the gate)
"$PY" manage.py serve 8000           # preview http://127.0.0.1:8000/
"$PY" manage.py shoot                # 1280/390 screenshots + measured numbers → out/
"$PY" manage.py doctor               # environment, CV files, CSS budget, image weights
"$PY" manage.py edit                 # local admin UI at http://127.0.0.1:8765/
"$PY" manage.py deploy               # prints the release steps (executor cannot push)
```

## Manage content

```bash
"$PY" manage.py new my-case --title "My case"          # scaffold, published: false
"$PY" manage.py image my-case shot.png \
      --alt-en "Dashboard" --alt-ru "Дашборд"          # → WebP, 1600 px, entry appended
"$PY" manage.py status my-case nda                     # public | nda | commercial | rnd
"$PY" manage.py order my-case 2
"$PY" manage.py show my-case                           # published: true
"$PY" manage.py hide my-case                           # published: false (page disappears)
"$PY" manage.py rm my-case --yes                       # delete the folder
```

Scalar edits are line-precise: comments and formatting in the YAML survive.
`new` writes a placeholder cover so the case is valid before real screenshots exist;
the first `image` call replaces it.

The admin UI (`manage.py edit`) edits the same YAML files as **raw text** (no round-trip
reformatting), saves with validation, and can trigger a build. It is local-only, binds
127.0.0.1, and is not part of the deployed site.

## Site map of the build

| file | what it does |
|---|---|
| `build.py` | reads YAML, renders pages, copies assets (minifies CSS), writes sitemap/robots/_headers/_redirects |
| `scripts/validate.py` | content schema, both locales, images exist, links, forbidden tokens, CV files |
| `scripts/check_dist.py` | per page: lang/title/description/canonical/one h1; every img has alt; every internal link resolves; sitemap entries exist |
| `scripts/shoot.py` | Playwright: 1280 + 390 screenshots, page weight, 360 px overflow, alt/h1 checks |
| `manage.py` | the single command surface above |

## Design layer

`templates/*.html` + `static/css/site.css` + `static/js/site.js` + `static/fonts/*`.
Tokens in `:root`; components below them; motion has a dedicated section and a
`prefers-reduced-motion` block at the end. Image dimensions come from the file header
(`image_size()` in `build.py`), and `<stem>-800/-1200.webp` variants become `srcset`
automatically.

## Deploy

`.github/workflows/pages.yml` builds and publishes `dist/` to GitHub Pages on every push to
`main` (repo `kukhtik/kukhtik.github.io` → https://kukhtik.github.io/).
`.github/workflows/cloudflare.yml` is the manual Cloudflare Pages path (needs
`CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`).

## History

`docs/design-runs/` holds the two OpenDesign mocks (deepseek / glm) and the brief from the
first design round. That direction was rejected by the owner; the current design is
documented in `DESIGN.md`.

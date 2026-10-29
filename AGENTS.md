# AGENTS.md — runbook

Content-driven static site: slot table + the LCARS components → `dist/` → GitHub Pages.

**The design code is in `docs/lcars-code-design/`** - read `00-README.md` first.
The machine-readable form is `docs/lcars-code-design/lcars-spec.json`, and
`scripts/check_spec.py` fails the build when the stylesheets drift from it.

The console is the LCARS frame of theLCARS (banner, data cascade, navigation, the
panel staircase) with the content set into the window. The frame is the template's own
markup and CSS; `src2/content.css` only styles what we put inside the window.

## Golden rules

1. **Never edit `dist/`.** It is generated. Edit `content/`, `templates/`, `static/`.
2. **Never put copy in templates.** Facts live in `content/home-table.json` (and the legacy `content/*.yaml`).
3. **Never add a case by editing a template.** Add an entry to `content/home-table.json` under `slots.mid.projects` - the builder makes the page, the theme and the gallery from it.
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
"$PY" manage.py lab [--shoot]        # assemble the variants lab → dist/lab/ (+ render)
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
| `build/build.mjs` | the console builder: the slot table (`content/home-table.json`) + the frame and page templates in `src2/` become `dist/` |
| `build.py` | the entry point the workflow calls - runs the node builder and copies the CV files |
| `scripts/validate.py` | the legacy YAML content schema, both locales, images exist, links, forbidden tokens, CV files |
| `scripts/validate_slots.py` | the slot table: both locales per entry, the per-entry length limits, images on disk, no forbidden claim |
| `scripts/check_dist.py` | per page: lang/title/description/canonical/one h1; every img has alt; every internal link resolves; sitemap entries exist |
| `scripts/shoot.py` | Playwright: 1280 + 390 screenshots, page weight, 360 px overflow, alt/h1 checks |
| `manage.py` | the single command surface above |
| `out/lab/assemble_lab.py` | stitches the per-block variant fragments into `dist/lab/` (local review tool; `dist/` and `out/` are gitignored) |
| `out/lab/shoot_lab.py` | renders every lab block at 1280/390, checks console errors and 360 px overflow |

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


## Гейты (обязательны перед любым «это готово»)

```bash
python manage.py check --anti-ai     # контент + анти-ИИ линт + проверка фактов
python scripts/check_facts.py --self-test   # доказать, что проверка фактов вообще ловит
python scripts/check_fragment.py --page lab/lab.html --port 8150   # один фрагмент
```

- `scripts/check_ai_lint.py` — ИИ-подпись в дизайне. Лимиты откалиброваны по десяти
  реальным сайтам, сделанным человеком; `--calibrate` переизмеряет референсы.
- `scripts/check_facts.py` — правда в цифрах: выдуманная метрика, метрика чужого
  проекта, выдуманный проект. Есть `--self-test`.
- `scripts/check_fragment.py` — те же плотности по одному фрагменту, до переноса в сайт.
- `docs/ANTI-PATTERN.md` — почему такие лимиты и что с этим делать.

**Правило, которое ловушка фактов доказала на практике:** самоотчёт воркера —
это утверждение, а не факт. `beam` выдал журнал, где реальные числа RAG (96/100,
768/775) были приписаны GeoConverter и VETKA_DWG, плюс несуществующий проект
`terra-444`. Проверка «есть ли число» бы это пропустила. Проверяется **атрибуция**:
какому проекту принадлежит число.

## LCARS preview site
```
python manage.py lcars      # -> dist-lcars/  (LCARS home + the normal case studies)
python manage.py serve 8131 --root dist-lcars   # or just open dist-lcars/index.html
```
`dist-lcars/` is a preview only - `dist/` (production) is never touched by it.
The LCARS home is a static artifact in `out/opendesign/`; promoting it to
`templates/` is pending the owner's visual approval.

## The site IS the LCARS build (2026-10-28)
The old design system is gone: `static/css/site.css`, `static/js/site.js`, the
Inter Tight fonts and the classic `templates/{base,home,project,404}.html` were
deleted. What ships now:

| file | role |
|---|---|
| `templates/base_lcars.html` | the shell: rail + `<main>` + the LCARS stylesheets |
| `templates/home_lcars.html` | the home, in both locales |
| `templates/project_lcars.html` | the case-study pages |
| `templates/404_lcars.html` | the 404 page |
| `static/lcars/` | `app.css`, `lcars.css`, `fonts.css`, `app.js`, `fonts/`, `vendor/` (GSAP) |
| `content/ui.yaml` -> `lcars:` | the bilingual instrument chrome (38 labels) |

**Every number on the page comes from YAML.** The gauge target and the lead readouts
are `data-gauge` / `data-target` attributes rendered from `project.yaml`; `app.js`
reads them. Nothing is hardcoded in JS any more - a metric can never drift away from
the project it belongs to.

The `l-` prefix is the LCARS kit: elbow cantilevers, the vertical colour rail,
segmented bars, medallions. `app.js` draws the instrument graphics (isodose, MLC,
field map, vectorisation, coordinate lattice, waveform) into inline SVGs.

### Gates (all green)
```
python manage.py build          # validate -> build -> check
python scripts/check_ai_lint.py # densities + css
python scripts/check_facts.py --self-test
```

# DESIGN.md — site-v2

Direction: **instrument console**. The site is built like the service software of a
radiotherapy machine: dark clinical surface, one laser-green accent, technical drawing
elements (gantry, isocentre, gantry angle, SAD), mono readouts, motion that reads as
telemetry rather than decoration.

## Why this direction

The subject is not "a Python developer". It is an engineer who spent 2022—2026 maintaining
linear accelerators inside an RF-shielded bunker and built software under the same rule:
the result must be verifiable. The site therefore leads with the service record, not with a
stack list, and the visual language borrows from the machine he serviced — crosshairs,
isocentre rings, dose/telemetry readouts — not from a SaaS landing page.

## Directions rejected

1. **Technical datasheet** (previous version: hairline rules, mono labels, paper-white).
   Rejected by the owner: reads as a printed document, no visual pull, projects did not
   look clickable.
2. **Editorial / type-only** (large serif, folios, no graphics). Authorial and quiet, but it
   tells nothing about medical engineering and gives the eye nothing to land on.
3. **Card grid with pastel gradients.** Generic portfolio template; flattens three very
   different projects into identical tiles.

## What the design is made of

- **Hero**: name at 86 px, a two-line lead, and a *schematic* of a linac gantry — bore ring,
  tick ring, rotating head, beam cone, treatment table, isocentre reticle — drawn as inline
  SVG, animated in CSS. A `data-dial` parallax (12 px max) follows the pointer on hover-capable
  devices only.
- **Telemetry strip**: four readouts (based / timezone / availability / English) in the
  machine-data idiom.
- **Service record**: a three-entry timeline, 2022 → 11.2026 clinical service, the software
  built alongside it, and the move to full-time.
- **Work**: one wide card + two half cards. The whole card is a link (`h3 a::after` stretches
  over the card), hover lifts it 4 px and sweeps a green scanline across the screenshot.
- **Capabilities**: three cards with hand-drawn SVG glyphs (isocentre, structure, signal).
- **About / contact**: paper-quiet panels on the dark surface; the email is the largest
  interactive element on the page.

## Tokens

All in `:root` in `static/css/site.css`; the build minifies CSS into `dist/`.

| token | value | use |
|---|---|---|
| `--ink` | `#05090A` | page background |
| `--panel` / `--panel-2` | `#0B1214` / `#101A1D` | cards, asides |
| `--line` | `#1C2A2D` | 1 px rules, borders |
| `--text` | `#E9F2F0` | body copy (contrast 17.5:1) |
| `--muted` | `#93A8A5` | secondary copy (7.99:1) |
| `--accent` | `#45F08F` | laser green: CTAs, badges, instrument strokes |
| `--amber` | `#F3B45E` | NDA / commercial badges only |
| `--radius` | `14px` | cards; `8px` for small controls |
| `--wrap` | `1180px` | content width |
| `--font-sans` | Inter Tight (self-hosted, subset latin+cyrillic) | everything |
| `--font-mono` | JetBrains Mono (self-hosted, subset) | labels, metrics, file bars |

Type scale: display `clamp(2.9rem, 7.4vw, 5.4rem)`, h2 `clamp(1.9rem, 3.4vw, 2.9rem)`,
body 17 px/1.65, mono labels 10–12 px with `0.08–0.16em` tracking.

## Motion inventory

| element | motion | reduced-motion |
|---|---|---|
| `.grid-bg` | static technical grid, radial mask | hidden |
| `.scanline` | 140 px light bar sweeps the page every 14 s | hidden |
| `.brand-mark::after` | crop-frame pulse 3.6 s | disabled |
| `.status-dot i` | availability pulse 2.4 s | disabled |
| `.ins-gantry` | gantry rotates 360° in 22 s | disabled |
| `.ins-reticle` | isocentre breathing 3.4 s | disabled |
| `.hero-rule` | accent rule draws in on load | disabled |
| cards | 4 px lift + scanline sweep on hover | transitions 0.01 ms |
| sections | `[data-reveal]` fade/rise via IntersectionObserver | all visible at once |

`prefers-reduced-motion: reduce` kills every animation and transition and shows all content.
Without JS (`html.no-js`) the page is complete; nothing depends on script.

## Files

- `templates/base.html` — head, header (brand, status, nav, language), footer.
- `templates/home.html` — hero + instrument SVG, telemetry, record, work, capabilities, about, contact.
- `templates/project.html` — case page: hero, cover, problem/approach/results/stack/public, aside links + gallery.
- `static/css/site.css` — tokens + all components (source); minified at build.
- `static/js/site.js` — 2.4 KB: reveals + pointer parallax, nothing else.
- `static/fonts/*.woff2` — Inter Tight + JetBrains Mono, latin + cyrillic subsets, SIL OFL.

## Measured (local, `scripts/shoot.py` + Lighthouse 12.8 mobile)

| page | weight | CSS | JS | LCP | CLS | a11y / BP / SEO |
|---|---|---|---|---|---|---|
| `/` | 154–157 KB | 24.9 KB | 2.3 KB | 1.7–1.9 s | 0 | 100 / 100 / 100 |
| `/work/engineer-companion/` | 17.7 KB | 24.9 KB | 2.3 KB | 1.9 s | 0 | 100 / 100 / 100 |

Performance: 95–99 depending on machine load (two consecutive runs: 99 and 95, same build).
No horizontal scroll at 360 px, contrast never below 6.3:1, all images have intrinsic
`width`/`height` and `srcset` variants (800/1200 w).

## How to change the design

1. Tokens first: colour, radius, type scale in `:root`. Most changes stop there.
2. Structure lives in `templates/`; class names are the contract with `site.css`.
3. Motion: add a rule, then add the matching line to the `prefers-reduced-motion` block —
   nothing ships animated without an off switch.
4. After any change: `python manage.py build` → `python manage.py shoot` (renders 1280/390,
   checks 360 px overflow, alt text, one `h1`, prints page weight).

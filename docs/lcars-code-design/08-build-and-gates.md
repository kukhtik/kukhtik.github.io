# The build and the gates

## The pipeline

```
content/home-table.json  +  src2/ (the frame, the pages, the CSS, the JS)
        │
        ├─ build/frame.mjs        the generator: the readout field, the spine
        └─ build/build.mjs        the assembler: every page, both languages
                │
                └─ dist/           37 pages, the assets, the sitemap
```

`node build/build.mjs` writes the site. `python build.py` is what the
workflow calls; it wipes `dist/` first, so a stale file can never make a
check pass.

## The gates

Each gate proves one thing, and the build fails if it does not hold.

| gate | what it proves |
|---|---|
| `scripts/validate.py` | the legacy YAML content: both languages, the images, the links, the CV files |
| `scripts/validate_slots.py` | the slot table: both languages per entry, the per-entry length limits, the images on disk, one source link per case, no forbidden claim |
| `build.mjs` | the generated markup is **balanced** - an unbalanced end tag moves a block out of its parent and silently breaks the frame |
| `scripts/check_dist.py` | every page: the lang, the title, the description, the canonical, exactly one `h1`, an `alt` on every image, every internal link resolves, the sitemap matches the files |
| `scripts/check_frame.py` | the frame rules: the 8 px gutters, the 40 px cells, the 20 px elbow, the 31 px edge, no sideways scroll, one `h1` |
| `scripts/check_spec.py` | the CSS still agrees with `docs/lcars-code-design/lcars-spec.json` - the tokens have not drifted from the documents |

## The workflow

`.github/workflows/pages.yml` runs on every push to `main`:

```
checkout -> setup python -> setup node -> pip install -> validate
         -> validate_slots -> build -> check_dist -> upload -> deploy
```

The site is published by GitHub Pages on the custom domain
`kukhto.is-a.dev` (the certificate is approved and HTTPS is enforced).

## Adding content

* **a fact**: one entry in the appropriate group of `content/home-table.json`,
  in both languages, inside its limit.
* **a case**: one entry in `mid.projects` with its slug, its title, its
  summary, its problem, its approach, its results, its source link and its
  screenshots. The page, the spine block, the theme and the gallery are
  generated from it.
* **a section**: one entry in `sections` and one block in the page template.
* **a page**: one template in `src2/pages/` and one entry in the `PAGES`
  list of `build/build.mjs`.

Nothing in a template hard-codes a fact, and nothing needs a template change
when the content changes.

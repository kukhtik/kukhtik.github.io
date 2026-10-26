# DESIGN.md — Maxim Kukhto personal site (v2)

## Direction: technical datasheet with editorial hierarchy

Derived from the subject itself — measurement, tolerance, evidence. Hairline rules divide the
page like a calibration protocol; every section and case is index-numbered (01/02/03, dates in
small caps under title); all numbers and meta-labels are set in monospace with tabular figures,
so measured values read as measured values. Display type is large, tightly tracked, and the
accent is rationed to numbering, the availability flag, and one primary CTA. Rejected:
gradient/dark-hacker themes (decorative, contradicts evidence-first calm), SaaS card grids with
icons and shadows (template feel), serif display (editorial posturing for an engineering brief),
external icon packs (scope), and any invented social-proof elements.

## Tokens (`:root` in site.css)

- Colour: `--bg oklch(0.976 0.002 260)`, `--surface oklch(0.995 0 0)`, `--fg oklch(0.19 0.015 260)`,
  `--muted oklch(0.45 0.02 260)`, `--border oklch(0.885 0.006 260)`, `--border-strong oklch(0.72)`,
  one accent `--accent oklch(0.46 0.13 258)` (deep metrology blue, AA on bg).
- Type: system sans (`Segoe UI` stack) for display/body + `ui-monospace` stack for labels/values.
  Scale: 48/32–36 display, 20–22 h2, 17 body, 13–14 mono meta; leading 1.1–1.45 display, 1.6 body.
- Spacing: 4/8/12/16/24/32/48/72 px steps (`--space-1..8`); radii: 4px only (datasheet, not bubbly).
- Layout: content max 1088px, case prose capped at 68ch; cards split image/body 2:3 ≥940px.

## Notes

- One file `site.css` shared by `home.html` and `case.html`; ~9 KB, no JS, no external requests.
- Imagery: only the two real screenshots from `img/`; VETKA_DWG card uses a hatched NDA panel
  instead of a placeholder stock image.
- Accessibility: skip-link, landmarks, focus-visible ring, 44px targets, reduced-motion friendly
  (no motion shipped), alt on every image, contrast ≥ 4.5:1 body / 3:1 large.

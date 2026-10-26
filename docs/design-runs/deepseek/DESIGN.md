# DESIGN.md: Maxim Kukhto, v2

**Direction:** technical datasheet. The site is laid out like an instrument record: hairline rules, a fixed measure, monospace for every label and measured value, and cases presented as evidence rows rather than marketing cards.

**Why it fits:** the subject is measurement, tolerance, calibration and offline operation. The visual language borrows from the documents Maxim already works with (specification pages, calibration reports, test output) rather than from a developer-portfolio template.

**Composition:** 1120px max width, 20–40px gutters, full-bleed section rules, one asymmetric hero (copy + profile record), a three-cell evidence rail, a featured case with a real screenshot, two NDA cases as specification rows. Case body is capped at 70ch with a 300px sticky aside.

**Type:** two system faces only. Segoe UI Variable / SF for display and reading; Cascadia Mono / SF Mono / Consolas for metadata and numbers. Display 72/1.02, H1 56/1.05, H2 36/1.1, case title 28/1.15, body 17/1.65, labels 11–12/1.4. Display tracking -0.035em; mono labels +0.02em; body tracking 0.

**Colour:** cool document neutrals plus one rust accent, taken from the orange action control visible in the product screenshots. Accent appears on the CV button and the contact email underline only. Status is text, never a coloured dot.

**Tokens** (CSS custom properties in `:root`, light):
--bg oklch(0.982 0.002 255) · --surface oklch(0.962 0.004 255) · --fg oklch(0.21 0.01 255) · --muted oklch(0.45 0.01 255) · --border oklch(0.875 0.006 255) · --accent oklch(0.50 0.15 38)
Dark scheme overrides the same names (`prefers-color-scheme`) with --bg oklch(0.185 0.006 255), --fg oklch(0.945 0.003 255), --accent oklch(0.75 0.125 45).

**Space / shape:** 4px base scale; section padding 48–72px; grid gaps 24–80px; radius 2px on buttons, badges, images and chips; 1px rules, 2px only where a block starts (profile, facts, aside). No shadows.

**Rejected:** editorial serif (too authorial for a hiring scan); "dark hacker" terminal styling (the screenshots already carry technical credibility, and the site must stay readable in daylight); card grids with rounded corners and gradient blobs (generic SaaS); numbered section eyebrows and scroll animation (noise, no evidence); icon packs (the metrics are the iconography).

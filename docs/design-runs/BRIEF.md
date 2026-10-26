# BRIEF — personal site of Maxim Kukhto (v2, case-study site)

Static personal site. Two locales (EN at `/`, RU at `/ru/`), home + one page per case.
This mock is the **design layer only**: we will port the chosen design into Jinja2 templates
afterwards, so keep the markup semantic and the CSS tokens explicit.

## Deliverables

1. `home.html` — the EN homepage, complete, self-contained page (inline `<style>` or one
   `site.css` next to it). No framework, no build step, no JavaScript required to read it.
2. `case.html` — one case page (Engineer Companion), same design language.
3. `DESIGN.md` — 12–20 lines: the direction you chose, why it fits this subject, the design
   tokens (colour, type scale, spacing, radii), and what you rejected.

## Subject (facts are real — do not invent anything)

Maxim Kukhto — Python / AI engineer. Focus: CAD/GIS automation, offline RAG, LLM agents, medtech.
Based in Mogilev, Belarus; UTC+3; works remote; English B2.
Currently a medical-equipment engineer at a radiotherapy centre (since 2022), leaving in
November 2026; available full-time from late November 2026.

Audience, in priority order:
1. tech lead / hiring manager — reads code, metrics, architecture; distrusts claims without artifacts;
2. HR / recruiter — scans role, seniority, stack, availability, then stops;
3. freelance client — looking for "someone who solves my problem", not a portfolio.

Within 20 seconds, without scrolling, a stranger must know: who this is, what he builds,
that there is proof, and when he can start.

## Feel

Professional, technical, calm. Not a SaaS landing page, not "dark hacker", not a template with
gradient blobs. Cases and measured numbers lead; "about" supports. Strong typographic hierarchy,
generous whitespace, one accent colour used sparingly.

## Hard constraints

- Content width 1080–1120px max; case body text 68–72ch.
- At most 2 typefaces. System font stack or self-hosted only — **no Google Fonts, no CDN, no
  external requests of any kind** (images come from `img/`).
- One accent colour; body text contrast ≥ 4.5:1, large text ≥ 3:1; visible `:focus-visible` ring;
  a skip-link to the main content; semantic landmarks.
- No JavaScript needed for content. `prefers-reduced-motion` respected.
- Every `<img>` gets `width`/`height` or `aspect-ratio` (no layout shift) and real `alt` text.
- 360px wide: no horizontal scrolling; tap targets ≥ 44px.
- No carousels, autoplay, parallax, icon packs, decorative animation, emoji, fake client logos.
- Header: name/mark, nav (Work, About, Contact), EN/RU switch (visual in the mock).
- Hero: name, role, lead, availability line, location + UTC+3, English B2, CTAs (CV, GitHub, email).
- Three case cards: status badge, year, title, 1–2 line summary, exactly three metrics, "View case".
- "What I do": three directions, numbered 01/02/03.
- "About": 2–3 paragraphs plus a short facts list.
- Contact: email, GitHub, LinkedIn, CV.
- Footer: © 2026 Maxim Kukhto · "static site · no trackers".
- Case page: back link, status + year + title + lead, cover image with caption, then
  Problem / Approach / Results / Stack / What is public, and a sidebar with links and a gallery.

## Design directions to consider (pick one, make it specific)

- **Type-led editorial** — big display type, hairline rules, numbers as graphic elements.
- **Technical datasheet** — tight grid, monospace labels, tables, index numbering, specification feel.
- **Engineering log** — annotated sections, marginal notes, evidence-first framing.

Whatever you choose must feel derived from this subject (measurement, tolerance, evidence,
offline operation) rather than from a generic "developer portfolio" template.

## Copy — use verbatim

Hero lead:
"I build systems that work without internet — and prove their work with tests, measured latency, and evidence links."

Hero note:
"Currently a medical-equipment engineer at a radiotherapy centre; leaving in November to do software full-time."

Availability: "Available full-time from late November 2026"
Location line: "Mogilev, Belarus · UTC+3 · remote · English B2"

Case 1 — Engineer Companion — offline RAG · status: Public code · year 2026
Summary: "Offline RAG over radiotherapy equipment documentation. Hybrid LanceDB + BM25 retrieval, local embeddings and reranker, CPU-only. Answers cite document, page and drawing region."
Metrics: 21,214 facts indexed · 96/100 benchmark accuracy · 130 ms p50 latency (CPU)

Case 2 — VETKA_DWG — photo of a survey sketch → DXF · status: Source private · NDA · year 2026
Summary: "Computer-vision pipeline that turns a photo of a hand-drawn survey sketch into a topographic DXF. Marker detection, OCR, block library. Cuts manual drafting from 4 hours to 15 minutes."
Metrics: 4 h → 15 min drafting time · 3 surveying companies in production · 444 GUGK blocks in the library

Case 3 — GeoConverter — geodetic coordinate conversion · status: Commercial · NDA · year 2023–2024
Summary: "Commercial desktop product for sub-millimetre conversion between legacy local coordinate systems and WGS-84. Four-stage numerical calibration, round-trip validation, hardware-locked licensing."
Metrics: <1 mm round-trip error · 20+ local coordinate systems · Commercial release, government clients

What I do:
01 Offline and on-prem RAG — "Document ingestion, hybrid retrieval, reranking, local quantized inference (llama.cpp / GGUF, ONNX), evaluation harnesses, evidence-linked answers."
02 CAD/GIS automation — "DXF/DWG generation, photo-to-drawing CV pipelines, coordinate systems, numerical calibration, desktop tooling with PySide6/PyQt6."
03 Python backend and desktop — "FastAPI services, async pipelines, SQL schemas and migrations, Cloudflare Workers/D1/R2, CI with coverage and mutation gates."

About:
1. "I am a medical-equipment engineer at the Mogilev Regional Oncology Dispensary, where I maintain Varian TrueBeam / VitalBeam linear accelerators. That work is safety-critical and documentation-heavy — which is exactly why I built Engineer Companion: a field engineer in an RF-shielded bunker needs the exact page in seconds, with no internet."
2. "I have been building software alongside that role since 2020: a commercial geodetic converter, a production photo-to-DXF pipeline, an offline RAG system, and a live Telegram product. I am leaving the clinical role in November 2026 to work on software full-time."
3. "Commercial projects are covered by NDA. I can show architecture, screenshots, and measured results; source stays private."

Facts: Based — Mogilev, Belarus · Timezone — UTC+3 · Availability — full-time from late Nov 2026 ·
English — B2 · Focus — RAG · CAD/GIS · Python

Contact: maxkukhto@gmail.com · github.com/kukhtik · LinkedIn · CV (PDF)

### Case page — Engineer Companion

Lead: "A field engineer in an RF-shielded bunker needs the exact page of a specification in
seconds, with no internet — out of tens of thousands of pages of manuals."

Problem: "A field engineer servicing a clinical linear accelerator works in an RF-shielded bunker
with no internet and needs the exact page of a specification in seconds — out of tens of thousands
of pages of manuals."

Approach:
- "One Python core: PDF indexing, chunking, embeddings, LanceDB retrieval and a fact catalogue."
- "Hybrid retrieval: dense vectors + BM25, with a cross-encoder reranker."
- "Local quantized inference (Gemma-3-4B, GGUF / llama.cpp); every answer carries an evidence link
  to document, page and drawing region."

Results: 21,214 facts indexed · 96/100 benchmark accuracy · 130 ms p50 latency · 768/775 tests passing

Stack: Python · LanceDB · BM25 · multilingual-e5-small · mmarco reranker · Gemma-3-4B (GGUF) ·
llama.cpp · PySide6 · pytest

What is public: "Public code. The repository contains the retrieval and generation code and the
test suite; the benchmark harness is internal."

Links: Public code (github.com/kukhtik/engineer-companion) · Architecture notes (github.com/kukhtik/Open_space)

Cover image: `img/engineer-companion-chat.png`
Caption: "Answer with evidence links: document, page, drawing region."
Gallery: `img/geoconverter.png` — "Generated calibration report with round-trip residuals."

## Available screenshots

`img/engineer-companion-chat.png` and `img/geoconverter.png` are real product screenshots.
Use them as the case imagery in `home.html` and `case.html` — no placeholder boxes, no stock photos.

## Acceptance

- 1280px and 390px render intentionally; nothing orphaned or cramped.
- No horizontal scroll at 360px.
- One `<h1>` per page, ordered headings, landmarks, `alt` on every image.
- Contrast passes AA; focus is visible; skip-link works.
- Lean CSS (target < 30KB), no external requests — the site must score ≥ 95 mobile Lighthouse
  in performance, accessibility, best practices, SEO.
- No generic "portfolio" clichés: no glassmorphism, no gradient blobs, no emoji, no invented logos.

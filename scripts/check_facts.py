#!/usr/bin/env python3
"""Fact-check the lab fragments against the real project data.

The failure mode this catches is the one that actually happened: not invented
numbers, but REAL numbers attached to the WRONG project. A fragment that gave
GeoConverter the RAG benchmark score (96/100) and VETKA_DWG the test count
(768/775) reads as impressive and is a lie. A value-only check cannot see that -
it needs attribution.

Rules:
  1. NO INVENTED NUMBERS  - a project metric must exist in project.yaml.
  2. NO MIS-ATTRIBUTION    - a number that belongs to project X must not appear in
     a row about project Y (only for numbers exclusive to one project, so shared
     small values like "3" do not produce false positives).
  3. NO INVENTED PROJECTS  - a project identifier that is not in project.yaml is a
     fabrication even when its numbers are real.
  4. DEVICE FACTS ARE SCOPED - 0.5 mm is a true fact about the linac (isocentre)
     but a fabricated tolerance when it sits next to "допуск" in a project row.

The gate must be able to fail: `--self-test` runs it against deliberately WRONG
snippets and asserts every one is caught.

Usage:
    python scripts/check_facts.py
    python scripts/check_facts.py out/lab/_v_dos.html
    python scripts/check_facts.py --self-test
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
LAB = ROOT / "out" / "lab"
PROJECTS = ROOT / "content" / "projects"

# Numbers that describe the MACHINE. Allowed only near machine words.
DEVICE_FACTS = {"1000", "120", "0.5", "118", "1.0", "0.3", "24", "2.00", "1.84", "12.4",
                "50", "25", "40", "200", "90", "180", "360", "45", "28", "16"}
DEVICE_WORDS = re.compile(
    r"sad|mlc|изоцентр|isocentr|truebeam|vitalbeam|ускорител|accelerator|гантри|gantry|"
    r"номенклатур|фотон|photon|мев|mev|gy|гр\b|мгр|sv|зиверт", re.I)

# Layout-only numbers: viewport widths, pixel sizes, percentages of nothing.
LAYOUT = re.compile(r"px\b|vw\b|vh\b|%")

CLAIM_CUES = (
    r"факт\w*", r"точн\w*", r"бенчмарк\w*", r"p50", r"латент\w*", r"задержк\w*",
    r"тест\w*", r"мс\b", r"мм\b", r"px\b", r"блок\w*", r"систем\w*", r"компани\w*",
    r"часов", r"\bч\b", r"мин\b", r"/100", r"изодоз\w*", r"допуск\w*", r"измерен\w*",
    r"погрешност\w*", r"остат\w*", r"доза\w*", r"норм\w*", r"запас\w*", r"предел\w*",
    r"план\w*", r"контрол\w*", r"сеанс\w*", r"калибровк\w*", r"отклонени\w*", r"карт\w*",
    r"фракци\w*", r"грей\w*", r"индекс\w*", r"выдач\w*", r"поиск\w*", r"операц\w*",
    r"соглас\w*", r"привед\w*", r"конверт\w*", r"вектор\w*", r"черт[её]ж\w*", r"абрис\w*",
    r"покрыт\w*", r"сет\w*", r"точк\w*", r"коммерч\w*", r"nda", r"rnd", r"блок\w*",
    r"релиз\w*", r"производств\w*",
)
CUE_RE = re.compile("|".join(CLAIM_CUES), re.I)
NUM_RE = re.compile(r"\d{1,3}(?:[ \u00a0]\d{3})+(?:[.,]\d+)?|"
                     r"\d+(?:[.,]\d+)?(?:[eE][-+]?\d+)?")
TS_RE = re.compile(r"\[\s*\d{1,2}:\d{2}(?:[.:]\d+)?\s*\]")
# an invented product identifier: lowercase, dashed, and carrying a digit
# ("terra-444" is caught; "WGS-84", "CPU-only", "скролл-механика" are not projects)
PROJID_RE = re.compile(r"\b[a-z][a-z0-9]*(?:-[a-z0-9]+)*[0-9][a-z0-9]*(?:-[a-z0-9]+)*\b")


def norm(tok: str) -> str:
    return tok.replace(" ", "").replace(",", "").lower()


def is_year(n: str) -> bool:
    return len(n) == 4 and n.isdigit() and n.startswith("20")


def resolve(raw: str, known: set[str]) -> list[str]:
    """Return the parts of a numeric token that are NOT in `known`.

    A token like "50 130" can be two adjacent numbers rather than one grouped
    number, so a token that is unknown is re-split on spaces and each part is
    checked on its own. Only the parts that are genuinely unknown come back.
    """
    n = norm(raw)
    if n in known:
        return []
    parts = [x for x in re.split(r"[ \u00a0]+", raw.strip()) if x]
    if len(parts) > 1:
        bad = []
        for part in parts:
            pn = norm(part)
            if pn not in known and not is_year(pn):
                bad.append(part)
        return bad
    if is_year(n):
        return []
    return [raw.strip()]


def load_projects() -> dict[str, dict]:
    out = {}
    for pfile in sorted(PROJECTS.glob("*/project.yaml")):
        d = yaml.safe_load(pfile.read_text(encoding="utf-8")) or {}
        d["_slug"] = d.get("slug", pfile.parent.name)
        out[d["_slug"]] = d
    return out


def aliases(proj: dict) -> list[str]:
    """Every string the site may use to refer to this project."""
    names: set[str] = {proj["_slug"], proj["_slug"].replace("-", " ")}
    for t in (proj.get("title") or {}).values():
        if isinstance(t, str):
            names.add(t)
            names.add(t.split("—")[0].split(" - ")[0].strip())  # short name
    for key in ("name", "short", "label"):
        v = proj.get(key)
        if isinstance(v, str):
            names.add(v)
    return sorted({n for n in names if n and len(n) > 2}, key=len, reverse=True)


def owned_numbers(proj: dict) -> set[str]:
    toks: set[str] = set()

    def add(raw: str) -> None:
        s = str(raw).replace(",", " ").replace(" ", " ").strip()
        if not s:
            return
        toks.add(norm(s))
        for piece in re.findall(r"\d[\d.,]*", s):
            toks.add(norm(piece))
            toks.add(norm(piece.replace(",", " ")))

    for r in proj.get("results") or []:
        add(r.get("value", ""))
    return toks


def site_numbers() -> set[str]:
    toks: set[str] = set()
    for name in ("site.yaml", "ui.yaml"):
        text = (ROOT / "content" / name).read_text(encoding="utf-8")
        for piece in re.findall(r"\d[\d.,]*", text):
            toks.add(norm(piece))
    return toks


def visible_text(html: str) -> str:
    html = re.sub(r'(data-(?:to|count)="([\d.]+)")[^>]*>\s*0\s*<', r"\1>\2<", html)
    assigns = dict(re.findall(
        r'(?:const|let|var)?\s*([\w-]+)\.textContent\s*=\s*[^;]*?\?\s*[\'"]([\d.]+)[\'"]', html))
    for vid, final in assigns.items():
        html = re.sub(r'(id="%s"[^>]*>)\s*[\d.]+\s*<' % re.escape(vid), r"\g<1>%s<" % final, html)
    html = TS_RE.sub(" ", html)
    t = re.sub(r"<style>.*?</style>", " ", html, flags=re.S)
    t = re.sub(r"<script>.*?</script>", " ", t, flags=re.S)
    t = re.sub(r"<svg.*?</svg>", " ", t, flags=re.S)
    t = re.sub(r"<!--.*?-->", " ", t, flags=re.S)
    t = re.sub(r"<[^>]+>", " ", t)
    t = re.sub(r"&[a-z]+;", " ", t)
    return re.sub(r"[ \t]+", " ", t)


def rows_of(html: str) -> list[str]:
    """Text of each table row / list item - the natural unit of attribution."""
    out = []
    for m in re.finditer(r"<tr\b.*?</tr>|<li\b.*?</li>|<dd\b.*?</dd>", html, re.S | re.I):
        txt = visible_text(m.group(0))
        if txt.strip():
            out.append(txt.strip())
    return out


def check(html: str, projects: dict[str, dict]) -> list[str]:
    problems: list[str] = []
    owner: dict[str, set[str]] = {s: owned_numbers(p) for s, p in projects.items()}
    all_owned = set().union(*owner.values()) if owner else set()
    site_nums = site_numbers()

    # number -> the single project it belongs to (exclusive numbers only)
    exclusive: dict[str, str] = {}
    for slug, nums in owner.items():
        for n in nums:
            if n in exclusive and exclusive[n] != slug:
                exclusive[n] = "*shared*"      # appears in two projects: not diagnostic
            elif n not in exclusive:
                exclusive[n] = slug

    alias_map: dict[str, str] = {}
    for slug, proj in projects.items():
        for a in aliases(proj):
            alias_map[a.lower()] = slug

    # ---- rule 3: invented projects -------------------------------------------------
    for m in PROJID_RE.finditer(visible_text(html)):
        cand = m.group(0)
        low = cand.lower()
        if low in alias_map:
            continue
        if any(low in a for a in alias_map):
            continue
        if re.search(r"\b(?:rnd|nda|public|commercial|offline|rag|dwg|dxf|geo|cad|qml|"
                     r"truebeam|vitalbeam|py|pyqt|pyside|opencv|ocr|sqlite|postgres|"
                     r"html|css|js|json|yaml|md|txt|docx|pdf|utf|ascii|iso|api|"
                     r"p50|p95|p99|latency|ms|cpu|gpu|bm25|llm|rag)\b", low):
            continue
        tail = visible_text(html)[m.end():m.end() + 50]
        if CUE_RE.search(tail) and re.search(r"\d", tail):
            problems.append(f"выдуманный проект: {cand!r} (нет такого в project.yaml)")

    # ---- rules 1, 2, 4 inside project rows ------------------------------------------
    for row in rows_of(html):
        low_row = row.lower()
        hit = [alias_map[a] for a in alias_map if a in low_row]
        hit = [s for s in hit if s != "*shared*"]
        if not hit:
            continue
        slug = hit[0]
        row_scan = re.sub(r"\bp\d+\b", "p", row)
        # a pixel figure is a measurement here when the row talks about tolerance
        tolerance_ctx = bool(re.search(r"допуск|отклонени|точн|норм", row, re.I))
        for m in NUM_RE.finditer(row_scan):
            raw = m.group(0).strip()
            if LAYOUT.search(row_scan[m.end():m.end() + 4]) and not tolerance_ctx:
                continue
            for part in resolve(raw, owner[slug] | site_nums):
                pn = norm(part)
                if pn in owner[slug] or pn in site_nums:
                    continue
                if pn in DEVICE_FACTS:
                    if DEVICE_WORDS.search(row):
                        continue
                    problems.append(f"цифра прибора {part!r} в строке проекта {slug!r} без слов о приборе")
                    continue
                ex = exclusive.get(pn)
                if ex and ex not in ("*shared*", slug):
                    problems.append(f"метрика {part!r} принадлежит проекту {ex!r}, а стоит в строке {slug!r}")
                    continue
                if re.fullmatch(r"\d{1,2}", pn) and not tolerance_ctx:
                    continue
                problems.append(f"метрика {part!r} в строке {slug!r} не найдена в project.yaml")

    # ---- rule 1 outside rows: a metric claim with a number nobody owns --------------
    known = all_owned | site_nums
    for sentence in re.split(r"[.;:\n]", visible_text(html)):
        if not CUE_RE.search(sentence):
            continue
        scan = re.sub(r"\bp\d+\b", "p", sentence)
        for m in NUM_RE.finditer(scan):
            raw = m.group(0).strip()
            if LAYOUT.search(scan[m.end():m.end() + 4]):
                continue
            for part in resolve(raw, known):
                pn = norm(part)
                if pn in known or pn in DEVICE_FACTS or is_year(pn):
                    continue
                if re.fullmatch(r"\d{1,2}", pn):
                    continue
                problems.append(f"метрика {part!r} не найдена в данных проектов")
    return problems


SELF_TEST = [
 ("RAG score on GeoConverter",
  '<tr><td>GeoConverter</td><td>96/100 точность</td><td>21 214 фактов</td></tr>'),
 ("RAG test count on VETKA_DWG",
  '<tr><td>VETKA_DWG</td><td>768/775 тестов</td><td>4 ч в 15 мин</td></tr>'),
 ("invented tolerance on GeoConverter",
  '<tr><td>GeoConverter</td><td>допуск 0.5 px</td></tr>'),
 ("invented project terra-444",
  '<tr><td>terra-444</td><td>130 мс p50</td></tr>'),
 ("invented number 42 000",
  '<tr><td>Engineer Companion</td><td>42 000 фактов</td></tr>'),
 ("correct row must NOT be flagged",
  '<tr><td>VETKA_DWG</td><td>4 ч → 15 мин</td><td>444 блока ГУГК</td></tr>'),
]


def main() -> int:
    if "--self-test" in sys.argv:
        projects = load_projects()
        ok = True
        for label, snippet in SELF_TEST:
            problems = check(snippet, projects)
            expect_clean = label.startswith("correct row")
            if expect_clean and problems:
                print(f"   FALSE POSITIVE [{label}]: {problems[0]}")
                ok = False
            elif not expect_clean and not problems:
                print(f"   MISSED [{label}] - the gate is too weak")
                ok = False
            elif not expect_clean:
                print(f"   caught [{label}]: {problems[0]}")
        if not ok:
            print("SELF-TEST FAILED")
            return 1
        print(f"SELF-TEST OK: {len(SELF_TEST) - 1} wrong snippets caught, 1 correct row accepted")
        return 0

    args = [a for a in sys.argv[1:] if a != "--self-test"]
    files = [Path(a) for a in args] or sorted(LAB.glob("_v_*.html"))
    projects = load_projects()
    failed = []
    for f in files:
        if not f.is_file():
            continue
        problems = check(f.read_text(encoding="utf-8"), projects)
        if problems:
            failed.append((f, problems))
    for f, problems in failed:
        print(f"FAIL {f}")
        for pr in problems:
            print(f"   - {pr}")
    if not failed:
        print(f"FACT-CHECK OK: {len(files)} фрагмент(ов): метрики существуют и принадлежат верному проекту")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())

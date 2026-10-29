// ===================================================================
// The frame is generated, not copied.
//
// The shell of theLCARS is a constant - the same bar widths and the same
// 24-column readout field on every one of their pages. What differs is the
// content layer, and that is where the design code lives:
//
//   * the readout field is a fixed grid of columns x rows of right-aligned
//     digits. The grid is the constant, the numbers are the content - so
//     the field is filled with OUR measurements;
//   * the left column is a stack of panels, one per section, and the
//     heights follow from the content of those sections;
//   * the colour cycle of the digits is the template's own (data-group-*),
//     so the field breathes the way the original does.
//
// See docs/lcars-design-code.md for the measurements behind these rules.
// ===================================================================

const FIELD_COLUMNS = 24;   // measured: every page of the template has 24
const FIELD_ROWS = 7;       // measured: dc-row-1 .. dc-row-7

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// A metric becomes the digits it contains: "21,214" -> 21 / 214,
// "96/100" -> 96 / 100, "4-5x" -> 4 / 5.
function digitsOf(value) {
  const parts = String(value ?? '')
    .split(/[\s,/·→+×%]/)
    .map((part) => part.replace(/[^\d.]/g, ''))
    .filter(Boolean);
  return parts.length ? parts : [];
}

// The stream of our real numbers, in reading order. Every number here is a
// measured fact from the content table - a metric, a stack version, a year,
// a screenshot count. Nothing is filler.
function numberStream(table) {
  const out = [];
  const push = (value) => { for (const part of digitsOf(value)) out.push(part); };
  const pushText = (value) => {
    const text = typeof value === 'object' && value !== null
      ? (value.en ?? value.ru ?? '')
      : String(value ?? '');
    for (const part of text.split(/[^0-9]+/)) if (part && part.length <= 6) out.push(part);
  };

  for (const [index, project] of (table.slots['mid.projects'] ?? []).entries()) {
    for (const result of project.results ?? []) push(result.value);
    pushText(project.subtitle);
    pushText(project.stack);
    push(String((project.images ?? []).length));
    push(String(index + 1).padStart(2, '0'));
    // the measured numbers inside the prose - they are our facts too
    pushText(project.problem);
    pushText(project.approach);
  }
  for (const entry of table.slots['mid.record'] ?? []) {
    for (const part of String(entry.when ?? '').split(/[^0-9]+/)) if (part) out.push(part);
  }
  for (const entry of table.slots['mid.services'] ?? []) {
    for (const part of String(entry.number ?? '').split(/[^0-9]+/)) if (part) out.push(part);
    pushText(entry.title);
  }
  for (const entry of table.slots['left.facts'] ?? []) {
    pushText(entry.value?.en ?? entry.value ?? '');
    pushText(entry.label?.en ?? entry.label ?? '');
  }
  for (const entry of table.slots['bottom.more'] ?? []) {
    pushText(entry.title);
    pushText(entry.text);
  }
  for (const entry of table.slots['mid.record'] ?? []) {
    pushText(entry.title);
  }
  for (const entry of table.slots['page.about'] ?? []) {
    pushText(entry.text);
  }
  return out;
}

// The readout field: a fixed grid, filled column by column with our numbers.
// The first two columns carry the live clock and the machine state.
function cascade(table, lang) {
  const live = [
    [['--', 'clock-h'], ['--', 'clock-m'], ['--', 'clock-s'],
     ['--', 'date-d'], ['--', 'date-m'], ['----', 'date-y'], ['----', 'sd-a']],
    [['--', 'days'], ['--', 'up-h'], ['--', 'up-m'], ['--', 'up-s'],
     ['21', 'facts-a'], ['214', 'facts-b'], [String((table.slots['mid.projects'] ?? []).length)]],
  ];

  const stream = numberStream(table);
  const cells = [];
  for (let i = 0; i < FIELD_COLUMNS * FIELD_ROWS; i += 1) {
    cells.push(stream.length ? stream[i % stream.length] : '');
  }

  const columns = live.map((columnCells) => {
    const rows = columnCells.map(([value, key], index) =>
      `<div class="dc-row-${(index % FIELD_ROWS) + 1}" data-live="${esc(key)}">${esc(value)}</div>`);
    return `<div class="data-column live">${rows.join('')}</div>`;
  });

  for (let columnIndex = 0; columnIndex < FIELD_COLUMNS - live.length; columnIndex += 1) {
    const rows = [];
    for (let row = 0; row < FIELD_ROWS; row += 1) {
      const value = cells[columnIndex * FIELD_ROWS + row];
      rows.push(`<div class="dc-row-${row + 1}">${esc(value)}</div>`);
    }
    columns.push(`<div class="data-column">${rows.join('')}</div>`);
  }

  return columns.join('\n');
}

// --- the left column: one panel per section, heights from the content ------
function panels(table, page) {
  const sections = table.sections?.[page] ?? table.sections?.home ?? [];
  return sections.map((section, index) => ({
    index,
    id: section.id,
    label: section.label,
    rows: section.rows ?? 1,
  }));
}

// --- the application menu: one cell per section, then the big block ------
function menu(table, page, lang) {
  const sections = table.sections?.[page] ?? table.sections?.home ?? [];
  const colours = ['var(--orchid)', 'var(--red)', 'var(--orange)', 'var(--light-blue)', 'var(--cornflower)', 'var(--amber)'];
  const cells = sections.map((section, index) =>
    `      <a class="cell" href="#${esc(section.id)}" data-target="${esc(section.id)}" style="--c:${colours[index % colours.length]}">${String(index + 1).padStart(2, '0')}<i>${esc(section.label)}</i></a>`);
  cells.push('      <a class="cell cell--start menu__big" href="#sec-links" style="--c:var(--orchid)">{{SLOT:status.place}}<i>{{SLOT:status.from}}</i></a>');
  return cells.join('\n');
}

// --- the readout: the numbers of the cases, in cells --------------------
function readout(table) {
  const projects = table.slots['mid.projects'] ?? [];
  const cells = [];
  for (const project of projects.slice(0, 4)) {
    const result = (project.results ?? [])[0];
    if (!result) continue;
    const title = typeof project.title === 'object' ? (project.title.en ?? '') : project.title;
    cells.push(`      <div class="cell cell--num" style="--c:var(--light-blue)"><i>${esc(String(title).slice(0, 10))}</i><span>${esc(result.value)}</span></div>`);
  }
  cells.push(`      <div class="cell cell--num" style="--c:var(--amber)"><i>cases</i><span>${projects.length}</span></div>`);
  cells.push(`      <div class="cell cell--num" style="--c:var(--orange)"><i>facts</i><span>21 214</span></div>`);
  return cells.join('\n');
}

export { cascade, panels, menu, readout, esc, FIELD_COLUMNS, FIELD_ROWS };

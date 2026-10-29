import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const tablePath = path.join(root, 'content', 'home-table.json');
const templatePath = path.join(root, 'src2', 'index.src.html');
const distDir = path.join(root, 'dist');
const assetsDir = path.join(distDir, 'assets');
const fontsDir = path.join(root, 'src', 'fonts2');

const htmlEscapes = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => htmlEscapes[character]);
}

function flattenSlots(table) {
  const entries = new Map();

  for (const group of Object.values(table.slots ?? {})) {
    if (!Array.isArray(group)) continue;
    for (const entry of group) {
      if (!entry || typeof entry !== 'object' || !entry.id) continue;
      entries.set(entry.id, entry);
    }
  }

  return entries;
}

function pickText(entry, lang) {
  for (const field of ['text', 'title', 'summary']) {
    const value = entry[field];
    if (value && typeof value === 'object' && typeof value[lang] === 'string') {
      return value[lang];
    }
  }

  if (entry.label && typeof entry.label === 'object' && typeof entry.label[lang] === 'string') {
    return entry.label[lang];
  }

  if (typeof entry.value === 'string') return entry.value;

  return '';
}

// Resolve a dotted path inside a slot entry, language-aware.
// "results.0.value"  -> the raw value
// "title"            -> title[lang]
// "stack"            -> stack joined with " - "
// "stack.0"          -> stack[0]
function resolvePath(entry, path, lang) {
  if (!path) return pickText(entry, lang);

  const parts = path.split('.');
  let node = entry;

  for (const part of parts) {
    if (node === null || node === undefined) return '';
    if (Array.isArray(node)) {
      const index = Number(part);
      node = Number.isInteger(index) ? node[index] : undefined;
      continue;
    }
    node = node[part];
  }

  if (node === null || node === undefined) return '';

  if (typeof node === 'object' && !Array.isArray(node)) {
    if (typeof node[lang] === 'string') return node[lang];
    if (typeof node.en === 'string') return node.en;
    return '';
  }

  if (Array.isArray(node)) {
    return node
      .map((item) => (typeof item === 'string' ? item : resolvePath({ text: item }, '', lang)))
      .filter(Boolean)
      .join(' - ');
  }

  return String(node);
}


// Expand a block of prose into separate lines:
//   {{#SENTENCES:slot.path}} <li>{{SENTENCE}}</li> {{/SENTENCES:slot.path}}
// A wall of text becomes a list - the same content, read as an instrument.
function expandSentences(template, entries, lang) {
  const pattern = /\{\{#SENTENCES:([^}]+)\}\}([\s\S]*?)\{\{\/SENTENCES:\1\}\}/g;

  return template.replace(pattern, (_, path, body) => {
    const { id, rest } = splitReference(path, entries);
    const entry = entries.get(id);
    if (!entry) throw new Error(`Unknown sentence slot: ${id}`);

    let node = entry;
    for (const part of rest.split('.').filter(Boolean)) {
      if (node === null || node === undefined) return '';
      node = Array.isArray(node) ? node[Number(part)] : node[part];
    }

    const text = String(node ?? '').trim();
    if (!text) return '';

    const parts = [];
    for (const chunk of text.split(/(?<=[.!?;])\s+|(?<=\u2014)\s+/)) {
      const trimmed = chunk.trim();
      if (!trimmed) continue;
      // a very long clause is broken further, at the commas
      if (trimmed.length > 150) {
        for (const piece of trimmed.split(/,\s+(?=[a-z\u0430-\u044f])/i)) {
          if (piece.trim()) parts.push(piece.trim());
        }
      } else {
        parts.push(trimmed);
      }
    }

    return parts.map((part) => body.split('{{SENTENCE}}').join(escapeHtml(part))).join('');
  });
}


// Remove a whole element by class name, balancing the tags. A regex would
// stop at the first closing tag and leave the tail of the block behind.
function removeElement(html, className) {
  const open = new RegExp(`<div class="${className}"[^>]*>`);
  const start = html.search(open);
  if (start < 0) return html;
  const tagRe = /<(\/?)div\b[^>]*>/g;
  tagRe.lastIndex = start;
  let depth = 0;
  let end = html.length;
  let match;
  while ((match = tagRe.exec(html))) {
    if (match[1] === '/') {
      depth -= 1;
      if (depth === 0) { end = match.index + match[0].length; break; }
    } else {
      depth += 1;
    }
  }
  return html.slice(0, start) + html.slice(end);
}

// Expand a repeat block: {{#SLOT:path}} ... {{/SLOT:path}}
// Inside, {{SLOT:path.@value}} and {{SLOT:path.@label}} refer to the current element.
function expandRepeats(template, entries, lang) {
  const pattern = /\{\{#SLOT:([^}]+)\}\}([\s\S]*?)\{\{\/SLOT:\1\}\}/g;

  return template.replace(pattern, (_, path, body) => {
    const { id, rest } = splitReference(path, entries);
    const entry = entries.get(id);
    if (!entry) throw new Error(`Unknown repeat slot: ${id}`);

    let node = entry;
    for (const part of rest.split('.').filter(Boolean)) {
      if (node === null || node === undefined) return '';
      node = Array.isArray(node) ? node[Number(part)] : node[part];
    }
    if (!Array.isArray(node)) return '';

    return node
      .map((item) =>
        body
          .split(`{{SLOT:${path}.@value}}`).join(escapeHtml(String(item?.value ?? item ?? '')))
          .split(`{{SLOT:${path}.@label}}`).join(escapeHtml(resolvePath({ label: item?.label }, '', lang)))
          .split(`{{SLOT:${path}.@label.en}}`).join(escapeHtml(String(item?.label?.en ?? '')))
          .split(`{{SLOT:${path}.@label.ru}}`).join(escapeHtml(String(item?.label?.ru ?? '')))
        .split(`{{SLOT:${path}.@url}}`).join(escapeHtml(String(item?.url ?? '')))
        .split(`{{SLOT:${path}.@src}}`).join(escapeHtml(String(item?.src ?? '')))
        .split(`{{SLOT:${path}.@thumb}}`).join(escapeHtml(String(item?.thumb ?? '')))
                  .split(`{{SLOT:${path}.@alt}}`).join(escapeHtml(typeof item?.alt === 'object' ? (item.alt[lang] ?? '') : String(item?.alt ?? '')))
        .split(`{{SLOT:${path}.@year}}`).join(escapeHtml(String(item?.year ?? '')))
      )
      .join('');
  });
}

// Slot ids contain dots (chrome.lang, hero.name, project.engineer-companion),
// and so do field paths (project.x.results.0.value). Split on the LONGEST id
// that actually exists, so the id wins over the path.
function splitReference(reference, entries) {
  const parts = reference.split('.');
  for (let take = parts.length; take > 0; take -= 1) {
    const id = parts.slice(0, take).join('.');
    if (entries.has(id)) {
      return { id, rest: parts.slice(take).join('.') };
    }
  }
  return { id: parts[0], rest: parts.slice(1).join('.') };
}

async function copyAssets() {
  await mkdir(assetsDir, { recursive: true });

  for (const file of ['app.js', 'fonts.css', 'lcars.css', 'content.css', 'favicon.svg']) {
    await copyFile(path.join(root, 'src2', file), path.join(assetsDir, file));
  }

  const targetFontsDir = path.join(assetsDir, 'fonts');
  await mkdir(targetFontsDir, { recursive: true });

  for (const file of await readdir(fontsDir)) {
    await copyFile(path.join(fontsDir, file), path.join(targetFontsDir, file));
  }

  // project screenshots: one full size and one thumbnail per shot
  for (const dir of ['media-full', 'media-thumb']) {
    const from = path.join(root, 'src', dir);
    const to = path.join(assetsDir, dir);
    await mkdir(to, { recursive: true });
    for (const file of await readdir(from)) {
      await copyFile(path.join(from, file), path.join(to, file));
    }
  }
}


// Expand a repeat over a group of slot entries:
//   {{#GROUP:mid.projects}} ... {{SLOT:@title}} ... {{/GROUP:mid.projects}}
// Inside the body, @field reads the current entry (language aware).
// A nested repeat over a list field is also supported:
//   {{#SLOT:@results}} ... {{SLOT:@results.@value}} ... {{/SLOT:@results}}

// Raw (unflattened) node lookup - a list field must stay a list.
function resolveRaw(entry, path) {
  if (!path) return entry;
  let node = entry;
  for (const part of path.split('.')) {
    if (node === null || node === undefined) return undefined;
    node = Array.isArray(node) ? node[Number(part)] : node[part];
  }
  return node;
}

function expandGroup(template, table, lang) {
  return template.replace(/\{\{#GROUP:([^}]+)\}\}([\s\S]*?)\{\{\/GROUP:\1\}\}/g, (_, groupId, body) => {
    const group = (table.slots ?? {})[groupId];
    if (!Array.isArray(group)) throw new Error(`Unknown group: ${groupId}`);
    return group.map((entry) => {
      let out = body;
      // nested list repeats on the current entry
      out = out.replace(/\{\{#SLOT:@([\w.]+)\}\}([\s\S]*?)\{\{\/SLOT:@\1\}\}/g, (__, field, inner) => {
        const list = resolveRaw(entry, field);
        const items = Array.isArray(list) ? list : [];
        const parts = items.map((item) => {
          let piece = inner;
          piece = piece.split(`{{SLOT:@${field}.@value}}`).join(escapeHtml(String(item?.value ?? item ?? '')));
          piece = piece.split(`{{SLOT:@${field}.@label}}`).join(escapeHtml(resolvePath({ label: item?.label }, '', lang)));
          piece = piece.split(`{{SLOT:@${field}.@src}}`).join(escapeHtml(String(item?.src ?? '')));
          piece = piece.split(`{{SLOT:@${field}.@thumb}}`).join(escapeHtml(String(item?.thumb ?? '')));
          piece = piece.split(`{{SLOT:@${field}.@alt}}`).join(escapeHtml(String(item?.alt ?? '')));
          piece = piece.split(`{{SLOT:@${field}.@url}}`).join(escapeHtml(String(item?.url ?? '')));
          piece = piece.split(`{{SLOT:@${field}.@labelEn}}`).join(escapeHtml(String(item?.label?.en ?? '')));
          piece = piece.split(`{{SLOT:@${field}.@labelRu}}`).join(escapeHtml(String(item?.label?.ru ?? '')));
          return piece;
        });
        return parts.join('');
      });
      // plain fields of the current entry
      out = out.replace(/\{\{SLOT:@([\w.]+)\}\}/g, (__, field) => escapeHtml(resolvePath(entry, field, lang)));
      out = out.split('{{SLOT:@id}}').join(escapeHtml(String(entry.id ?? '')));
      return out;
    }).join('');
  });
}

export async function build(lang, outDir, page, contentOverride) {
  if (lang !== 'ru' && lang !== 'en') {
    throw new Error(`Unsupported language: ${lang}`);
  }

  const spec = page || { template: 'index.src.html', out: 'index.html', home: true };

  const table = JSON.parse(await readFile(tablePath, 'utf8'));
  const entries = flattenSlots(table);
  // every page is only the INSIDE of the window; the console frame is shared
  const content = contentOverride ?? await readFile(path.join(root, 'src2', 'pages', spec.template), 'utf8');
  let template = await readFile(path.join(root, 'src2', 'frame.src.html'), 'utf8');
  template = template
    .split('{{CONTENT}}').join(content)
    .split('{{TITLE}}').join(spec.title ?? '')
    .split('{{META}}').join(spec.meta ?? '')
    .split('{{ACCENT}}').join(spec.accent ?? 'var(--amber)')
    .split('{{PAGE}}').join(spec.page ?? '')
    .split('{{META_DESC}}').join(spec.metaDesc ?? spec.meta ?? '')
    .split('{{CANONICAL}}').join(spec.canonical ?? '')
    .split('{{RU}}').join(lang === 'ru' ? '/ru' : '');

  // A project page is one template rendered per project: {{PROJECT}} is the
  // slot id prefix (project.engineer-companion, ...).
  if (spec.project) {
    template = template.split('{{PROJECT}}').join(`project.${spec.project}`);
    template = template.split('{{THEME}}').join(spec.theme);
    // a case without screenshots gets no gallery block at all
    const entry = (table.slots['mid.projects'] ?? []).find((p) => p.slug === spec.project);
    if (!entry?.images?.length) {
      template = removeElement(template, 'gallery');
    }
  }

  // Only home-scoped slots must appear in the home template.
  // Slots with scope 'about' belong to the ABOUT page.
  if (spec.home) {
  // slots covered by a group repeat ({{#GROUP:x}}) are referenced by the
  // group, not by their own id
  const grouped = new Set();
  for (const match of template.matchAll(/\{\{#GROUP:([^}]+)\}\}/g)) {
    for (const entry of (table.slots ?? {})[match[1]] ?? []) grouped.add(entry.id);
  }
  for (const [id, entry] of entries) {
    if (entry.scope && entry.scope !== 'home') continue;
    if (grouped.has(id)) continue;
    const referenced = template.includes(`{{SLOT:${id}}}`) ||
      template.includes(`{{SLOT:${id}.`) ||
      template.includes(`{{#SLOT:${id}}}`) ||
      template.includes(`{{#SLOT:${id}.`);
    if (!referenced) {
      throw new Error(`Template is missing placeholder for slot: ${id}`);
    }
  }
  }

  const expanded = expandSentences(expandRepeats(expandGroup(template, table, lang), entries, lang), entries, lang);

  const html = expanded
    .replace(/\{\{LANG\}\}/g, lang)
    .replace(/\{\{SLOT:([^}]+)\}\}/g, (_, reference) => {
      const { id, rest } = splitReference(reference, entries);
      const entry = entries.get(id);
      if (!entry) throw new Error(`Unknown slot placeholder: ${id}`);
      return escapeHtml(resolvePath(entry, rest, lang));
    });

  if (html.includes('{{SLOT:')) {
    throw new Error('Template still contains unresolved slot placeholders');
  }

  // outDir is the page's own index.html path
  const targetFile = path.isAbsolute(outDir) ? outDir : path.join(root, outDir);
  const targetDir = path.dirname(targetFile);
  await mkdir(targetDir, { recursive: true });
  await writeFile(targetFile, html, 'utf8');
  if (spec.home) await copyAssets();
}

const PAGES = [
  { template: 'index.src.html', out: 'index.html', home: true,
    title: 'Maxim Kukhto', page: 'home',
    metaDesc: 'Offline RAG, CAD/GIS automation and Python backend - measured results, public code, remote from Mogilev, UTC+3.' },
  { template: 'work.src.html', out: 'work/index.html',
    title: 'Work — 14 measured cases', page: 'work',
    metaDesc: 'Fourteen systems, each measured on a real run: latency, accuracy, test counts, sweep results.' },
  { template: 'about.src.html', out: 'about/index.html',
    title: 'About — record and facts', page: 'about',
    metaDesc: 'Six years of medical-equipment engineering and parallel software work. Remote from Mogilev, UTC+3.' },
  { template: 'contact.src.html', out: 'contact/index.html',
    title: 'Contact — channels', page: 'contact',
    metaDesc: 'Email, GitHub, LinkedIn, Telegram and the CV. Remote from Mogilev, UTC+3.' },
];

// One case page per project in the content table. The project's theme is
// read from the table, so adding a project needs no change here.
async function projectPages() {
  const table = JSON.parse(await readFile(tablePath, 'utf8'));
  return (table.slots['mid.projects'] ?? []).map((entry) => ({
    template: 'project.src.html',
    out: `work/${entry.slug}/index.html`,
    project: entry.slug,
    theme: entry.theme,
    title: `{{SLOT:project.${entry.slug}.title}}`,
    metaDesc: `{{SLOT:project.${entry.slug}.summary}}`,
    accent: entry.accent ?? 'var(--amber)',
    page: 'work',
  }));
}

const SITE = 'https://kukhto.is-a.dev';

async function writeDeployFiles(pages) {
  const urls = pages.map((p) => `${SITE}/${p.url}`);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u}</loc><changefreq>monthly</changefreq></url>`)
    .join('\n')}\n</urlset>\n`;
  await writeFile(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8');

  await writeFile(path.join(distDir, 'robots.txt'),
    `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`, 'utf8');

  await writeFile(path.join(distDir, '_headers'),
    `/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`, 'utf8');

  await writeFile(path.join(distDir, '_redirects'),
    `/en/    ${SITE}/    301\n/en/*    ${SITE}/:splat    301\n`, 'utf8');
}

async function main() {
  const cases = await projectPages();
  const built = [];

  for (const lang of ['en', 'ru']) {
    const root = lang === 'en' ? distDir : path.join(distDir, 'ru');
    for (const page of [...PAGES, ...cases]) {
      const target = path.join(root, page.out);
      const rel = page.out.replace(/index\.html$/, '');
      const url = (lang === 'en' ? '' : '/ru') + '/' + rel;
      const canonical = SITE + url;
      await build(lang, target, { ...page, url, canonical });
      built.push({ url, lang });
    }
  }

  // the CV files come from the content folder
  const cvDir = path.join(root, 'content', 'cv');
  for (const file of ['cv-en.pdf', 'cv-ru.pdf']) {
    const from = path.join(cvDir, file);
    try {
      await copyFile(from, path.join(distDir, 'assets', file));
    } catch (err) {
      console.warn('missing CV:', file);
    }
  }

  // 404 - the console frame with a "no such module" readout
  const notFound = `        <div class="lcars-text-bar own-bar"><h2>404</h2></div>\n        <ul class="lcars-list"><li><b>MODULE NOT FOUND</b> the address does not exist on this console</li></ul>\n        <div class="btnrow"><a class="btn btn--amber" href="/">HOME</a></div>\n`;
  await build('en', path.join(distDir, '404.html'), {
    template: 'index.src.html', out: '404.html', home: false, page: '404',
    title: 'Not found', meta: 'module not found', canonical: `${SITE}/404.html`,
  }, notFound);

  await writeDeployFiles(built);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

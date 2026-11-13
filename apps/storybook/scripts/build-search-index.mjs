#!/usr/bin/env node
/**
 * Builds the full-text search index for the Storybook search (Cmd/Ctrl+K).
 *
 * Storybook only knows page and story titles. The written guidance lives in
 * rendered JSX, so this script opens every docs page (and every story page
 * that has no autodocs page) in a headless browser, splits the rendered text
 * into sections by heading, and writes `search-index.json` next to the build.
 *
 * Usage: node scripts/build-search-index.mjs [--dir storybook-static] [--concurrency 6]
 *
 * If no browser can be launched the script warns and exits 0. The search UI
 * then falls back to title-only results from `index.json`.
 */
import { createReadStream, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const args = process.argv.slice(2);
const argValue = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
};

const staticDir = resolve(argValue('dir', 'storybook-static'));
const concurrency = Number(argValue('concurrency', '6'));
const RENDER_TIMEOUT_MS = 20_000;
const MAX_SECTION_CHARS = 2_000;
const MAX_STORY_TEXT_CHARS = 600;

const indexPath = join(staticDir, 'index.json');
if (!existsSync(indexPath)) {
  console.error(`[search-index] ${indexPath} not found. Run "storybook build" first.`);
  process.exit(1);
}

const { entries } = JSON.parse(readFileSync(indexPath, 'utf-8'));
const allEntries = Object.values(entries);
const titlesWithDocs = new Set(allEntries.filter((e) => e.type === 'docs').map((e) => e.title));

// Docs pages hold the written content. Story pages are only rendered when
// their component has no docs page, which is how the guidance pages are built,
// or when the story opts in with the `search-docs` tag because it is itself the
// reference content (autodocs shows it inside `.docs-story`, which is skipped).
const SEARCH_DOCS_TAG = 'search-docs';
const toRender = allEntries.filter(
  (e) => e.type === 'docs' || !titlesWithDocs.has(e.title) || e.tags?.includes(SEARCH_DOCS_TAG)
);

// ── Static file server for the built Storybook ──────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

const server = createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const filePath = normalize(join(staticDir, urlPath === '/' ? 'index.html' : urlPath));
  if (
    !filePath.startsWith(staticDir + sep) ||
    !existsSync(filePath) ||
    !statSync(filePath).isFile()
  ) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
  createReadStream(filePath).pipe(res);
});

await new Promise((done) => server.listen(0, '127.0.0.1', done));
const baseUrl = `http://127.0.0.1:${server.address().port}`;

// ── Browser ─────────────────────────────────────────────────────────────────
async function launchBrowser() {
  const { chromium } = await import('playwright');
  const channel = process.env.SEARCH_INDEX_BROWSER_CHANNEL;
  const attempts = channel ? [{ channel }] : [{}, { channel: 'chrome' }];
  for (const options of attempts) {
    try {
      return await chromium.launch(options);
    } catch {
      // try the next option
    }
  }
  return null;
}

const browser = await launchBrowser();
if (!browser) {
  console.warn(
    '[search-index] No browser available, skipping the full-text index. ' +
      'Run "pnpm exec playwright install chromium" to enable it. Search falls back to titles.'
  );
  server.close();
  process.exit(0);
}

/**
 * Runs inside the page. Walks the rendered content and groups text under the
 * nearest preceding heading.
 *
 * `rootSelector` scopes the walk (a tab panel, for example). `initial` is the
 * heading the scoped content sits under, so its text is attributed correctly.
 */
function extractContent({ rootSelector, initial, skipTabPanels, maxSectionChars }) {
  const root = document.querySelector(rootSelector);
  if (!root) return { sections: [], props: [] };

  const EXCLUDE = [
    'script',
    'style',
    'noscript',
    'svg',
    'pre',
    'textarea',
    'input',
    'select',
    // Button labels are UI chrome ("Show code", "Copy"), not content.
    'button',
    '[aria-hidden="true"]',
    '.docs-story',
    '.docblock-argstable',
    '.docblock-source',
    '.sb-anchor > .sb-story',
    // Documentation tab panels are indexed one by one, tagged with their tab.
    ...(skipTabPanels ? ['[data-search-tabs] [data-search-panel]'] : []),
  ].join(',');

  const props = [...root.querySelectorAll('.docblock-argstable tbody tr > td:first-child')]
    .map((cell) => cell.textContent.trim().split(/\s/)[0])
    .filter((name) => /^[A-Za-z_$][\w$-]*$/.test(name));

  const sections = [];
  let current = { heading: initial?.heading ?? '', anchor: initial?.anchor ?? '', text: '' };
  // The inherited heading already has its own record, only add text under it.
  let inherited = Boolean(initial?.heading);
  const push = () => {
    const text = current.text.replace(/\s+/g, ' ').trim();
    if ((current.heading && !inherited) || text) {
      sections.push({ ...current, text: text.slice(0, maxSectionChars) });
    }
    inherited = false;
  };

  const visible = new WeakMap();
  const isVisible = (el) => {
    if (!visible.has(el)) {
      // checkVisibility() is false for display: contents wrappers, which have no
      // box of their own. Walk into them and judge their children instead.
      const boxless = getComputedStyle(el).display === 'contents';
      visible.set(
        el,
        boxless || typeof el.checkVisibility !== 'function' ? true : el.checkVisibility()
      );
    }
    return visible.get(el);
  };

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
      if (node.matches(EXCLUDE) || !isVisible(node)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (/^H[1-4]$/.test(node.tagName)) {
        push();
        const anchorEl = node.id ? node : node.closest('[id^="anchor--"]');
        current = {
          heading: node.textContent.replace(/\s+/g, ' ').trim(),
          anchor: anchorEl?.id ?? '',
          text: '',
        };
        // Skip the heading's own text nodes.
        let last = node;
        while (last.lastChild) last = last.lastChild;
        walker.currentNode = last;
      }
      continue;
    }
    current.text += ` ${node.textContent}`;
  }
  push();

  return { sections, props: [...new Set(props)] };
}

/*
 * Documentation tab sets opt in with three markers, so live demo tabs are never
 * clicked:
 *   data-search-tabs          the set
 *   data-search-tab="Label"   each tab button, data-state="active" when open
 *   data-search-panel         the open panel (the only one rendered)
 * Sets can nest (a path selector inside a tab). A marker belongs to the closest
 * set around it.
 */

/** Runs inside the page. Tags the sets directly inside `scopeSelector` with ids. */
function markTabSets({ scopeSelector, prefix }) {
  const scope = document.querySelector(scopeSelector);
  if (!scope) return [];
  const ids = [];
  for (const set of scope.querySelectorAll('[data-search-tabs]')) {
    const parentSet = set.parentElement?.closest('[data-search-tabs]');
    // Only sets whose own parent set is outside the scope, nested ones come later.
    if (parentSet && scope.contains(parentSet)) continue;
    const id = `${prefix}${ids.length}`;
    set.setAttribute('data-search-set-id', id);
    ids.push(id);
  }
  return ids;
}

/** Runs inside the page. Tags a set's own tab buttons and returns their labels. */
function markTabTriggers({ id }) {
  const set = document.querySelector(`[data-search-set-id="${id}"]`);
  if (!set) return [];
  return [...set.querySelectorAll('[data-search-tab]')]
    .filter((trigger) => trigger.closest('[data-search-tabs]') === set)
    .map((trigger, index) => {
      trigger.setAttribute('data-search-trigger-id', `${id}:${index}`);
      return {
        label: (trigger.getAttribute('data-search-tab') || trigger.textContent || '')
          .replace(/\s+/g, ' ')
          .trim(),
        selected: trigger.getAttribute('data-state') === 'active',
      };
    });
}

/**
 * Runs inside the page. Marks the open panel of a set as an extraction scope and
 * returns the heading the set sits under.
 */
function markOpenPanel({ id }) {
  const set = document.querySelector(`[data-search-set-id="${id}"]`);
  // Radix keeps an empty, hidden element for every closed tab, so pick the open one.
  const panel = set
    ? [...set.querySelectorAll('[data-search-panel]')].find(
        (el) =>
          el.closest('[data-search-tabs]') === set &&
          !el.hidden &&
          el.getAttribute('data-state') !== 'inactive'
      )
    : null;
  if (!set || !panel) return null;
  for (const el of document.querySelectorAll(`[data-search-scope="${id}"]`)) {
    el.removeAttribute('data-search-scope');
  }
  panel.setAttribute('data-search-scope', id);

  // The iframe always has both containers, use the one that holds this set.
  const root = set.closest('#storybook-docs, #storybook-root') ?? document.body;
  let heading = null;
  for (const el of document.querySelectorAll('h1, h2, h3, h4')) {
    if (set.contains(el) || !root.contains(el)) continue;
    if (el.compareDocumentPosition(set) & Node.DOCUMENT_POSITION_FOLLOWING) heading = el;
  }
  const anchorEl = heading && (heading.id ? heading : heading.closest('[id^="anchor--"]'));
  return {
    heading: heading?.textContent.replace(/\s+/g, ' ').trim() ?? '',
    anchor: anchorEl?.id ?? '',
  };
}

async function clickTrigger(page, triggerId) {
  await page.click(`[data-search-trigger-id="${triggerId}"]`, { timeout: 3000 });
  await page.waitForTimeout(150);
}

/**
 * Tab sets only render their open panel, so open each tab in turn (the default
 * one included), index its panel, then repeat for sets nested inside it.
 * Sections carry the tab path (e.g. ["Resources", "Figma"]) so the preview can
 * open each tab before scrolling, even after someone switched tabs.
 */
async function extractTabPanels(page, scopeSelector, path = [], prefix = 's') {
  const sections = [];
  const ids = await page.evaluate(markTabSets, { scopeSelector, prefix });
  for (const id of ids) {
    const triggers = await page.evaluate(markTabTriggers, { id });
    const defaultIndex = triggers.findIndex((trigger) => trigger.selected);
    for (const [index, trigger] of triggers.entries()) {
      if (!trigger.label) continue;
      // Clicking the tab that is already open is a no-op, so always click: an
      // earlier pass may have left a different tab open.
      try {
        await clickTrigger(page, `${id}:${index}`);
      } catch {
        continue;
      }
      const initial = await page.evaluate(markOpenPanel, { id });
      if (!initial) continue;
      const panelScope = `[data-search-scope="${id}"]`;
      const tabs = [...path, trigger.label];
      const { sections: found } = await page.evaluate(extractContent, {
        rootSelector: panelScope,
        initial,
        skipTabPanels: true,
        maxSectionChars: MAX_SECTION_CHARS,
      });
      for (const section of found) sections.push({ ...section, tabs });
      sections.push(...(await extractTabPanels(page, panelScope, tabs, `${id}.${index}.`)));
    }
    if (defaultIndex >= 0) await clickTrigger(page, `${id}:${defaultIndex}`).catch(() => {});
  }
  return sections;
}

async function renderEntry(context, entry) {
  const isDocs = entry.type === 'docs';
  const page = await context.newPage();
  try {
    const url = `${baseUrl}/iframe.html?id=${encodeURIComponent(entry.id)}&viewMode=${isDocs ? 'docs' : 'story'}`;
    await page.goto(url, { waitUntil: 'load', timeout: RENDER_TIMEOUT_MS });
    // Storybook toggles body classes once a story or docs page has rendered.
    await page
      .waitForFunction(
        () =>
          !document.body.classList.contains('sb-show-preparing-story') &&
          !document.body.classList.contains('sb-show-preparing-docs') &&
          (document.body.classList.contains('sb-show-main') ||
            document.body.classList.contains('sb-show-errordisplay')),
        null,
        { timeout: RENDER_TIMEOUT_MS }
      )
      .catch(() => {});
    await page.waitForTimeout(400);
    const rootSelector = isDocs ? '#storybook-docs' : '#storybook-root';
    const content = await page.evaluate(extractContent, {
      rootSelector,
      initial: null,
      skipTabPanels: true,
      maxSectionChars: MAX_SECTION_CHARS,
    });
    const tabSections = await extractTabPanels(page, rootSelector);
    return { sections: [...content.sections, ...tabSections], props: content.props };
  } catch (error) {
    console.warn(`[search-index] ${entry.id}: ${error.message.split('\n')[0]}`);
    return { sections: [], props: [] };
  } finally {
    await page.close();
  }
}

// ── Render everything ───────────────────────────────────────────────────────
const started = Date.now();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const rendered = new Map();
let cursor = 0;
let done = 0;

async function worker() {
  while (cursor < toRender.length) {
    const entry = toRender[cursor++];
    rendered.set(entry.id, await renderEntry(context, entry));
    done++;
    if (done % 25 === 0 || done === toRender.length) {
      console.log(`[search-index] rendered ${done}/${toRender.length}`);
    }
  }
}

await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
await browser.close();
server.close();

// ── Write the index ─────────────────────────────────────────────────────────
const pages = [];
const sections = [];

for (const entry of allEntries) {
  const pageIndex = pages.length;
  const content = rendered.get(entry.id);
  const page = { id: entry.id, type: entry.type, title: entry.title, name: entry.name };
  if (content?.props.length) page.props = content.props.join(' ');
  pages.push(page);
  if (!content) continue;

  const isDocs = entry.type === 'docs';
  for (const section of content.sections) {
    // Story pages without headings are mostly live demos, keep a short excerpt only.
    const text =
      !isDocs && !section.heading ? section.text.slice(0, MAX_STORY_TEXT_CHARS) : section.text;
    if (!section.heading && !text) continue;
    // Autodocs adds an empty "Stories" heading above the story list.
    if (isDocs && section.heading === 'Stories' && !text) continue;
    const record = { p: pageIndex, h: section.heading, t: text };
    if (section.anchor) record.a = section.anchor;
    if (section.tabs?.length) record.tb = section.tabs;
    sections.push(record);
  }
}

const output = { v: 1, generatedAt: new Date().toISOString(), pages, sections };
const outPath = join(staticDir, 'search-index.json');
writeFileSync(outPath, JSON.stringify(output));

const sizeKb = Math.round(statSync(outPath).size / 1024);
console.log(
  `[search-index] wrote ${pages.length} pages and ${sections.length} sections ` +
    `(${sizeKb} KB) in ${Math.round((Date.now() - started) / 1000)}s`
);

import MiniSearch, { type Query, type SearchResult } from 'minisearch';

/** Shape of `search-index.json`, written by `scripts/build-search-index.mjs`. */
interface IndexPage {
  id: string;
  type: 'docs' | 'story';
  title: string;
  name: string;
  props?: string;
}

interface IndexSection {
  /** Index into `pages`. */
  p: number;
  /** Heading text. Empty for text that comes before the first heading. */
  h: string;
  /** Text under the heading. */
  t: string;
  /** Element id to scroll to, when the heading has one. */
  a?: string;
  /** Tab path to the panel the text lives in, outermost first. */
  tb?: string[];
}

interface SearchIndexFile {
  v: number;
  generatedAt?: string;
  pages: IndexPage[];
  sections: IndexSection[];
}

interface StorybookIndexFile {
  entries: Record<string, { id: string; type: string; title: string; name: string }>;
}

export interface SearchDocument {
  key: string;
  kind: 'page' | 'section';
  pageIndex: number;
  title: string;
  name: string;
  heading: string;
  text: string;
  props: string;
  anchor: string;
  tabs: string[];
}

export interface SearchHit {
  key: string;
  kind: 'page' | 'section';
  /** Storybook entry to open. */
  entryId: string;
  entryType: 'docs' | 'story';
  label: string;
  snippet: string;
  anchor: string;
  heading: string;
  /** Documentation tabs to open before scrolling, outermost first. */
  tabs: string[];
  terms: string[];
}

export type LibraryKey = 'wind' | 'react' | 'material' | 'core' | 'other';

export interface Library {
  key: LibraryKey;
  /** Shown as the results section header. */
  label: string;
  /** Short guidance shown next to the header. */
  note: string;
  /** Short name for the badge on each result. */
  badge: string;
}

const LIBRARIES: Record<Exclude<LibraryKey, 'other'>, Library> = {
  wind: {
    key: 'wind',
    label: 'Apollo Wind',
    note: 'Recommended for new UI',
    badge: 'Wind',
  },
  react: {
    key: 'react',
    label: 'Apollo React',
    note: 'Canvas, chat, and decision table',
    badge: 'React',
  },
  material: {
    key: 'material',
    label: 'Apollo React Material',
    note: 'Maintenance only. Use Apollo Wind for new work.',
    badge: 'Material',
  },
  core: {
    key: 'core',
    label: 'Apollo Core',
    note: 'Tokens, icons, and writing',
    badge: 'Core',
  },
};

const MATERIAL_PREFIX = 'Apollo React/Material (Maintenance Only)';

export function libraryFor(title: string): Library {
  if (title.startsWith(MATERIAL_PREFIX)) return LIBRARIES.material;
  if (title.startsWith('Apollo Wind')) return LIBRARIES.wind;
  if (title.startsWith('Apollo React')) return LIBRARIES.react;
  if (title.startsWith('Apollo Core')) return LIBRARIES.core;
  const label = title.split('/')[0] ?? title;
  return { key: 'other', label, note: '', badge: '' };
}

export interface SearchGroup {
  /** Component or page title, e.g. "Apollo Wind/Components/Button". */
  title: string;
  /** Library the page belongs to, used to section and color results. */
  library: Library;
  /** First path segment, used to group results, e.g. "Apollo Wind". */
  section: string;
  /** Path between the section and the leaf, e.g. "Components". */
  breadcrumb: string;
  /** Leaf name, e.g. "Button". */
  leaf: string;
  /** Entry the group header opens. */
  entryId: string;
  entryType: 'docs' | 'story';
  hits: SearchHit[];
  score: number;
}

export interface LoadedIndex {
  fullText: boolean;
  pageCount: number;
  sectionCount: number;
  search: (query: string) => SearchGroup[];
}

const DOC_PAGE_NAMES = new Set(['Docs', 'Documentation', 'Overview']);
const MAX_GROUPS = 20;
const MAX_HITS_PER_GROUP = 4;

/**
 * Words people search for that are spelled differently in our sidebar.
 * Each set is treated as interchangeable at query time.
 */
const SYNONYMS: string[][] = [
  ['dropdown', 'select', 'combobox'],
  ['modal', 'dialog'],
  ['toast', 'sonner', 'snackbar', 'notification'],
  ['popup', 'popover', 'tooltip'],
  ['spinner', 'loader', 'loading', 'progress'],
  ['toggle', 'switch'],
  ['tag', 'chip', 'badge'],
  ['grid', 'table', 'datatable'],
  ['textbox', 'input', 'textfield'],
  ['multiline', 'textarea'],
  ['upload', 'dropzone', 'file'],
  ['tree', 'treeview'],
  ['icon', 'icons', 'lucide'],
  ['colour', 'color', 'colors'],
  ['a11y', 'accessibility', 'aria'],
  ['error', 'validation'],
  ['drawer', 'sheet', 'panel'],
  ['steps', 'stepper', 'wizard'],
];

const synonymLookup = new Map<string, string[]>();
for (const set of SYNONYMS) {
  for (const word of set) synonymLookup.set(word, set);
}

const tokenize = MiniSearch.getDefault('tokenize') as (text: string) => string[];

function buildQuery(raw: string, combineWith: 'AND' | 'OR'): Query {
  const terms = tokenize(raw.toLowerCase()).filter(Boolean);
  return {
    combineWith,
    queries: terms.map((term) => {
      const alternatives = synonymLookup.get(term);
      // Exact synonyms only, so a typo of "dialog" doesn't drag in "modal".
      return alternatives
        ? {
            combineWith: 'OR' as const,
            queries: [term, ...alternatives.filter((alt) => alt !== term)],
          }
        : term;
    }),
  };
}

function splitTitle(title: string) {
  // The library header already says "Material", so drop it from the breadcrumb.
  const parts = (
    title.startsWith(MATERIAL_PREFIX)
      ? ['Apollo React Material', ...title.slice(MATERIAL_PREFIX.length + 1).split('/')]
      : title.split('/')
  ).filter(Boolean);
  return {
    section: parts[0] ?? title,
    breadcrumb: parts.slice(1, -1).join(' / '),
    leaf: parts[parts.length - 1] ?? title,
  };
}

/** Picks about 160 characters around the first matched term. */
function makeSnippet(text: string, terms: string[]) {
  if (!text) return '';
  const lower = text.toLowerCase();
  let at = -1;
  for (const term of terms) {
    const found = lower.indexOf(term.toLowerCase());
    if (found !== -1 && (at === -1 || found < at)) at = found;
  }
  if (at === -1) return text.length > 160 ? `${text.slice(0, 160).trimEnd()}…` : text;
  const start = Math.max(0, at - 60);
  const end = Math.min(text.length, at + 100);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

/**
 * Keeps each library's results together so the section headers never repeat.
 * Libraries are ordered by their best match, but Material always goes last so
 * the maintained component is what people see first.
 */
function orderByLibrary(groups: SearchGroup[]) {
  const buckets = new Map<string, SearchGroup[]>();
  for (const group of groups) {
    const key = `${group.library.key}:${group.library.label}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(group);
    else buckets.set(key, [group]);
  }
  return [...buckets.values()]
    .sort((a, b) => {
      const aLegacy = a[0]?.library.key === 'material' ? 1 : 0;
      const bLegacy = b[0]?.library.key === 'material' ? 1 : 0;
      if (aLegacy !== bLegacy) return aLegacy - bLegacy;
      return (b[0]?.score ?? 0) - (a[0]?.score ?? 0);
    })
    .flat();
}

function createSearch(pages: IndexPage[], sections: IndexSection[]): LoadedIndex['search'] {
  const docsEntryByTitle = new Map<string, IndexPage>();
  for (const page of pages) {
    if (page.type === 'docs') docsEntryByTitle.set(page.title, page);
  }

  const documents: SearchDocument[] = pages.map((page, pageIndex) => ({
    key: `p${pageIndex}`,
    kind: 'page',
    pageIndex,
    title: page.title.replaceAll('/', ' '),
    // Only autodocs entries have a synthetic name. A story called "Overview" is a real name.
    name: page.type === 'docs' ? '' : page.name,
    heading: '',
    text: '',
    props: page.props ?? '',
    anchor: '',
    tabs: [],
  }));
  sections.forEach((section, index) => {
    const page = pages[section.p];
    if (!page) return;
    documents.push({
      key: `s${index}`,
      kind: 'section',
      pageIndex: section.p,
      title: page.title.replaceAll('/', ' '),
      // The story name, so "destructive modal permanent deletion" can match a
      // section using every term. Synthetic docs names add nothing.
      name: page.type === 'docs' ? '' : page.name,
      heading: section.h,
      text: section.t,
      props: '',
      anchor: section.a ?? '',
      tabs: Array.isArray(section.tb) ? section.tb : [],
    });
  });

  const mini = new MiniSearch<SearchDocument>({
    idField: 'key',
    fields: ['title', 'name', 'heading', 'text', 'props'],
    storeFields: ['kind', 'pageIndex', 'heading', 'text', 'anchor', 'name', 'tabs'],
    searchOptions: {
      boost: { title: 4, name: 2.5, heading: 2.5, props: 2, text: 1 },
      prefix: (term) => term.length >= 2,
      fuzzy: (term) => (term.length > 4 ? 0.2 : false),
      boostDocument: (_id, _term, stored) => {
        const page = pages[stored?.pageIndex as number];
        if (!page) return 1;
        let boost = 1;
        // Material is maintenance-only, so prefer the current components.
        if (page.title.includes('Material (Maintenance Only)')) boost *= 0.5;
        // Prefer written docs over individual story variants.
        if (page.type === 'docs' || DOC_PAGE_NAMES.has(page.name)) boost *= 1.3;
        return boost;
      },
    },
  });
  mini.addAll(documents);

  return (raw: string) => {
    const query = raw.trim();
    if (!query) return [];
    // Exact and prefix matches first. Typo matching only kicks in when they find
    // nothing, so "modal" doesn't also pull in "model".
    const attempts: Array<[combineWith: 'AND' | 'OR', fuzzy: boolean]> = [
      ['AND', false],
      ['AND', true],
      ['OR', false],
      ['OR', true],
    ];
    let results: SearchResult[] = [];
    for (const [combineWith, fuzzy] of attempts) {
      results = mini.search(buildQuery(query, combineWith), fuzzy ? {} : { fuzzy: false });
      if (results.length > 0) break;
    }

    const groups = new Map<string, SearchGroup>();
    for (const result of results) {
      const page = pages[result.pageIndex as number];
      if (!page) continue;
      let group = groups.get(page.title);
      if (!group) {
        if (groups.size >= MAX_GROUPS) continue;
        const target = docsEntryByTitle.get(page.title) ?? page;
        group = {
          title: page.title,
          library: libraryFor(page.title),
          ...splitTitle(page.title),
          entryId: target.id,
          entryType: target.type,
          hits: [],
          score: result.score,
        };
        groups.set(page.title, group);
      }
      if (group.hits.length >= MAX_HITS_PER_GROUP) continue;

      const kind = result.kind as 'page' | 'section';
      const heading = (result.heading as string) ?? '';
      const isDocPage = page.type === 'docs';
      // A page hit that only repeats the group header adds nothing.
      if (kind === 'page' && isDocPage && page.id === group.entryId) continue;
      // Rows that matched only through the page title repeat the group header,
      // except story rows under a title with no docs page: those are separate
      // destinations (Error Message, Notification) the header alone can't reach.
      const matchedFields = new Set(Object.values(result.match).flat());
      const titleOnly =
        matchedFields.size > 0 && [...matchedFields].every((field) => field === 'title');
      const distinctStory = kind === 'page' && !docsEntryByTitle.has(page.title);
      if (titleOnly && !distinctStory) continue;

      group.hits.push({
        key: result.id as string,
        kind,
        entryId: page.id,
        entryType: page.type,
        label:
          kind === 'page'
            ? page.name
            : [
                ...new Set(
                  [
                    // Stories under one title share the group row, so name the
                    // story ("Error Message › Rules", not just "Rules").
                    page.type === 'story' && !isDocPage && page.name !== group.leaf
                      ? page.name
                      : '',
                    heading || page.name,
                    ...((result.tabs as string[] | undefined) ?? []),
                  ].filter(Boolean)
                ),
              ].join(' › '),
        snippet: kind === 'section' ? makeSnippet(result.text as string, result.terms) : '',
        anchor: (result.anchor as string) ?? '',
        heading,
        tabs: (result.tabs as string[] | undefined) ?? [],
        terms: result.terms,
      });
    }
    return orderByLibrary([...groups.values()]);
  };
}

/** Prefers the full-text index and falls back to Storybook's own `index.json`. */
export async function loadSearchIndex(): Promise<LoadedIndex> {
  try {
    const response = await fetch('./search-index.json');
    if (response.ok) {
      const data = (await response.json()) as SearchIndexFile;
      if (data.v === 1) {
        return {
          fullText: data.sections.length > 0,
          pageCount: data.pages.length,
          sectionCount: data.sections.length,
          search: createSearch(data.pages, data.sections),
        };
      }
    }
  } catch {
    // fall through to the title-only index
  }

  const response = await fetch('./index.json');
  const data = (await response.json()) as StorybookIndexFile;
  const pages: IndexPage[] = Object.values(data.entries)
    .filter((entry) => entry.type === 'docs' || entry.type === 'story')
    .map((entry) => ({
      id: entry.id,
      type: entry.type as 'docs' | 'story',
      title: entry.title,
      name: entry.name,
    }));
  return {
    fullText: false,
    pageCount: pages.length,
    sectionCount: 0,
    search: createSearch(pages, []),
  };
}

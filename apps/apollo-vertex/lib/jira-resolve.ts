import { extractAdfText, type JiraIssue } from "./jira";

// All known routable slugs per section, derived from the site's _meta.ts files
const SLUGS_BY_SECTION: Record<string, string[]> = {
  components: [
    "accordion",
    "alert",
    "alert-dialog",
    "aspect-ratio",
    "avatar",
    "badge",
    "breadcrumb",
    "button",
    "button-group",
    "calendar",
    "card",
    "carousel",
    "chart",
    "line-chart",
    "multi-line-chart",
    "bar-chart",
    "distribution-chart",
    "kpi-chart",
    "table-chart",
    "checkbox",
    "collapsible",
    "combobox",
    "command",
    "context-menu",
    "data-table",
    "date-picker",
    "dialog",
    "drawer",
    "dropdown-menu",
    "empty",
    "field",
    "feature-flags",
    "filter-dropdown",
    "form",
    "form-wizard",
    "hover-card",
    "input",
    "input-group",
    "input-otp",
    "item",
    "kbd",
    "label",
    "menubar",
    "navigation-menu",
    "pagination",
    "popover",
    "progress",
    "radio-group",
    "resizable",
    "scroll-area",
    "select",
    "separator",
    "sheet",
    "sidebar",
    "skeleton",
    "slider",
    "sonner",
    "spinner",
    "switch",
    "table",
    "tabs",
    "textarea",
    "toggle",
    "toggle-group",
    "tooltip",
  ],
  patterns: [
    "ai-chat",
    "feedback-vote-widget",
    "metric-card",
    "page-header",
    "shell",
  ],
  templates: ["list-page", "settings", "solution-tests"],
  guidelines: ["ai-toolkit", "notifications"],
  foundation: ["colors", "spacing", "grid", "typography", "icons", "logos"],
};

// Flat map: slug → absolute path
const SLUG_PATH_MAP = new Map<string, string>();
for (const [section, slugs] of Object.entries(SLUGS_BY_SECTION)) {
  for (const slug of slugs) {
    SLUG_PATH_MAP.set(slug, `/${section}/${slug}`);
  }
}

export type LinkSource = "explicit" | "convention" | "jira";
export type Section = "delivered" | "coming-soon" | "backlog";
export type BadgeLabel = "required" | "best-practice" | null;

export interface ProcessedCard {
  key: string;
  summary: string;
  status: string;
  section: Section;
  badge: BadgeLabel;
  link: string;
  linkSource: LinkSource;
  jiraUrl: string;
  updated: string;
  epicName: string | null;
  epicKey: string | null;
}

export interface BoardData {
  delivered: ProcessedCard[];
  comingSoon: ProcessedCard[];
  backlog: ProcessedCard[];
  linkStats: { explicit: number; convention: number; jiraFallback: number };
}

const SECTION_BY_STATUS = {
  closed: "delivered",
  done: "delivered",
  "in progress": "coming-soon",
  "in review": "coming-soon",
  review: "coming-soon",
} satisfies Record<string, Section>;

function toSection(statusName: string): Section {
  const key = statusName.trim().toLowerCase();
  return (
    (SECTION_BY_STATUS as Record<string, Section | undefined>)[key] ?? "backlog"
  );
}

const BADGE_BY_LABEL = {
  "ai-legal-required": "required",
  "ai-legal-best-practice": "best-practice",
} as const satisfies Record<string, Exclude<BadgeLabel, null>>;

const BADGE_LABEL_PRIORITY = [
  "ai-legal-required",
  "ai-legal-best-practice",
] as const;

function toBadge(labels: readonly string[]): BadgeLabel {
  const label = BADGE_LABEL_PRIORITY.find((candidate) =>
    labels.includes(candidate),
  );
  return label ? BADGE_BY_LABEL[label] : null;
}

function resolveDeliveredLink(
  issue: JiraIssue,
  jiraUrl: string,
): { url: string; source: LinkSource } {
  const descText = extractAdfText(issue.fields.description);

  // Priority 1: explicit "Vertex: https://..." or "Vertex URL: https://..." in description
  const vertexMatch = descText.match(
    /Vertex(?:\s+URL)?:\s*(https?:\/\/[^\s\n)]+)/i,
  );
  if (vertexMatch) {
    return { url: vertexMatch[1].trim(), source: "explicit" };
  }

  // Priority 2: "Component: <name>" convention — slugify and look up known paths
  const componentMatch = descText.match(/^Component:\s*(.+)$/im);
  if (componentMatch) {
    const rawSlug = componentMatch[1].match(/^([^\s(,]+)/)?.[1];
    if (rawSlug) {
      const slug = rawSlug
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/(^-|-$)/g, "");
      const path = SLUG_PATH_MAP.get(slug);
      if (path) return { url: path, source: "convention" };
    }
  }

  // Priority 3: fall back to Jira ticket
  return { url: jiraUrl, source: "jira" };
}

function buildCard(issue: JiraIssue, jiraBaseUrl: string): ProcessedCard {
  const statusName = issue.fields.status.name;
  const section = toSection(statusName);
  const jiraUrl = `${jiraBaseUrl}/browse/${issue.key}`;

  const { url: link, source: linkSource } =
    section === "delivered"
      ? resolveDeliveredLink(issue, jiraUrl)
      : { url: jiraUrl, source: "jira" as LinkSource };

  const parentIsEpic =
    issue.fields.parent?.fields.issuetype.name === "Epic" ||
    issue.fields.parent?.fields.issuetype.hierarchyLevel === 1;

  return {
    key: issue.key,
    summary: issue.fields.summary,
    status: statusName,
    section,
    badge: toBadge(issue.fields.labels),
    link,
    linkSource,
    jiraUrl,
    updated: issue.fields.updated,
    epicName: parentIsEpic
      ? (issue.fields.parent?.fields.summary ?? null)
      : null,
    epicKey: parentIsEpic ? (issue.fields.parent?.key ?? null) : null,
  };
}

function isReviewStatus(s: string): boolean {
  const sl = s.toLowerCase();
  return sl === "review" || sl === "in review";
}

function sortComingSoon(cards: ProcessedCard[]): ProcessedCard[] {
  return cards.toSorted((a, b) => {
    const aReview = isReviewStatus(a.status);
    const bReview = isReviewStatus(b.status);
    if (aReview !== bReview) return aReview ? -1 : 1;
    return 0;
  });
}

function countLinkStats(cards: ProcessedCard[]): BoardData["linkStats"] {
  return cards.reduce(
    (acc, c) => {
      if (c.linkSource === "explicit") acc.explicit++;
      else if (c.linkSource === "convention") acc.convention++;
      else acc.jiraFallback++;
      return acc;
    },
    { explicit: 0, convention: 0, jiraFallback: 0 },
  );
}

export function processIssues(
  issues: JiraIssue[],
  jiraBaseUrl: string,
): BoardData {
  const delivered: ProcessedCard[] = [];
  const comingSoon: ProcessedCard[] = [];
  const backlog: ProcessedCard[] = [];

  for (const issue of issues) {
    const card = buildCard(issue, jiraBaseUrl);
    if (card.section === "delivered") delivered.push(card);
    else if (card.section === "coming-soon") comingSoon.push(card);
    else backlog.push(card);
  }

  return {
    delivered,
    comingSoon: sortComingSoon(comingSoon),
    backlog,
    linkStats: countLinkStats(delivered),
  };
}

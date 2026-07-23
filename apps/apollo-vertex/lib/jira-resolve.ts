import { type JiraIssue, extractAdfText } from "./jira";

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

function toSection(statusName: string): Section {
  const s = statusName.toLowerCase();
  if (s === "closed" || s === "done") return "delivered";
  if (s === "in progress" || s === "in review" || s === "review")
    return "coming-soon";
  return "backlog";
}

function toBadge(labels: string[]): BadgeLabel {
  if (labels.includes("ai-legal-required")) return "required";
  if (labels.includes("ai-legal-best-practice")) return "best-practice";
  return null;
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
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const path = SLUG_PATH_MAP.get(slug);
      if (path) return { url: path, source: "convention" };
    }
  }

  // Priority 3: fall back to Jira ticket
  return { url: jiraUrl, source: "jira" };
}

export function processIssues(
  issues: JiraIssue[],
  jiraBaseUrl: string,
): BoardData {
  const delivered: ProcessedCard[] = [];
  const comingSoon: ProcessedCard[] = [];
  const backlog: ProcessedCard[] = [];
  const linkStats = { explicit: 0, convention: 0, jiraFallback: 0 };

  for (const issue of issues) {
    const statusName = issue.fields.status.name;
    const section = toSection(statusName);
    const jiraUrl = `${jiraBaseUrl}/browse/${issue.key}`;

    let link: string;
    let linkSource: LinkSource;

    if (section === "delivered") {
      const resolved = resolveDeliveredLink(issue, jiraUrl);
      link = resolved.url;
      linkSource = resolved.source;
      if (linkSource === "explicit") linkStats.explicit++;
      else if (linkSource === "convention") linkStats.convention++;
      else linkStats.jiraFallback++;
    } else {
      link = jiraUrl;
      linkSource = "jira";
    }

    const parentIsEpic =
      issue.fields.parent?.fields.issuetype.name === "Epic" ||
      issue.fields.parent?.fields.issuetype.hierarchyLevel === 1;

    const card: ProcessedCard = {
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

    if (section === "delivered") {
      delivered.push(card);
    } else if (section === "coming-soon") {
      // Review/In Review sorts before In Progress — closer to landing
      const sl = statusName.toLowerCase();
      if (sl === "in review" || sl === "review") comingSoon.unshift(card);
      else comingSoon.push(card);
    } else {
      backlog.push(card);
    }
  }

  return { delivered, comingSoon, backlog, linkStats };
}

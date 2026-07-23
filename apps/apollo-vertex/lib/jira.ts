const JQL =
  'project = DESIGN AND labels = "horizontal-ux" AND status != "On hold" AND (statusCategory != Done OR labels = "ds-delivered") ORDER BY updated DESC';

const FIELDS = [
  "summary",
  "status",
  "labels",
  "updated",
  "resolutiondate",
  "description",
  "parent",
];

interface AdfNode {
  type: string;
  text?: string;
  content?: AdfNode[];
  attrs?: Record<string, string>;
}

export interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    status: { name: string };
    labels: string[];
    updated: string;
    resolutiondate: string | null;
    description: AdfNode | null;
    parent?: {
      key: string;
      fields: {
        summary: string;
        issuetype: { name: string; hierarchyLevel: number };
      };
    } | null;
  };
}

export function extractAdfText(node: AdfNode | null | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  if (node.type === "inlineCard") return node.attrs?.url ?? "";
  if (!node.content) return "";
  const parts = node.content.map(extractAdfText);
  const isBlock =
    node.type === "paragraph" ||
    node.type === "heading" ||
    node.type === "listItem" ||
    node.type === "bulletList" ||
    node.type === "orderedList";
  return isBlock ? `${parts.join("")}\n` : parts.join("");
}

export async function fetchJiraIssues(): Promise<JiraIssue[]> {
  const base = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  if (!base || !email || !token) {
    throw new Error(
      "Missing Jira configuration. Add JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN to .env.local",
    );
  }

  const auth = Buffer.from(`${email}:${token}`).toString("base64");
  const issues: JiraIssue[] = [];
  let nextPageToken: string | undefined;

  do {
    const body: Record<string, unknown> = {
      jql: JQL,
      fields: FIELDS,
      maxResults: 50,
    };
    if (nextPageToken) body["nextPageToken"] = nextPageToken;

    const res = await fetch(`${base}/rest/api/3/search/jql`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Jira API error ${res.status}: ${text}`);
    }

    const data = (await res.json()) as {
      issues?: JiraIssue[];
      nextPageToken?: string;
    };
    issues.push(...(data.issues ?? []));
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  return issues;
}

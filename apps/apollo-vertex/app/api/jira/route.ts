import { type NextRequest, NextResponse } from 'next/server';
import { fetchJiraIssues } from '@/lib/jira';
import { processIssues } from '@/lib/jira-resolve';

export async function GET(_req: NextRequest) {
  try {
    const issues = await fetchJiraIssues();
    const jiraBaseUrl = process.env.JIRA_BASE_URL ?? 'https://uipath.atlassian.net';
    const data = processIssues(issues, jiraBaseUrl);
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

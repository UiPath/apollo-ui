#!/usr/bin/env node
/**
 * Lists the comments real people left on pull requests merged with a given
 * label during a time window, as JSON (and optionally a markdown digest).
 *
 * Deterministic on purpose: the same window always produces the same output,
 * so the agent that turns review feedback into instructions
 * (apollo-vertex-review-feedback.yml) only decides what to learn, never what
 * to read.
 *
 * Usage:
 *   node collect-comments.mjs [--repo owner/name] [--label name]
 *     [--since ISO] [--until ISO] [--output file] [--summary-output file]
 *     [--ignore-user login]... [--trusted-associations A,B]
 *
 * Defaults to the previous UTC day, so a daily run covers every merge exactly
 * once regardless of when the scheduler starts it. Needs GITHUB_TOKEN or
 * GH_TOKEN with read access to pull requests.
 */

import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

export const DEFAULT_LABEL = 'app:apollo-vertex';

// Org membership is private for most UiPath engineers, so their comments are
// tagged CONTRIBUTOR or COLLABORATOR rather than MEMBER. NONE and the
// FIRST_TIME* values (anyone with a GitHub account) are left out because the
// comments feed an agent prompt.
export const DEFAULT_TRUSTED_ASSOCIATIONS = ['OWNER', 'MEMBER', 'COLLABORATOR', 'CONTRIBUTOR'];

const DAY_MS = 24 * 60 * 60 * 1000;
const CONTEXT_BODY_LIMIT = 1500;
const DIFF_HUNK_LINES = 15;

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function parseDate(value, name) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`--${name} must be an ISO 8601 date or timestamp, got "${value}"`);
  }
  return date;
}

/** Resolves the [since, until) window; both bounds default to the previous UTC day. */
export function resolveWindow({ since, until, now = new Date() }) {
  const untilDate = until ? parseDate(until, 'until') : startOfUtcDay(now);
  const sinceDate = since ? parseDate(since, 'since') : new Date(untilDate.getTime() - DAY_MS);
  if (sinceDate >= untilDate) {
    throw new Error(
      `--since (${sinceDate.toISOString()}) must be before --until (${untilDate.toISOString()})`
    );
  }
  return { since: sinceDate, until: untilDate };
}

/** Names the window for branches and titles: the date for one UTC day, otherwise the date range. */
export function windowLabel({ since, until }) {
  const day = (date) => date.toISOString().slice(0, 10);
  const isOneUtcDay =
    since.getTime() === startOfUtcDay(since).getTime() &&
    until.getTime() - since.getTime() === DAY_MS;
  return isOneUtcDay ? day(since) : `${day(since)}-to-${day(until)}`;
}

/**
 * The search API mis-parses `Z` timestamps in `merged:` ranges (it returns no
 * results), so query whole days with a day of margin on each side and filter
 * on `merged_at` exactly afterwards.
 */
export function buildSearchQuery({ repo, label, since, until }) {
  const day = (date) => date.toISOString().slice(0, 10);
  const from = day(new Date(since.getTime() - DAY_MS));
  const to = day(new Date(until.getTime() + DAY_MS));
  return `repo:${repo} is:pr is:merged label:"${label}" merged:${from}..${to}`;
}

export function isInWindow(timestamp, { since, until }) {
  const date = new Date(timestamp);
  return date >= since && date < until;
}

/** Returns why an author's comment is left out, or null when it counts as a real user's. */
export function exclusionReason(comment, { ignoreUsers, trustedAssociations }) {
  const user = comment.user;
  if (!user) return 'deleted-user';
  if (user.type !== 'User' || user.login.endsWith('[bot]')) return 'bot';
  if (ignoreUsers.includes(user.login.toLowerCase())) return 'ignored-user';
  if (!trustedAssociations.includes(comment.author_association)) return 'untrusted';
  if (!comment.body?.trim()) return 'empty';
  return null;
}

function truncate(text, limit) {
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

function lastLines(text, count) {
  const lines = text.split('\n');
  return lines.slice(-count).join('\n');
}

function isBotUser(user) {
  return !user || user.type !== 'User' || user.login.endsWith('[bot]');
}

function byCreatedAtThenId(a, b) {
  return a.createdAt.localeCompare(b.createdAt) || a.id - b.id;
}

/**
 * Turns the raw API responses for one pull request into its feedback entry.
 * Every comment kind is kept: inline review comments (with the code and the
 * thread they reply to), conversation comments, and review summaries.
 */
export function buildPullRequestFeedback(
  { pr, issueComments, reviewComments, reviews },
  options,
  excluded
) {
  const prAuthor = pr.user?.login ?? null;
  const reviewCommentsById = new Map(reviewComments.map((comment) => [comment.id, comment]));
  const comments = [];

  const keep = (comment) => {
    const reason = exclusionReason(comment, options);
    if (reason) {
      excluded[reason] = (excluded[reason] ?? 0) + 1;
      return false;
    }
    return true;
  };

  const base = (comment, kind, createdAt) => ({
    kind,
    id: comment.id,
    url: comment.html_url,
    author: comment.user.login,
    authorAssociation: comment.author_association,
    isPrAuthor: comment.user.login === prAuthor,
    createdAt,
    body: comment.body.trim(),
  });

  for (const comment of reviewComments) {
    if (!keep(comment)) continue;
    const parent = comment.in_reply_to_id ? reviewCommentsById.get(comment.in_reply_to_id) : null;
    comments.push({
      ...base(comment, 'review_comment', comment.created_at),
      path: comment.path,
      line: comment.line ?? comment.original_line ?? null,
      diffHunk: comment.diff_hunk ? lastLines(comment.diff_hunk, DIFF_HUNK_LINES) : null,
      inReplyTo: parent
        ? {
            author: parent.user?.login ?? null,
            isBot: isBotUser(parent.user),
            body: truncate(parent.body?.trim() ?? '', CONTEXT_BODY_LIMIT),
          }
        : null,
    });
  }

  for (const comment of issueComments) {
    if (!keep(comment)) continue;
    comments.push(base(comment, 'issue_comment', comment.created_at));
  }

  for (const review of reviews) {
    if (!keep(review)) continue;
    comments.push({ ...base(review, 'review', review.submitted_at ?? ''), state: review.state });
  }

  comments.sort(byCreatedAtThenId);

  return {
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
    author: prAuthor,
    mergedAt: pr.pull_request.merged_at,
    comments,
  };
}

/** Assembles the report from already-fetched data. Pure, so it can be tested without the API. */
export function buildReport({ repo, label, window, pullRequests, options }) {
  const excluded = {};
  const feedback = pullRequests
    .map((data) => buildPullRequestFeedback(data, options, excluded))
    .sort((a, b) => a.mergedAt.localeCompare(b.mergedAt) || a.number - b.number);
  const withComments = feedback.filter((pr) => pr.comments.length > 0);

  return {
    repo,
    label,
    since: window.since.toISOString(),
    until: window.until.toISOString(),
    windowLabel: windowLabel(window),
    summary: {
      pullRequestsMerged: feedback.length,
      pullRequestsWithFeedback: withComments.length,
      commentsIncluded: withComments.reduce((total, pr) => total + pr.comments.length, 0),
      commentsExcluded: Object.fromEntries(Object.entries(excluded).sort()),
    },
    pullRequests: withComments,
  };
}

/** Short markdown digest of the report, used as the source list in the generated PR body. */
export function renderSummaryMarkdown(report) {
  const { summary } = report;
  const lines = [
    `Review comments from pull requests labeled \`${report.label}\` merged between ${report.since} and ${report.until}.`,
    '',
    `- Pull requests merged: ${summary.pullRequestsMerged}`,
    `- Pull requests with human comments: ${summary.pullRequestsWithFeedback}`,
    `- Comments considered: ${summary.commentsIncluded}`,
  ];
  const excludedEntries = Object.entries(summary.commentsExcluded);
  if (excludedEntries.length > 0) {
    const parts = excludedEntries.map(([reason, count]) => `${reason}: ${count}`);
    lines.push(`- Comments skipped: ${parts.join(', ')}`);
  }
  if (report.pullRequests.length > 0) {
    lines.push('', '| Pull request | Comments |', '| --- | --- |');
    for (const pr of report.pullRequests) {
      const title = pr.title.replaceAll('|', '\\|');
      lines.push(`| [#${pr.number}](${pr.url}) ${title} | ${pr.comments.length} |`);
    }
  }
  return `${lines.join('\n')}\n`;
}

function createGitHubClient(token, apiUrl = 'https://api.github.com') {
  async function request(url) {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!response.ok) {
      throw new Error(`GitHub API ${response.status} for ${url}: ${await response.text()}`);
    }
    return response;
  }

  function nextLink(response) {
    const match = response.headers.get('link')?.match(/<([^>]+)>;\s*rel="next"/);
    return match ? match[1] : null;
  }

  return {
    async paginate(path, pick = (data) => data) {
      const results = [];
      let url = `${apiUrl}${path}${path.includes('?') ? '&' : '?'}per_page=100`;
      while (url) {
        const response = await request(url);
        results.push(...pick(await response.json()));
        url = nextLink(response);
      }
      return results;
    },
    async get(path) {
      return (await request(`${apiUrl}${path}`)).json();
    },
  };
}

async function fetchMergedPullRequests(client, { repo, label, window }) {
  const query = buildSearchQuery({ repo, label, ...window });
  const first = await client.get(`/search/issues?q=${encodeURIComponent(query)}&per_page=1`);
  if (first.total_count > 1000) {
    throw new Error(`Search matched ${first.total_count} PRs; narrow the window below 1000.`);
  }
  const items = await client.paginate(
    `/search/issues?q=${encodeURIComponent(query)}`,
    (data) => data.items
  );
  return items.filter(
    (item) =>
      item.pull_request?.merged_at &&
      isInWindow(item.pull_request.merged_at, window) &&
      item.labels.some((itemLabel) => itemLabel.name === label)
  );
}

async function fetchPullRequestData(client, repo, pr) {
  const [issueComments, reviewComments, reviews] = await Promise.all([
    client.paginate(`/repos/${repo}/issues/${pr.number}/comments`),
    client.paginate(`/repos/${repo}/pulls/${pr.number}/comments`),
    client.paginate(`/repos/${repo}/pulls/${pr.number}/reviews`),
  ]);
  return { pr, issueComments, reviewComments, reviews };
}

export function parseCliArgs(argv, env = process.env) {
  const { values } = parseArgs({
    args: argv,
    options: {
      repo: { type: 'string', default: env.GITHUB_REPOSITORY },
      label: { type: 'string', default: DEFAULT_LABEL },
      since: { type: 'string' },
      until: { type: 'string' },
      output: { type: 'string' },
      'summary-output': { type: 'string' },
      'ignore-user': { type: 'string', multiple: true, default: [] },
      'trusted-associations': {
        type: 'string',
        default: DEFAULT_TRUSTED_ASSOCIATIONS.join(','),
      },
    },
    strict: true,
  });
  if (!values.repo || !/^[\w.-]+\/[\w.-]+$/.test(values.repo)) {
    throw new Error('--repo owner/name is required (or set GITHUB_REPOSITORY)');
  }
  return {
    repo: values.repo,
    label: values.label,
    window: resolveWindow({ since: values.since, until: values.until }),
    output: values.output,
    summaryOutput: values['summary-output'],
    options: {
      ignoreUsers: values['ignore-user'].map((login) => login.toLowerCase()),
      trustedAssociations: values['trusted-associations']
        .split(',')
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean),
    },
  };
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) throw new Error('Set GITHUB_TOKEN or GH_TOKEN');

  const client = createGitHubClient(token, process.env.GITHUB_API_URL);
  const merged = await fetchMergedPullRequests(client, args);
  const pullRequests = [];
  for (const pr of merged) {
    pullRequests.push(await fetchPullRequestData(client, args.repo, pr));
  }

  const report = buildReport({ ...args, pullRequests });
  const json = `${JSON.stringify(report, null, 2)}\n`;
  if (args.output) {
    await writeFile(args.output, json);
  } else {
    process.stdout.write(json);
  }
  if (args.summaryOutput) {
    await writeFile(args.summaryOutput, renderSummaryMarkdown(report));
  }

  const { summary } = report;
  console.error(
    `${summary.pullRequestsMerged} PRs merged, ${summary.pullRequestsWithFeedback} with feedback, ` +
      `${summary.commentsIncluded} comments included, skipped: ${JSON.stringify(summary.commentsExcluded)}`
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

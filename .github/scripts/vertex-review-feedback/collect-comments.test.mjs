import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildReport,
  buildSearchQuery,
  DEFAULT_TRUSTED_ASSOCIATIONS,
  exclusionReason,
  parseCliArgs,
  renderSummaryMarkdown,
  resolveWindow,
  windowLabel,
} from './collect-comments.mjs';

const options = { ignoreUsers: [], trustedAssociations: DEFAULT_TRUSTED_ASSOCIATIONS };

const person = (login) => ({ login, type: 'User' });
const bot = (login) => ({ login, type: 'Bot' });

function comment(id, user, body, extra = {}) {
  return {
    id,
    user,
    body,
    author_association: 'CONTRIBUTOR',
    html_url: `https://github.com/o/r/pull/1#c${id}`,
    created_at: `2026-10-20T10:00:${String(id % 60).padStart(2, '0')}Z`,
    ...extra,
  };
}

function review(id, user, body, state) {
  const { created_at: submittedAt, ...rest } = comment(id, user, body);
  return { ...rest, state, submitted_at: submittedAt };
}

function pullRequest(number, mergedAt, author = 'author') {
  return {
    number,
    title: `PR ${number}`,
    html_url: `https://github.com/o/r/pull/${number}`,
    user: person(author),
    pull_request: { merged_at: mergedAt },
  };
}

const window = resolveWindow({ since: '2026-10-20', until: '2026-10-21' });

describe('resolveWindow', () => {
  it('defaults to the previous UTC day', () => {
    const result = resolveWindow({ now: new Date('2026-10-26T05:03:00Z') });
    assert.equal(result.since.toISOString(), '2026-10-25T00:00:00.000Z');
    assert.equal(result.until.toISOString(), '2026-10-26T00:00:00.000Z');
  });

  it('defaults since to one day before an explicit until', () => {
    const result = resolveWindow({ until: '2026-10-10T12:00:00Z' });
    assert.equal(result.since.toISOString(), '2026-10-09T12:00:00.000Z');
  });

  it('rejects invalid and inverted windows', () => {
    assert.throws(() => resolveWindow({ since: 'yesterday' }), /ISO 8601/);
    assert.throws(() => resolveWindow({ since: '2026-10-21', until: '2026-10-20' }), /before/);
  });
});

describe('windowLabel', () => {
  it('uses the date for exactly one UTC day and a range otherwise', () => {
    assert.equal(windowLabel(window), '2026-10-20');
    assert.equal(
      windowLabel(resolveWindow({ since: '2026-10-13', until: '2026-10-20' })),
      '2026-10-13-to-2026-10-20'
    );
  });
});

describe('buildSearchQuery', () => {
  it('queries whole days with a day of margin on each side', () => {
    assert.equal(
      buildSearchQuery({ repo: 'o/r', label: 'app:apollo-vertex', ...window }),
      'repo:o/r is:pr is:merged label:"app:apollo-vertex" merged:2026-10-19..2026-10-22'
    );
  });
});

describe('exclusionReason', () => {
  it('keeps trusted people', () => {
    assert.equal(exclusionReason(comment(1, person('ruud'), 'nit'), options), null);
  });

  it('drops bots by type and by [bot] login', () => {
    assert.equal(exclusionReason(comment(1, bot('Copilot'), 'x'), options), 'bot');
    assert.equal(exclusionReason(comment(1, person('renovate[bot]'), 'x'), options), 'bot');
  });

  it('drops deleted users, ignored users, untrusted authors and empty bodies', () => {
    assert.equal(exclusionReason(comment(1, null, 'x'), options), 'deleted-user');
    assert.equal(
      exclusionReason(comment(1, person('Bob'), 'x'), { ...options, ignoreUsers: ['bob'] }),
      'ignored-user'
    );
    assert.equal(
      exclusionReason(comment(1, person('anon'), 'x', { author_association: 'NONE' }), options),
      'untrusted'
    );
    assert.equal(exclusionReason(comment(1, person('ruud'), '  \n'), options), 'empty');
  });
});

describe('buildReport', () => {
  const pullRequests = [
    {
      pr: pullRequest(2, '2026-10-20T15:00:00Z'),
      issueComments: [comment(10, bot('github-actions[bot]'), 'preview ready')],
      reviewComments: [],
      reviews: [review(11, person('ruud'), '', 'APPROVED')],
    },
    {
      pr: pullRequest(1, '2026-10-20T09:00:00Z'),
      issueComments: [comment(22, person('koko'), 'Thanks!')],
      reviewComments: [
        comment(20, bot('Copilot'), 'Consider sorting keys.', { path: 'a.ts', line: 3 }),
        comment(21, person('author'), 'Fixed in abc.', {
          in_reply_to_id: 20,
          path: 'a.ts',
          line: 3,
          diff_hunk: Array.from({ length: 20 }, (_, i) => `line ${i}`).join('\n'),
        }),
        comment(23, person('ruud'), 'pointless comment', { path: 'b.ts', original_line: 7 }),
      ],
      reviews: [review(24, person('ruud'), 'Drop the docs note.', 'CHANGES_REQUESTED')],
    },
  ];

  const report = buildReport({
    repo: 'o/r',
    label: 'app:apollo-vertex',
    window,
    pullRequests,
    options,
  });

  it('summarizes what was kept and skipped', () => {
    assert.deepEqual(report.summary, {
      pullRequestsMerged: 2,
      pullRequestsWithFeedback: 1,
      commentsIncluded: 4,
      commentsExcluded: { bot: 2, empty: 1 },
    });
    assert.equal(report.windowLabel, '2026-10-20');
  });

  it('drops pull requests without human comments', () => {
    assert.deepEqual(
      report.pullRequests.map((pr) => pr.number),
      [1]
    );
  });

  it('sorts comments by time and tags the PR author', () => {
    const [pr] = report.pullRequests;
    assert.deepEqual(
      pr.comments.map((c) => [c.id, c.kind, c.isPrAuthor]),
      [
        [21, 'review_comment', true],
        [22, 'issue_comment', false],
        [23, 'review_comment', false],
        [24, 'review', false],
      ]
    );
  });

  it('includes the thread a reply answers, even when a bot wrote it', () => {
    const reply = report.pullRequests[0].comments.find((c) => c.id === 21);
    assert.deepEqual(reply.inReplyTo, {
      author: 'Copilot',
      isBot: true,
      body: 'Consider sorting keys.',
    });
    assert.equal(reply.diffHunk.split('\n').length, 15);
    assert.ok(reply.diffHunk.endsWith('line 19'));
  });

  it('falls back to the original line for outdated comments', () => {
    const outdated = report.pullRequests[0].comments.find((c) => c.id === 23);
    assert.equal(outdated.line, 7);
    assert.equal(outdated.inReplyTo, null);
  });

  it('keeps the review state on review summaries', () => {
    const review = report.pullRequests[0].comments.find((c) => c.id === 24);
    assert.equal(review.state, 'CHANGES_REQUESTED');
  });
});

describe('renderSummaryMarkdown', () => {
  it('lists source pull requests and escapes table pipes', () => {
    const markdown = renderSummaryMarkdown({
      label: 'app:apollo-vertex',
      since: '2026-10-20T00:00:00.000Z',
      until: '2026-10-21T00:00:00.000Z',
      summary: {
        pullRequestsMerged: 3,
        pullRequestsWithFeedback: 1,
        commentsIncluded: 2,
        commentsExcluded: { bot: 5 },
      },
      pullRequests: [{ number: 7, title: 'a | b', url: 'https://x/7', comments: [{}, {}] }],
    });
    assert.match(markdown, /Comments skipped: bot: 5/);
    assert.match(markdown, /\| \[#7\]\(https:\/\/x\/7\) a \\\| b \| 2 \|/);
  });
});

describe('parseCliArgs', () => {
  it('reads the repo from GITHUB_REPOSITORY and normalizes filters', () => {
    const args = parseCliArgs(
      [
        '--since',
        '2026-10-20',
        '--ignore-user',
        'SomeBot',
        '--trusted-associations',
        'member, owner',
      ],
      { GITHUB_REPOSITORY: 'UiPath/apollo-ui' }
    );
    assert.equal(args.repo, 'UiPath/apollo-ui');
    assert.equal(args.label, 'app:apollo-vertex');
    assert.deepEqual(args.options, {
      ignoreUsers: ['somebot'],
      trustedAssociations: ['MEMBER', 'OWNER'],
    });
  });

  it('requires a repo', () => {
    assert.throws(() => parseCliArgs([], {}), /--repo/);
  });
});

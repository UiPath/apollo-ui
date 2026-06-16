// Posts a sticky PR comment with per-package coverage:
//   - Overall coverage % (from <pkg>/coverage/coverage-summary.json)
//   - New-line coverage % (intersection of `git diff` against PR base + lcov.info)
//
// Invoked from .github/workflows/pr-checks.yml via actions/github-script.
// Also runnable locally:  node scripts/coverage-pr-comment.cjs --dry-run [--base=<sha>] [--head=<sha>]
//
// No external deps — lcov is parsed inline so we don't have to add anything to package.json.

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
// Apollo packages live under two workspace roots.
const PACKAGE_ROOTS = ['packages', 'web-packages'];
const MARKER = '<!-- coverage-comment -->';
// The sticky comment is authored by the Actions token; only ever update our own.
const COMMENT_AUTHOR = 'github-actions[bot]';

// Skip tests/specs in new-line coverage calc — they're excluded from coverage too.
const TEST_FILE_RE = /\.(test|spec)\.(ts|tsx|js|jsx)$/;
const SOURCE_FILE_RE = /\.(ts|tsx|js|jsx)$/;

// Allow only characters that are valid in SHAs and ref names: alphanumeric, dot, dash,
// underscore, slash. No shell metacharacters. Belt-and-suspenders alongside execFileSync.
const GIT_REF_RE = /^[A-Za-z0-9._/\-]+$/;

/** Parse `git diff --unified=0` output → Map<repoRelativePath, Set<lineNumber>> for the
 *  new side of each hunk, i.e. added AND modified lines (deletions don't appear there). */
function parseDiff(diffText) {
  const out = new Map();
  let currentFile = null;
  for (const line of diffText.split('\n')) {
    if (line.startsWith('diff --git ')) {
      const m = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
      currentFile = m ? m[2] : null;
      continue;
    }
    if (line.startsWith('+++ /dev/null')) {
      currentFile = null;
      continue;
    }
    if (line.startsWith('+++ b/')) {
      currentFile = line.slice(6);
      continue;
    }
    if (line.startsWith('@@') && currentFile) {
      // @@ -<oldStart>[,<oldCount>] +<newStart>[,<newCount>] @@
      const m = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
      if (!m) continue;
      const newStart = parseInt(m[1], 10);
      const newCount = m[2] !== undefined ? parseInt(m[2], 10) : 1;
      if (newCount <= 0) continue;
      let set = out.get(currentFile);
      if (!set) {
        set = new Set();
        out.set(currentFile, set);
      }
      for (let n = 0; n < newCount; n++) set.add(newStart + n);
    }
  }
  return out;
}

/** Parse lcov.info → Map<sfPath, Map<lineNumber, hits>>. */
function parseLcov(lcovPath) {
  const result = new Map();
  let text;
  try {
    text = fs.readFileSync(lcovPath, 'utf8');
  } catch {
    return result;
  }
  let currentMap = null;
  for (const line of text.split('\n')) {
    if (line.startsWith('SF:')) {
      currentMap = new Map();
      result.set(line.slice(3).trim(), currentMap);
    } else if (line.startsWith('DA:') && currentMap) {
      const [num, hits] = line.slice(3).split(',');
      currentMap.set(parseInt(num, 10), parseInt(hits, 10));
    } else if (line === 'end_of_record') {
      currentMap = null;
    }
  }
  return result;
}

/** Force POSIX separators so paths from `path.relative()` (native separators on Windows)
 *  match `git diff` output (always POSIX). */
function toPosixPath(p) {
  return p.split(path.sep).join('/');
}

/** lcov SF: paths can be absolute or relative to the package — normalize to repo-relative POSIX. */
function normalizeLcovPath(sfPath, packageDir) {
  const abs = path.isAbsolute(sfPath) ? sfPath : path.resolve(packageDir, sfPath);
  return toPosixPath(path.relative(REPO_ROOT, abs));
}

/** Workspace packages that ship a vitest config (only those produce coverage). */
function listInstrumentedPackages() {
  const out = [];
  for (const root of PACKAGE_ROOTS) {
    const rootDir = path.join(REPO_ROOT, root);
    if (!fs.existsSync(rootDir)) continue;
    for (const d of fs.readdirSync(rootDir, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const dir = path.join(rootDir, d.name);
      const hasVitest = ['ts', 'mts', 'js', 'mjs'].some((ext) =>
        fs.existsSync(path.join(dir, `vitest.config.${ext}`))
      );
      if (hasVitest) out.push({ rel: `${root}/${d.name}`, dir });
    }
  }
  return out.sort((a, b) => a.rel.localeCompare(b.rel));
}

function readPkgName(pkgDir) {
  try {
    const json = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
    return json.name || path.basename(pkgDir);
  } catch {
    return path.basename(pkgDir);
  }
}

function readOverallPct(pkgDir) {
  try {
    const json = JSON.parse(fs.readFileSync(path.join(pkgDir, 'coverage', 'coverage-summary.json'), 'utf8'));
    const pct = json?.total?.lines?.pct;
    return typeof pct === 'number' && !Number.isNaN(pct) ? pct : null;
  } catch {
    return null;
  }
}

function fmtPct(pct) {
  return pct === null ? '—' : `${pct.toFixed(1)}%`;
}

function buildTable({ baseSha, headSha }) {
  // Defense in depth against command injection: (1) reject anything outside a strict
  // git-ref alphabet, then (2) hand args directly to git via execFileSync (no shell).
  if (!GIT_REF_RE.test(baseSha) || !GIT_REF_RE.test(headSha)) {
    throw new Error(`Invalid git ref: base=${JSON.stringify(baseSha)} head=${JSON.stringify(headSha)}`);
  }
  const diffText = execFileSync(
    'git',
    ['diff', '--unified=0', '--no-color', '--no-renames', `${baseSha}...${headSha}`],
    { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  );
  const changedByFile = parseDiff(diffText);

  const packages = listInstrumentedPackages();
  const rows = [];
  let anyChanges = false;

  for (const pkg of packages) {
    const pkgName = readPkgName(pkg.dir);
    const overallPct = readOverallPct(pkg.dir);

    const pkgPrefix = `${pkg.rel}/`;
    const pkgChanged = [];
    for (const [file, lines] of changedByFile) {
      if (!file.startsWith(pkgPrefix)) continue;
      if (!SOURCE_FILE_RE.test(file)) continue;
      if (TEST_FILE_RE.test(file)) continue;
      pkgChanged.push({ file, lines });
    }

    let newLineCell = '—';
    if (pkgChanged.length > 0) {
      anyChanges = true;
      const lcov = parseLcov(path.join(pkg.dir, 'coverage', 'lcov.info'));

      // No coverage report at all (job didn't run/upload for this package, e.g. not
      // affected) — don't mislabel changed lines as "untracked"; say so explicitly.
      if (lcov.size === 0 && overallPct === null) {
        rows.push(`| \`${pkgName}\` | ${fmtPct(overallPct)} | — (no coverage report) |`);
        continue;
      }

      const lcovByRepoPath = new Map();
      for (const [sfPath, lineMap] of lcov) {
        lcovByRepoPath.set(normalizeLcovPath(sfPath, pkg.dir), lineMap);
      }

      let totalNew = 0;
      let coveredNew = 0;
      let untracked = 0; // changed lines with no instrumentation entry (e.g. types)
      for (const { file, lines } of pkgChanged) {
        const lcovLines = lcovByRepoPath.get(file);
        for (const lineNum of lines) {
          if (lcovLines && lcovLines.has(lineNum)) {
            totalNew++;
            if (lcovLines.get(lineNum) > 0) coveredNew++;
          } else {
            untracked++;
          }
        }
      }
      if (totalNew > 0) {
        const pct = (coveredNew / totalNew) * 100;
        newLineCell = `${pct.toFixed(1)}% (${coveredNew}/${totalNew})`;
      } else if (untracked > 0) {
        newLineCell = `— (${untracked} untracked)`;
      }
    }

    rows.push(`| \`${pkgName}\` | ${fmtPct(overallPct)} | ${newLineCell} |`);
  }

  const summary = anyChanges
    ? 'Per-package coverage on this PR. **New-line coverage** = of the source lines this PR adds or changes, what % is hit by tests.'
    : 'No JS/TS source changes detected under `packages/*` or `web-packages/*` for this PR.';

  return `${MARKER}
### 📊 Coverage by package

${summary}

| Package | Overall | New-line coverage |
| --- | ---: | ---: |
${rows.join('\n')}

<sub>"Overall" is each package's own \`coverage.include\` scope (e.g. apollo-core instruments only \`scripts/\`, not its generated tokens, so its % is not whole-package). "Untracked" = changed lines with no coverage instrumentation (types, config, generated code). Packages with no vitest config are omitted.</sub>`;
}

async function buildAndPostCoverageComment({ github, context, core }) {
  if (!context.payload.pull_request) {
    if (core) core.info('Not a pull_request event; skipping coverage comment.');
    return;
  }
  const baseSha = context.payload.pull_request.base.sha;
  // Use the checked-out commit (the merge ref by default for pull_request events) instead of
  // pull_request.head.sha — coverage was generated against this tree, so its lcov line numbers
  // line up with the diff only when both refer to the same SHA.
  const headSha = context.sha;

  let body;
  try {
    body = buildTable({ baseSha, headSha });
  } catch (err) {
    if (core) core.warning(`Coverage comment failed to build: ${err.message}`);
    return;
  }

  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const issue_number = context.payload.pull_request.number;

  // Paginate across all pages so the sticky marker is found even past page 1.
  const comments = await github.paginate(github.rest.issues.listComments, {
    owner,
    repo,
    issue_number,
    per_page: 100,
  });
  // Only match our own bot's comment — a user posting a comment that starts with the
  // marker must not hijack (or break) the sticky update.
  const existing = comments.find(
    (c) => c.body && c.body.startsWith(MARKER) && c.user && c.user.login === COMMENT_AUTHOR
  );
  if (existing) {
    await github.rest.issues.updateComment({ owner, repo, comment_id: existing.id, body });
  } else {
    await github.rest.issues.createComment({ owner, repo, issue_number, body });
  }
}

module.exports = { buildAndPostCoverageComment, buildTable, MARKER };

// Local dry-run:
//   node scripts/coverage-pr-comment.cjs --dry-run
//   node scripts/coverage-pr-comment.cjs --dry-run --base=origin/main --head=HEAD
if (require.main === module) {
  const args = process.argv.slice(2);
  if (!args.includes('--dry-run')) {
    console.error('Usage: node scripts/coverage-pr-comment.cjs --dry-run [--base=<sha>] [--head=<sha>]');
    process.exit(2);
  }
  let base = process.env.COVERAGE_BASE_SHA || 'origin/main';
  let head = process.env.COVERAGE_HEAD_SHA || 'HEAD';
  for (const a of args) {
    if (a.startsWith('--base=')) base = a.slice(7);
    if (a.startsWith('--head=')) head = a.slice(7);
  }
  try {
    process.stdout.write(buildTable({ baseSha: base, headSha: head }) + '\n');
  } catch (err) {
    console.error('Dry-run failed:', err.message);
    process.exit(1);
  }
}

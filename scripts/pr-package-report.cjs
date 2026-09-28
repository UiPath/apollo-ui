// Posts a sticky PR comment with a per-package report:
//   - Coverage: overall % (from <pkg>/coverage/coverage-summary.json) + new-line % (lcov ∩ diff)
//   - Size: packed (gzip) + unpacked, via `npm pack --dry-run` on built packages
//   - vs main: packed delta against the last successful main build's sizes (apples-to-apples —
//     both maps are produced by this same script on the same CI; no npm/registry involved)
//
// Invoked from .github/workflows/pr-checks.yml via actions/github-script. The main baseline is
// the `package-sizes` artifact uploaded by .github/workflows/release.yml on every main build.
// Also runnable locally:  node scripts/pr-package-report.cjs --dry-run [--base=<sha>] [--head=<sha>] [--base-sizes=<file>]
//
// No external deps — lcov/diff are parsed inline so we don't have to add anything to package.json.

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

function fmtBytes(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—';
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}

/** Signed byte delta for the "vs main" column. */
function fmtDelta(bytes) {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) return '—';
  if (bytes === 0) return '±0';
  return `${bytes > 0 ? '+' : '−'}${fmtBytes(Math.abs(bytes))}`;
}

/** Run `npm pack --dry-run --json` per built package → { "<root>/<pkg>": {packed, unpacked} }.
 *  Only packages whose dist/ exists are measured (npm pack reads package.json `files`).
 *  `packed` is the gzipped tarball size npm would publish; `unpacked` is the installed size.
 *  `--ignore-scripts` so size collection never runs a package's prepare/prepack lifecycle. */
function collectPackageSizes() {
  const sizes = {};
  for (const pkg of listInstrumentedPackages()) {
    if (!fs.existsSync(path.join(pkg.dir, 'dist'))) continue;
    try {
      const out = execFileSync('npm', ['pack', '--dry-run', '--ignore-scripts', '--json'], {
        cwd: pkg.dir,
        encoding: 'utf8',
        maxBuffer: 32 * 1024 * 1024,
      });
      const meta = JSON.parse(out)[0];
      if (meta) sizes[pkg.rel] = { packed: meta.size, unpacked: meta.unpackedSize };
    } catch {
      // unmeasurable (e.g. dist incomplete) → renders as "—"
    }
  }
  return sizes;
}

/** Read a pre-collected sizes map (written by --collect-sizes). Always returns a plain object of
 *  well-formed entries: a corrupt/non-object artifact (e.g. `null`, an array, a primitive) or an
 *  entry missing numeric packed/unpacked is dropped, so callers can rely on Object.keys/lookups
 *  never throwing and the report still renders ("vs main" → "—"). */
function readSizes(sizesPath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(sizesPath, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out = {};
    for (const [key, v] of Object.entries(parsed)) {
      if (v && typeof v === 'object' && typeof v.packed === 'number' && typeof v.unpacked === 'number') {
        out[key] = { packed: v.packed, unpacked: v.unpacked };
      }
    }
    return out;
  } catch {
    return {};
  }
}

function buildTable({ baseSha, headSha, sizes = {}, baseSizes = {} }) {
  const hasBaseline = Object.keys(baseSizes).length > 0;
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

      if (lcov.size === 0 && overallPct === null) {
        // No coverage report (e.g. package not affected) — don't mislabel changes as untracked.
        newLineCell = '— (no coverage report)';
      } else {
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
          newLineCell = `${((coveredNew / totalNew) * 100).toFixed(1)}% (${coveredNew}/${totalNew})`;
        } else if (untracked > 0) {
          newLineCell = `— (${untracked} untracked)`;
        }
      }
    }

    const size = sizes[pkg.rel];
    const packedCell = size ? fmtBytes(size.packed) : '—';
    const unpackedCell = size ? fmtBytes(size.unpacked) : '—';
    // "vs main" = packed (gzipped) delta against the last successful main build. Both maps come
    // from the same `npm pack` on the same CI, so the delta is a true build-to-build comparison.
    let vsCell = '—';
    if (size) {
      const base = baseSizes[pkg.rel];
      if (base && typeof base.packed === 'number') {
        vsCell = fmtDelta(size.packed - base.packed);
      } else if (hasBaseline) {
        vsCell = '🆕 new'; // baseline exists but this package isn't in it yet
      }
      // else: no main baseline available this run → leave "—"
    }

    rows.push(
      `| \`${pkgName}\` | ${fmtPct(overallPct)} | ${newLineCell} | ${packedCell} | ${unpackedCell} | ${vsCell} |`
    );
  }

  const summary = anyChanges
    ? 'Per-package coverage and bundle size on this PR. **New-line coverage** = of the source lines this PR adds or changes, the % hit by tests.'
    : 'Per-package bundle size on this PR (no JS/TS source changes detected under `packages/*` or `web-packages/*`).';

  return `${MARKER}
### 📊 Coverage + size by package

${summary}

| Package | Coverage | New-line coverage | Packed (gzip) | Unpacked | vs main |
| --- | ---: | ---: | ---: | ---: | ---: |
${rows.join('\n')}

<sub>"Coverage" is each package's own \`coverage.include\` scope (e.g. apollo-core instruments only \`scripts/\`). "Packed"/"Unpacked" come from \`npm pack --dry-run\` and only cover built packages — "—" means not measured this run (package not affected / not built). "vs main" is the **packed (gzipped)** delta against the last successful \`main\` build (the \`package-sizes\` artifact from the Release workflow); "—" there means no main baseline was available this run. The baseline is main's latest build, not this PR's exact merge-base, so it includes any drift since the branch diverged. Packages with no vitest config are omitted.</sub>`;
}

async function postPackageReportComment({ github, context, core }) {
  if (!context.payload.pull_request) {
    if (core) core.info('Not a pull_request event; skipping package report comment.');
    return;
  }
  const baseSha = context.payload.pull_request.base.sha;
  // Use the checked-out commit (the merge ref by default for pull_request events) instead of
  // pull_request.head.sha — coverage was generated against this tree, so its lcov line numbers
  // line up with the diff only when both refer to the same SHA.
  const headSha = context.sha;

  // Head sizes: collected by this PR's Build job (--collect-sizes) and downloaded as an artifact.
  // Base sizes: the last successful main build's `package-sizes` artifact (release.yml), downloaded
  // by the comment job. Either absent → that column renders as "—".
  const sizes = readSizes(process.env.PKG_SIZES_FILE || path.join(REPO_ROOT, 'pkg-sizes.json'));
  const baseSizes = process.env.PKG_SIZES_BASE_FILE ? readSizes(process.env.PKG_SIZES_BASE_FILE) : {};

  let body;
  try {
    body = buildTable({ baseSha, headSha, sizes, baseSizes });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    if (core) core.warning(`Package report failed to build: ${detail}`);
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

module.exports = { postPackageReportComment, buildTable, collectPackageSizes, readSizes, MARKER };

// CLI:
//   node scripts/pr-package-report.cjs --collect-sizes[=pkg-sizes.json]   (CI Build + Release jobs)
//   node scripts/pr-package-report.cjs --dry-run [--base=<sha>] [--head=<sha>] [--base-sizes=<file>]
if (require.main === module) {
  const args = process.argv.slice(2);

  // Collect mode: pack each built package and write the sizes map (PR Build job → head baseline;
  // Release/main build → the baseline PRs compare against).
  const collectArg = args.find((a) => a === '--collect-sizes' || a.startsWith('--collect-sizes='));
  if (collectArg) {
    const out = collectArg.includes('=') ? collectArg.split('=')[1] : 'pkg-sizes.json';
    const sizes = collectPackageSizes();
    fs.writeFileSync(out, JSON.stringify(sizes, null, 2));
    console.error(`Wrote ${Object.keys(sizes).length} package size(s) → ${out}`);
    process.exit(0);
  }

  if (!args.includes('--dry-run')) {
    console.error(
      'Usage: node scripts/pr-package-report.cjs (--collect-sizes[=file] | --dry-run [--base=<sha>] [--head=<sha>] [--base-sizes=<file>])'
    );
    process.exit(2);
  }
  let base = process.env.COVERAGE_BASE_SHA || 'origin/main';
  let head = process.env.COVERAGE_HEAD_SHA || 'HEAD';
  let baseSizesFile = null;
  for (const a of args) {
    if (a.startsWith('--base=')) base = a.slice(7);
    if (a.startsWith('--head=')) head = a.slice(7);
    if (a.startsWith('--base-sizes=')) baseSizesFile = a.slice(13);
  }
  try {
    // Local dry-run measures head sizes inline (built packages only); pass --base-sizes to
    // compare against a saved main baseline, otherwise the "vs main" column shows "—".
    const baseSizes = baseSizesFile ? readSizes(baseSizesFile) : {};
    process.stdout.write(buildTable({ baseSha: base, headSha: head, sizes: collectPackageSizes(), baseSizes }) + '\n');
  } catch (err) {
    console.error('Dry-run failed:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

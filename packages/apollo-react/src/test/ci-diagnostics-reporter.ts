import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Reporter, TestModule, Vitest } from 'vitest/node';

type UnhandledErrors = Parameters<NonNullable<Reporter['onTestRunEnd']>>[1];

/** Tests that take at least this share of the timeout are listed as close to it. */
const SLOW_SHARE = 0.5;
/** Caps each list so a mass failure still makes a readable summary. */
const MAX_ENTRIES = 50;

const firstLine = (text = '') => text.split('\n', 1)[0] ?? '';

function capped(entries: string[]) {
  return entries.length > MAX_ENTRIES
    ? [...entries.slice(0, MAX_ENTRIES), `- ...and ${entries.length - MAX_ENTRIES} more`]
    : entries;
}

/**
 * Writes why a run failed to a file and, on a failing exit, to the GitHub job summary. The CI
 * job log drops the end of turbo's buffered Vitest output, summary and errors included.
 */
export class CiDiagnosticsReporter implements Reporter {
  private timeout = 5000;
  // Replaced at the end of the run, so a file still holding this means the run never got there.
  private body = ['The run started but never reached its end.'];

  constructor(private readonly outputFile: string) {}

  onInit(vitest: Vitest) {
    this.timeout = vitest.config.testTimeout;
    this.write();
    process.once('exit', (code) => {
      // ru_maxrss is in kilobytes on Linux.
      const peakMb = Math.round(process.resourceUsage().maxRSS / 1024);
      this.body.push('', `Exit code ${code}. Main process peak RSS ${peakMb} MB.`);
      const report = this.write();
      const summary = process.env.GITHUB_STEP_SUMMARY;
      if (code !== 0 && summary) {
        appendFileSync(summary, `${report}\n`);
      }
    });
  }

  onTestRunEnd(testModules: ReadonlyArray<TestModule>, unhandledErrors: UnhandledErrors) {
    const failed: string[] = [];
    const slow: { duration: number; entry: string }[] = [];
    for (const testModule of testModules) {
      const file = testModule.relativeModuleId;
      for (const error of testModule.errors()) {
        failed.push(`- \`${file}\`: ${firstLine(error.message)}`);
      }
      for (const test of testModule.children.allTests()) {
        const result = test.result();
        if (result.state === 'failed') {
          failed.push(
            `- \`${file}\` > ${test.fullName}: ${firstLine(result.errors?.[0]?.message)}`
          );
        }
        const duration = test.diagnostic()?.duration ?? 0;
        if (duration >= this.timeout * SLOW_SHARE) {
          slow.push({
            duration,
            entry: `- ${Math.round(duration)}ms \`${file}\` > ${test.fullName}`,
          });
        }
      }
    }
    // A crashed worker's cause says how it died, e.g. "Worker exited unexpectedly".
    const unhandled = unhandledErrors.map(
      (error) =>
        `- ${error.name ?? 'Error'}: ${firstLine(error.message)}` +
        (error.cause ? ` Caused by: ${firstLine(error.cause.message)}` : '')
    );

    this.body = [
      `${testModules.length} test files ran.`,
      '',
      `### Failed tests and files (${failed.length})`,
      ...capped(failed),
      '',
      `### Unhandled errors, including crashed workers (${unhandled.length})`,
      ...capped(unhandled),
      '',
      `### Tests at or over ${SLOW_SHARE * 100}% of the ${this.timeout}ms timeout (${slow.length})`,
      ...capped(slow.sort((a, b) => b.duration - a.duration).map(({ entry }) => entry)),
    ];
  }

  private write() {
    const report = ['## apollo-react Vitest diagnostics', '', ...this.body].join('\n');
    mkdirSync(dirname(this.outputFile), { recursive: true });
    writeFileSync(this.outputFile, `${report}\n`);
    return report;
  }
}

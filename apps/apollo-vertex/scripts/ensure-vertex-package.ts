import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function findRepoRoot(start: string): string {
  let dir = start;
  for (;;) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return start;
    }
    dir = parent;
  }
}

const repoRoot = findRepoRoot(dirname(fileURLToPath(import.meta.url)));
const distIndex = join(repoRoot, "packages/apollo-vertex/dist/index.js");

if (existsSync(distIndex)) {
  process.exit(0);
}

const result = spawnSync(
  "pnpm",
  ["--filter", "@uipath/apollo-vertex", "build"],
  { cwd: repoRoot, stdio: "inherit" },
);

process.exit(result.status ?? 1);

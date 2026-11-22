// Decision 041: `db` uses the HTTP driver, which has no interactive transactions.
// Every transaction must go through `withTransaction` from db/client.ts.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const DIRS = ["app", "components", "lib", "db", "scripts"];
const ALLOWED = new Set(["db/client.ts"]);

function sourceFiles(dir: string): string[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return []; // the folder does not exist
  }
  return entries.flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" || e.name === "migrations" ? [] : sourceFiles(path);
    return /\.tsx?$/.test(e.name) ? [path] : [];
  });
}

describe("Decision 041 — no transactions on the HTTP driver", () => {
  it("041: no `db.transaction(` outside db/client.ts (use withTransaction)", () => {
    const offenders: string[] = [];
    for (const file of DIRS.flatMap((d) => sourceFiles(join(ROOT, d)))) {
      const rel = relative(ROOT, file).split("\\").join("/");
      if (ALLOWED.has(rel)) continue;
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/\bdb\s*\.\s*transaction\s*\(/.test(line)) offenders.push(`${rel}:${i + 1}`);
        });
    }
    expect(offenders).toEqual([]);
  });
});

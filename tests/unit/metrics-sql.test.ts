import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseMetricsSql, stripComments } from "@/scripts/metrics-sql";

const FILE = readFileSync(new URL("../../docs/product/metrics.sql", import.meta.url), "utf8");

describe("metrics.sql — one query per metric", () => {
  it("M1–M7: has one query per metric, in order, including M4b", () => {
    expect(parseMetricsSql(FILE).map((q) => q.id)).toEqual(["M1", "M2", "M3", "M4", "M4b", "M5", "M6", "M7"]);
  });

  it("M1–M7: every query is a SELECT (or WITH … SELECT)", () => {
    for (const q of parseMetricsSql(FILE)) {
      expect(stripComments(q.sql)).toMatch(/^(SELECT|WITH)\b/i);
      expect(q.sql).not.toMatch(/\b(INSERT|UPDATE|DELETE|TRUNCATE|DROP|ALTER|CREATE)\b/i);
    }
  });

  it("M1–M7: every query has a comment with a name and a formula", () => {
    for (const q of parseMetricsSql(FILE)) {
      expect(q.title.length).toBeGreaterThan(0);
      expect(q.sql).toMatch(/^-- Formula:/m);
    }
  });

  it("rejects a statement without a metric header", () => {
    expect(() => parseMetricsSql("-- just a note\nSELECT 1;\n")).toThrow(/header/);
  });

  it("skips comment-only chunks such as the file header", () => {
    expect(parseMetricsSql("-- file header\n\n-- M1: One\n-- Formula: x\nSELECT 1;\n")).toEqual([
      { id: "M1", title: "One", sql: "-- file header\n\n-- M1: One\n-- Formula: x\nSELECT 1" },
    ]);
  });
});

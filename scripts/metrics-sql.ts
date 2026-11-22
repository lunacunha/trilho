// Splits docs/product/metrics.sql into one query per metric. Pure: no database, no file system.

export type MetricQuery = { id: string; title: string; sql: string };

const HEADER = /^--\s*(M\d+b?):\s*(.+)$/m;

/** Statements end with `;` at the end of a line. Each one must have a `-- M<n>: <name>` header. */
export function parseMetricsSql(text: string): MetricQuery[] {
  const queries: MetricQuery[] = [];
  for (const chunk of text.split(/;[ \t]*(?:\r?\n|$)/)) {
    const body = stripComments(chunk);
    if (body === "") continue;
    const header = HEADER.exec(chunk);
    if (!header) throw new Error(`A statement in metrics.sql has no "-- M<n>: <name>" header: ${body.slice(0, 60)}`);
    queries.push({ id: header[1], title: header[2].trim(), sql: chunk.trim() });
  }
  return queries;
}

/** The statement without `--` comment lines, trimmed. */
export function stripComments(sql: string): string {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .trim();
}

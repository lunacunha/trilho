// Product events (SPEC §9). The only place that writes to product_event.
import type { Database } from "../../db/client.ts";
import type { ProductEventName } from "../../db/schema.ts";
import { notImplemented } from "../not-implemented.ts";

export type EventName = ProductEventName;

/** `executor` is the db or the current transaction, so events commit with the change. */
export type Executor = Pick<Database, "insert">;

export async function recordEvent(
  executor: Executor,
  userId: string,
  name: EventName,
  properties: Record<string, unknown>,
  applicationId?: string,
): Promise<void> {
  return notImplemented(executor, userId, name, properties, applicationId);
}

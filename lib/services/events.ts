// Product events (SPEC §9). The only place that writes to product_event.
import type { Executor as DbExecutor } from "../../db/client.ts";
import { productEvent, type ProductEventName } from "../../db/schema.ts";

export type EventName = ProductEventName;

/** `executor` is the db or the current transaction, so events commit with the change. */
export type Executor = Pick<DbExecutor, "insert">;

export async function recordEvent(
  executor: Executor,
  userId: string,
  name: EventName,
  properties: Record<string, unknown>,
  applicationId?: string,
): Promise<void> {
  await executor.insert(productEvent).values({ userId, name, properties, applicationId: applicationId ?? null });
}

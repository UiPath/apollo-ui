"use client";

/**
 * Attachment reads for the Solution Tests view. The expected/actual outputs and
 * evaluator results are stored as File-field attachments on the `UiPathST*`
 * records, so they aren't part of the reactive collections — we download them
 * on demand through the `@uipath/uipath-typescript` Entities service, using the
 * authenticated client vs-core exposes at `solution.api.sdk.core` (no consumer
 * injection needed).
 */

import type { useSolution } from "@uipath/vs-core";
import { Entities } from "@uipath/uipath-typescript/entities";

type Solution = ReturnType<typeof useSolution>;

/**
 * Download an entity File-field attachment and parse it as JSON (falling back
 * to raw text). `entityId` is the DataFabric entity id (GUID), not its name.
 * Returns null when there's no active solution.
 */
export async function fetchAttachment(
  solution: Solution,
  entityId: string,
  recordId: string,
  field: string,
  scope?: { folderKey?: string },
): Promise<unknown> {
  if (!solution) return null;
  const entities = new Entities(solution.api.sdk.core);
  const blob = await entities.downloadAttachment(
    entityId,
    recordId,
    field,
    scope,
  );
  const text = await blob.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

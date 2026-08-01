/** Shared formatting helpers for workflow-generated PR comments. */

/** "Updated (PT)" timestamp used across the preview/visual-diff comments. */
export function ptTimestamp() {
  return new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

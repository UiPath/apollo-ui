import { useState } from "react";

interface ExpansionOptions {
  expandedIds?: readonly string[];
  defaultExpandedIds?: readonly string[];
  onExpandedChange?: (expandedIds: string[]) => void;
}

/** Ids appended after the last one already seen. Earlier unseen ids, e.g. loaded history, don't count. */
function appendedIds(ids: readonly string[], seen: readonly string[]) {
  const lastSeen = ids.findLastIndex((id) => seen.includes(id));
  return ids.slice(lastSeen + 1);
}

/** Which messages are expanded. The latest starts expanded, and so does every message appended later. */
function useMessageThreadExpansion(
  ids: readonly string[],
  { expandedIds, defaultExpandedIds, onExpandedChange }: ExpansionOptions,
) {
  const [uncontrolled, setUncontrolled] = useState<readonly string[]>(
    () => defaultExpandedIds ?? ids.slice(-1),
  );
  const [seen, setSeen] = useState(ids);

  const unseen = ids.filter((id) => !seen.includes(id));
  // A thread that mounts empty while loading starts once its first messages arrive.
  if (seen.length === 0 && unseen.length > 0) {
    setSeen(ids);
    if (defaultExpandedIds == null) setUncontrolled(ids.slice(-1));
  }
  if (seen.length > 0 && unseen.length > 0) {
    const appended = appendedIds(ids, seen);
    setSeen([...seen, ...unseen]);
    setUncontrolled((prev) => [
      ...prev,
      ...appended.filter((id) => !prev.includes(id)),
    ]);
  }

  const expanded = expandedIds ?? uncontrolled;
  const toggle = (id: string) => {
    const next = expanded.includes(id)
      ? expanded.filter((other) => other !== id)
      : [...expanded, id];
    setUncontrolled(next);
    onExpandedChange?.(next);
  };

  return [expanded, toggle] as const;
}

export { useMessageThreadExpansion };
export type { ExpansionOptions };

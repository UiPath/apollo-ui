import * as React from 'react';

// Internal: shared by chat primitives, outside the package's exported paths.

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

/**
 * `compact` while any ancestor has `data-density="compact"`, as the `in-data-[density=compact]:`
 * variant the chat primitives use in CSS. For the few that must change markup or props, not just
 * classes (ChatComposer, EmptyState). That ancestor's attribute is watched; an ancestor that only
 * gains it later is picked up on the component's next render. Off when `enabled` is false.
 */
export function useAncestorDensity(node: React.RefObject<HTMLElement | null>, enabled: boolean) {
  const [density, setDensity] = React.useState<'compact' | undefined>(undefined);
  const watched = React.useRef<{ ancestor: Element; observer?: MutationObserver } | null>(null);
  // No dependency list: the ancestor is looked up after every render, and re-subscribed only when
  // it changes.
  useIsomorphicLayoutEffect(() => {
    const ancestor =
      (enabled && node.current?.parentElement?.closest('[data-density="compact"]')) || null;
    setDensity(ancestor ? 'compact' : undefined);
    if (watched.current?.ancestor === ancestor) return;
    watched.current?.observer?.disconnect();
    watched.current = null;
    if (!ancestor) return;
    const observer =
      typeof MutationObserver === 'undefined'
        ? undefined
        : new MutationObserver(() =>
            setDensity(ancestor.getAttribute('data-density') === 'compact' ? 'compact' : undefined)
          );
    observer?.observe(ancestor, { attributes: true, attributeFilter: ['data-density'] });
    watched.current = { ancestor, observer };
  });
  React.useEffect(
    () => () => {
      watched.current?.observer?.disconnect();
      watched.current = null;
    },
    []
  );
  return density;
}

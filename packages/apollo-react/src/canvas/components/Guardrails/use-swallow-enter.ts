import { type RefObject, useEffect } from 'react';

/**
 * Cancels Enter in the single-line inputs under `ref`, so a builder mounted inside a host's
 * `<form>` cannot trigger its implicit submission.
 */
export function useSwallowEnter(ref: RefObject<HTMLElement | null>): void {
  // The nested MetadataForm guards the fields it owns, but the builder renders single-line
  // inputs of its own (name, and the escalation recipient/app fallbacks) outside that div.
  // Mounted `inline` inside a host's <form>, Enter in one of those triggers the host's
  // implicit submission and skips `handleSave` entirely — no validation, no callback. Same
  // treatment as apollo-wind's `container='div'`: swallow Enter for single-line inputs only,
  // so textareas keep newlines and buttons keep activation. Bound natively because the root
  // is a passive container with no ARIA role to declare.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const swallowEnter = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.defaultPrevented) return;
      const target = event.target as HTMLElement;
      if (target instanceof HTMLInputElement && target.type !== 'button') {
        event.preventDefault();
      }
    };

    node.addEventListener('keydown', swallowEnter);
    return () => node.removeEventListener('keydown', swallowEnter);
  }, [ref]);
}

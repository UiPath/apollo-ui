import type React from 'react';
import { useState } from 'react';
import type { Translate } from './translate';

/** The view's polite announcements: a moved rule and a refused clear, each read even when it repeats. */
export interface TextAnnouncements {
  announceMove: (from: number, to: number) => void;
  announce: (text: string) => void;
  region: React.ReactNode;
}

/** A polite live region the view announces into; `from` and `to` are 0-based. */
export const useTextAnnouncements = (_: Translate, dataTestId: string): TextAnnouncements => {
  const [note, setNote] = useState({ text: '', count: 0 });
  const announce = (text: string) => setNote((current) => ({ text, count: current.count + 1 }));
  return {
    announce,
    announceMove: (from, to) =>
      announce(
        _({
          id: 'decision-text.rule_moved',
          message: 'Rule moved from position {from} to {to}',
          values: { from: from + 1, to: to + 1 },
        })
      ),
    region: (
      <output aria-live="polite" className="sr-only" data-testid={`${dataTestId}-live`}>
        <span key={note.count}>{note.text}</span>
      </output>
    ),
  };
};

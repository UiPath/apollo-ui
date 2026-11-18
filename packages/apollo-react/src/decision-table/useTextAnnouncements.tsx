import type React from 'react';
import { useState } from 'react';

/** The words of the view's announcements. */
export interface TextAnnouncementLabels {
  /** A moved rule by its 1-based positions, e.g. "Rule moved from position 1 to 3". */
  ruleMoved: (from: number, to: number) => string;
}

/** The view's polite announcements: a moved rule and a refused clear, each read even when it repeats. */
export interface TextAnnouncements {
  announceMove: (from: number, to: number) => void;
  announce: (text: string) => void;
  region: React.ReactNode;
}

/** A polite live region the view announces into; `from` and `to` are 0-based. */
export const useTextAnnouncements = (
  labels: TextAnnouncementLabels,
  dataTestId: string
): TextAnnouncements => {
  const [note, setNote] = useState({ text: '', count: 0 });
  const announce = (text: string) => setNote((current) => ({ text, count: current.count + 1 }));
  return {
    announce,
    announceMove: (from, to) => announce(labels.ruleMoved(from + 1, to + 1)),
    region: (
      <output aria-live="polite" className="sr-only" data-testid={`${dataTestId}-live`}>
        <span key={note.count}>{note.text}</span>
      </output>
    ),
  };
};

import type React from 'react';

/**
 * The Embedded framing shared by the chat stories: a popup panel docked to the bottom right of the
 * frame, as a host application would place it. `slot` docks further panels to the left.
 */
export const EMBEDDED_PANEL = { width: 400, height: 600, inset: 24, gap: 24 } as const;

const panelRight = (slot: number) =>
  EMBEDDED_PANEL.inset + slot * (EMBEDDED_PANEL.width + EMBEDDED_PANEL.gap);

export function embeddedPanelStyle(slot = 0): React.CSSProperties {
  return {
    position: 'fixed',
    bottom: EMBEDDED_PANEL.inset,
    right: panelRight(slot),
    width: EMBEDDED_PANEL.width,
    height: EMBEDDED_PANEL.height,
    boxShadow: 'var(--shadow-xl, 0 12px 32px rgba(0, 0, 0, 0.35))',
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 1000,
    background: 'var(--color-background)',
  };
}

/** A caption just above a docked panel, used when several renderers are compared. */
export function embeddedPanelLabelStyle(slot = 0): React.CSSProperties {
  return {
    position: 'fixed',
    bottom: EMBEDDED_PANEL.inset + EMBEDDED_PANEL.height + 8,
    right: panelRight(slot),
    width: EMBEDDED_PANEL.width,
    zIndex: 1000,
  };
}

/** Where a host's "open chat" launcher sits for a docked panel: its bottom-right corner. */
export function embeddedLauncherStyle(slot = 0): React.CSSProperties {
  return {
    position: 'fixed',
    bottom: EMBEDDED_PANEL.inset,
    right: panelRight(slot),
    zIndex: 1000,
  };
}

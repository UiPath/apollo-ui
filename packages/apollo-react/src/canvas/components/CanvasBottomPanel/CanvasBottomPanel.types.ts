import type { ReactNode } from 'react';

export interface CanvasBottomPanelTab {
  /** Stable identifier used for controlled selection and ARIA relationships. */
  id: string;
  /** Visible tab label. */
  label: ReactNode;
  /** Accessible label when the visible label is not plain text. */
  ariaLabel?: string;
  /** Content remains mounted while inactive or collapsed so consumer state is preserved. */
  content: ReactNode;
}

export interface CanvasBottomPanelProps {
  tabs: CanvasBottomPanelTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  isCollapsed: boolean;
  onCollapsedChange: (isCollapsed: boolean) => void;
  /** Consumer-owned controls rendered at the end of the panel header. */
  headerActions?: ReactNode;
  /** Unique prefix for tab and panel IDs when multiple instances share a page. */
  idPrefix?: string;
  className?: string;
}

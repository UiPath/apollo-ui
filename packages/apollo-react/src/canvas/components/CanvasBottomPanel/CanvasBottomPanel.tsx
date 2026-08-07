import { Fragment, memo, useCallback, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { cn } from '@uipath/apollo-wind';
import type { CanvasBottomPanelProps } from './CanvasBottomPanel.types';

export const CANVAS_BOTTOM_PANEL_COLLAPSED_HEIGHT = 48;

function clearNativeSelection() {
  if (typeof window === 'undefined' || typeof window.getSelection !== 'function') return;
  window.getSelection()?.removeAllRanges();
}

export const CanvasBottomPanel = memo(function CanvasBottomPanel({
  tabs,
  activeTabId,
  onTabChange,
  isCollapsed,
  onCollapsedChange,
  headerActions,
  idPrefix = 'canvas-bottom-panel',
  className,
}: CanvasBottomPanelProps) {
  const focusTab = useCallback(
    (tabId: string) => {
      requestAnimationFrame(() => {
        document.getElementById(`${idPrefix}-tab-${tabId}`)?.focus();
      });
    },
    [idPrefix]
  );

  const activateTab = useCallback(
    (tabId: string) => {
      clearNativeSelection();
      onTabChange(tabId);
      if (isCollapsed) onCollapsedChange(false);
    },
    [isCollapsed, onCollapsedChange, onTabChange]
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
      if (tabs.length === 0) return;

      let nextIndex: number;
      switch (event.key) {
        case 'ArrowRight':
          nextIndex = (index + 1) % tabs.length;
          break;
        case 'ArrowLeft':
          nextIndex = (index - 1 + tabs.length) % tabs.length;
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      const nextTab = tabs[nextIndex];
      if (!nextTab) return;
      activateTab(nextTab.id);
      focusTab(nextTab.id);
    },
    [activateTab, focusTab, tabs]
  );

  return (
    <section
      data-testid="canvas-bottom-panel"
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised text-foreground shadow-lg',
        className
      )}
      style={isCollapsed ? { height: CANVAS_BOTTOM_PANEL_COLLAPSED_HEIGHT } : undefined}
    >
      <header
        className="flex shrink-0 items-center justify-between gap-3 px-3"
        style={{ height: CANVAS_BOTTOM_PANEL_COLLAPSED_HEIGHT }}
      >
        <div
          role="tablist"
          aria-orientation="horizontal"
          className="flex min-w-0 items-center gap-1 overflow-x-auto"
        >
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTabId;
            return (
              <Fragment key={tab.id}>
                <button
                  id={`${idPrefix}-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-label={tab.ariaLabel}
                  aria-selected={isActive}
                  aria-controls={`${idPrefix}-tabpanel-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  data-state={isActive ? 'active' : 'inactive'}
                  className="inline-flex h-7 shrink-0 cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:bg-surface-overlay data-[state=active]:text-foreground"
                  onClick={() => activateTab(tab.id)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                >
                  {tab.label}
                </button>
              </Fragment>
            );
          })}
        </div>

        {headerActions && (
          <div
            className="flex shrink-0 items-center gap-1"
            data-testid="canvas-bottom-panel-actions"
          >
            {headerActions}
          </div>
        )}
      </header>

      <div
        className="min-h-0 flex-1 border-t border-border-subtle"
        style={{ display: isCollapsed ? 'none' : 'block' }}
        data-testid="canvas-bottom-panel-content"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              id={`${idPrefix}-tabpanel-${tab.id}`}
              role="tabpanel"
              aria-labelledby={`${idPrefix}-tab-${tab.id}`}
              hidden={!isActive}
              className="h-full w-full"
              style={{ display: isActive ? 'block' : 'none' }}
            >
              {tab.content}
            </div>
          );
        })}
      </div>
    </section>
  );
});

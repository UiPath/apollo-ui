import {
  Fragment,
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@uipath/apollo-wind';
import type { CanvasBottomPanelProps } from './CanvasBottomPanel.types';

export const CANVAS_BOTTOM_PANEL_COLLAPSED_HEIGHT = 48;

interface CanvasBottomPanelActionsContextValue {
  container: HTMLElement | null;
  active: boolean;
}

const CanvasBottomPanelActionsContext = createContext<CanvasBottomPanelActionsContextValue | null>(
  null
);

/** Renders active-tab controls in the panel's right-aligned header action area. */
export function CanvasBottomPanelActions({ children }: { children: ReactNode }) {
  const slot = useContext(CanvasBottomPanelActionsContext);
  if (!slot?.active || !slot.container) return null;
  return createPortal(children, slot.container);
}

function ActionsScope({
  active,
  container,
  children,
}: {
  active: boolean;
  container: HTMLElement | null;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ active, container }), [active, container]);
  return (
    <CanvasBottomPanelActionsContext.Provider value={value}>
      {children}
    </CanvasBottomPanelActionsContext.Provider>
  );
}

function shouldSeparateTabs(
  previous: CanvasBottomPanelProps['tabs'][number] | undefined,
  current: CanvasBottomPanelProps['tabs'][number]
) {
  if (!previous) return false;
  if (!previous.group && !current.group) return false;
  return previous.group !== current.group;
}

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
  onExpand,
  headerActions,
  overlay,
  variant = 'floating',
  collapsedHeight = CANVAS_BOTTOM_PANEL_COLLAPSED_HEIGHT,
  idPrefix = 'canvas-bottom-panel',
  className,
}: CanvasBottomPanelProps) {
  const [actionsContainer, setActionsContainer] = useState<HTMLDivElement | null>(null);
  const [overlayHost, setOverlayHost] = useState<HTMLDivElement | null>(null);
  const overlayActive = overlay?.tabIds.includes(activeTabId) ?? false;
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
      if (isCollapsed) {
        onCollapsedChange?.(false);
        onExpand?.();
      }
    },
    [isCollapsed, onCollapsedChange, onExpand, onTabChange]
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
        'flex min-h-0 flex-col overflow-hidden bg-surface-raised text-foreground',
        variant === 'floating' && 'rounded-2xl border border-border-subtle shadow-lg',
        className
      )}
      style={isCollapsed ? { height: collapsedHeight } : undefined}
    >
      <header
        className="flex shrink-0 items-center justify-between gap-3 px-3"
        style={{ height: collapsedHeight }}
      >
        <div
          role="tablist"
          aria-orientation="horizontal"
          className="flex min-w-0 items-center gap-1 overflow-x-auto"
        >
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTabId;
            const controlsOverlay = overlay?.tabIds.includes(tab.id) ?? false;
            return (
              <Fragment key={tab.id}>
                {shouldSeparateTabs(tabs[index - 1], tab) && (
                  <span
                    role="presentation"
                    aria-hidden="true"
                    className="mx-1.5 h-4 w-px shrink-0 bg-border-subtle"
                    data-testid="canvas-bottom-panel-tab-separator"
                  />
                )}
                <button
                  id={`${idPrefix}-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-label={tab.ariaLabel}
                  aria-selected={isActive}
                  aria-controls={
                    controlsOverlay
                      ? `${idPrefix}-overlay-tabpanel`
                      : `${idPrefix}-tabpanel-${tab.id}`
                  }
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

        <div className="flex shrink-0 items-center gap-1">
          <div
            ref={setActionsContainer}
            className="flex items-center gap-1 empty:hidden"
            data-testid="canvas-bottom-panel-tab-actions"
          />
          {headerActions && (
            <div className="flex items-center gap-1" data-testid="canvas-bottom-panel-actions">
              {headerActions}
            </div>
          )}
        </div>
      </header>

      <div
        className="min-h-0 flex-1 border-t border-border-subtle"
        style={{ display: isCollapsed ? 'none' : 'block' }}
        data-testid="canvas-bottom-panel-content"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          if (overlay?.tabIds.includes(tab.id)) return null;
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
              <ActionsScope active={!isCollapsed && isActive} container={actionsContainer}>
                {tab.content}
              </ActionsScope>
            </div>
          );
        })}
        {overlay && (
          <div
            ref={setOverlayHost}
            id={`${idPrefix}-overlay-tabpanel`}
            role="tabpanel"
            aria-labelledby={overlayActive ? `${idPrefix}-tab-${activeTabId}` : undefined}
            hidden={!overlayActive}
            className="h-full w-full"
            style={{ display: overlayActive ? 'block' : 'none' }}
            data-testid="canvas-bottom-panel-overlay"
          />
        )}
        {overlay &&
          overlayHost &&
          createPortal(
            <ActionsScope active={!isCollapsed && overlayActive} container={actionsContainer}>
              {overlay.content}
            </ActionsScope>,
            overlayHost
          )}
      </div>
    </section>
  );
});

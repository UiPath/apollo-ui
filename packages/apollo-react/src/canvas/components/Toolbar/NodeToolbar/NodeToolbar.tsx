import { cn } from '@uipath/apollo-wind';
import { AnimatePresence, motion } from 'motion/react';
import { memo, useMemo } from 'react';
import { CanvasIcon } from '../../../utils/icon-registry';
import { CanvasTooltip } from '../../CanvasTooltip';
import { NodeViewportOverlay } from '../../NodeViewportOverlay';
import { ToolbarButton, ToolbarIconButton } from '../shared';
import type { NodeToolbarProps } from './NodeToolbar.types';
import { isSeparator } from './NodeToolbar.utils';
import { useToolbarState } from './useToolbarState';

const POSITIONER_BASE_CLASS = 'absolute flex pointer-events-none z-10';

// Container enforces a 40px cross-axis (`min-h-10 min-w-10`) in every
// orientation, so the same offset produces a consistent ~12px gap on every
// side: 40 (toolbar) + 12 (gap) = 52.
// `--toolbar-offset` (default 0) adds extra displacement to clear handle buttons.
const POSITIONER_POSITION_CLASS: Record<'top' | 'bottom' | 'left' | 'right', string> = {
  top: 'top-[calc(-52px-var(--toolbar-offset,0px))] left-0 right-0 flex-row',
  bottom: 'bottom-[calc(-52px-var(--toolbar-offset,0px))] left-0 right-0 flex-row',
  left: 'left-[calc(-52px-var(--toolbar-offset,0px))] top-0 bottom-0 flex-col',
  right: 'right-[calc(-52px-var(--toolbar-offset,0px))] top-0 bottom-0 flex-col',
};

/** Extra displacement (px) applied when `offsetToolbar` is true. */
const TOOLBAR_OFFSET = 48; // Clears the button handle + label + gaps

const POSITIONER_ALIGN_CLASS: Record<'start' | 'center' | 'end', string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
};

const CONTAINER_BASE_CLASS =
  'flex items-center gap-1 p-1 min-h-10 min-w-10 shrink-0 bg-(--canvas-background-raised) ' +
  'border border-(--canvas-background-overlay) rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.08)] ' +
  'pointer-events-auto';

const CONTAINER_DIRECTION_CLASS: Record<'top' | 'bottom' | 'left' | 'right', string> = {
  top: 'flex-row',
  bottom: 'flex-row',
  left: 'flex-col',
  right: 'flex-col',
};

const SEPARATOR_BASE_CLASS = 'flex-[0_0_auto] bg-(--canvas-background-overlay) self-center';
const SEPARATOR_VERTICAL_CLASS = 'w-px h-5';
const SEPARATOR_HORIZONTAL_CLASS = 'w-full h-px';

const DROPDOWN_MENU_CLASS =
  'absolute top-[-2px] left-[calc(100%+4px)] min-w-[180px] ' +
  'bg-(--canvas-background-raised) border border-(--canvas-background-overlay) rounded-md ' +
  'shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)] p-1 pointer-events-auto';

const DROPDOWN_ITEM_BASE_CLASS =
  'flex items-center gap-3 w-full py-2 px-3 bg-transparent border-none rounded-[4px] ' +
  'text-sm text-(--canvas-foreground) text-left [transition:background_0.15s_ease] ' +
  'enabled:hover:bg-(--canvas-background-hover) future:enabled:hover:bg-(--canvas-background-overlay) ' +
  '[&>svg]:shrink-0 [&>svg]:text-(--canvas-foreground)';

const DROPDOWN_ITEM_DISABLED_CLASS = 'cursor-not-allowed opacity-40 pointer-events-none';
const DROPDOWN_ITEM_ENABLED_CLASS = 'cursor-pointer opacity-100';

const NodeToolbarComponent = ({
  nodeId,
  config,
  expanded,
  hidden,
  offsetToolbar,
  portalToNodeOverlay,
}: NodeToolbarProps) => {
  const {
    isDropdownOpen,
    setIsDropdownOpen,
    dropdownRef,
    buttonRef,
    actionsToDisplay,
    displayState,
    shouldShowOverflow,
    overflowActionsToDisplay,
    separatorOrientation,
    toggleDropdown,
  } = useToolbarState({ config, expanded, nodeId, hidden });

  const position = config.position || 'top';
  const align = config.align || 'center';

  const positionerClassName = useMemo(
    () =>
      cn(POSITIONER_BASE_CLASS, POSITIONER_POSITION_CLASS[position], POSITIONER_ALIGN_CLASS[align]),
    [position, align]
  );

  const containerClassName = useMemo(
    () => cn(CONTAINER_BASE_CLASS, CONTAINER_DIRECTION_CLASS[position]),
    [position]
  );

  const separatorClassName = useMemo(
    () =>
      cn(
        SEPARATOR_BASE_CLASS,
        separatorOrientation === 'horizontal'
          ? SEPARATOR_HORIZONTAL_CLASS
          : SEPARATOR_VERTICAL_CLASS
      ),
    [separatorOrientation]
  );

  const offsetStyle = useMemo(() => {
    if (!offsetToolbar) return undefined;
    return { '--toolbar-offset': `${TOOLBAR_OFFSET}px` } as React.CSSProperties;
  }, [offsetToolbar]);

  const toolbarAnimationVariants = useMemo(() => {
    const offsetAxis = position === 'top' || position === 'bottom' ? 'y' : 'x';
    const offsetAmount = position === 'top' || position === 'left' ? -10 : 10;

    const offset = displayState !== 'pinned' ? { [offsetAxis]: offsetAmount } : {};
    const offsetAtRest = displayState !== 'pinned' ? { [offsetAxis]: 0 } : {};

    return {
      initial: { opacity: 0, ...offset },
      animate: { opacity: 1, ...offsetAtRest },
      exit: { opacity: 0, ...offset },
    };
  }, [position, displayState]);

  if (
    config.actions.length === 0 &&
    (!config.overflowActions || config.overflowActions.length === 0)
  ) {
    return null;
  }

  const toolbarContent = (
    <AnimatePresence>
      {displayState !== 'hidden' && (
        <div className={positionerClassName} style={offsetStyle}>
          <motion.div
            layout="position"
            className={containerClassName}
            initial={toolbarAnimationVariants.initial}
            animate={toolbarAnimationVariants.animate}
            exit={toolbarAnimationVariants.exit}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="toolbar"
          >
            {actionsToDisplay.map((item, i) =>
              isSeparator(item) ? (
                <div key={`separator-${i}`} className={separatorClassName} />
              ) : (
                <ToolbarButton
                  key={item.id}
                  action={item}
                  layoutId={item.isPinned ? `toolbar-btn-${nodeId}-${item.id}` : undefined}
                />
              )
            )}
            {shouldShowOverflow && (
              <>
                {actionsToDisplay.length > 0 && <div className={separatorClassName} />}
                <div className="relative">
                  <CanvasTooltip content={config.overflowLabel ?? 'More options'} placement="top">
                    <ToolbarIconButton
                      ref={buttonRef}
                      type="button"
                      className="nodrag nopan"
                      onClick={toggleDropdown}
                      aria-label={config.overflowLabel ?? 'More options'}
                      aria-expanded={isDropdownOpen}
                      aria-haspopup="menu"
                    >
                      <CanvasIcon icon="ellipsis-vertical" size={16} />
                    </ToolbarIconButton>
                  </CanvasTooltip>
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        ref={dropdownRef}
                        className={DROPDOWN_MENU_CLASS}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        role="menu"
                        aria-label={config.overflowLabel ?? 'More options'}
                      >
                        {overflowActionsToDisplay.map((item, i) => {
                          if (isSeparator(item)) {
                            return (
                              <div
                                key={`separator-${i}`}
                                className={cn(SEPARATOR_BASE_CLASS, SEPARATOR_HORIZONTAL_CLASS)}
                              />
                            );
                          }
                          return (
                            <button
                              key={item.id}
                              type="button"
                              className={cn(
                                DROPDOWN_ITEM_BASE_CLASS,
                                item.disabled
                                  ? DROPDOWN_ITEM_DISABLED_CLASS
                                  : DROPDOWN_ITEM_ENABLED_CLASS,
                                'nodrag nopan'
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (!item.disabled) {
                                  item.onClick();
                                  setIsDropdownOpen(false);
                                }
                              }}
                              aria-label={item.label}
                              aria-disabled={item.disabled}
                              disabled={item.disabled}
                              role="menuitem"
                            >
                              {item.icon && typeof item.icon === 'string' && (
                                <span style={{ flex: 'unset', display: 'inline-flex' }}>
                                  <CanvasIcon icon={item.icon} size={16} />
                                </span>
                              )}
                              {item.icon && typeof item.icon !== 'string' && item.icon}
                              <span className="flex-1 text-(--canvas-foreground)">
                                {item.label}
                              </span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (portalToNodeOverlay) {
    return (
      <NodeViewportOverlay nodeId={nodeId} layer="nodeToolbar">
        {toolbarContent}
      </NodeViewportOverlay>
    );
  }

  return toolbarContent;
};

export const NodeToolbar = memo(NodeToolbarComponent);

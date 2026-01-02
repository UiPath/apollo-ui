import { memo, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { ApIcon, ApTooltip } from '@uipath/apollo-react/material/components';
import {
  StyledToolbarContainer,
  StyledToolbarButton,
  StyledToolbarSeparator,
  StyledDropdownMenu,
  StyledDropdownItem,
  StyledOverflowContainer,
} from './NodeToolbar.styles';
import type { NodeToolbarProps } from './NodeToolbar.types';
import { ToolbarButton } from './ToolbarButton';
import { useToolbarState } from './useToolbarState';
import { isSeparator } from './NodeToolbar.utils';

const NodeToolbarComponent = ({ nodeId, config, expanded, hidden }: NodeToolbarProps) => {
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

  const toolbarAnimationVariants = useMemo(() => {
    const offsetAxis = config.position === 'top' || config.position === 'bottom' ? 'y' : 'x';
    const offsetAmount = config.position === 'top' || config.position === 'left' ? -10 : 10;

    const offset = displayState !== 'pinned' ? { [offsetAxis]: offsetAmount } : {};
    const offsetAtRest = displayState !== 'pinned' ? { [offsetAxis]: 0 } : {};

    return {
      initial: { opacity: 0, ...offset },
      animate: { opacity: 1, ...offsetAtRest },
      exit: { opacity: 0, ...offset },
    };
  }, [config.position, displayState]);

  if (
    config.actions.length === 0 &&
    (!config.overflowActions || config.overflowActions.length === 0)
  ) {
    return null;
  }

  return (
    <AnimatePresence>
      {displayState !== 'hidden' && (
        <StyledToolbarContainer
          layout
          $position={config.position || 'top'}
          $align={config.align || 'end'}
          initial={toolbarAnimationVariants.initial}
          animate={toolbarAnimationVariants.animate}
          exit={toolbarAnimationVariants.exit}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          role="toolbar"
        >
          {actionsToDisplay.map((item, i) =>
            isSeparator(item) ? (
              <StyledToolbarSeparator key={`separator-${i}`} $orientation={separatorOrientation} />
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
              {actionsToDisplay.length > 0 && (
                <StyledToolbarSeparator $orientation={separatorOrientation} />
              )}
              <StyledOverflowContainer>
                <StyledToolbarButton
                  ref={buttonRef}
                  type="button"
                  className="nodrag nopan"
                  onClick={toggleDropdown}
                  aria-label="More options"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="menu"
                >
                  <ApTooltip content={config.overflowLabel} placement="top">
                    <ApIcon variant="outlined" name="more_vert" size="16px" />
                  </ApTooltip>
                </StyledToolbarButton>
                <AnimatePresence>
                  {isDropdownOpen && (
                    <StyledDropdownMenu
                      ref={dropdownRef}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      role="menu"
                      aria-labelledby={buttonRef.current?.id}
                    >
                      {overflowActionsToDisplay.map((item, i) => {
                        if (isSeparator(item)) {
                          return (
                            <StyledToolbarSeparator
                              key={`separator-${i}`}
                              $orientation="horizontal"
                            />
                          );
                        }
                        return (
                          <StyledDropdownItem
                            key={item.id}
                            type="button"
                            className="nodrag nopan"
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
                            role="menuitem"
                            $disabled={item.disabled}
                          >
                            {item.icon && typeof item.icon === 'string' && (
                              <ApIcon variant="outlined" name={item.icon} size="16px" />
                            )}
                            {item.icon && typeof item.icon !== 'string' && item.icon}
                            <span>{item.label}</span>
                          </StyledDropdownItem>
                        );
                      })}
                    </StyledDropdownMenu>
                  )}
                </AnimatePresence>
              </StyledOverflowContainer>
            </>
          )}
        </StyledToolbarContainer>
      )}
    </AnimatePresence>
  );
};

export const NodeToolbar = memo(NodeToolbarComponent);

import React, { useCallback, useMemo, useRef } from 'react';
import { Tooltip } from '@mui/material';
import type { ApTooltipProps } from './ApTooltip.types';
import { useTruncationDetection } from './useTruncationDetection';

const makeTooltipRenderInSameDOMTree: Partial<ApTooltipProps> = {
  PopperProps: {
    // Disable rendering in a portal and render inline instead.
    disablePortal: true,
    popperOptions: { strategy: 'fixed' },
  },
};

export function ApTooltip({
  content,
  placement = 'bottom',
  disabled = false,
  hide,
  isOpen,
  delay = false,
  children,
  formattedContent,
  dontUseInternalOnlyDebugForceOpen = false,
  smartTooltip = false,
  onTooltipOpen,
  onTooltipClose,
  closeOnInteraction = false,
  ...muiProps
}: Readonly<ApTooltipProps>) {
  const childRef = useRef<HTMLElement | null>(null);
  const truncationDetection = useTruncationDetection(childRef);
  // If smartTooltip is false, always show tooltip (default behavior)
  const isTruncated = smartTooltip ? truncationDetection.isTruncated : true;

  // State for closeOnInteraction feature
  const [isTemporarilyClosed, setIsTemporarilyClosed] = React.useState(false);

  const setChildRef = React.useCallback(
    (node: HTMLElement | null) => {
      childRef.current = node;

      const childRefProp = (children as any).ref;
      if (typeof childRefProp === 'function') {
        childRefProp(node);
      } else if (childRefProp) {
        childRefProp.current = node;
      }
    },
    [children]
  );

  // Helper to get closeOnInteraction event handlers
  const getCloseOnInteractionHandlers = () => {
    if (!closeOnInteraction) {
      return {};
    }
    const childProps = children.props as any;
    return {
      onMouseLeave: handleMouseLeave,
      onInputCapture: (e: React.FormEvent<HTMLElement>) => {
        handleInteractionStart();
        childProps.onInputCapture?.(e);
      },
      onMouseDown: (e: React.MouseEvent<HTMLElement>) => {
        handleInteractionStart();
        childProps.onMouseDown?.(e);
      },
    };
  };

  const handleInteractionStart = useCallback(() => {
    if (closeOnInteraction) {
      setIsTemporarilyClosed(true);
    }
  }, [closeOnInteraction]);

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (closeOnInteraction) {
        setIsTemporarilyClosed(false);
      }
      const childProps = children.props as any;
      childProps.onMouseLeave?.(e);
    },
    [closeOnInteraction, children.props]
  );

  const childrenWithRef = smartTooltip
    ? React.cloneElement(children, {
        ref: setChildRef,
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
          truncationDetection?.check();
          const childProps = children.props as any;
          childProps.onMouseEnter?.(e);
        },
        ...getCloseOnInteractionHandlers(),
      } as any)
    : React.cloneElement(children, getCloseOnInteractionHandlers());

  const debugPopperInstanceRef = React.useRef<any>(null);
  React.useLayoutEffect(() => {
    let forceUpdateInterval: number;
    if (dontUseInternalOnlyDebugForceOpen) {
      forceUpdateInterval = window.setInterval(() => {
        debugPopperInstanceRef.current?.forceUpdate();
      }, 100);
    }
    return () => {
      window.clearInterval(forceUpdateInterval);
    };
  }, [dontUseInternalOnlyDebugForceOpen]);

  const hasCustomContent = Boolean(formattedContent);
  const tooltipProps = hasCustomContent ? makeTooltipRenderInSameDOMTree : {};

  const isTooltipTitleHidden: boolean = useMemo(() => {
    if (isOpen != null) {
      return !isOpen;
    }
    if (hide != null) {
      return hide;
    }
    if (closeOnInteraction && isTemporarilyClosed) {
      return true;
    }
    if (smartTooltip && !isTruncated) {
      return true;
    }
    return false;
  }, [isOpen, hide, closeOnInteraction, isTemporarilyClosed, smartTooltip, isTruncated]);

  const handleTooltipOpen = useCallback(
    (event: React.SyntheticEvent) => {
      if (smartTooltip && truncationDetection) {
        truncationDetection.check();
      }
      onTooltipOpen?.(event);
    },
    [smartTooltip, truncationDetection, onTooltipOpen]
  );

  const tooltipTitle: React.ReactNode =
    isTooltipTitleHidden || disabled ? '' : (formattedContent ?? content);

  // Filter out 'content' from muiProps to avoid conflicts with MUI's Tooltip
  const { content: _, ...filteredMuiProps } = muiProps as any;

  return (
    <Tooltip
      title={tooltipTitle}
      placement={placement}
      enterDelay={delay ? 700 : 0}
      enterNextDelay={delay ? 700 : 0}
      onOpen={handleTooltipOpen}
      onClose={onTooltipClose}
      {...filteredMuiProps}
      {...tooltipProps}
      {...(dontUseInternalOnlyDebugForceOpen && {
        open: true,
        PopperProps: {
          ...(tooltipProps.PopperProps as any),
          popperRef: debugPopperInstanceRef,
        },
      })}
      {...(isOpen != null && { open: dontUseInternalOnlyDebugForceOpen ? true : isOpen })}
    >
      {childrenWithRef}
    </Tooltip>
  );
}

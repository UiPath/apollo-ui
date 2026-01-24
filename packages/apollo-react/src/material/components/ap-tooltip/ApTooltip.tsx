import type { PopperProps } from '@mui/material';
import { Tooltip } from '@mui/material';
import React, { useCallback, useMemo, useRef } from 'react';
import type { ApTooltipProps } from './ApTooltip.types';
import { useTruncationDetection } from './useTruncationDetection';

// Type for child element props that may include event handlers
interface ChildElementProps {
  onMouseLeave?: React.MouseEventHandler<HTMLElement>;
  onMouseDown?: React.MouseEventHandler<HTMLElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLElement>;
  onInputCapture?: React.FormEventHandler<HTMLElement>;
  ref?: React.Ref<HTMLElement>;
}

const makeTooltipRenderInSameDOMTree = {
  PopperProps: {
    // Disable rendering in a portal and render inline instead.
    disablePortal: true,
    popperOptions: { strategy: 'fixed' as const },
  },
} as const;

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
  const childElement = useMemo(
    () => (React.isValidElement(children) ? children : <span>{children}</span>),
    [children]
  );

  // Store childElement in a ref for callbacks that need access without re-creating
  const childElementRef = useRef(childElement);
  childElementRef.current = childElement;

  const childRef = useRef<HTMLElement | null>(null);
  const truncationDetection = useTruncationDetection(childRef);
  // If smartTooltip is false, always show tooltip (default behavior)
  const isTruncated = smartTooltip ? truncationDetection.isTruncated : true;

  // State for closeOnInteraction feature
  const [isTemporarilyClosed, setIsTemporarilyClosed] = React.useState(false);

  // Stable ref callback that uses childElementRef to avoid dependency on childElement
  const setChildRef = useCallback((node: HTMLElement | null) => {
    childRef.current = node;

    const childRefProp = (childElementRef.current.props as ChildElementProps).ref;
    if (typeof childRefProp === 'function') {
      childRefProp(node);
    } else if (childRefProp && typeof childRefProp === 'object') {
      (childRefProp as React.RefObject<HTMLElement | null>).current = node;
    }
  }, []);

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
      const childProps = childElementRef.current.props as ChildElementProps;
      childProps.onMouseLeave?.(e);
    },
    [closeOnInteraction]
  );

  const handleInputCapture = useCallback(
    (e: React.FormEvent<HTMLElement>) => {
      handleInteractionStart();
      const childProps = childElementRef.current.props as ChildElementProps;
      childProps.onInputCapture?.(e);
    },
    [handleInteractionStart]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      handleInteractionStart();
      const childProps = childElementRef.current.props as ChildElementProps;
      childProps.onMouseDown?.(e);
    },
    [handleInteractionStart]
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      truncationDetection.check();
      const childProps = childElementRef.current.props as ChildElementProps;
      childProps.onMouseEnter?.(e);
    },
    [truncationDetection.check]
  );

  const closeOnInteractionHandlers = useMemo(() => {
    if (!closeOnInteraction) {
      return {};
    }
    return {
      onMouseLeave: handleMouseLeave,
      onInputCapture: handleInputCapture,
      onMouseDown: handleMouseDown,
    };
  }, [closeOnInteraction, handleMouseLeave, handleInputCapture, handleMouseDown]);

  // Separate useMemos for smartTooltip and non-smartTooltip cases
  // This avoids handleMouseEnter being a dependency when smartTooltip is false
  const childrenWithRefSmartTooltip = useMemo(
    () =>
      React.cloneElement(childElement, {
        ref: setChildRef,
        onMouseEnter: handleMouseEnter,
        ...closeOnInteractionHandlers,
      } as ChildElementProps),
    [childElement, setChildRef, handleMouseEnter, closeOnInteractionHandlers]
  );

  const childrenWithRefRegular = useMemo(
    () => React.cloneElement(childElement, closeOnInteractionHandlers),
    [childElement, closeOnInteractionHandlers]
  );

  const childrenWithRef = smartTooltip ? childrenWithRefSmartTooltip : childrenWithRefRegular;

  // Debug-only ref for forcing popper updates - internal debug functionality
  const debugPopperInstanceRef = React.useRef<{ forceUpdate: () => void } | null>(null);
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
      if (smartTooltip) {
        truncationDetection.check();
      }
      onTooltipOpen?.(event);
    },
    [smartTooltip, truncationDetection.check, onTooltipOpen]
  );

  const tooltipTitle: React.ReactNode =
    isTooltipTitleHidden || disabled ? '' : (formattedContent ?? content);

  // Destructure content from muiProps to ensure it's not passed to MUI Tooltip
  // This is needed because ApTooltipProps adds 'content' which conflicts with MUI's internal TransitionProps
  const { content: _unusedContent, ...safeToSpreadMuiProps } = muiProps as typeof muiProps & {
    content?: unknown;
  };

  return (
    <Tooltip
      title={tooltipTitle}
      placement={placement}
      enterDelay={delay ? 700 : 0}
      enterNextDelay={delay ? 700 : 0}
      onOpen={handleTooltipOpen}
      onClose={onTooltipClose}
      {...safeToSpreadMuiProps}
      {...tooltipProps}
      {...(dontUseInternalOnlyDebugForceOpen && {
        open: true,
        PopperProps: {
          ...('PopperProps' in tooltipProps
            ? (tooltipProps.PopperProps as Partial<PopperProps>)
            : {}),
          // Debug-only ref - cast needed due to internal Popper types
          popperRef: debugPopperInstanceRef as React.RefObject<unknown>,
        } as Partial<PopperProps>,
      })}
      {...(isOpen != null && { open: dontUseInternalOnlyDebugForceOpen ? true : isOpen })}
    >
      {childrenWithRef}
    </Tooltip>
  );
}

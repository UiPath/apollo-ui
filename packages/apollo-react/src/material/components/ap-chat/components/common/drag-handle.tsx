import { styled } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import React from 'react';

import { useChatService } from '../../providers/chat-service.provider';
import { useChatState } from '../../providers/chat-state-provider';
import { useChatWidth } from '../../providers/chat-width-provider';
import {
  AutopilotChatInternalEvent,
  CHAT_WIDTH_KEY,
  CHAT_WIDTH_SIDE_BY_SIDE_MAX,
  CHAT_WIDTH_SIDE_BY_SIDE_MIN,
  StorageService,
} from '../../service';

const DragHandleContainer = styled('div')(() => ({
  position: 'absolute',
  left: 0,
  top: 0,
  width: token.Border.BorderThickS,
  height: '100%',
  background: 'var(--color-border-de-emp)',
  cursor: 'ew-resize',
  transition: 'background 0.2s ease',
  userSelect: 'none',
  zIndex: 2,

  // Expand the drag handle to 15px to make it easier to click
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: -7,
    width: 15,
    height: '100%',
    cursor: 'ew-resize',
    userSelect: 'none',
    zIndex: 2,
  },

  '&:hover, &:focus, &:active': {
    background: 'var(--color-focus-indicator)',
    outline: 'none',
  },
}));

const Border = styled('div')(() => ({
  position: 'absolute',
  left: 0,
  top: 0,
  width: token.Border.BorderThickS,
  height: '100%',
  background: 'var(--color-border-de-emp)',
}));

function DragHandleComponent() {
  const isDraggingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const startWidthRef = React.useRef(0);
  const { width, setWidth, setShouldAnimate } = useChatWidth();
  const chatInternalService = useChatService().__internalService__;
  const { disabledFeatures } = useChatState();
  const widthRef = React.useRef(width);
  widthRef.current = width;

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current) {
        return;
      }

      const delta = startXRef.current - e.clientX;
      const newWidth = Math.min(
        Math.max(startWidthRef.current + delta, CHAT_WIDTH_SIDE_BY_SIDE_MIN),
        CHAT_WIDTH_SIDE_BY_SIDE_MAX
      );

      widthRef.current = newWidth;
      chatInternalService.publish(AutopilotChatInternalEvent.ChatResize, newWidth);
      setWidth(newWidth);
    },
    [setWidth, chatInternalService]
  );

  const handleMouseUp = React.useCallback(() => {
    isDraggingRef.current = false;

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    StorageService.Instance.set(CHAT_WIDTH_KEY, widthRef.current.toString());
  }, [handleMouseMove]);

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      startXRef.current = e.clientX;
      startWidthRef.current = widthRef.current;

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [handleMouseMove, handleMouseUp]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const step = 10; // Increase step size for faster resizing

      if (
        widthRef.current < CHAT_WIDTH_SIDE_BY_SIDE_MIN ||
        widthRef.current > CHAT_WIDTH_SIDE_BY_SIDE_MAX
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();

        const newWidth = Math.min(widthRef.current + step, CHAT_WIDTH_SIDE_BY_SIDE_MAX);
        widthRef.current = newWidth;

        setWidth(newWidth);
        chatInternalService.publish(AutopilotChatInternalEvent.ChatResize, newWidth);
        setShouldAnimate(true);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();

        const newWidth = Math.max(widthRef.current - step, CHAT_WIDTH_SIDE_BY_SIDE_MIN);
        widthRef.current = newWidth;

        setWidth(newWidth);
        chatInternalService.publish(AutopilotChatInternalEvent.ChatResize, newWidth);
        setShouldAnimate(true);
      }
    },
    [setWidth, setShouldAnimate, chatInternalService]
  );

  const handleKeyUp = React.useCallback(() => {
    setShouldAnimate(false);

    StorageService.Instance.set(CHAT_WIDTH_KEY, widthRef.current.toString());
  }, [setShouldAnimate]);

  React.useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  if (disabledFeatures.resize) {
    return <Border />;
  }

  return (
    <DragHandleContainer
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      tabIndex={0}
      role="separator"
      aria-valuenow={width}
      aria-valuemin={CHAT_WIDTH_SIDE_BY_SIDE_MIN}
      aria-valuemax={CHAT_WIDTH_SIDE_BY_SIDE_MAX}
    />
  );
}

export const DragHandle = React.memo(DragHandleComponent);

/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material/styles';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatDisabledFeatures,
    AutopilotChatEvent,
    AutopilotChatInternalEvent,
} from '@uipath/portal-shell-util';
import React from 'react';

import { AutopilotChatInternalService } from '../../services/chat-internal-service';
import { AutopilotChatService } from '../../services/chat-service';
import { StorageService } from '../../services/storage';
import {
    CHAT_WIDTH_KEY,
    CHAT_WIDTH_SIDE_BY_SIDE_MAX,
    CHAT_WIDTH_SIDE_BY_SIDE_MIN,
} from '../../utils/constants';

const DragHandleContainer = styled('div')(({ theme }) => ({
    position: 'absolute',
    left: 0,
    top: 0,
    width: token.Border.BorderThickS,
    height: '100%',
    background: theme.palette.semantic.colorBorderDeEmp,
    cursor: 'ew-resize',
    transition: 'background 0.2s ease',
    userSelect: 'none',

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
    },

    '&:hover, &:focus, &:active': {
        background: theme.palette.semantic.colorFocusIndicator,
        outline: 'none',
    },
}));

const Border = styled('div')(({ theme }) => ({
    position: 'absolute',
    left: 0,
    top: 0,
    width: token.Border.BorderThickS,
    height: '100%',
    background: theme.palette.semantic.colorBorderDeEmp,
}));

interface DragHandleProps {
    width: number;
    onWidthChange: (newWidth: number) => void;
    setShouldAnimate: (shouldAnimate: boolean) => void;
}

function DragHandleComponent({
    width, onWidthChange, setShouldAnimate,
}: DragHandleProps) {
    const isDraggingRef = React.useRef(false);
    const startXRef = React.useRef(0);
    const startWidthRef = React.useRef(0);
    const widthRef = React.useRef(width);
    const [ resizeDisabled, setResizeDisabled ] = React.useState(
        AutopilotChatService.Instance.getConfig?.()?.disabledFeatures?.resize ?? false,
    );

    React.useEffect(() => {
        const unsubscribe = AutopilotChatService.Instance.on(
            AutopilotChatEvent.SetDisabledFeatures,
            (features: AutopilotChatDisabledFeatures) => {
                setResizeDisabled(features?.resize ?? false);
            });

        return () => {
            unsubscribe();
        };
    }, []);

    const handleMouseMove = React.useCallback((e: MouseEvent) => {
        if (!isDraggingRef.current) {
            return;
        }

        const delta = startXRef.current - e.clientX;
        const newWidth = Math.min(
            Math.max(startWidthRef.current + delta, CHAT_WIDTH_SIDE_BY_SIDE_MIN),
            CHAT_WIDTH_SIDE_BY_SIDE_MAX,
        );

        widthRef.current = newWidth;
        AutopilotChatInternalService.Instance.publish(AutopilotChatInternalEvent.ChatResize, newWidth);
        onWidthChange(newWidth);
    }, [ onWidthChange ]);

    const handleMouseUp = React.useCallback(() => {
        isDraggingRef.current = false;

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        StorageService.Instance.set(CHAT_WIDTH_KEY, widthRef.current.toString());
    }, [ handleMouseMove ]);

    const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDraggingRef.current = true;
        startXRef.current = e.clientX;
        startWidthRef.current = widthRef.current;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [ handleMouseMove, handleMouseUp ]);

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
        const step = 10; // Increase step size for faster resizing

        if (widthRef.current < CHAT_WIDTH_SIDE_BY_SIDE_MIN || widthRef.current > CHAT_WIDTH_SIDE_BY_SIDE_MAX) {
            return;
        }

        if (e.key === 'ArrowLeft') {
            e.preventDefault();

            const newWidth = Math.min(widthRef.current + step, CHAT_WIDTH_SIDE_BY_SIDE_MAX);
            widthRef.current = newWidth;

            onWidthChange(newWidth);
            AutopilotChatInternalService.Instance.publish(AutopilotChatInternalEvent.ChatResize, newWidth);
            setShouldAnimate(true);

        } else if (e.key === 'ArrowRight') {
            e.preventDefault();

            const newWidth = Math.max(widthRef.current - step, CHAT_WIDTH_SIDE_BY_SIDE_MIN);
            widthRef.current = newWidth;

            onWidthChange(newWidth);
            AutopilotChatInternalService.Instance.publish(AutopilotChatInternalEvent.ChatResize, newWidth);
            setShouldAnimate(true);
        }
    }, [ onWidthChange, setShouldAnimate ]);

    const handleKeyUp = React.useCallback(() => {
        setShouldAnimate(false);

        StorageService.Instance.set(CHAT_WIDTH_KEY, widthRef.current.toString());
    }, [ setShouldAnimate ]);

    React.useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [ handleMouseMove, handleMouseUp ]);

    if (resizeDisabled) {
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

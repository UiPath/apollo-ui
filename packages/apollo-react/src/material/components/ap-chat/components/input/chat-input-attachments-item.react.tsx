/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatFileInfo,
    AutopilotChatFileType,
} from '@uipath/portal-shell-util';
import React from 'react';

import { t } from '../../../../utils/localization/loc';
import { ApTooltipReact } from '../../../ap-tooltip/ap-tooltip.react';
import { AutopilotChatActionButton } from '../common/action-button.react';

export const AttachmentIcon = styled('span')<{ fileType?: AutopilotChatFileType; width?: string; height?: string }>(({
    theme, fileType, width, height,
}) => ({
    maxWidth: width ?? token.Spacing.SpacingM,
    maxHeight: height ?? token.Spacing.SpacingM,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: token.Spacing.SpacingXs,
    borderRadius: token.Border.BorderRadiusM,

    ...(fileType === AutopilotChatFileType.File ? {
        padding: token.Spacing.SpacingMicro,
        backgroundColor: '#078E9E',
    } : {
        backgroundColor: theme.palette.semantic.colorBackgroundSecondary,
        '& svg': {
            width: width ?? token.Spacing.SpacingM,
            height: height ?? token.Spacing.SpacingM,
        },
    }),
}));

const StyledAttachment = styled('div')<{ showRemoveIcon: boolean }>(({
    theme, showRemoveIcon,
}) => ({
    display: 'flex',
    alignItems: 'center',
    gap: token.Spacing.SpacingXs,
    padding: token.Spacing.SpacingMicro,
    margin: `${token.Spacing.SpacingMicro} 0`,
    boxSizing: 'border-box',
    borderRadius: token.Border.BorderRadiusL,
    border: `${token.Border.BorderThickS} solid ${theme.palette.semantic.colorBorderDeEmp}`,
    position: 'relative',
    maxWidth: `calc(50% - ${token.Spacing.SpacingXs} / 2)`,

    '& .attachment-name': {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        color: theme.palette.semantic.colorForeground,
    },

    '& .attachment-remove': {
        opacity: showRemoveIcon ? 1 : 0,
        marginLeft: 'auto',
        position: 'absolute',
        right: token.Spacing.SpacingMicro,
        backgroundColor: theme.palette.semantic.colorBackground,
        height: token.Spacing.SpacingM,
        display: 'flex',

        '& .MuiButtonBase-root': {
            height: token.Spacing.SpacingM,
            width: token.Spacing.SpacingM,
            padding: 0,
        },
    },
}));

interface AttachmentProps {
    attachment: AutopilotChatFileInfo;
    onRemove: (name: string) => void;
    setFocusedAttachmentIndex: () => void;
    shouldFocus: boolean;
}

export const Attachment = React.memo(({
    attachment, onRemove, setFocusedAttachmentIndex, shouldFocus,
}: AttachmentProps) => {
    const removeButtonRef = React.useRef<HTMLButtonElement>(null);
    const [ isRemoveIconVisible, setIsRemoveIconVisible ] = React.useState(false);
    const [ isFocused, setIsFocused ] = React.useState(shouldFocus);
    const attachmentRef = React.useRef<HTMLDivElement>(null);
    const lastMousePosition = React.useRef({
        x: 0,
        y: 0,
    });

    // Tooltip interferes with the onMouseEnter/onMouseLeave events, so we need to listen to mouse move events
    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isFocused) {
                return;
            }

            // Store the last known mouse position
            lastMousePosition.current = {
                x: e.clientX,
                y: e.clientY,
            };

            if (attachmentRef.current) {
                const rect = attachmentRef.current.getBoundingClientRect();
                const isInside = (
                    e.clientX >= rect.left &&
                    e.clientX <= rect.right &&
                    e.clientY >= rect.top &&
                    e.clientY <= rect.bottom
                );

                setIsRemoveIconVisible(isInside);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);

        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, [ isFocused ]);

    React.useEffect(() => {
        if (shouldFocus && removeButtonRef.current) {
            removeButtonRef.current.focus();
        }
    }, [ shouldFocus ]);

    return (
        <StyledAttachment
            ref={attachmentRef}
            id={attachment.name}
            showRemoveIcon={isRemoveIconVisible || isFocused || shouldFocus}
        >
            <AttachmentIcon
                fileType={attachment.friendlyType}
                dangerouslySetInnerHTML={{ __html: attachment.icon }}
            />

            <ApTooltipReact
                content={attachment.name}
                placement="top"
            >
                <ap-typography class="attachment-name">{attachment.name}</ap-typography>
            </ApTooltipReact>

            <div className="attachment-remove">
                <AutopilotChatActionButton
                    ref={removeButtonRef}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    iconSize={token.Icon.IconS}
                    iconName="close"
                    tooltip={t('autopilot-chat-remove-file')}
                    ariaLabel={t('autopilot-chat-remove-file-name', { name: attachment.name })}
                    onClick={() => {
                        onRemove(attachment.name);
                        setFocusedAttachmentIndex();
                        // Wait for next paint to ensure container has updated
                        // and trigger mousemove event to check if the remove icon is visible
                        requestAnimationFrame(() => {
                            const event = new MouseEvent('mousemove', {
                                clientX: lastMousePosition.current.x,
                                clientY: lastMousePosition.current.y,
                            });
                            document.dispatchEvent(event);
                        });
                    }}
                />
            </div>
        </StyledAttachment>
    );
});

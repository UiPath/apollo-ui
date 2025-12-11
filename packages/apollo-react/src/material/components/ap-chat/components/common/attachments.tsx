import React from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import {
  CircularProgress,
  styled,
} from '@mui/material';
import token from '@uipath/apollo-core';

import { ApTypography } from '../../../';
import { useChatState } from '../../providers/chat-state-provider';
import {
  AutopilotChatFileInfo,
  AutopilotChatFileType,
} from '../../service';
import { fileToIcon } from '../../utils/file-to-icon';
import { AutopilotChatActionButton } from './action-button';
import { AutopilotChatTooltip } from './tooltip';

const AttachmentIcon = styled('span')<{ fileType?: AutopilotChatFileType; width?: string; height?: string }>(({
    fileType, width, height,
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
        backgroundColor: 'var(--color-background-secondary)',
        '& svg': {
            width: width ?? token.Spacing.SpacingM,
            height: height ?? token.Spacing.SpacingM,
        },
    }),
}));

const AttachmentsContainer = styled('div')<{ removeSpacing?: boolean; disableOverflow?: boolean }>(({
    removeSpacing, disableOverflow,
}) => ({
    display: 'flex',
    flexWrap: 'wrap',
    padding: removeSpacing ? 0 : `0 ${token.Spacing.SpacingBase}`,
    marginTop: removeSpacing ? 0 : token.Spacing.SpacingMicro,
    gap: `0 ${token.Spacing.SpacingXs}`,
    boxSizing: 'border-box',

    ...(disableOverflow ? {
        overflow: 'hidden',
        maxWidth: '100%',
        width: '100%',
    } : {
        overflowY: 'auto',
        maxHeight: '190px',
    }),
}));

const StyledAttachment = styled('div')<{ showRemoveIcon: boolean; isFullWidth?: boolean }>(({
    showRemoveIcon, isFullWidth,
}) => ({
    display: 'flex',
    alignItems: 'center',
    gap: token.Spacing.SpacingXs,
    padding: token.Spacing.SpacingMicro,
    margin: `${token.Spacing.SpacingMicro} 0`,
    boxSizing: 'border-box',
    borderRadius: token.Border.BorderRadiusL,
    border: `${token.Border.BorderThickS} solid var(--color-border-de-emp)`,
    position: 'relative',
    maxWidth: isFullWidth ? '100%' : `calc(50% - ${token.Spacing.SpacingXs} / 2)`,
    outlineColor: 'var(--color-focus-indicator)',
    backgroundColor: 'var(--color-background)',

    '& .attachment-name': {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        color: 'var(--color-foreground)',
    },

    '& .attachment-remove': {
        opacity: showRemoveIcon ? 1 : 0,
        marginLeft: 'auto',
        position: 'absolute',
        right: token.Spacing.SpacingMicro,
        backgroundColor: 'var(--color-background)',
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
    onRemove?: (name: string) => void;
    shouldFocus?: boolean;
    isFullWidth?: boolean;
    loading?: boolean;
}

export const Attachment = React.memo(({
    attachment, onRemove, shouldFocus, isFullWidth, loading,
}: AttachmentProps) => {
    const { _ } = useLingui();
    const { spacing } = useChatState();
    const removeButtonRef = React.useRef<HTMLButtonElement>(null);
    const [ isRemoveIconVisible, setIsRemoveIconVisible ] = React.useState(false);
    const [ isFocused, setIsFocused ] = React.useState(false);
    const attachmentRef = React.useRef<HTMLDivElement>(null);
    const lastMousePosition = React.useRef({
        x: 0,
        y: 0,
    });

    // Focus attachment when shouldFocus changes
    React.useEffect(() => {
        if (shouldFocus && removeButtonRef.current) {
            removeButtonRef.current.focus();
        }
    }, [ shouldFocus ]);

    // Tooltip interferes with the onMouseEnter/onMouseLeave events, so we need to listen to mouse move events
    React.useEffect(() => {
        // Only track mouse movement for removal if onRemove is provided
        if (!onRemove) {
            return undefined;
        }

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
    }, [ isFocused, onRemove ]);
    const [ IconComponent, friendlyType ] = React.useMemo(() => {
        const {
            icon: IconComp, friendlyType: fileType,
        } = fileToIcon(attachment.name);

        return [ IconComp, fileType ];
    }, [ attachment ]);

    return (
        <StyledAttachment
            ref={attachmentRef}
            id={attachment.name}
            showRemoveIcon={(isRemoveIconVisible || isFocused) && !!onRemove}
            isFullWidth={isFullWidth}
            tabIndex={0}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
        >
            <AttachmentIcon
                fileType={friendlyType}
            >
                <IconComponent />
            </AttachmentIcon>

            <AutopilotChatTooltip
                title={attachment.name}
                placement="top"
                disableInteractive={true}
            >
                <ApTypography variant={spacing.primaryFontToken} className="attachment-name">{attachment.name}</ApTypography>
            </AutopilotChatTooltip>

            {onRemove && !loading && (
                <div className="attachment-remove">
                    <AutopilotChatActionButton
                        ref={removeButtonRef}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        iconSize={token.Icon.IconS}
                        iconName="close"
                        tooltip={_(msg({ id: 'autopilot-chat.common.attachments.remove-file', message: `Remove file` }))}
                        ariaLabel={_(msg({ id: 'autopilot-chat.common.attachments.remove-file-name', message: `Remove ${attachment.name}` }))}
                        onClick={() => {
                            if (onRemove) {
                                onRemove(attachment.name);
                            }
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
                        data-testid="autopilot-chat-attachment-remove"
                    />
                </div>
            )}
            {loading && (
                <div className="attachment-loading">
                    <CircularProgress size={16} color="primary"/>
                </div>
            )}
        </StyledAttachment>
    );
});

interface AttachmentsProps {
    attachments: AutopilotChatFileInfo[];
    attachmentsLoading?: AutopilotChatFileInfo[];
    onRemove?: (name: string, index: number) => void;
    removeSpacing?: boolean;
    disableOverflow?: boolean;
}

export const Attachments = React.memo(({
    attachments, attachmentsLoading, onRemove, removeSpacing, disableOverflow,
}: AttachmentsProps) => {
    const [ focusedAttachmentIndex, setFocusedAttachmentIndex ] = React.useState<number | null>(null);
    const prevAttachmentsLength = React.useRef(attachments.length);

    // Update focus when attachments change (e.g. after removal)
    React.useEffect(() => {
        const currentLength = attachments.length;
        const prevLength = prevAttachmentsLength.current;

        // If attachments were removed and we have a focused index
        if (currentLength < prevLength && focusedAttachmentIndex !== null) {
            // If the focused index is now out of bounds, adjust it
            if (focusedAttachmentIndex >= currentLength) {
                if (currentLength === 0) {
                    setFocusedAttachmentIndex(null);
                } else {
                    setFocusedAttachmentIndex(currentLength - 1);
                }
            }
        }

        prevAttachmentsLength.current = currentLength;
    }, [ attachments.length, focusedAttachmentIndex ]);

    const handleRemoveAttachment = React.useCallback((name: string, index: number) => {
        // Only set focus to next attachment if we have a remove function
        if (onRemove) {
            // Set focus to the current index (will be adjusted in useEffect after array length changes)
            setFocusedAttachmentIndex(index);
            onRemove(name, index);
        }
    }, [ onRemove ]);

    // Determine if there's an odd number of attachments
    const hasOddNumberOfAttachments = attachments.length % 2 !== 0;

    return (
        <AttachmentsContainer removeSpacing={removeSpacing} disableOverflow={disableOverflow}>
            {attachments.map((attachment, index) => (
                <Attachment
                    key={attachment.name + attachment.size}
                    attachment={attachment}
                    loading={attachmentsLoading?.find(a =>
                        a.name === attachment.name &&
                        a.size === attachment.size,
                    )?.loading}
                    onRemove={onRemove ? (name) => handleRemoveAttachment(name, index) : undefined}
                    shouldFocus={index === focusedAttachmentIndex}
                    isFullWidth={hasOddNumberOfAttachments && index === attachments.length - 1}
                />
            ))}
        </AttachmentsContainer>
    );
});

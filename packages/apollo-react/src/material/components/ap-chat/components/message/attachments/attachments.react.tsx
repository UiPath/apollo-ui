/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material';
import token from '@uipath/apollo-core/lib';
import React from 'react';

import { t } from '../../../../../utils/localization/loc';
import { ApTooltipReact } from '../../../../ap-tooltip/ap-tooltip.react';
import {
    AutopilotChatAccordionPosition,
    AutopilotChatEvent,
    FileInfo,
} from '../../../models/chat.model';
import { AutopilotChatService } from '../../../services/chat-service';
import { AutopilotChatAccordion } from '../../common/accordion.react';
import { AttachmentIcon } from '../../input/chat-input-attachments.react';

interface AttachmentItemProps {
    attachment: FileInfo;
}

const AttachmentContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: token.Spacing.SpacingS,
    margin: `${token.Spacing.SpacingS} 0`,

    '& .attachment-name': {
        color: theme.palette.semantic.colorForeground,
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
    },
}));

function AttachmentItemComponent({ attachment }: AttachmentItemProps) {
    return (
        <AttachmentContainer>
            <AttachmentIcon
                fileType={attachment.friendlyType}
                width={token.Spacing.SpacingXl}
                height={token.Spacing.SpacingXl}
                className={`attachment-icon attachment-icon-${attachment.friendlyType}`}
                dangerouslySetInnerHTML={{ __html: attachment.icon }}
            />
            <ApTooltipReact content={attachment.name}>
                <ap-typography class="attachment-name">{attachment.name}</ap-typography>
            </ApTooltipReact>
        </AttachmentContainer>
    );
}

const AttachmentItem = React.memo(AttachmentItemComponent);

interface AutopilotChatAttachmentsProps {
    attachments: FileInfo[];
    onToggleExpanded?: (expanded: boolean) => void;
}

function AutopilotChatAttachmentsComponent({
    attachments, onToggleExpanded,
}: AutopilotChatAttachmentsProps) {
    const [ visibleFiles, setVisibleFiles ] = React.useState<number>(2);
    const displayFileContainerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        // Method to calculate the number of files to display in the summary
        const calculateVisibleFiles = () => {
            // aproximate size of the "& more" text
            const SUFFIX_SIZE = 50;

            if (!displayFileContainerRef.current) {
                return;
            }

            // Get the contaienr width so we can calculate the minimum number of files to display
            const container = displayFileContainerRef.current;
            const containerWidth = container.offsetWidth;
            let totalWidth = 0;
            let count = 0;

            // Create a fake node to simulate the space taken by the file name
            const temp = document.createElement('span');
            temp.style.visibility = 'hidden';
            temp.style.position = 'absolute';
            document.body.appendChild(temp);

            for (let i = 0; i < attachments.length; i++) {
                // fill the temp node with the file name
                temp.textContent = i > 0 ? `, ${attachments[i].name}` : attachments[i].name;
                totalWidth += temp.offsetWidth;

                // If the total width of the files is greater than the container width, stop the loop
                if (totalWidth > containerWidth - SUFFIX_SIZE) {
                    break;
                }

                // If the total width is less than the container width, increment the count
                count = i + 1;
            }

            document.body.removeChild(temp);
            setVisibleFiles(Math.max(1, count)); // Ensure at least 1 file is shown
        };

        calculateVisibleFiles();
        window.addEventListener('resize', calculateVisibleFiles);

        const unsubscribe = AutopilotChatService.Instance.on(AutopilotChatEvent.ModeChange, () => {
            requestAnimationFrame(calculateVisibleFiles);
        });

        return () => {
            window.removeEventListener('resize', calculateVisibleFiles);
            unsubscribe();
        };
    }, [ attachments ]);

    const getFilePreview = React.useCallback(() => {
        if (visibleFiles >= attachments.length) {
            return attachments.map(a => a.name).join(', ');
        }

        const visibleNames = attachments.slice(0, visibleFiles).map(a => a.name)
            .join(', ');
        return t('autopilot-chat-files-preview', {
            files: visibleNames,
            count: attachments.length - visibleFiles,
        });
    }, [ attachments, visibleFiles ]);

    return (
        <AutopilotChatAccordion
            position={AutopilotChatAccordionPosition.Right}
            ref={displayFileContainerRef}
            summaryTitle={t('autopilot-chat-selected-files', { count: attachments.length })}
            summaryDescription={getFilePreview()}
            onToggleExpanded={onToggleExpanded}
        >
            {attachments.map((attachment) => (
                <AttachmentItem
                    key={attachment.name}
                    attachment={attachment}
                />
            ))}
        </AutopilotChatAccordion>
    );
}

export const AutopilotChatAttachments = React.memo(AutopilotChatAttachmentsComponent);

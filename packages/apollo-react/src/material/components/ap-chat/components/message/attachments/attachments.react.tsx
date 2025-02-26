/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatAccordionPosition,
    AutopilotChatEvent,
    AutopilotChatFileInfo,
    AutopilotChatInternalEvent,
} from '@uipath/portal-shell-util';
import React from 'react';

import { t } from '../../../../../utils/localization/loc';
import { AutopilotChatInternalService } from '../../../services/chat-internal-service';
import { AutopilotChatService } from '../../../services/chat-service';
import { AutopilotChatAccordion } from '../../common/accordion.react';
import { AttachmentItem } from './attachment-item.react';

interface AutopilotChatAttachmentsProps {
    attachments: AutopilotChatFileInfo[];
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
            const SUFFIX_SIZE = 70;

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
            temp.style.fontSize = token.FontFamily.FontMSize;
            temp.style.fontWeight = token.FontFamily.FontMWeight.toString();
            temp.style.fontFamily = token.FontFamily.FontMFamily;
            temp.style.lineHeight = token.FontFamily.FontMLineHeight;
            displayFileContainerRef.current.appendChild(temp);

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

            displayFileContainerRef.current.removeChild(temp);
            setVisibleFiles(Math.max(1, count)); // Ensure at least 1 file is shown
        };

        requestAnimationFrame(calculateVisibleFiles);

        const unsubscribeModeChange = AutopilotChatService.Instance.on(
            AutopilotChatEvent.ModeChange,
            () => {
                requestAnimationFrame(calculateVisibleFiles);
            },
        );
        const unsubscribeResize = AutopilotChatInternalService.Instance.on(
            AutopilotChatInternalEvent.ChatResize,
            calculateVisibleFiles,
        );

        return () => {
            unsubscribeModeChange();
            unsubscribeResize();
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

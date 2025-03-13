/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    styled,
} from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core/lib';
import {
    AutopilotChatAccordionPosition,
    AutopilotChatEvent,
    AutopilotChatInternalEvent,
    AutopilotChatMode,
} from '@uipath/portal-shell-util';
import React from 'react';

import { AutopilotChatInternalService } from '../../services/chat-internal-service';
import { AutopilotChatService } from '../../services/chat-service';
import { StorageService } from '../../services/storage';
import {
    CHAT_MESSAGE_MAX_PADDING,
    CHAT_WIDTH_KEY,
    CHAT_WIDTH_SIDE_BY_SIDE_MIN,
} from '../../utils/constants';
import { calculateDynamicPadding } from '../../utils/dynamic-padding';

const AccordionContainer = styled('div')<{ isLeft: boolean }>(({
    theme, isLeft,
}) => {
    const [ padding, setPadding ] = React.useState(
        calculateDynamicPadding(parseInt(StorageService.Instance.get(CHAT_WIDTH_KEY) ?? CHAT_WIDTH_SIDE_BY_SIDE_MIN.toString(), 10)),
    );
    const chatService = AutopilotChatService.Instance;
    const chatInternalService = AutopilotChatInternalService.Instance;

    React.useEffect(() => {
        if (!chatInternalService || !chatService) {
            return;
        }

        const unsubscribe = chatInternalService.on(AutopilotChatInternalEvent.ChatResize, (width: number) => {
            setPadding(calculateDynamicPadding(width));
        });

        const unsubscribeMode = chatService.on(
            AutopilotChatEvent.ModeChange, (mode: AutopilotChatMode) => {
                if (mode === AutopilotChatMode.FullScreen) {
                    setPadding(CHAT_MESSAGE_MAX_PADDING);
                } else {
                    const defaultWidth = CHAT_WIDTH_SIDE_BY_SIDE_MIN.toString();
                    const storedWidth = StorageService.Instance.get(CHAT_WIDTH_KEY) ?? defaultWidth;
                    const width = parseInt(storedWidth, 10);

                    setPadding(calculateDynamicPadding(width));
                }
            });

        return () => {
            unsubscribe();
            unsubscribeMode();
        };
    }, [ chatInternalService, chatService ]);

    return {
        display: 'flex',
        padding: `${token.Spacing.SpacingS} ${token.Spacing.SpacingBase} ${token.Spacing.SpacingMicro}`,
        flexDirection: 'column',
        justifyContent: 'center',
        alignSelf: isLeft ? 'flex-start' : 'flex-end',
        gap: token.Spacing.SpacingMicro,
        borderRadius: '12px',
        marginLeft: isLeft ? '0' : token.Spacing.SpacingL,
        marginRight: isLeft ? token.Spacing.SpacingL : '0',
        minWidth: '320px',
        maxWidth: `calc(100% - ${token.Spacing.SpacingL} * 2 - ${padding}px)`, // margin of parent + dynamic padding based on side by side width
        border: `${token.Border.BorderThickS} solid ${theme.palette.semantic.colorBorderDeEmp}`,
        boxShadow: 'none',

        '& .MuiAccordion-root': { backgroundImage: 'unset' },
    };
});

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
    padding: 'unset',
    marginBottom: token.Spacing.SpacingS,

    '& .MuiAccordionSummary-expandIconWrapper': {
        alignSelf: 'flex-start',
        marginTop: token.Padding.PadXs,
        color: theme.palette.semantic.colorIconDefault,
    },
}));

const SummaryDetails = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',

    '& .summary-details-description': { color: theme.palette.semantic.colorForegroundDeEmp },
}));

interface AccordionProps {
    summaryTitle: string;
    summaryDescription: string;
    children: React.ReactNode;
    onToggleExpanded?: (expanded: boolean) => void;
    position?: AutopilotChatAccordionPosition;
}

const AutopilotChatAccordionComponent = React.forwardRef<HTMLDivElement, AccordionProps>(({
    summaryTitle,
    summaryDescription,
    children,
    onToggleExpanded,
    position = AutopilotChatAccordionPosition.Left,
}, ref) => {
    return (
        <AccordionContainer ref={ref} isLeft={position === AutopilotChatAccordionPosition.Left}>
            <Accordion onChange={(_, expanded) => onToggleExpanded?.(expanded)}>
                <StyledAccordionSummary expandIcon={<portal-custom-icon name="chevron" size="20px" />}>
                    <SummaryDetails>
                        <ap-typography variant={FontVariantToken.fontSizeLBold}>
                            {summaryTitle}
                        </ap-typography>

                        <ap-typography class="summary-details-description" variant={FontVariantToken.fontSizeS}>
                            {summaryDescription}
                        </ap-typography>
                    </SummaryDetails>
                </StyledAccordionSummary>

                <AccordionDetails>
                    {children}
                </AccordionDetails>
            </Accordion>
        </AccordionContainer>
    );
});

export const AutopilotChatAccordion = React.memo(AutopilotChatAccordionComponent);

/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    styled,
} from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core/lib';
import React from 'react';

const AccordionContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: token.Spacing.SpacingMicro,
    padding: `${token.Spacing.SpacingS} ${token.Spacing.SpacingBase} ${token.Spacing.SpacingMicro}`,
    marginLeft: '0',
    marginRight: token.Spacing.SpacingL,
    maxWidth: 'calc(100% - 112px)',
    borderRadius: '12px',
    border: `${token.Border.BorderThickS} solid ${theme.palette.semantic.colorBorderDeEmp}`,
    boxShadow: 'none',
    minWidth: '320px',

    '& .MuiAccordion-root': { backgroundImage: 'unset' },
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
    padding: 'unset',
    marginBottom: token.Spacing.SpacingS,

    '& .MuiAccordionSummary-expandIconWrapper': {
        alignSelf: 'flex-start',
        marginTop: '2px',
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
}

const AutopilotChatAccordionComponent = React.forwardRef<HTMLDivElement, AccordionProps>(({
    summaryTitle,
    summaryDescription,
    children,
    onToggleExpanded,
}, ref) => {
    return (
        <AccordionContainer ref={ref}>
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

import React from 'react';
import { styled } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import token from '@uipath/apollo-core';

import { NestedValue } from './NestedValue';
import type { ToolCallSectionProps } from './ApToolCall.types';

const SectionArrowIcon = styled(KeyboardArrowRightIcon, {
    shouldForwardProp: (prop) => prop !== 'expanded',
})<{ expanded?: boolean }>(({ expanded }) => ({
    marginRight: token.Spacing.SpacingXs,
    transition: 'transform 0.2s ease',
    cursor: 'pointer',
    transform: expanded ? 'rotate(90deg)' : 'none',
}));

const SectionHeader = styled('div')({
    display: 'flex',
    alignItems: 'center',
    padding: token.Spacing.SpacingMicro,
    borderRadius: token.Spacing.SpacingMicro,
    cursor: 'pointer',
    '&:hover': {
        backgroundColor: 'var(--color-background-hover)',
    },
    '&:focus-visible': {
        outline: `${token.Border.BorderThickS} solid var(--color-focus-indicator)`,
        outlineOffset: '-1px',
    },
});

const SectionContent = styled('div', {
    shouldForwardProp: (prop) => prop !== 'expanded',
})<{ expanded?: boolean }>(({ expanded }) => ({
    marginLeft: token.Spacing.SpacingXl,
    overflow: 'hidden',
    transition: 'max-height 0.2s ease',
    maxHeight: expanded ? '220px' : '0',
}));

const KeyValueContainer = styled('div')({
    maxHeight: '180px',
    overflowY: 'auto',
    backgroundColor: 'var(--color-background-secondary)',
    padding: `${token.Spacing.SpacingXs} ${token.Spacing.SpacingS}`,
    margin: `${token.Spacing.SpacingXs} 0`,
    borderRadius: token.Spacing.SpacingMicro,
});

const KeyValuePair = styled('div')({
    display: 'flex',
    marginBottom: token.Spacing.SpacingMicro,
    fontSize: token.FontFamily.FontSSize,
    '&:last-child': {
        marginBottom: 0,
    },
});

const Key = styled('span')({
    fontWeight: token.FontFamily.FontWeightMedium,
    marginRight: token.Spacing.SpacingXs,
    minWidth: 'max-content',
});

const UrlValue = styled('span')({
    color: 'var(--color-foreground-link)',
    'a': {
        textDecoration: 'none',
        '&:hover': {
            textDecoration: 'underline',
        },
    },
});

const CompletedStatus = styled(CheckCircleIcon)({
    width: token.FontFamily.FontLSize,
    color: 'var(--color-success-icon)',
    fill: 'var(--color-success-icon)',
});

const WaitingStatus = styled(ErrorIcon)({
    width: token.FontFamily.FontLSize,
    color: 'var(--color-warning-icon)',
    fill: 'var(--color-warning-icon)',
});

const TaskUrlKey = styled('span')({
    fontWeight: token.FontFamily.FontWeightMedium,
    marginTop: token.Spacing.SpacingMicro,
    marginRight: token.Spacing.SpacingXs,
    minWidth: 'max-content',
});

const TaskUrlsContainer = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    gap: token.Spacing.SpacingXs,
});

const TaskUrlItem = styled('div')({
    display: 'flex',
    alignItems: 'center',
    gap: token.Spacing.SpacingXs,
});

const TaskUrlLink = styled('a')({
    color: 'inherit',
    textDecoration: 'none',
    '&:hover': {
        textDecoration: 'underline',
    },
    '&:focus-visible': {
        outline: `${token.Border.BorderThickS} solid var(--color-focus-indicator)`,
        outlineOffset: '1px',
    },
});

export const ToolCallSection: React.FC<ToolCallSectionProps> = ({
    title,
    isExpanded,
    onToggle,
    data,
    children,
}) => {
    const showKeyValuePairs = data && Object.keys(data).length > 0;

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggle();
        }
    };

    return (
        <div>
            <SectionHeader
                onClick={onToggle}
                onKeyDown={handleKeyDown}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
            >
                <SectionArrowIcon fontSize="small" expanded={isExpanded} />
                {title}
            </SectionHeader>
            <SectionContent expanded={isExpanded}>
                {showKeyValuePairs && (
                    <KeyValueContainer>
                        {Object.entries(data).map(([key, value]) => (
                            <KeyValuePair key={key}>
                                {key === 'taskUrls' && Array.isArray(value) ? (
                                    <>
                                        <TaskUrlKey>
                                            {value.length > 1 ? 'taskUrls' : 'taskUrl'}:
                                        </TaskUrlKey>
                                        <TaskUrlsContainer>
                                            {value.map((item: any, index: number) => (
                                                <TaskUrlItem key={index}>
                                                    <UrlValue>
                                                        <TaskUrlLink
                                                            href={item.taskUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            {item.taskUrl}
                                                        </TaskUrlLink>
                                                    </UrlValue>
                                                    {item.status === 'unset' ? (
                                                        <WaitingStatus />
                                                    ) : (
                                                        <CompletedStatus />
                                                    )}
                                                </TaskUrlItem>
                                            ))}
                                        </TaskUrlsContainer>
                                    </>
                                ) : (
                                    <>
                                        <Key>{key}:</Key>
                                        <NestedValue value={value} />
                                    </>
                                )}
                            </KeyValuePair>
                        ))}
                    </KeyValueContainer>
                )}
                {children}
            </SectionContent>
        </div>
    );
};

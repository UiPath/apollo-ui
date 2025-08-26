/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    useTheme,
} from '@mui/material';
import token from '@uipath/apollo-core/lib';
import light from 'highlight.js/styles/github.css';
import dark from 'highlight.js/styles/github-dark.css';
import katex from 'katex';
import React from 'react';

import { isDebuggingEnabled } from '../../../../../react/stencil-react-adapter/Utils/DebugUtils';
import { t } from '../../../../../utils/localization/loc';
import { ThemeInstanceResolver } from '../../../../../utils/theme/themeInstanceResolver';
import { ApChipReact } from '../../../../ap-chip/ap-chip.react';
import { useChatState } from '../../../providers/chat-state-provider.react';
import { AutopilotChatActionButton } from '../../common/action-button.react';

// Utility function to extract plain text from React elements
const extractTextFromChildren = (children: any): string => {
    if (typeof children === 'string') {
        return children;
    }
    if (typeof children === 'number') {
        return String(children);
    }
    if (React.isValidElement(children)) {
        const element = children as React.ReactElement<{ children?: any }>;
        return extractTextFromChildren(element.props.children);
    }
    if (Array.isArray(children)) {
        return children.map(child => extractTextFromChildren(child)).join('');
    }
    return '';
};

const CodeBlockHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${token.Spacing.SpacingXs} ${token.Spacing.SpacingBase}`,
    color: theme.palette.semantic.colorForeground,
    fontFamily: token.FontFamily.FontNormal,
    boxSizing: 'border-box',
}));

const CodeBlockContainer = styled('div')(({ theme }) => ({
    position: 'relative',
    width: '100%',
    fontFamily: token.FontFamily.FontNormal,
    background: theme.palette.semantic.colorBackground,
    borderRadius: token.Border.BorderRadiusL,
    border: `1px solid ${theme.palette.semantic.colorBackgroundGray}`,
    paddingBottom: token.Spacing.SpacingMicro,

    /* this is for inline codeblocks */
    '&:not(pre &)': {
        display: 'inline-block',
        width: 'unset',
        position: 'relative',
        top: '6px',
        borderRadius: 0,
        border: 'none',
        background: theme.palette.semantic.colorBackgroundDisabled,
        padding: `0 ${token.Spacing.SpacingMicro}`,

        '& *': { padding: '0 !important' },
        [`& ${CodeBlockHeader}`]: { display: 'none !important' },
    },
}));

const NonCodeContentContainer = styled('div')(({ theme }) => ({
    color: theme.palette.semantic.colorForeground,
    padding: token.Spacing.SpacingM,
    maxWidth: '100%',
    overflow: 'auto',
    fontFamily: token.FontFamily.FontNormal,
}));

const HighlightedCodeContainer = styled('div')<{ isDark: boolean }>(({
    isDark, theme,
}) => {
    const { spacing } = useChatState();

    const codeFontStyles = {
        fontSize: spacing.compactMode ? token.FontFamily.FontMonoSSize : token.FontFamily.FontMonoMSize,
        fontFamily: spacing.compactMode ? token.FontFamily.FontMonoSFamily : token.FontFamily.FontMonoMFamily,
        fontWeight: spacing.compactMode ? token.FontFamily.FontMonoSWeight : token.FontFamily.FontMonoMWeight,
    };

    return {
        margin: 0,
        width: '100%',
        padding: token.Spacing.SpacingBase,
        background: 'transparent',
        borderRadius: token.Border.BorderRadiusL,
        boxSizing: 'border-box',
        color: theme.palette.semantic.colorForeground,
        textWrap: 'wrap',
        ...codeFontStyles,
        // Apply GitHub theme colors from highlight.js conditionally
        ...(isDark ? { dark } : { light }),
    };
});

export const Code = React.memo(({
    inline, className, children, ...props
}: any) => {
    const theme = useTheme();
    const { spacing } = useChatState();
    const apolloTheme = ThemeInstanceResolver.Instance?.getTheme();
    const isDark = apolloTheme?.includes('dark') || false;
    const match = /language-(\w+)/.exec(className || '');

    const codeFontStyles = {
        fontSize: spacing.compactMode ? token.FontFamily.FontMonoSSize : token.FontFamily.FontMonoMSize,
        fontFamily: spacing.compactMode ? token.FontFamily.FontMonoSFamily : token.FontFamily.FontMonoMFamily,
        lineHeight: spacing.compactMode ? token.FontFamily.FontMonoSLineHeight : token.FontFamily.FontMonoMLineHeight,
        height: spacing.compactMode ? token.FontFamily.FontMonoSLineHeight : token.FontFamily.FontMonoMLineHeight,
        fontWeight: spacing.compactMode ? token.FontFamily.FontMonoSWeight : token.FontFamily.FontMonoMWeight,
    };

    // Additional check for inline code blocks
    const isInline = inline || (!className && typeof children === 'string' && !children.includes('\n'));

    if (isInline) {
        return (
            <code style={{
                color: theme.palette.semantic.colorForeground,
                padding: `0 ${token.Padding.PadS}`,
                background: theme.palette.semantic.colorBackgroundDisabled,
                borderRadius: token.Border.BorderRadiusM,
                display: 'inline-block',
                width: 'fit-content',
                ...codeFontStyles,
            }} className={className} {...props}>
                {children}
            </code>
        );
    }

    // Handle math blocks using KaTeX
    if (match?.[1] === 'math') {
        try {
            const html = katex.renderToString(String(children).replace(/\n$/, ''), {
                output: 'mathml',
                trust: false,
                strict: true,
                throwOnError: false,
            });
            return (
                <div
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            );
        } catch (e) {
            if (isDebuggingEnabled()) {
                // eslint-disable-next-line no-console
                console.warn('Error rendering math block:', e);
            }

            return (
                <pre style={{ color: theme.palette.semantic.colorForeground }}>
                    {String(children)}
                </pre>
            );
        }
    }

    const codeContent = extractTextFromChildren(children).replace(/\n$/, '');
    const language = match?.[1] || '';

    return (
        <CodeBlockContainer>
            <CodeBlockHeader>
                <ApChipReact
                    label={language || t('autopilot-chat-code-block-language')}
                />
                <AutopilotChatActionButton
                    iconName="content_copy"
                    tooltip={t('autopilot-chat-code-block-copy')}
                    onClick={() => {
                        navigator.clipboard.writeText(codeContent);
                    }}
                />
            </CodeBlockHeader>

            {language ? (
                <HighlightedCodeContainer isDark={isDark}>
                    {children}
                </HighlightedCodeContainer>
            ) : (
                <NonCodeContentContainer>
                    {children}
                </NonCodeContentContainer>
            )}
        </CodeBlockContainer>
    );
});

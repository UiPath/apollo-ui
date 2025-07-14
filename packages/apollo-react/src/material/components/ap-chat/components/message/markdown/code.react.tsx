/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    useTheme,
} from '@mui/material';
import token from '@uipath/apollo-core/lib';
import katex from 'katex';
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
    coldarkDark,
    oneLight,
} from 'react-syntax-highlighter/dist/cjs/styles/prism';

import { isDebuggingEnabled } from '../../../../../react/stencil-react-adapter/Utils/DebugUtils';
import { t } from '../../../../../utils/localization/loc';
import { ThemeInstanceResolver } from '../../../../../utils/theme/themeInstanceResolver';
import { ApChipReact } from '../../../../ap-chip/ap-chip.react';
import { AutopilotChatActionButton } from '../../common/action-button.react';

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

type CodeBlockProps = {
    language: string;
    value: string;
};

const CodeBlock: React.FC<CodeBlockProps> = React.memo(({
    language, value,
}) => {
    useTheme(); // triggers re-render when theme changes

    const apolloTheme = ThemeInstanceResolver.Instance?.getTheme();

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
                        navigator.clipboard.writeText(value);
                    }}
                />
            </CodeBlockHeader>

            {language ? (
                <SyntaxHighlighter
                    style={apolloTheme?.includes('dark') ? coldarkDark : oneLight}
                    language={language}
                    PreTag="div"
                    wrapLongLines
                    customStyle={{
                        margin: 0,
                        width: '100%',
                        padding: token.Spacing.SpacingBase,
                        background: 'transparent',
                        borderRadius: token.Border.BorderRadiusL,
                        boxSizing: 'border-box',
                    }}
                    codeTagProps={{
                        style: {
                            fontSize: token.FontFamily.FontMSize,
                            fontFamily: token.FontFamily.FontMono,
                        },
                    }}>
                    {value}
                </SyntaxHighlighter>
            ) : (
                <NonCodeContentContainer>
                    {value}
                </NonCodeContentContainer>
            )}
        </CodeBlockContainer>
    );
});

export const Code = React.memo(({
    inline, className, children, ...props
}: any) => {
    const theme = useTheme();
    const match = /language-(\w+)/.exec(className || '');

    if (inline) {
        return (
            <code style={{
                color: theme.palette.semantic.colorForeground,
                fontSize: token.FontFamily.FontMonoMSize,
                fontFamily: token.FontFamily.FontMonoMFamily,
                lineHeight: token.FontFamily.FontMonoMLineHeight,
                height: token.FontFamily.FontMonoMLineHeight,
                fontWeight: token.FontFamily.FontMonoMWeight,
                padding: `0 ${token.Padding.PadS}`,
                background: theme.palette.semantic.colorBackgroundDisabled,
                borderRadius: token.Border.BorderRadiusM,
                display: 'inline-block',
                width: 'fit-content',
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

    return (
        <CodeBlock
            language={(match?.[1]) || ''}
            value={String(children).replace(/\n$/, '')}
            {...props} />
    );
});

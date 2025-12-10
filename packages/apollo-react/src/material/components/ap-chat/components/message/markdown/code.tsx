import React from 'react';

import dark from 'highlight.js/styles/github-dark.css';
import light from 'highlight.js/styles/github.css';
import katex from 'katex';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  IconButton,
  Modal,
  styled,
} from '@mui/material';
import token from '@uipath/apollo-core';

import { ThemeInstanceResolver } from '../../../../../utils/theme/themeInstanceResolver';
import { ApChipReact } from '../../../../ap-chip/ap-chip';
import { useChatState } from '../../../providers/chat-state-provider';
import { AutopilotChatActionButton } from '../../common/action-button';

enum LANGUAGES {
    HTML = 'html',
}

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

const CodeBlockHeader = styled('div')((() => ({
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${token.Spacing.SpacingXs} ${token.Spacing.SpacingBase}`,
    color: 'var(--color-foreground)',
    fontFamily: token.FontFamily.FontNormal,
    boxSizing: 'border-box',
})));

const CodeBlockContainer = styled('div')((() => ({
    position: 'relative',
    width: '100%',
    fontFamily: token.FontFamily.FontNormal,
    background: 'var(--color-background)',
    borderRadius: token.Border.BorderRadiusL,
    border: `1px solid var(--color-background-gray)`,
    paddingBottom: token.Spacing.SpacingMicro,

    /* this is for inline codeblocks */
    '&:not(pre &)': {
        display: 'inline-block',
        width: 'unset',
        position: 'relative',
        top: '6px',
        borderRadius: 0,
        border: 'none',
        background: 'var(--color-background-disabled)',
        padding: `0 ${token.Spacing.SpacingMicro}`,

        '& *': { padding: '0 !important' },
        [`& ${CodeBlockHeader}`]: { display: 'none !important' },
    },
})));

const NonCodeContentContainer = styled('div')(() => ({
    color: 'var(--color-foreground)',
    padding: token.Spacing.SpacingM,
    maxWidth: '100%',
    overflow: 'auto',
    fontFamily: token.FontFamily.FontNormal,
}));

const HighlightedCodeContainer = styled('div')<{ isDark: boolean }>(({
    isDark,
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
        color: 'var(--color-foreground)',
        textWrap: 'wrap',
        ...codeFontStyles,
        // Apply GitHub theme colors from highlight.js conditionally
        ...(isDark ? { dark } : { light }),
    };
});

const ContentContainer = styled('div')((() => ({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '400px',
    borderRadius: token.Border.BorderRadiusL,
    overflow: 'auto',
    backgroundColor: 'var(--color-background)',
    boxSizing: 'border-box',
    resize: 'vertical',
})));

const PreviewIframe = styled('iframe')((() => ({
    width: '100%',
    height: '100%',
    border: 'none',
    backgroundColor: 'var(--color-background)',
    flex: 1,
})));

const CustomModal = styled(Modal)(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& .MuiBackdrop-root': { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
}));

const ModalContainer = styled(Box)((() => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '95vw',
    height: '90vh',
    maxWidth: '1400px',
    maxHeight: '900px',
    backgroundColor: 'var(--color-background-raised)',
    borderRadius: token.Border.BorderRadiusS,
    padding: token.Spacing.SpacingL,
    boxShadow: '0px 5px 5px -3px rgba(0, 0, 0, 0.20), 0px 8px 10px 1px rgba(0, 0, 0, 0.14), 0px 3px 14px 2px rgba(0, 0, 0, 0.12)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    outline: 'none',
    '&:focus-visible, &:focus': { outline: 'none' },
})));

const ModalContent = styled(Box)(() => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
}));

const CloseButton = styled(IconButton)((() => ({
    position: 'absolute',
    top: token.Spacing.SpacingXs,
    right: token.Spacing.SpacingS,
    zIndex: 1,
    backgroundColor: 'var(--color-background-raised)',
    '&:hover': { backgroundColor: 'var(--color-background-hover)' },
})));

export const Code = React.memo(({
    inline, className, children, isStreaming, ...props
}: any) => {
    const { _ } = useLingui();
    const {
        disabledFeatures, spacing,
    } = useChatState();
    const apolloTheme = ThemeInstanceResolver.Instance?.getTheme();
    const isDark = apolloTheme?.includes('dark') || false;
    const match = /language-(\w+)/.exec(className || '');
    const codeContent = extractTextFromChildren(children).replace(/\n$/, '');
    const language = match?.[1] || '';
    const isPreviewable = language === LANGUAGES.HTML && !disabledFeatures.htmlPreview;
    const [ showPreview, setShowPreview ] = React.useState(isPreviewable && !isStreaming);
    const [ isModalOpen, setIsModalOpen ] = React.useState(false);

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
                color: 'var(--color-foreground)',
                padding: `0 ${token.Padding.PadS}`,
                background: 'var(--color-background-disabled)',
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
            return (
                <pre style={{ color: 'var(--color-foreground)' }}>
                    {String(children)}
                </pre>
            );
        }
    }

    const previewContent = (
        <PreviewIframe
            sandbox="allow-scripts"
            srcDoc={codeContent}
            title="HTML Preview"
        />
    );

    const markdownContent = language ? (
        <HighlightedCodeContainer isDark={isDark}>
            {children}
        </HighlightedCodeContainer>
    ) : (
        <NonCodeContentContainer>
            {children}
        </NonCodeContentContainer>
    );

    return (
        <>
            <CodeBlockContainer>
                <CodeBlockHeader>
                    <ApChipReact
                        label={language || _(msg({ id: 'autopilot-chat.message.code-block-language', message: `Code` }))}
                    />
                    <div style={{
                        display: 'flex',
                        gap: token.Spacing.SpacingMicro,
                    }}>
                        {isPreviewable && (
                            <AutopilotChatActionButton
                                iconName={showPreview ? 'code' : 'visibility'}
                                tooltip={showPreview ? _(msg({ id: 'autopilot-chat.message.code-block-code', message: `Show code` })) : _(msg({ id: 'autopilot-chat.message.code-block-preview', message: `Preview` }))}
                                onClick={() => {
                                    setShowPreview(!showPreview);
                                }}
                            />
                        )}
                        <AutopilotChatActionButton
                            iconName="open_in_full"
                            tooltip={_(msg({ id: 'autopilot-chat.message.expand', message: `Expand` }))}
                            onClick={() => {
                                setIsModalOpen(true);
                            }}
                        />
                        <AutopilotChatActionButton
                            iconName="content_copy"
                            tooltip={_(msg({ id: 'autopilot-chat.message.code-block-copy', message: `Copy code` }))}
                            onClick={() => {
                                navigator.clipboard.writeText(codeContent);
                            }}
                            data-testid="autopilot-chat-code-copy"
                        />
                    </div>
                </CodeBlockHeader>

                {isPreviewable ? (
                    <ContentContainer>
                        {showPreview ? previewContent : markdownContent}
                    </ContentContainer>
                ) : (
                    markdownContent
                )}
            </CodeBlockContainer>

            <CustomModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                disablePortal
                keepMounted
            >
                <ModalContainer>
                    <CloseButton
                        size="small"
                        onClick={() => setIsModalOpen(false)}
                        aria-label={_(msg({ id: 'autopilot-chat.message.close', message: `Close` }))}
                    >
                        <CloseIcon
                            sx={{
                                width: token.Spacing.SpacingBase,
                                height: token.Spacing.SpacingBase,
                            }}
                        />
                    </CloseButton>

                    <ModalContent>
                        <div style={{
                            flex: 1,
                            overflow: (isPreviewable && showPreview) ? 'hidden' : 'auto',
                            minHeight: 0,
                            marginTop: token.Spacing.SpacingXs,
                        }}>
                            {isPreviewable && showPreview ? previewContent : markdownContent}
                        </div>
                    </ModalContent>
                </ModalContainer>
            </CustomModal>
        </>
    );
});

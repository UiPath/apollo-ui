import React from 'react';

import dark from 'highlight.js/styles/github-dark.css';
import light from 'highlight.js/styles/github.css';
import katex from 'katex';

import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  IconButton,
  Modal,
  styled,
  useTheme,
} from '@mui/material';
import token from '@uipath/apollo-core';

import { isDebuggingEnabled } from '../../../../../react/stencil-react-adapter/Utils/DebugUtils';
import { t } from '../../../../../utils/localization/loc';
import { ThemeInstanceResolver } from '../../../../../utils/theme/themeInstanceResolver';
import { ApChipReact } from '../../../../ap-chip/ap-chip.react';
import { useChatState } from '../../../providers/chat-state-provider.react';
import { AutopilotChatActionButton } from '../../common/action-button.react';

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

const ContentContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '400px',
    borderRadius: token.Border.BorderRadiusL,
    overflow: 'auto',
    backgroundColor: theme.palette.semantic.colorBackground,
    boxSizing: 'border-box',
    resize: 'vertical',
}));

const PreviewIframe = styled('iframe')(({ theme }) => ({
    width: '100%',
    height: '100%',
    border: 'none',
    backgroundColor: theme.palette.semantic.colorBackground,
    flex: 1,
}));

const CustomModal = styled(Modal)(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& .MuiBackdrop-root': { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
}));

const ModalContainer = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '95vw',
    height: '90vh',
    maxWidth: '1400px',
    maxHeight: '900px',
    backgroundColor: theme.palette.semantic.colorBackgroundRaised,
    borderRadius: token.Border.BorderRadiusS,
    padding: token.Spacing.SpacingL,
    boxShadow: '0px 5px 5px -3px rgba(0, 0, 0, 0.20), 0px 8px 10px 1px rgba(0, 0, 0, 0.14), 0px 3px 14px 2px rgba(0, 0, 0, 0.12)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    outline: 'none',
    '&:focus-visible, &:focus': { outline: 'none' },
}));

const ModalContent = styled(Box)(() => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
}));

const CloseButton = styled(IconButton)(({ theme }) => ({
    position: 'absolute',
    top: token.Spacing.SpacingXs,
    right: token.Spacing.SpacingS,
    zIndex: 1,
    backgroundColor: theme.palette.semantic.colorBackgroundRaised,
    '&:hover': { backgroundColor: theme.palette.semantic.colorBackgroundHover },
}));

export const Code = React.memo(({
    inline, className, children, isStreaming, ...props
}: any) => {
    const theme = useTheme();
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
                console.warn('Error rendering math block:', e);
            }

            return (
                <pre style={{ color: theme.palette.semantic.colorForeground }}>
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
                        label={language || t('autopilot-chat-code-block-language')}
                    />
                    <div style={{
                        display: 'flex',
                        gap: token.Spacing.SpacingMicro,
                    }}>
                        {isPreviewable && (
                            <AutopilotChatActionButton
                                iconName={showPreview ? 'code' : 'visibility'}
                                tooltip={showPreview ? t('autopilot-chat-code-block-code') : t('autopilot-chat-code-block-preview')}
                                onClick={() => {
                                    setShowPreview(!showPreview);
                                }}
                            />
                        )}
                        <AutopilotChatActionButton
                            iconName="open_in_full"
                            tooltip={t('autopilot-chat-expand')}
                            onClick={() => {
                                setIsModalOpen(true);
                            }}
                        />
                        <AutopilotChatActionButton
                            iconName="content_copy"
                            tooltip={t('autopilot-chat-code-block-copy')}
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
                        aria-label={t('autopilot-chat-close')}
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

/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

// Import Katex CSS
import 'katex/dist/katex.min.css';

import { styled } from '@mui/material';
import { FontVariantToken } from '@uipath/apollo-core/lib';
import {
    AutopilotChatEvent,
    AutopilotChatMessage,
    AutopilotChatMode,
} from '@uipath/portal-shell-util';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { t } from '../../../../../utils/localization/loc';
import { useChatWidth } from '../../../providers/chat-width-provider.react';
import { useStreaming } from '../../../providers/streaming-provider.react';
import { AutopilotChatService } from '../../../services/chat-service';
import { Code } from './code.react';
import {
    Li,
    Ol,
    Ul,
} from './lists.react';
import {
    Cell,
    HeaderCell,
    Row,
    Table,
    TableHeader,
} from './table.react';
import {
    Blockquote,
    Break,
    Del,
    Emphazised,
    getTextForVariant,
    Hr,
    Pre,
    Strong,
} from './text.react';

const StyledMarkdown = React.memo(
    styled(ReactMarkdown)(({ theme }) => ({ '&, & .katex': { color: theme.palette.semantic.colorForeground } })),
);

const FAKE_STREAM_CHARS_COUNT = 10;
const FAKE_STREAM_INTERVAL = 50;

function AutopilotChatMarkdownRendererComponent({ message }: { message: AutopilotChatMessage }) {
    // Only store message ID and content separately to minimize re-renders
    const messageId = React.useRef(message.id);
    const [ content, setContent ] = React.useState(message.fakeStream ? '' : (message.content || ''));
    const chatService = AutopilotChatService.Instance;
    const { setStreaming } = useStreaming();
    const contentRef = React.useRef<HTMLDivElement>(null);
    const previousHeightRef = React.useRef(0);
    const { width } = useChatWidth();

    React.useEffect(() => {
        if (!chatService) {
            return;
        }

        const unsubscribeModeChange = chatService.on(AutopilotChatEvent.ModeChange, (mode) => {
            if (mode === AutopilotChatMode.FullScreen) {
                requestAnimationFrame(() => {
                    previousHeightRef.current = contentRef.current?.scrollHeight || 0;
                });
            }
        });

        return () => unsubscribeModeChange?.();
    }, [ chatService ]);

    React.useEffect(() => {
        requestAnimationFrame(() => {
            previousHeightRef.current = contentRef.current?.scrollHeight || 0;
        });
    }, [ width ]);

    // Update the message ID ref if a new message is passed
    React.useEffect(() => {
        let unsubscribeStopResponse: (() => void) | undefined;
        let fakeStreamInterval: NodeJS.Timeout | undefined;
        if (message.id !== messageId.current || !message.stream) {
            messageId.current = message.id;
            setContent(message.fakeStream ? '' : (message.content || ''));
        }

        if (message.fakeStream) {
            unsubscribeStopResponse = chatService.on(AutopilotChatEvent.StopResponse, () => {
                clearInterval(fakeStreamInterval);
                setStreaming(false);
                setContent(message.content || '');
            });

            const characters = message.content.split('');
            let charIndex = 0;

            setStreaming(true);

            fakeStreamInterval = setInterval(() => {
                if (charIndex < characters.length) {
                    const chunkSize = FAKE_STREAM_CHARS_COUNT;
                    const endIndex = Math.min(charIndex + chunkSize, characters.length);
                    const chunk = characters.slice(charIndex, endIndex).join('');

                    setContent(prevContent => `${prevContent}${chunk}`);

                    if (contentRef.current && contentRef.current.scrollHeight > previousHeightRef.current) {
                        chatService.scrollToBottom();

                        previousHeightRef.current = contentRef.current.scrollHeight;
                    }

                    charIndex = endIndex;
                } else {
                    clearInterval(fakeStreamInterval);
                    setStreaming(false);
                }
            }, FAKE_STREAM_INTERVAL);
        }

        return () => {
            unsubscribeStopResponse?.();
            fakeStreamInterval && clearInterval(fakeStreamInterval);
        };
    }, [ message, chatService, setStreaming ]);

    React.useEffect(() => {
        if (!chatService) {
            return;
        }

        const unsubscribe = chatService.on(AutopilotChatEvent.SendChunk, (msg: AutopilotChatMessage) => {
            if (msg.id === messageId.current) {
                requestAnimationFrame(() => {
                    setContent(prevContent => `${prevContent}${msg.content}`);

                    if (contentRef.current && contentRef.current.scrollHeight > previousHeightRef.current) {
                        chatService.scrollToBottom();
                        previousHeightRef.current = contentRef.current.scrollHeight;
                    }
                });
            }
        });

        return () => unsubscribe();
    }, [ chatService ]);

    const components = React.useMemo(() => ({
        ul: Ul,
        ol: Ol,
        li: Li,
        p: React.memo(getTextForVariant(FontVariantToken.fontSizeM)),
        h1: React.memo(getTextForVariant(FontVariantToken.fontSizeH3Bold, 1)),
        h2: React.memo(getTextForVariant(FontVariantToken.fontSizeH3Bold, 2)),
        h3: React.memo(getTextForVariant(FontVariantToken.fontSizeH3Bold, 3)),
        h4: React.memo(getTextForVariant(FontVariantToken.fontSizeLBold, 4)),
        h5: React.memo(getTextForVariant(FontVariantToken.fontSizeLBold, 5)),
        h6: React.memo(getTextForVariant(FontVariantToken.fontSizeLBold, 6)),
        br: Break,
        table: Table,
        thead: TableHeader,
        tr: Row,
        th: HeaderCell,
        td: Cell,
        img: ({ src }: { src?: string }) => src || '',
        code: Code,
        blockquote: Blockquote,
        em: Emphazised,
        del: Del,
        strong: Strong,
        hr: Hr,
        pre: Pre,
    }), []);

    return React.useMemo(() => (
        <div ref={contentRef}>
            <StyledMarkdown
                remarkPlugins={[ remarkGfm, [ remarkMath, { singleDollarTextMath: false } ] ]}
                rehypePlugins={[ [ rehypeKatex, {
                    output: 'mathml',
                    trust: false,
                    strict: true,
                    throwOnError: false,
                } ] ]}
                remarkRehypeOptions={{ footnoteLabel: t('autopilot-chat-footnote-label') }}
                components={components}
            >
                {content}
            </StyledMarkdown>
        </div>
    ), [ content, components ]);
}

export const AutopilotChatMarkdownRenderer = React.memo(AutopilotChatMarkdownRendererComponent);

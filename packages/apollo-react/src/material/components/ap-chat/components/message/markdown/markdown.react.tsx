/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

// Import Katex CSS
import 'katex/dist/katex.min.css';

import { styled } from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core/lib';
import {
    AutopilotChatEvent,
    AutopilotChatMessage,
} from '@uipath/portal-shell-util';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { t } from '../../../../../utils/localization/loc';
import { useChatService } from '../../../providers/chat-service.provider.react';
import { useStreaming } from '../../../providers/streaming-provider.react';
import { Citation } from './citation.react';
import { Code } from './code.react';
import {
    Li,
    Ol,
    Ul,
} from './lists.react';
import {
    citationPlugin,
    contentPartsToMarkdown,
} from './parsers/citation-parser';
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
    Link,
    Pre,
    Strong,
} from './text.react';

const StyledMarkdown = React.memo(
    styled(ReactMarkdown)(({ theme }) => ({
        '&, & .katex': { color: theme.palette.semantic.colorForeground },
        display: 'flex',
        flexDirection: 'column',
        gap: token.Spacing.SpacingL,
    })),
);

const FAKE_STREAM_CHARS_COUNT = 10;
const FAKE_STREAM_INTERVAL = 50;
const CHUNK_QUEUE_PROCESS_INTERVAL = 50;

function AutopilotChatMarkdownRendererComponent({ message }: { message: AutopilotChatMessage }) {
    // Only store message ID and content separately to minimize re-renders
    const messageId = React.useRef(message.id);

    // Generate initial content from contentParts if available, otherwise use message.content
    const getInitialContent = React.useCallback(() => {
        if (message.contentParts && message.contentParts.length > 0) {
            return contentPartsToMarkdown(messageId.current, message.contentParts);
        }
        return message.content || '';
    }, [ message.contentParts, message.content ]);

    const [ content, setContent ] = React.useState(message.fakeStream ? '' : getInitialContent());
    const chatService = useChatService();
    const { setStreaming } = useStreaming();
    const chunkQueue = React.useRef<string[]>([]);
    const lastChunkQueueProcessedTime = React.useRef<number>(0);

    // Update the message ID ref if a new message is passed
    React.useEffect(() => {
        let unsubscribeStopResponse: (() => void) | undefined;
        let fakeStreamInterval: NodeJS.Timeout | undefined;

        if (message.id !== messageId.current || !message.stream) {
            messageId.current = message.id;
            setContent(message.fakeStream ? '' : getInitialContent());
        }

        if (message.fakeStream) {
            unsubscribeStopResponse = chatService.on(AutopilotChatEvent.StopResponse, () => {
                clearInterval(fakeStreamInterval);
                setStreaming(false);
                setContent(getInitialContent());
                chunkQueue.current = [];
                lastChunkQueueProcessedTime.current = 0;
            });

            const characters = getInitialContent().split('');
            let charIndex = 0;

            setStreaming(true);

            fakeStreamInterval = setInterval(() => {
                if (charIndex < characters.length) {
                    const chunkSize = FAKE_STREAM_CHARS_COUNT;
                    const endIndex = Math.min(charIndex + chunkSize, characters.length);
                    const chunk = characters.slice(charIndex, endIndex).join('');

                    setContent(prevContent => `${prevContent}${chunk}`);

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
    }, [ message, chatService, setStreaming, getInitialContent ]);

    React.useEffect(() => {
        if (!chatService) {
            return;
        }

        const unsubscribe = chatService.on(AutopilotChatEvent.SendChunk, (msg: AutopilotChatMessage) => {
            if (msg.id === messageId.current) {
                chunkQueue.current.push(msg.content);

                if (Date.now() - lastChunkQueueProcessedTime.current > CHUNK_QUEUE_PROCESS_INTERVAL) {
                    lastChunkQueueProcessedTime.current = Date.now();

                    if (msg.contentParts) {
                        setContent(contentPartsToMarkdown(messageId.current, msg.contentParts));
                        return;
                    }

                    setContent(prevContent => `${prevContent}${chunkQueue.current.join('')}`);
                    chunkQueue.current = [];
                } else {
                    if (msg.done) {
                        lastChunkQueueProcessedTime.current = 0;

                        if (msg.contentParts) {
                            setContent(contentPartsToMarkdown(messageId.current, msg.contentParts));
                            return;
                        }

                        setContent(prevContent => `${prevContent}${chunkQueue.current.join('')}`);
                        chunkQueue.current = [];
                    }
                }
            }
        });

        return () => {
            unsubscribe();
        };
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
        a: Link,
        citation: Citation,
    }), []);

    return React.useMemo(() => (
        <StyledMarkdown
            remarkPlugins={[
                citationPlugin,
                remarkGfm,
                [ remarkMath, { singleDollarTextMath: false } ],
            ]}
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
    ), [ content, components ]);
}

export const AutopilotChatMarkdownRenderer = React.memo(AutopilotChatMarkdownRendererComponent);

/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

// Import Katex CSS
import 'katex/dist/katex.min.css';

import { styled } from '@mui/material';
import { FontVariantToken } from '@uipath/apollo-core/lib';
import { AutopilotChatMessage } from '@uipath/portal-shell-util';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

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

const StyledMarkdown = styled(ReactMarkdown)(({ theme }) => ({ '&, & .katex': { color: theme.palette.semantic.colorForeground } }));

function AutopilotChatMarkdownRendererComponent({ message }: { message: AutopilotChatMessage }) {
    return (
        <StyledMarkdown
            remarkPlugins={[
                remarkGfm,
                [ remarkMath, { singleDollarTextMath: false } ],
            ]}
            rehypePlugins={[ [ rehypeKatex, {
                output: 'mathml',
                trust: false,
                strict: true,
                throwOnError: false,
            } ] ]}
            remarkRehypeOptions={{ footnoteLabel: 'Sources' }}
            components={{
                ul: Ul,
                ol: Ol,
                li: Li,
                p: getTextForVariant(FontVariantToken.fontSizeM),
                h1: getTextForVariant(FontVariantToken.fontSizeH1),
                h2: getTextForVariant(FontVariantToken.fontSizeH2),
                h3: getTextForVariant(FontVariantToken.fontSizeH3),
                h4: getTextForVariant(FontVariantToken.fontSizeH4),
                h5: getTextForVariant(FontVariantToken.fontSizeL),
                h6: getTextForVariant(FontVariantToken.fontSizeM),
                br: Break,
                table: Table,
                thead: TableHeader,
                tr: Row,
                th: HeaderCell,
                td: Cell,
                img: ({ src }) => src,
                code: Code,
                blockquote: Blockquote,
                em: Emphazised,
                del: Del,
                strong: Strong,
                hr: Hr,
                pre: Pre,
            }}
        >
            {message.content}
        </StyledMarkdown>
    );
}

export const AutopilotChatMarkdownRenderer = React.memo(AutopilotChatMarkdownRendererComponent);

/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import token from '@uipath/apollo-core/lib';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { StatusTypes } from '../../../../models/statusTypes';
import { useError } from '../../providers/error-provider.react';
import {
    Li,
    Ol,
    Ul,
} from '../message/markdown/lists.react';
import { Link } from '../message/markdown/text.react';

function AutopilotChatInputErrorComponent() {
    const {
        error, clearError,
    } = useError();

    React.useEffect(() => {
        const listener = () => clearError();

        document.addEventListener('cancelAlert', listener);

        return () => {
            document.removeEventListener('cancelAlert', listener);
        };
    }, [ clearError ]);

    if (!error) {
        return null;
    }

    return (
        <ap-alert-bar
            style={{
                marginBottom: token.Spacing.SpacingBase,
                width: '100%',
                maxHeight: '300px',
                overflowY: 'auto',
            }}
            status={error.level === 'warn' ? StatusTypes.WARNING : StatusTypes.ERROR}>
            <ReactMarkdown
                remarkPlugins={[ remarkGfm ]}
                components={{
                    p: ({ children }) => <div style={{
                        margin: 0,
                        paddingBottom: token.Spacing.SpacingXs,
                    }}>{children}</div>,
                    a: Link,
                    ul: Ul,
                    ol: Ol,
                    li: Li,
                }}
            >
                {error.message}
            </ReactMarkdown>
        </ap-alert-bar>
    );
}

export const AutopilotChatInputError = React.memo(AutopilotChatInputErrorComponent);

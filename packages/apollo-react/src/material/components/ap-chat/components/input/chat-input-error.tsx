import { styled } from '@mui/material';
import token from '@uipath/apollo-core';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { StatusTypes } from '../../../../../types/statusTypes';
import { ApAlertBar } from '../../../ap-alert-bar';
import { useError } from '../../providers/error-provider';
import { Li, Ol, Ul } from '../message/markdown/lists';
import { Link } from '../message/markdown/text';

// Space between paragraphs, but not after the last one, so the text stays
// vertically centered in the alert bar.
const Paragraph = styled('div')({
  margin: 0,
  paddingBottom: token.Spacing.SpacingXs,

  '&:last-child': {
    paddingBottom: 0,
  },
});

function AutopilotChatInputErrorComponent() {
  const { error, clearError } = useError();

  React.useEffect(() => {
    const listener = () => clearError();

    document.addEventListener('cancelAlert', listener);

    return () => {
      document.removeEventListener('cancelAlert', listener);
    };
  }, [clearError]);

  if (!error) {
    return null;
  }

  return (
    <ApAlertBar
      sx={{
        marginBottom: token.Spacing.SpacingBase,
        width: '100%',
        maxHeight: '300px',
        overflowY: 'auto',
      }}
      status={error.level === 'warn' ? StatusTypes.WARNING : StatusTypes.ERROR}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <Paragraph>{children}</Paragraph>,
          a: Link,
          ul: Ul,
          ol: Ol,
          li: Li,
        }}
      >
        {error.message}
      </ReactMarkdown>
    </ApAlertBar>
  );
}

export const AutopilotChatInputError = React.memo(AutopilotChatInputErrorComponent);

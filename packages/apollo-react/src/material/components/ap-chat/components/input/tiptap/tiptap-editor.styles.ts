import { styled } from '@mui/material/styles';
import token from '@uipath/apollo-core';

const EDITOR_PADDING = token.Spacing.SpacingXs;

export const EditorContainer = styled('div')<{
  minRows: number;
  maxRows: number;
  lineHeight: string;
}>(({ minRows, maxRows, lineHeight }) => ({
  width: '100%',
  minHeight: `calc(${minRows} * ${lineHeight} + ${EDITOR_PADDING})`,
  maxHeight: `calc(${maxRows} * ${lineHeight} + ${EDITOR_PADDING})`,
  overflowY: 'auto',
  cursor: 'text',

  '& .tiptap': {
    outline: 'none',
    minHeight: `calc(${minRows} * ${lineHeight} + ${EDITOR_PADDING})`,
    paddingBottom: EDITOR_PADDING,

    '& p': {
      margin: 0,
      minHeight: lineHeight,
      lineHeight: lineHeight,
    },

    '& p.is-editor-empty:first-of-type::before': {
      content: 'attr(data-placeholder)',
      float: 'left',
      color: 'var(--color-foreground-de-emp)',
      pointerEvents: 'none',
      height: 0,
    },
  },
}));

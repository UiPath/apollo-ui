import { styled } from '@mui/material/styles';
import token from '@uipath/apollo-core';

const EDITOR_PADDING = token.Spacing.SpacingXs;
const LINE_GAP = token.Spacing.SpacingMicro;

export const EditorContainer = styled('div')<{
  minRows: number;
  maxRows: number;
  lineHeight: string;
}>(({ minRows, maxRows, lineHeight }) => {
  const rowHeight = `calc(${lineHeight} + ${LINE_GAP})`;

  return {
    width: '100%',
    minHeight: `calc(${minRows} * ${rowHeight} + ${EDITOR_PADDING})`,
    maxHeight: `calc(${maxRows} * ${rowHeight} + ${EDITOR_PADDING})`,
    overflowY: 'auto',
    cursor: 'text',

    '& .tiptap': {
      outline: 'none',
      minHeight: `calc(${minRows} * ${rowHeight} + ${EDITOR_PADDING})`,
      paddingBottom: EDITOR_PADDING,

      '& p': {
        margin: 0,
        minHeight: rowHeight,
        lineHeight: rowHeight,
      },

      '& p.is-editor-empty:first-of-type::before': {
        content: 'attr(data-placeholder)',
        float: 'left',
        color: 'var(--color-foreground-de-emp)',
        pointerEvents: 'none',
        height: 0,
      },
    },
  };
});

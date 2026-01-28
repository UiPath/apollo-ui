import { styled } from '@mui/material/styles';
import token from '@uipath/apollo-core';

const EDITOR_PADDING = token.Spacing.SpacingXs;

export const EditorContainer = styled('div')<{
  minRows: number;
  maxRows: number;
  lineHeight: string;
}>(({ theme, minRows, maxRows, lineHeight }) => ({
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
    },

    '& p.is-editor-empty:first-of-type::before': {
      content: 'attr(data-placeholder)',
      float: 'left',
      color: theme.palette.semantic.colorForegroundDeEmp,
      pointerEvents: 'none',
      height: 0,
    },

    '& .resource-mention': {
      display: 'inline-flex',
      alignItems: 'center',
      gap: token.Spacing.SpacingMicro,
      padding: `0 ${token.Spacing.SpacingXs} 0 ${token.Spacing.SpacingMicro}`,
      backgroundColor: theme.palette.semantic.colorPrimaryLighter,
      color: theme.palette.semantic.colorForeground,
      borderRadius: `calc(${token.Border.BorderRadiusL} * 2)`,
      verticalAlign: 'middle',
      cursor: 'default',
      userSelect: 'none',
      maxWidth: '200px',
    },

    '& .resource-chip-icon': {
      fontFamily: '"Material Icons Outlined"',
      fontSize: token.Icon.IconXs,
      flexShrink: 0,
    },

    '& .resource-display-name': {
      fontWeight: token.FontFamily.FontWeightSemibold,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  },
}));

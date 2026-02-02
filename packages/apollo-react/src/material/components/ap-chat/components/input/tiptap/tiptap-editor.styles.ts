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
      gap: token.Spacing.SpacingXs,
      padding: `${token.Spacing.SpacingMicro} ${token.Spacing.SpacingS}`,
      backgroundColor: theme.palette.semantic.colorInfoBackground,
      color: theme.palette.semantic.colorForegroundLink,
      borderRadius: `calc(${token.Border.BorderRadiusL} * 2)`,
      fontSize: 'inherit',
      lineHeight: 'inherit',
      verticalAlign: 'baseline',
      cursor: 'default',
      userSelect: 'none',
    },

    '& .resource-chip-icon': {
      fontFamily: '"Material Symbols Outlined"',
      fontSize: '16px',
      fontWeight: 'normal',
      fontStyle: 'normal',
      lineHeight: 1,
      letterSpacing: 'normal',
      textTransform: 'none',
      whiteSpace: 'nowrap',
      wordWrap: 'normal',
      direction: 'ltr',
      WebkitFontSmoothing: 'antialiased',
      flexShrink: 0,
    },
  },
}));

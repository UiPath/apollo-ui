import type { ComponentsOverrides } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiAutocomplete = (palette: Palette): ComponentsOverrides['MuiAutocomplete'] => ({
  root: {
    color: palette.semantic.colorForeground,
    '&.Mui-disabled': { color: palette.semantic.colorForegroundDisable },
    '& .MuiAutocomplete-inputRoot[class*="MuiOutlinedInput-root"]': {
      paddingTop: '2.38px',
      paddingBottom: '2px',
    },
  },
  paper: {
    boxShadow: token.Shadow.ShadowDp8,
    background: palette.semantic.colorBackgroundRaised,
  },
  option: {
    background: palette.semantic.colorBackgroundRaised,
    fontSize: token.FontFamily.FontMSize,
    lineHeight: token.FontFamily.FontMLineHeight,
    '&.MuiAutocomplete-option.Mui-focusVisible': {
      outline: `${token.Stroke.StrokeM} solid ${palette.semantic.colorPrimaryFocused}`,
      outlineOffset: '-2px',
    },
    '&:hover': {
      backgroundColor: palette.semantic.colorBackgroundHover,
      color: palette.semantic.colorForegroundDeEmp,
    },
    '&:focus': {
      backgroundColor: palette.semantic.colorBackgroundHover,
      color: palette.semantic.colorForegroundDeEmp,
      outline: `${token.Stroke.StrokeM} solid ${palette.semantic.colorPrimaryFocused}`,
      outlineOffset: '-2px',
    },
    '&.MuiAutocomplete-option.MuiAutocomplete-option[aria-selected="true"]': {
      boxShadow: `inset 4px 0px 0px ${palette.semantic.colorSelectionIndicator}`,
      backgroundColor: palette.semantic.colorBackgroundSelected,
      color: palette.semantic.colorForegroundDeEmp,
    },
    '&.MuiAutocomplete-option.MuiAutocomplete-option[aria-selected="true"]:hover': {
      boxShadow: `inset 4px 0px 0px ${palette.semantic.colorSelectionIndicator}`,
      backgroundColor: palette.semantic.colorBackgroundSelected,
      color: palette.semantic.colorForegroundDeEmp,
    },
    '&.MuiAutocomplete-option.MuiAutocomplete-option[aria-selected="true"].Mui-focused': {
      outline: `${token.Stroke.StrokeM} solid ${palette.semantic.colorPrimaryFocused}`,
      outlineOffset: '-2px',
    },
  },
  groupUl: {
    background: palette.semantic.colorBackgroundRaised,
    boxShadow: token.Shadow.ShadowDp8,
  },
});

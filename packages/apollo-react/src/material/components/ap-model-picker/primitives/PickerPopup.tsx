import Box from '@mui/material/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import { Colors } from '@uipath/apollo-core';
import type React from 'react';

export interface PickerPopupProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  /** Optional fixed width (defaults to anchor width). */
  width?: number | string;
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  /** z-index for the popper. Defaults to 1400 so the popup sits above the
   *  page and Apollo's app shell, but below MUI Dialogs (which use 1500). */
  zIndex?: number;
  /** Renders above the listbox (e.g. search input). */
  header?: React.ReactNode;
  /** Renders below the listbox (e.g. effort picker, secondary controls). */
  footer?: React.ReactNode;
  /** Optional className forwarded to the inner Paper for host overrides. */
  className?: string;
  /** Test id forwarded to the inner Paper. */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'data-testid'?: string;
  children: React.ReactNode;
}

/**
 * Popper + Paper wrapper used by ModelPicker. Provides
 * the consistent dropdown chrome: shadow, border, click-outside-to-close.
 * Header/footer are slots so consumers can compose pickers without rewriting
 * the popup structure.
 *
 * All colors read through CSS custom properties (with `Colors.*`
 * fallbacks) so the picker dark-modes correctly when consumed as a
 * web component without an Apollo MUI ThemeProvider.
 */
export const PickerPopup: React.FC<PickerPopupProps> = ({
  open,
  anchorEl,
  onClose,
  width,
  placement = 'bottom-start',
  zIndex = 1400,
  header,
  footer,
  className,
  'data-testid': dataTestId,
  children,
}) => (
  <Popper
    open={open}
    anchorEl={anchorEl}
    placement={placement}
    style={{
      zIndex,
      width: width ?? anchorEl?.clientWidth,
    }}
    modifiers={[{ name: 'offset', options: { offset: [0, 6] } }]}
  >
    <ClickAwayListener onClickAway={onClose}>
      <Paper
        elevation={0}
        className={className}
        data-testid={dataTestId}
        sx={{
          // 10px radius matches the design handoff's dropdown panel.
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: `var(--color-border-de-emp, ${Colors.ColorGray300})`,
          backgroundColor: `var(--color-background-raised, ${Colors.ColorWhite})`,
          // Diffuse, slightly heavier drop matches the handoff's
          // `0 12px 30px rgba(16,24,40,.10)`.
          boxShadow: '0 12px 30px rgba(16, 24, 40, 0.10), 0 2px 6px rgba(16, 24, 40, 0.04)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {header}
        <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
        {footer && (
          <Box
            sx={{
              borderTop: '1px solid',
              borderColor: `var(--color-border-de-emp, ${Colors.ColorGray300})`,
              backgroundColor: `var(--color-background-raised, ${Colors.ColorWhite})`,
            }}
          >
            {footer}
          </Box>
        )}
      </Paper>
    </ClickAwayListener>
  </Popper>
);

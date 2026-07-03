import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import { Colors } from '@uipath/apollo-core';
import type React from 'react';
import { useSafeLingui } from '../../../../i18n';

export interface PickerSearchInputProps {
  value: string;
  onChange: (next: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  /** Accessible name for the input. Defaults to the placeholder. */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'aria-label'?: string;
  /**
   * Pointer to the currently active option's element id. Forwarded to
   * the input as `aria-activedescendant` so screen readers announce the
   * highlighted row even though DOM focus stays on the input.
   */
  activeDescendantId?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  listboxId?: string;
  dense?: boolean;
  /**
   * Rendered to the left of the search icon, on the same row. Use for an
   * inline folder picker / scope chip so it shares chrome with the search
   * field instead of sitting in a separate banner above it.
   */
  leading?: React.ReactNode;
  /**
   * Rendered to the right of the input field, on the same row. Use for
   * tiny end-aligned controls like a view-toggle icon button or a clear
   * button. Borders match the divider used by `leading`.
   */
  trailing?: React.ReactNode;
  /** Optional className forwarded to the outer wrapper for host overrides. */
  className?: string;
  /** Test id forwarded to the input element. */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'data-testid'?: string;
}

export const PickerSearchInput: React.FC<PickerSearchInputProps> = ({
  value,
  onChange,
  onKeyDown,
  placeholder,
  'aria-label': ariaLabel,
  activeDescendantId,
  inputRef,
  listboxId,
  dense,
  leading,
  trailing,
  className,
  'data-testid': dataTestId,
}) => {
  const { _ } = useSafeLingui();
  const resolvedPlaceholder =
    placeholder ?? _({ id: 'modelPicker.search.placeholder', message: 'Search models' });
  return (
    // Toolbar row per the design: three distinct controls sit side by
    // side — [folder pill] [bordered search box] [group-by pills] —
    // each with its own chrome, on a 12px-padded band above the list.
    <Box
      className={className}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: dense ? 1.25 : 1.5,
        borderBottom: '1px solid',
        borderColor: `var(--color-border-de-emp, ${Colors.ColorGray300})`,
        backgroundColor: `var(--color-background-raised, ${Colors.ColorWhite})`,
      }}
    >
      {leading && (
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{leading}</Box>
      )}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          border: '1px solid',
          borderColor: `var(--color-border-de-emp, ${Colors.ColorGray300})`,
          borderRadius: '8px',
          px: 1.25,
          py: dense ? 0.5 : 0.75,
          backgroundColor: `var(--color-background-raised, ${Colors.ColorWhite})`,
          transition: 'border-color 120ms',
          '&:focus-within': {
            borderColor: `var(--color-primary, ${Colors.ColorBlue500})`,
          },
        }}
      >
        <SearchIcon
          sx={{
            fontSize: dense ? 16 : 18,
            color: `var(--color-foreground-disable, ${Colors.ColorGray500})`,
          }}
          aria-hidden
        />
        <InputBase
          inputRef={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={resolvedPlaceholder}
          sx={{
            flex: 1,
            fontSize: dense ? 13 : 13.5,
            color: `var(--color-foreground, ${Colors.ColorGray850})`,
            '& .MuiInputBase-input::placeholder': {
              color: `var(--color-foreground-disable, ${Colors.ColorGray500})`,
              opacity: 1,
            },
          }}
          inputProps={{
            role: 'combobox',
            'aria-label': ariaLabel ?? resolvedPlaceholder,
            'aria-controls': listboxId,
            'aria-autocomplete': 'list',
            'aria-activedescendant': activeDescendantId,
            'aria-expanded': true,
            'data-testid': dataTestId,
          }}
        />
      </Box>
      {trailing && (
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{trailing}</Box>
      )}
    </Box>
  );
};

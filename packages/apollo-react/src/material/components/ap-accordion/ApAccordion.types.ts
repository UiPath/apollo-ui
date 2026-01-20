import React from 'react';
import { AccordionProps } from '@mui/material/Accordion';
import { SxProps, Theme } from '@mui/material/styles';
import { AccordionSummaryProps } from '@mui/material/AccordionSummary';
import { AccordionDetailsProps } from '@mui/material/AccordionDetails';

export interface ApAccordionProps extends AccordionProps {
  /** Sets the start icon of the accordion */
  startIcon?: React.ReactNode;
  /** Sets the label of the accordion */
  label: string;
  /** Sets the default expanded state of the accordion */
  defaultExpanded?: boolean;
  /** Sets the font size of the label */
  labelFontSize?: string;
  /** Sets the font weight of the label */
  labelFontWeight?: string | number;
  /** Sets the color of the label */
  labelColor?: string;
  /** Sets the sx props for the summary */
  summarySx?: SxProps<Theme>;
  /** Sets the props for the summary */
  summaryProps?: Partial<AccordionSummaryProps>;
  /** Sets the sx props for the details */
  detailsSx?: SxProps<Theme>;
  /** Sets the props for the details */
  detailsProps?: Partial<AccordionDetailsProps>;
  /** Sets the position of the expand icon (start or end) */
  expandIconPosition?: 'start' | 'end';
  /** If `true`, disables the divider line above the accordion */
  disableDivider?: boolean;
  /** Sets the left position of the divider area */
  dividerLeftPosition?: string;
  /** Sets the right position of the divider area */
  dividerRightPosition?: string;
}

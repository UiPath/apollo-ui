import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import { styled } from '@mui/material/styles';
import { FontVariantToken, PadL } from '@uipath/apollo-core';
import token from '@uipath/apollo-core';
import { ChevronDown } from '@uipath/apollo-react/icons';
import { ApTypography } from '../ap-typography';
import type { ApAccordionProps } from './ApAccordion.types';

interface StyledAccordionSummaryProps {
  disableDivider?: boolean;
  dividerLeftPosition?: string;
  dividerRightPosition?: string;
  expandIconPosition?: 'start' | 'end';
}

const StyledAccordion = styled(Accordion, {
  shouldForwardProp: (prop) => prop !== 'accordionPadding',
})(() => ({
  '&.MuiPaper-root': { boxShadow: 'unset' },
  position: 'relative',

  // remove expanded margin
  '&.Mui-expanded': {
    margin: 0,
  },

  // Hide default divider
  '&::before': {
    display: 'none',
  },

  // remove top divider for first accordion
  '&:first-of-type .MuiAccordionSummary-root::before': {
    display: 'none',
  },
}));

const StyledAccordionSummary = styled(AccordionSummary, {
  shouldForwardProp: (prop) =>
    prop !== 'disableDivider' &&
    prop !== 'accordionPadding' &&
    prop !== 'dividerLeftPosition' &&
    prop !== 'dividerRightPosition' &&
    prop !== 'expandIconPosition',
})<StyledAccordionSummaryProps>(
  ({ disableDivider, dividerLeftPosition, dividerRightPosition, expandIconPosition }) => ({
    // root styles
    '&:hover, &:focus': {
      backgroundColor: 'transparent',
    },

    // Stop focus outline from cutting off
    '&:focus-visible': {
      zIndex: 1,
    },

    flexDirection: expandIconPosition !== 'end' ? 'row-reverse' : 'row',

    padding: `${token.Padding.PadXl} ${token.Padding.PadXxxl}`,
    minHeight: token.Spacing.SpacingXxl,

    position: 'relative',
    // Divider
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: dividerLeftPosition || token.Padding.PadXxxl,
      right: dividerRightPosition || token.Padding.PadXxxl,
      height: 1,
      backgroundColor: 'var(--color-border-de-emp)',
      display: disableDivider ? 'none' : 'block',
      pointerEvents: 'none',
    },

    '&.Mui-expanded': {
      minHeight: token.Spacing.SpacingXxl,
    },

    // content slot
    '& .MuiAccordionSummary-content': {
      margin: '0px',

      '&.Mui-expanded': {
        margin: '0px',
      },
    },
  })
);

//NOTE: expanded state the top element has margin
export function ApAccordion(props: Readonly<ApAccordionProps>) {
  const {
    startIcon,
    label,
    defaultExpanded,
    children,
    expandIconPosition = 'end',
    labelFontSize,
    labelFontWeight,
    labelColor,
    disableDivider,
    summarySx,
    summaryProps,
    dividerLeftPosition,
    dividerRightPosition,
    detailsSx,
    detailsProps,

    ...accordionProps
  } = props;

  return (
    <StyledAccordion defaultExpanded={defaultExpanded} {...accordionProps}>
      <StyledAccordionSummary
        sx={summarySx}
        dividerLeftPosition={dividerLeftPosition}
        dividerRightPosition={dividerRightPosition}
        expandIcon={<ChevronDown size="20px" style={{ marginTop: '-2px' }} aria-hidden="true" />}
        expandIconPosition={expandIconPosition}
        disableDivider={disableDivider}
        {...summaryProps}
      >
        <ApTypography
          variant={FontVariantToken.fontSizeM}
          color={labelColor || 'var(--color-foreground-de-emp)'}
          style={{
            ...(labelFontSize && { fontSize: labelFontSize }),
            ...(labelFontWeight && { fontWeight: labelFontWeight }),
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {startIcon ? (
            <span style={{ display: 'flex', marginRight: PadL }}>{startIcon}</span>
          ) : null}
          {label}
        </ApTypography>
      </StyledAccordionSummary>
      <AccordionDetails sx={{ padding: 'unset', ...detailsSx }} {...detailsProps}>
        {children}
      </AccordionDetails>
    </StyledAccordion>
  );
}

ApAccordion.displayName = 'ApAccordion';

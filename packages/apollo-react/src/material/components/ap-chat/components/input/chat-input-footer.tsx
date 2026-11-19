import { Box } from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core';
import { useComposerFooter } from '@uipath/apollo-react/chat/headless/hooks/use-composer-footer';
import { ApLink } from '@uipath/apollo-react/material/components/ap-link';
import { ApTypography } from '@uipath/apollo-react/material/components/ap-typography';
import React from 'react';

const FOOTER_COLOR = 'var(--color-foreground-de-emp)';

function FooterText({ children }: { children: React.ReactNode }) {
  return (
    <ApTypography color={FOOTER_COLOR} variant={FontVariantToken.fontSizeXs}>
      {children}
    </ApTypography>
  );
}

function AutopilotChatInputFooterComponent() {
  const { disclaimer, links } = useComposerFooter();

  if (links.length === 0) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <FooterText>{disclaimer}</FooterText>
      </Box>
    );
  }

  // The links lead and the disclaimer ends the row, wrapping under them in a narrow panel.
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        columnGap: token.Spacing.SpacingS,
      }}
    >
      <Box
        component="ul"
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          columnGap: token.Spacing.SpacingS,
          margin: 0,
          padding: 0,
          listStyle: 'none',
        }}
      >
        {links.map(({ label, href }, index) => (
          // A host may repeat a label or a URL, so the position is the key.
          <li key={index}>
            {href ? (
              <ApLink
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                variant={FontVariantToken.fontSizeXs}
              >
                {label}
              </ApLink>
            ) : (
              <FooterText>{label}</FooterText>
            )}
          </li>
        ))}
      </Box>
      {disclaimer && (
        <Box sx={{ textAlign: 'end' }}>
          <FooterText>{disclaimer}</FooterText>
        </Box>
      )}
    </Box>
  );
}

export const AutopilotChatInputFooter = React.memo(AutopilotChatInputFooterComponent);

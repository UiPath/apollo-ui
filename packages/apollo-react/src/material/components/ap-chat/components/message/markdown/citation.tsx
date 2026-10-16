import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Box } from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core';
import { useOpenCitation } from '@uipath/apollo-react/chat/headless/hooks/use-citations';
import { highlightCitedRange } from '@uipath/apollo-react/chat/headless/markdown/citation-highlight';
import {
  citationFromMarker,
  getCitationUrl,
} from '@uipath/apollo-react/chat/headless/markdown/citations';
import { useChatState } from '@uipath/apollo-react/chat/headless/providers/chat-state-provider';
import { ApIcon } from '@uipath/apollo-react/material/components/ap-icon';
import { ApTypography } from '@uipath/apollo-react/material/components/ap-typography';
import React from 'react';
import { AutopilotChatTooltip } from '../../common/tooltip';

interface CitationProps {
  id: number;
  title: string;
  url?: string;
  page_number?: number;
  download_url?: string;
  messageId: string;
}

export const Citation = React.memo(
  ({ id, title, url, page_number, download_url, messageId }: CitationProps) => {
    const { _ } = useLingui();
    const pageText = page_number
      ? ` (${_(msg({ id: 'autopilot-chat.message.page-number', message: `Page ${page_number}` }))})`
      : '';
    const { spacing } = useChatState();
    const openCitation = useOpenCitation();
    const ref = React.useRef<HTMLDivElement>(null);
    const [open, setOpen] = React.useState(false);
    const clearHighlightRef = React.useRef<(() => void) | undefined>(undefined);
    // What a click will open, so the cursor only promises what happens.
    const finalUrl = getCitationUrl(
      citationFromMarker({ id, title, url, download_url, page_number, messageId })
    );

    const handleOpen = React.useCallback(() => {
      setOpen(true);

      if (id && ref.current) {
        const container = ref.current.closest(`[id="${messageId}"]`)!;
        clearHighlightRef.current = highlightCitedRange(
          id,
          ref.current,
          container,
          'var(--color-background-highlight)'
        );
      }
    }, [id, messageId]);

    const handleClose = React.useCallback(() => {
      setOpen(false);
      clearHighlightRef.current?.();
      clearHighlightRef.current = undefined;
    }, []);

    const handleClick = React.useCallback(
      () =>
        openCitation(citationFromMarker({ id, title, url, download_url, page_number, messageId })),
      [openCitation, id, title, url, download_url, page_number, messageId]
    );

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick();
        }
      },
      [handleClick]
    );

    return (
      <AutopilotChatTooltip
        open={open}
        placement="bottom-end"
        onOpen={handleOpen}
        onClose={handleClose}
        title={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: token.Spacing.SpacingS,
              cursor: finalUrl ? 'pointer' : 'default',
              padding: `${token.Spacing.SpacingXs} ${token.Spacing.SpacingS}`,
            }}
            onClick={handleClick}
          >
            <ApIcon
              variant={url ? 'custom' : 'outlined'}
              name={url ? 'website' : 'file_open'}
              size={token.Icon.IconXs}
              color={'var(--color-primary)'}
            />
            <ApTypography
              color="inherit"
              style={{ fontWeight: 500 }}
              variant={FontVariantToken.fontSizeMBold}
            >
              {title}
              {pageText}
            </ApTypography>
          </Box>
        }
        slotProps={{
          popper: {
            modifiers: [
              {
                name: 'preventOverflow',
                enabled: true,
                options: {
                  boundary: 'clippingParents',
                  rootBoundary: 'viewport',
                  padding: token.Spacing.SpacingXs,
                  altAxis: true,
                },
              },
              {
                name: 'flip',
                enabled: true,
                options: {
                  fallbackPlacements: ['bottom', 'left', 'right'],
                  padding: token.Spacing.SpacingS,
                },
              },
            ],
          },
          tooltip: {
            sx: {
              backgroundColor: 'var(--color-background-raised)',
              color: 'var(--color-foreground)',
              boxShadow: token.Shadow.ShadowDp6,
            },
          },
        }}
      >
        <Box
          component="sup"
          ref={ref}
          sx={{
            background: 'var(--color-background-disabled)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: `0 ${token.Spacing.SpacingMicro}`,
            marginLeft: token.Spacing.SpacingMicro,
            borderRadius: token.Border.BorderRadiusM,
            marginTop: `-${token.Spacing.SpacingMicro}`,
            outline: 'none',
            '&:focus-visible': { outline: `1px solid var(--color-focus-indicator)` },
          }}
          data-citation-sup="true"
          tabIndex={0}
          role="button"
          aria-label={_(
            msg({
              id: 'autopilot-chat.message.citation-aria-label',
              message: `Citation ${id}: ${title}${pageText}`,
            })
          )}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
        >
          <ApTypography color={'var(--color-foreground)'} variant={spacing.markdownTokens.citation}>
            {id}
          </ApTypography>
        </Box>
      </AutopilotChatTooltip>
    );
  }
);

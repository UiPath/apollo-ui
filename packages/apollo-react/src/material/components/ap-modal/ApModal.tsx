import CloseIcon from '@mui/icons-material/Close';
import { Box, Modal } from '@mui/material';
import token from '@uipath/apollo-core';
import React, { useCallback } from 'react';

import { ApButton } from '../ap-button';
import { ApIconButton } from '../ap-icon-button';
import { ApTypography } from '../ap-typography';
import type { ApModalProps } from './ApModal.types';

const getSizeWidth = (size: ApModalProps['size']): string => {
  switch (size) {
    case 'small':
      return '480px';
    case 'medium':
      return '600px';
    case 'large':
      return '800px';
    default:
      return '480px';
  }
};

export const ApModal = React.forwardRef<HTMLDivElement, ApModalProps>((props, ref) => {
  const {
    header,
    message,
    size = 'small',
    open,
    preventClose,
    hideCloseButton,
    primaryAction,
    secondaryAction,
    closeButtonId,
    onClose,
    children,
    ...rest
  } = props;

  const handleClose = useCallback(
    (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
      if (preventClose) {
        return;
      }
      onClose?.(event, reason);
    },
    [preventClose, onClose]
  );

  const handleCloseButtonClick = useCallback(() => {
    if (preventClose) {
      return;
    }
    onClose?.({}, 'closeButtonClick');
  }, [preventClose, onClose]);

  const hasActions = primaryAction || secondaryAction;

  return (
    <Modal ref={ref} disablePortal open={open} onClose={handleClose} {...rest}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: getSizeWidth(size),
          backgroundColor: 'var(--color-background)',
          borderRadius: token.Border.BorderRadiusS,
          padding: token.Spacing.SpacingL,
          boxShadow: token.Shadow.ShadowDp8,
          '&:focus-visible, &:focus': { outline: 'none' },
        }}
      >
        {/* Header */}
        {header && (
          <Box
            sx={{
              paddingTop: token.Padding.PadXl,
              paddingBottom: token.Padding.PadL,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ApTypography
              variant={token.FontVariantToken.fontSizeH4Bold}
              color="var(--color-foreground)"
            >
              {header}
            </ApTypography>
          </Box>
        )}

        {/* Close Button */}
        {!hideCloseButton && !preventClose && (
          <Box
            sx={{
              position: 'absolute',
              right: '10px',
              top: '10px',
            }}
          >
            <ApIconButton
              size="small"
              id={closeButtonId}
              color="secondary"
              onClick={handleCloseButtonClick}
            >
              <CloseIcon
                sx={{
                  width: token.Icon.IconXs,
                  height: token.Icon.IconXs,
                }}
              />
            </ApIconButton>
          </Box>
        )}

        {/* Content */}
        {message ? (
          <ApTypography variant={token.FontVariantToken.fontSizeM} color="var(--color-foreground)">
            {message}
          </ApTypography>
        ) : (
          children
        )}

        {/* Actions */}
        {hasActions && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              paddingTop: token.Spacing.SpacingM,
            }}
          >
            {secondaryAction && (
              <ApButton
                variant="secondary"
                id={secondaryAction.id}
                label={secondaryAction.label}
                loading={secondaryAction.loading}
                onClick={secondaryAction.onClick}
              />
            )}
            {primaryAction && (
              <Box sx={{ paddingLeft: token.Padding.PadL }}>
                <ApButton
                  variant="primary"
                  id={primaryAction.id}
                  label={primaryAction.label}
                  disabled={primaryAction.disabled}
                  loading={primaryAction.loading}
                  onClick={primaryAction.onClick}
                />
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Modal>
  );
});

ApModal.displayName = 'ApModal';

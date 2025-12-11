import React, {
  useCallback,
  useState,
} from 'react';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import {
  IconButton,
  styled,
} from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core';

import { StatusTypes } from '../../../types/statusTypes';
import { ApTypography } from '../ap-typography';
import type {
  AlertBarStatus,
  ApAlertBarProps,
} from './ApAlertBar.types';

const statusIconMap = {
    [StatusTypes.INFO]: InfoIcon,
    [StatusTypes.WARNING]: WarningIcon,
    [StatusTypes.ERROR]: ErrorIcon,
    [StatusTypes.SUCCESS]: CheckCircleIcon,
};

const AlertBarContainer = styled('div')<{ status: AlertBarStatus }>(({ status }) => {
    let borderColor: string;
    let backgroundColor: string;
    let iconColor: string;

    switch (status) {
        case StatusTypes.INFO:
            borderColor = 'var(--color-info-icon)';
            backgroundColor = 'var(--color-info-background)';
            iconColor = 'var(--color-info-icon)';
            break;
        case StatusTypes.WARNING:
            borderColor = 'var(--color-warning-icon)';
            backgroundColor = 'var(--color-warning-background)';
            iconColor = 'var(--color-warning-icon)';
            break;
        case StatusTypes.ERROR:
            borderColor = 'var(--color-error-icon)';
            backgroundColor = 'var(--color-error-background)';
            iconColor = 'var(--color-error-icon)';
            break;
        case StatusTypes.SUCCESS:
            borderColor = 'var(--color-success-icon)';
            backgroundColor = 'var(--color-success-background)';
            iconColor = 'var(--color-success-icon)';
            break;
        default:
            borderColor = 'var(--color-info-icon)';
            backgroundColor = 'var(--color-info-background)';
            iconColor = 'var(--color-info-icon)';
    }

    return {
        minHeight: '40px',
        display: 'flex',
        border: `1px solid ${borderColor}`,
        backgroundColor,
        '--icon-color': iconColor,
    };
});

const IconContainer = styled('div')({
    padding: `11px ${token.Padding.PadL} 0`,
    color: 'var(--icon-color)',

    '& .MuiSvgIcon-root': {
        width: token.Icon.IconS,
        height: token.Icon.IconS,
    },
});

const TextContent = styled('div')({
    padding: `${token.Padding.PadXl} ${token.Spacing.SpacingL} ${token.Padding.PadXl} 0`,
    width: '100%',
});

const CancelButton = styled('div')({
    padding: `${token.Padding.PadL} ${token.Padding.PadL} ${token.Padding.PadL} 0`,
    height: token.Icon.IconM,

    '& .MuiIconButton-root': {
        padding: 0,
        width: token.Icon.IconM,
        height: token.Icon.IconM,
    },
});

/**
 * ApAlertBar displays contextual feedback messages for user actions.
 * Supports info, warning, error, and success statuses with optional dismiss functionality.
 */
export const ApAlertBar = React.forwardRef<HTMLDivElement, ApAlertBarProps>(
    ({ status = StatusTypes.INFO, cancelable = true, onCancel, children, className, sx }, ref) => {
        const [visible, setVisible] = useState(true);

        const onDismiss = useCallback(() => {
            setVisible(false);
            onCancel?.();
        }, [onCancel]);

        const StatusIcon = statusIconMap[status];

        if (!visible) {
            return null;
        }

        return (
            <AlertBarContainer ref={ref} status={status} className={className} sx={sx}>
                <IconContainer>
                    <StatusIcon />
                </IconContainer>
                <TextContent>
                    <ApTypography
                        variant={FontVariantToken.fontSizeM}
                        color="var(--color-foreground)"
                    >
                        {children}
                    </ApTypography>
                </TextContent>
                {cancelable && (
                    <CancelButton>
                        <IconButton
                            size="small"
                            onClick={onDismiss}
                            aria-label="Dismiss"
                        >
                            <CloseIcon />
                        </IconButton>
                    </CancelButton>
                )}
            </AlertBarContainer>
        );
    }
);

ApAlertBar.displayName = 'ApAlertBar';

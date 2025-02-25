/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    CircularProgress,
    styled,
} from '@mui/material';
import React from 'react';

import AutopilotLogo from '../../../assets/autopilot-logo.svg';

const IconContainer = styled('div')<{ size: number }>(({ size }) => ({
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: size,
    height: size,
}));

const SvgIcon = styled('div')<{ size: number }>(({
    size, theme,
}) => ({
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: size * 0.75,
    height: size * 0.75,
    borderRadius: '50%',
    backgroundColor: theme.palette.common.white,
}));

export const LoadingIcon: React.FC<{ size: number }> = ({ size }) => {
    return (
        <IconContainer size={size}>
            <CircularProgress size={size} thickness={3} />
            <SvgIcon size={size} dangerouslySetInnerHTML={{ __html: AutopilotLogo }} />
        </IconContainer>
    );
};

/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    Box,
    useTheme,
} from '@mui/material';
import token from '@uipath/apollo-core/lib';
import React from 'react';

import { Text } from './text.react';

export const Ul = React.memo(({ children }: { children: React.ReactNode }) => {
    return <Box
        component="ul"
        sx={{
            listStyleType: 'disc',
            marginBlock: 'unset',
            marginInline: 'unset',
            paddingInlineStart: token.Spacing.SpacingBase,
            display: 'block',
            lineHeight: token.FontFamily.FontMicroLineHeight,
        }}>
        {children}
    </Box>;
});

export const Ol = React.memo(({
    children, start,
}: { children: React.ReactNode; start?: number }) => {
    return <Box
        component="ol"
        start={start}
        sx={{
            marginBlock: 'unset',
            marginInline: 'unset',
            paddingInlineStart: token.Spacing.SpacingBase,
            lineHeight: token.FontFamily.FontMicroLineHeight,
        }}>
        {children}
    </Box>;
});

export const Li = React.memo(({ children }: { children: React.ReactNode }) => {
    const theme = useTheme();

    return <Box
        component="li"
        sx={{
            '&::marker': {
                color: theme.palette.semantic.colorForeground,
                fontSize: token.FontFamily.FontMSize,
            },
            lineHeight: 0,
        }}>
        {/* Only return ap-typography on strings and not empty spaces */}
        {React.Children.map(children, child => {
            if (typeof child === 'string') {
                if (child.length > 1) {
                    return Text({
                        children: child,
                        customStyle: { display: 'inline' },
                    });
                }
                return null;
            }

            return child;
        })}
    </Box>;
});

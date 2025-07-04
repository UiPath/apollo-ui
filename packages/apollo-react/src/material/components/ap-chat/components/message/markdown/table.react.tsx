/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    Table as MuiTable,
    TableCell,
    TableHead,
    TableRow,
    useTheme,
} from '@mui/material';
import { FontVariantToken } from '@uipath/apollo-core';
import token from '@uipath/apollo-core/lib';
import type { ReactNode } from 'react';
// eslint-disable-next-line unused-imports/no-unused-imports
import React from 'react';

import { Text } from './text.react';

interface TableProps {
    children: ReactNode;
}

export const Table = React.memo(({ children }: TableProps) => {
    const theme = useTheme();

    return (
        <MuiTable sx={{
            border: `1px solid ${theme.palette.semantic.colorBorderDeEmp}`,
            borderRadius: token.Border.BorderRadiusL,
            borderCollapse: 'separate',
            borderSpacing: 0,

            '& td, & th': {
                border: 'unset',
                borderBottom: `1px solid ${theme.palette.semantic.colorBorderDeEmp}`,
            },

            '& tr:last-child td': { borderBottom: 'unset' },

            '& .MuiTableHead-root th:first-child': { borderTopLeftRadius: token.Border.BorderRadiusL },
            '& .MuiTableHead-root th:last-child': { borderTopRightRadius: token.Border.BorderRadiusL },
        }}>
            {children}
        </MuiTable>
    );
});

export const TableHeader = React.memo(({ children }: TableProps) => {
    const theme = useTheme();

    return (
        <TableHead
            sx={{ backgroundColor: theme.palette.semantic.colorBackgroundSecondary }}
        >
            {children}
        </TableHead>
    );
});

export const Row = React.memo(({ children }: TableProps) => (
    <TableRow>{children}</TableRow>
));

export const Cell = React.memo(({ children }: TableProps) => {
    return (
        <TableCell>
            {/* Only return ap-typography on strings and not empty spaces */}
            {React.Children.map(children, child => {
                if (typeof child === 'string') {
                    if (child.length > 1) {
                        return Text({
                            children: child?.trim()?.replace(/<br\s*\/?>/gi, '\n') ?? '',
                            customStyle: { display: 'inline' },
                        });
                    }
                    return null;
                }

                return child;
            })}
        </TableCell>
    );
});

export const HeaderCell = React.memo(({ children }: TableProps) => {
    const theme = useTheme();

    return (
        <TableCell>
            <ap-typography
                variant={FontVariantToken.fontSizeMBold}
                color={theme.palette.semantic.colorForeground}
            >
                {children}
            </ap-typography>
        </TableCell>
    );
});

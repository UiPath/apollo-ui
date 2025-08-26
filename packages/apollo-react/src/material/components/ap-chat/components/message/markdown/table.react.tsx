/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    Table as MuiTable,
    TableCell,
    TableHead,
    TableRow,
    useTheme,
} from '@mui/material';
import token from '@uipath/apollo-core/lib';
import type { ReactNode } from 'react';
import React from 'react';

import { useChatState } from '../../../providers/chat-state-provider.react';
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

            '& .MuiTableHead-root th:first-of-type': { borderTopLeftRadius: token.Border.BorderRadiusL },
            '& .MuiTableHead-root th:last-of-type': { borderTopRightRadius: token.Border.BorderRadiusL },
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
    const { spacing } = useChatState();

    return (
        <TableCell>
            {/* Only return ap-typography on strings that are not just empty spaces */}
            {React.Children.map(children, child => {
                if (typeof child === 'string') {
                    const trimmedString = child.trim();
                    const hasVisibleContent = trimmedString.length > 0;
                    if (!hasVisibleContent) {
                        return null;
                    }

                    return Text({
                        children: trimmedString.replace(/<br\s*\/?>/gi, '\n'),
                        customStyle: { display: 'inline' },
                        variant: spacing.markdownTokens.td,
                    });
                }

                return child;
            })}
        </TableCell>
    );
});

export const HeaderCell = React.memo(({ children }: TableProps) => {
    const theme = useTheme();
    const { spacing } = useChatState();

    return (
        <TableCell>
            <ap-typography
                variant={spacing.markdownTokens.th}
                color={theme.palette.semantic.colorForeground}
            >
                {children}
            </ap-typography>
        </TableCell>
    );
});

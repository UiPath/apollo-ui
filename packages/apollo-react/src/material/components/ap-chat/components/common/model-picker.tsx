/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {
    styled,
    useTheme,
} from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core/lib';
import type { AutopilotChatModelInfo } from '@uipath/portal-shell-util';
import React from 'react';

import { AutopilotChatTooltip } from './tooltip.react';

export const ModelPickerContainer = styled('div')({
    position: 'relative',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    width: '200px',
    gap: token.Spacing.SpacingMicro,
    paddingLeft: token.Spacing.SpacingMicro,
});

export const SelectedModelContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.semantic.colorForegroundLight,
    gap: token.Spacing.SpacingMicro,
}));

export const ModelSelectionContainer = styled('div')(({ theme }) => ({
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    transform: 'translateY(-100%)',
    backgroundColor: theme.palette.semantic.colorBackground,
    border: `${token.Border.BorderThickS} solid ${theme.palette.semantic.colorBorderDeEmp}`,
    borderRadius: token.Border.BorderRadiusM,
    color: theme.palette.semantic.colorForeground,
    zIndex: 1000,
}));

export const ModelOption = styled('div')({
    padding: `${token.Spacing.SpacingXs} ${token.Spacing.SpacingS}`,
    cursor: 'pointer',
    '&:hover': { backgroundColor: 'var(--color-icon-button-hover)' },
});

export interface ModelPickerProps {
    models?: AutopilotChatModelInfo[];
    selectedModel?: AutopilotChatModelInfo;
    onModelChange?: (model: AutopilotChatModelInfo) => void;
}

export const ModelPicker = React.memo(({
    models,
    selectedModel,
    onModelChange,
}: ModelPickerProps) => {
    const theme = useTheme();

    const [ isOpen, setIsOpen ] = React.useState(false);

    const handleModelChange = (model: AutopilotChatModelInfo) => {
        if (onModelChange) {
            onModelChange(model);
        }
        setIsOpen(false);
    };

    const toggleModelSelection = () => {
        setIsOpen(!isOpen);
    };

    return (
        <ModelPickerContainer onClick={toggleModelSelection}>
            {isOpen && models && (
                <ModelSelectionContainer>
                    {models.map((model) => (
                        <AutopilotChatTooltip
                            title={
                                <>
                                    <ap-typography
                                        color={theme.palette.semantic.colorForegroundInverse}
                                        variant={FontVariantToken.fontSizeS}
                                    >
                                        {model.description ?? model.name}
                                    </ap-typography>
                                </>
                            }
                            placement="right">
                            <ModelOption
                                key={model.id}
                                onClick={() => handleModelChange(model)}
                            >
                                <ap-typography>{model.name}</ap-typography>
                            </ModelOption>
                        </AutopilotChatTooltip>
                    ))}
                </ModelSelectionContainer>
            )}
            <SelectedModelContainer>
                <ap-typography>{selectedModel?.name}</ap-typography>
                {isOpen ? <KeyboardArrowUpIcon className="arrow-icon" fontSize="inherit" />
                    : <KeyboardArrowDownIcon className="arrow-icon" fontSize="inherit" />}
            </SelectedModelContainer>
        </ModelPickerContainer>
    );
});

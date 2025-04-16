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
});

export const SelectedModelContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.semantic.colorForegroundLight,
    gap: token.Spacing.SpacingMicro,
    paddingLeft: token.Spacing.SpacingMicro,
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
    useIcon?: boolean;
}

export const ModelPicker = React.memo(({
    models,
    selectedModel,
    onModelChange,
    useIcon,
}: ModelPickerProps) => {
    const theme = useTheme();
    const [ isOpen, setIsOpen ] = React.useState(false);

    const handleModelChange = (model: AutopilotChatModelInfo) => {
        onModelChange?.(model);
        setIsOpen(false);
    };

    const toggleModelSelection = () => {
        setIsOpen(!isOpen);
    };

    const renderSelectedModel = () => {
        const ArrowIcon = isOpen ? KeyboardArrowUpIcon : KeyboardArrowDownIcon;

        if (useIcon) {
            return <portal-custom-icon name="model" size="24px" />;
        }

        return (
            <SelectedModelContainer>
                <ap-typography>{selectedModel?.name}</ap-typography>
                <ArrowIcon className="arrow-icon" fontSize="inherit" />
            </SelectedModelContainer>
        );
    };

    const renderModelTooltip = () => (
        <AutopilotChatTooltip
            placement="top-start"
            title={
                <>
                    <ap-typography
                        color={theme.palette.semantic.colorForegroundInverse}
                        variant={FontVariantToken.fontSizeM}
                    >
                        {selectedModel?.name}
                    </ap-typography>
                    <ap-typography
                        color={theme.palette.semantic.colorForegroundInverse}
                        variant={FontVariantToken.fontSizeXs}
                    >
                        {selectedModel?.description}
                    </ap-typography>
                </>
            }
        >
            {renderSelectedModel()}
        </AutopilotChatTooltip>
    );

    return (
        <ModelPickerContainer onClick={toggleModelSelection}>
            {isOpen && models && (
                <ModelSelectionContainer>
                    {models.map((model) => (
                        <AutopilotChatTooltip
                            placement="right-start"
                            title={
                                <ap-typography
                                    color={theme.palette.semantic.colorForegroundInverse}
                                    variant={FontVariantToken.fontSizeS}
                                >
                                    {model.description ?? model.name}
                                </ap-typography>
                            }
                        >
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
            {isOpen ? renderSelectedModel() : renderModelTooltip()}
        </ModelPickerContainer>
    );
});

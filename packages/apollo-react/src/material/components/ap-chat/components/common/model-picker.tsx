/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
    Popover,
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
    '& .arrow-icon': {
        transition: 'transform 0.2s ease-in-out',
        transform: 'rotate(0deg)',
    },
    '& .arrow-icon.open': { transform: 'rotate(180deg)' },
}));

export const ModelSelectionContainer = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.semantic.colorBackground,
    border: `${token.Border.BorderThickS} solid ${theme.palette.semantic.colorBorderDeEmp}`,
    borderRadius: token.Border.BorderRadiusM,
    color: theme.palette.semantic.colorForeground,
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
    const [ anchorEl, setAnchorEl ] = React.useState<HTMLDivElement | null>(null);

    const handleModelChange = (model: AutopilotChatModelInfo) => {
        onModelChange?.(model);
        setAnchorEl(null);
    };

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    const renderSelectedModel = () => {
        if (useIcon) {
            return <portal-custom-icon name="model" size="24px" />;
        }

        return (
            <SelectedModelContainer>
                <ap-typography>{selectedModel?.name}</ap-typography>
                <KeyboardArrowDownIcon
                    className={`arrow-icon ${open ? 'open' : ''}`}
                    fontSize="inherit"
                />
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
        <>
            <ModelPickerContainer onClick={handleClick}>
                {open ? renderSelectedModel() : renderModelTooltip()}
            </ModelPickerContainer>
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                sx={{
                    '& .MuiPopover-paper': {
                        marginTop: `-${(models?.length ?? 0) * 20 + 4}px`,
                        boxShadow: 'none',
                    },
                }}
            >
                <ModelSelectionContainer>
                    {models?.map((model) => (
                        <AutopilotChatTooltip
                            key={model.id}
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
                            <ModelOption onClick={() => handleModelChange(model)}>
                                <ap-typography>{model.name}</ap-typography>
                            </ModelOption>
                        </AutopilotChatTooltip>
                    ))}
                </ModelSelectionContainer>
            </Popover>
        </>
    );
});

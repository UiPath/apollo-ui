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

import { useChatService } from '../../providers/chat-service.provider.react';
import { AutopilotChatActionButton } from './action-button.react';
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

export const ModelOption = styled('div')(({ theme }) => ({
    padding: `${token.Spacing.SpacingXs} ${token.Spacing.SpacingS}`,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: token.Spacing.SpacingMicro,
    '&:hover': { backgroundColor: theme.palette.semantic.colorBackgroundHover },
}));

export interface ModelPickerProps {
    models: AutopilotChatModelInfo[];
    selectedModel: AutopilotChatModelInfo;
    useIcon: boolean;
}

export const ModelPicker = React.memo(({
    models,
    selectedModel,
    useIcon,
}: ModelPickerProps) => {
    const theme = useTheme();
    const chatService = useChatService();
    const [ anchorEl, setAnchorEl ] = React.useState<HTMLDivElement | null>(null);

    const handleModelChange = React.useCallback((model: AutopilotChatModelInfo) => {
        chatService?.setSelectedModel(model.id);
        setAnchorEl(null);
    }, [ chatService ]);

    const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
        setAnchorEl(event.currentTarget.parentElement as HTMLDivElement);
    }, []);

    const handleClose = React.useCallback(() => {
        setAnchorEl(null);
    }, []);

    const open = Boolean(anchorEl);

    const renderSelectedModel = React.useCallback(() => {
        if (useIcon) {
            return (
                <AutopilotChatActionButton
                    iconName="model"
                    variant="custom"
                    onClick={handleClick}
                    tooltipPlacement="top"
                    tooltip={ !open ? (
                        <>
                            <ap-typography
                                color={theme.palette.semantic.colorForegroundInverse}
                                variant={FontVariantToken.fontSizeM}
                            >
                                {selectedModel.name}
                            </ap-typography>
                            <ap-typography
                                color={theme.palette.semantic.colorForegroundInverse}
                                variant={FontVariantToken.fontSizeXs}
                            >
                                {selectedModel.description}
                            </ap-typography>
                        </>
                    ) : null}
                    data-testid="autopilot-chat-model-picker"
                />
            );
        }

        return (
            <SelectedModelContainer onClick={handleClick}>
                <ap-typography>{selectedModel?.name}</ap-typography>
                <KeyboardArrowDownIcon
                    className={`arrow-icon ${open ? 'open' : ''}`}
                    fontSize="inherit"
                />
            </SelectedModelContainer>
        );
    }, [ selectedModel, useIcon, open ]);

    return (
        <>
            <ModelPickerContainer>
                {renderSelectedModel()}
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
                        marginTop: `-${(models.length) * 20 + 4}px`,
                        boxShadow: 'none',
                    },
                }}
            >
                <ModelSelectionContainer>
                    {models.map((model) => (
                        <AutopilotChatTooltip
                            key={model.id}
                            placement="left-start"
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
                                {model.icon && <ap-icon name={model.icon} size="24px" />}
                                <ap-typography>{model.name}</ap-typography>
                            </ModelOption>
                        </AutopilotChatTooltip>
                    ))}
                </ModelSelectionContainer>
            </Popover>
        </>
    );
});

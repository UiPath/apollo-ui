import React from 'react';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
  Menu,
  MenuItem,
  styled,
} from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core';

import { t } from '../../../../utils/localization/loc';
import { useChatState } from '../../providers/chat-state-provider';
import { AutopilotChatInternalEvent } from '../../service';
import { AutopilotChatActionButton } from './action-button';
import { AutopilotChatTooltip } from './tooltip';

export interface DropdownOption<T = string> {
    id: T;
    name: string;
    description?: string;
    icon?: string;
}

export interface DropdownPickerProps<T = string> {
    options: Array<DropdownOption<T>>;
    selectedOption: DropdownOption<T>;
    onSelect: (option: DropdownOption<T>) => void;
    useIcon: boolean;
    ariaLabel: string;
    chatServiceInstance?: any;
    iconVariant?: 'normal' | 'outlined' | 'custom';
}

const DropdownPickerContainer = styled('div')({
    position: 'relative',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: token.Spacing.SpacingMicro,
});

const SelectedOptionContainer = styled('div')((() => ({
    display: 'flex',
    alignItems: 'center',
    color: 'var(--color-foreground-light)',
    gap: token.Spacing.SpacingMicro,
    paddingLeft: token.Spacing.SpacingMicro,
    cursor: 'pointer',
    borderRadius: token.Border.BorderRadiusM,
    padding: token.Spacing.SpacingMicro,
    '&:focus': {
        outline: '2px solid var(--color-focus-indicator)',
        outlineOffset: '2px',
    },
    '& .arrow-icon': {
        transition: 'transform 0.2s ease-in-out',
        transform: 'rotate(0deg)',
    },
    '& .arrow-icon.open': { transform: 'rotate(180deg)' },
})));

const StyledMenuItem = styled(MenuItem)({
    display: 'flex',
    alignItems: 'center',
    gap: token.Spacing.SpacingMicro,
});

export function DropdownPicker<T = string>({
    options,
    selectedOption,
    onSelect,
    useIcon,
    ariaLabel,
    chatServiceInstance,
    iconVariant = 'outlined',
}: DropdownPickerProps<T>) {
    const {
        spacing, theming,
    } = useChatState();
    const [ anchorEl, setAnchorEl ] = React.useState<HTMLButtonElement | HTMLDivElement | null>(null);

    const handleClose = React.useCallback(() => {
        setAnchorEl(null);
        // Focus the input after closing
        if (chatServiceInstance) {
            requestAnimationFrame(() => {
                chatServiceInstance.__internalService__.publish(AutopilotChatInternalEvent.SetInputFocused, true);
            });
        }
    }, [ chatServiceInstance ]);

    const handleOptionChange = React.useCallback((option: DropdownOption<T>) => {
        onSelect(option);
        handleClose();
    }, [ onSelect, handleClose ]);

    const handleClick = React.useCallback(
        (event: React.MouseEvent<HTMLButtonElement | HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
            const target = event.currentTarget instanceof HTMLButtonElement
                ? event.currentTarget.parentElement as HTMLDivElement
                : event.currentTarget;
            setAnchorEl(target);
        }, []);

    const handleKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleClick(event);
        }
    }, [ handleClick ]);

    const open = Boolean(anchorEl);

    const renderSelectedOption = React.useCallback(() => {
        if (useIcon) {
            return (
                <AutopilotChatActionButton
                    iconName={selectedOption.icon ?? ''}
                    variant={iconVariant}
                    onClick={handleClick}
                    tooltipPlacement="top-start"
                    tooltip={ !open ? (
                        <>
                            <ap-typography
                                color={'var(--color-foreground-inverse)'}
                                variant={FontVariantToken.fontSizeM}
                            >
                                {selectedOption.name}
                            </ap-typography>
                            {selectedOption.description && (
                                <ap-typography
                                    color={'var(--color-foreground-inverse)'}
                                    variant={FontVariantToken.fontSizeXs}
                                >
                                    {selectedOption.description}
                                </ap-typography>
                            )}
                        </>
                    ) : null}
                    ariaLabel={t('autopilot-chat-model-selector-button')}
                />
            );
        }

        return (
            <AutopilotChatTooltip
                placement="top-start"
                title={
                    !open && selectedOption.description ? (
                        <ap-typography
                            color={'var(--color-foreground-inverse)'}
                            variant={FontVariantToken.fontSizeS}
                        >
                            {selectedOption.description}
                        </ap-typography>
                    ) : null
                }
            >
                <SelectedOptionContainer
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                    role="button"
                    aria-haspopup="true"
                    aria-expanded={open}
                    aria-label={t('autopilot-chat-mode-selector-button')}
                >
                    {selectedOption.icon && <ap-icon variant="outlined" name={selectedOption.icon} size={token.Icon.IconXs} />}
                    <ap-typography variant={spacing.primaryFontToken}>{selectedOption.name}</ap-typography>
                    <KeyboardArrowDownIcon
                        className={`arrow-icon ${open ? 'open' : ''}`}
                        fontSize="inherit"
                    />
                </SelectedOptionContainer>
            </AutopilotChatTooltip>
        );
    }, [ selectedOption, useIcon, open, handleClick, handleKeyDown, iconVariant, spacing ]);

    return (
        <>
            <DropdownPickerContainer>
                {renderSelectedOption()}
            </DropdownPickerContainer>
            <Menu
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
                MenuListProps={{
                    'aria-label': ariaLabel,
                    dense: true,
                }}
            >
                {options.map((option) => (
                    <StyledMenuItem
                        key={String(option.id)}
                        onClick={() => handleOptionChange(option)}
                        selected={selectedOption.id === option.id}
                    >
                        <AutopilotChatTooltip
                            placement={theming?.chatMenu?.groupItemTooltipPlacement ?? 'left'}
                            title={
                                option.description ? (
                                    <ap-typography
                                        color={'var(--color-foreground-inverse)'}
                                        variant={FontVariantToken.fontSizeS}
                                    >
                                        {option.description}
                                    </ap-typography>
                                ) : null
                            }
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: token.Spacing.SpacingMicro,
                                width: '100%',
                            }}>
                                {option.icon && <ap-icon variant="outlined" name={option.icon} size={token.Icon.IconXs} />}
                                <ap-typography variant={spacing.primaryFontToken}>{option.name}</ap-typography>
                            </div>
                        </AutopilotChatTooltip>
                    </StyledMenuItem>
                ))}
            </Menu>
        </>
    );
}

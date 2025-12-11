import { ChipProps } from '@mui/material/Chip';

export interface ApChipProps extends Omit<ChipProps, 'deleteIcon'> {
    /** Whether the chip is in a loading state */
    loading?: boolean;
    /** Error state - shows error styling and border */
    error?: string | boolean;
    /** Tooltip text to display on hover */
    tooltip?: string;
    /** Debug flag to force tooltip open (internal use only) */
    debugForceOpen?: boolean;
}

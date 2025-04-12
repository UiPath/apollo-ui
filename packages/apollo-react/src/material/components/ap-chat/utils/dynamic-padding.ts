import {
    CHAT_MESSAGE_MAX_PADDING,
    CHAT_MESSAGE_MIN_PADDING,
    CHAT_WIDTH_SIDE_BY_SIDE_MAX,
    CHAT_WIDTH_SIDE_BY_SIDE_MIN,
} from '@uipath/portal-shell-util/src/autopilot/constants';

export function calculateDynamicPadding(currentWidth: number): number {
    // If width is less than minimum, return minimum padding
    if (currentWidth <= CHAT_WIDTH_SIDE_BY_SIDE_MIN) {
        return CHAT_MESSAGE_MIN_PADDING;
    }
    // If width is more than maximum, return maximum padding
    if (currentWidth >= CHAT_WIDTH_SIDE_BY_SIDE_MAX) {
        return CHAT_MESSAGE_MAX_PADDING;
    }

    // Calculate the percentage of the way between min and max width
    const percentage = (currentWidth - CHAT_WIDTH_SIDE_BY_SIDE_MIN) / (CHAT_WIDTH_SIDE_BY_SIDE_MAX - CHAT_WIDTH_SIDE_BY_SIDE_MIN);

    // Calculate the padding based on the percentage and round to integer
    return Math.round(CHAT_MESSAGE_MIN_PADDING + (CHAT_MESSAGE_MAX_PADDING - CHAT_MESSAGE_MIN_PADDING) * percentage);
}

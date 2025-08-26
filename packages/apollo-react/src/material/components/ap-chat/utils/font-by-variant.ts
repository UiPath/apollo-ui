import {
    FontVariantToken,
    Typography,
} from '@uipath/apollo-core';

export const fontByVariant = (variant: FontVariantToken) => {
    // Find the enum key whose value matches the given variant
    const enumKey = Object.keys(FontVariantToken).find(
        key => FontVariantToken[key as keyof typeof FontVariantToken] === variant,
    );

    if (enumKey && Typography[enumKey]) {
        return Typography[enumKey];
    }

    return;
};

/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import token from '@uipath/apollo-core/lib';
import React from 'react';

import { StatusTypes } from '../../../../models/statusTypes';
import { useError } from '../../providers/error-provider.react';

function AutopilotChatInputErrorComponent() {
    const {
        error, clearError,
    } = useError();

    // FIXME: ApAlertBarReact doesn't have the styles.. they are in the ap-alert-bar component
    React.useEffect(() => {
        const listener = () => clearError();

        document.addEventListener('cancelAlert', listener);

        return () => {
            document.removeEventListener('cancelAlert', listener);
        };
    }, [ clearError ]);

    if (!error) {
        return null;
    }

    return <ap-alert-bar style={{
        marginBottom: token.Spacing.SpacingBase,
        width: '100%',
    }} status={StatusTypes.ERROR}>{error}</ap-alert-bar>;
}

export const AutopilotChatInputError = React.memo(AutopilotChatInputErrorComponent);

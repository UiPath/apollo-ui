import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import React from 'react';
import { AutopilotChatActionButton } from '../common/action-button';

interface ResourceTriggerButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

function ResourceTriggerButtonComponent({ onClick }: ResourceTriggerButtonProps) {
  const { _ } = useLingui();
  return (
    <AutopilotChatActionButton
      iconName="alternate_email"
      onClick={onClick}
      tooltipPlacement="top"
      tooltip={_(msg({ id: 'autopilot-chat.resource-trigger.tooltip', message: 'Add resource' }))}
      ariaLabel={_(
        msg({ id: 'autopilot-chat.resource-trigger.label', message: 'Add resource reference' })
      )}
    />
  );
}

export const ResourceTriggerButton = React.memo(ResourceTriggerButtonComponent);

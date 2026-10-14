import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from '@uipath/apollo-wind';
import { EllipsisVertical } from 'lucide-react';
import type React from 'react';

import type { AutopilotChatCustomHeaderAction } from '../../service';
import { ServiceIcon } from '../common/service-icon';
import { HeaderActionButton } from './header-action-button';

type MenuAction = Omit<AutopilotChatCustomHeaderAction, 'children'>;

function WithDescription({
  description,
  children,
}: {
  description?: string;
  children: React.ReactElement;
}) {
  if (!description) {
    return children;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipPortal>
        <TooltipContent side="left">{description}</TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
}

function ActionItem({
  action,
  onSelect,
}: {
  action: MenuAction;
  onSelect?: (action: MenuAction) => void;
}) {
  return (
    <WithDescription description={action.description}>
      <DropdownMenuItem
        disabled={action.disabled}
        onSelect={() => onSelect?.(action)}
        data-action-id={action.id}
      >
        <ServiceIcon icon={action.icon} />
        {action.name}
      </DropdownMenuItem>
    </WithDescription>
  );
}

/**
 * The service's custom header actions. Parents only open their children (one level, as the
 * service allows); leaves publish `CustomHeaderActionClicked`.
 */
export function CustomActionsMenu({
  actions,
  onAction,
}: {
  actions: AutopilotChatCustomHeaderAction[];
  onAction: (action: AutopilotChatCustomHeaderAction) => void;
}) {
  const { _ } = useLingui();
  const label = _(
    msg({ id: 'autopilot-chat.header.actions.custom-actions', message: `More actions` })
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HeaderActionButton label={label} data-testid="autopilot-chat-action-menu">
          <EllipsisVertical />
        </HeaderActionButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {actions.map((action) =>
          action.children && action.children.length > 0 ? (
            <DropdownMenuSub key={action.id}>
              <WithDescription description={action.description}>
                <DropdownMenuSubTrigger disabled={action.disabled} data-action-id={action.id}>
                  <ServiceIcon icon={action.icon} />
                  {action.name}
                </DropdownMenuSubTrigger>
              </WithDescription>
              <DropdownMenuSubContent className="min-w-44">
                {action.children.map((child) => (
                  <ActionItem key={child.id} action={child} onSelect={onAction} />
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : (
            // Like Material, a parent with an empty `children` list does not publish.
            <ActionItem
              key={action.id}
              action={action}
              onSelect={action.children ? undefined : onAction}
            />
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { Button } from '@uipath/apollo-wind';
import { memo, type MouseEvent, type ReactNode } from 'react';
import { TOOLBOX_PADDING_X } from '../../constants';
import { CanvasTooltip } from '../CanvasTooltip';

export type ToolboxQuickAction = {
  id: string;
  title: string;
  icon: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  trailing?: boolean;
  disabled?: boolean;
};

interface QuickActionsRowProps {
  actions: ToolboxQuickAction[];
}

function QuickActionButton({ action, wide }: { action: ToolboxQuickAction; wide?: boolean }) {
  return (
    <CanvasTooltip content={action.title}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={wide ? 'h-9 w-14 aspect-auto [&_svg]:size-6' : 'h-9 w-9 [&_svg]:size-6'}
        aria-label={action.title}
        disabled={action.disabled}
        onClick={action.onClick}
        onMouseEnter={action.onMouseEnter}
        onMouseLeave={action.onMouseLeave}
        data-testid={`toolbox-quick-action-${action.id}`}
      >
        {action.icon}
      </Button>
    </CanvasTooltip>
  );
}

export const QuickActionsRow = memo(function QuickActionsRow({ actions }: QuickActionsRowProps) {
  if (!actions.length) return null;

  const leading = actions.filter((a) => !a.trailing);
  const trailing = actions.filter((a) => a.trailing);

  return (
    <div
      className="flex items-center justify-center gap-3 min-h-11 pb-2 border-b border-border shrink-0"
      style={{ paddingInline: TOOLBOX_PADDING_X, marginInline: -TOOLBOX_PADDING_X }}
      data-testid="toolbox-quick-actions"
    >
      {leading.map((action) => (
        <QuickActionButton key={action.id} action={action} />
      ))}
      {trailing.length > 0 && leading.length > 0 && (
        <div
          className="w-px self-stretch mx-1 bg-border shrink-0"
          data-testid="toolbox-quick-actions-separator"
        />
      )}
      {trailing.map((action) => (
        <QuickActionButton key={action.id} action={action} wide />
      ))}
    </div>
  );
});

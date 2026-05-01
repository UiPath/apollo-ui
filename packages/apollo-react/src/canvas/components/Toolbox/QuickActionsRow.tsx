import styled from '@emotion/styled';
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

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 44px;
  padding: 0 ${TOOLBOX_PADDING_X}px 8px;
  margin: 0 -${TOOLBOX_PADDING_X}px;
  border-bottom: 1px solid var(--canvas-border-de-emp);
  flex-shrink: 0;
`;

const Separator = styled.div`
  width: 1px;
  align-self: stretch;
  margin: 0 4px;
  background: var(--canvas-border-de-emp);
  flex-shrink: 0;
`;

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
    <Container data-testid="toolbox-quick-actions">
      {leading.map((action) => (
        <QuickActionButton key={action.id} action={action} />
      ))}
      {trailing.length > 0 && leading.length > 0 && (
        <Separator data-testid="toolbox-quick-actions-separator" />
      )}
      {trailing.map((action) => (
        <QuickActionButton key={action.id} action={action} wide />
      ))}
    </Container>
  );
});

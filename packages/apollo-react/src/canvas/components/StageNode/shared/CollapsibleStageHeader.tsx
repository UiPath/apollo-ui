import styled from '@emotion/styled';
import { Spacing } from '@uipath/apollo-core';
import { CanvasIcon } from '@uipath/apollo-react/canvas';
import { Row } from '@uipath/apollo-react/canvas/layouts';
import { CanvasTooltip } from '../../CanvasTooltip';

const StyledRow = styled(Row)`
  cursor: pointer;
  padding: 4px;
  background-color: var(--color-background);
  border-radius: 4px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--color-background-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;

interface CollapsibleStageHeaderProps {
  isOpen: boolean;
  label: string;
  testId: string;
  children: React.ReactNode;
  onToggle: () => void;
}

export const CollapsibleStageHeader = ({
  isOpen,
  label,
  testId,
  children,
  onToggle,
}: CollapsibleStageHeaderProps) => {
  return (
    <div data-testid={testId}>
      <StyledRow
        h={32}
        pr={Spacing.SpacingS}
        gap={Spacing.SpacingMicro}
        align="center"
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${label}`}
        data-testid={`${testId}-accordion-button`}
        onClick={onToggle}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <span aria-hidden={true} style={{ display: 'inline-flex', flexShrink: 0 }}>
          <CanvasIcon
            data-testid={`${testId}-icon`}
            icon={isOpen ? 'chevron-down' : 'chevron-right'}
            size={16}
            color="var(--color-foreground-de-emp)"
          />
        </span>
        <CanvasTooltip content={label} placement="top" smartTooltip>
          <Row
            gap={'2px'}
            align="center"
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              data-testid={`${testId}-label`}
              className="text-sm truncate"
              style={{ minWidth: 0 }}
            >
              {label}
            </span>
          </Row>
        </CanvasTooltip>
      </StyledRow>
      <div
        data-testid={`${testId}-content`}
        style={{
          height: isOpen ? 'auto' : 0,
          overflow: isOpen ? 'visible' : 'hidden',
        }}
      >
        {isOpen && children}
      </div>
    </div>
  );
};

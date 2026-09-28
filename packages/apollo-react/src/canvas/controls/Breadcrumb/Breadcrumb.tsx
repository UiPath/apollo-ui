import styled from '@emotion/styled';
import { Spacing } from '@uipath/apollo-core';
import type React from 'react';
import { memo } from 'react';
import { CanvasTooltip } from '../../components/CanvasTooltip';

import { Row } from '../../layouts';

export type BreadcrumbItem = {
  label: string;
  onClick?: (
    e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>
  ) => void;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  delimiter?: React.ReactNode | string;
};

const OlStyled = styled.ol`
  display: flex;
  flex-direction: row;
  margin: 0;
  padding: 0;
`;

const LiStyled = styled.li`
  display: flex;
  align-items: center;
  padding: 0;
`;

export const Breadcrumb: React.FC<BreadcrumbProps> = memo(({ items, delimiter = '>' }) => {
  const delimiterNode =
    typeof delimiter === 'string' ? <span aria-hidden="true">{delimiter}</span> : delimiter;

  return (
    <Row
      align="center"
      style={{ overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--color-foreground-de-emp)' }}
      gap={Spacing.SpacingMicro}
    >
      <OlStyled>
        {items.map((item, index) => (
          <LiStyled key={`${item.label}-${index}`}>
            {item.onClick ? (
              <button
                type="button"
                style={{
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  color: 'inherit',
                }}
                onClick={(e) => item.onClick?.(e)}
                onKeyDown={(e) => e.key === 'Enter' && item.onClick?.(e)}
              >
                <Row
                  overflow="hidden"
                  align="center"
                  gap={Spacing.SpacingMicro}
                  aria-current={index === items.length - 1 ? 'page' : undefined}
                >
                  {item.startAdornment}
                  <CanvasTooltip smartTooltip content={item.label}>
                    <span
                      className={`${index === items.length - 1 ? 'text-sm font-bold' : 'text-sm'} truncate`}
                      data-testid={`breadcrumb-item-${item.label}`}
                    >
                      {item.label}
                    </span>
                  </CanvasTooltip>
                  {item.endAdornment}
                </Row>
              </button>
            ) : (
              <Row
                overflow="hidden"
                align="center"
                gap={Spacing.SpacingMicro}
                aria-current={index === items.length - 1 ? 'page' : undefined}
              >
                {item.startAdornment}
                <CanvasTooltip smartTooltip content={item.label}>
                  <span
                    className={`${index === items.length - 1 ? 'text-sm font-bold' : 'text-sm'} truncate`}
                    data-testid={`breadcrumb-item-${item.label}`}
                  >
                    {item.label}
                  </span>
                </CanvasTooltip>
                {item.endAdornment}
              </Row>
            )}
            {index < items.length - 1 && delimiterNode}
          </LiStyled>
        ))}
      </OlStyled>
    </Row>
  );
});

Breadcrumb.displayName = 'Breadcrumb';

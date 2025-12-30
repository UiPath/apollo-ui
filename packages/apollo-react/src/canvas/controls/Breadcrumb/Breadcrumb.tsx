import { FontVariantToken, Spacing } from '@uipath/apollo-core';
import { ApTooltip, ApTypography } from '@uipath/portal-shell-react';
import React from 'react';
import styled from '@emotion/styled';
import { Row } from '../../layouts';

type BreadcrumbProps = {
  items: {
    label: string;
    onClick?: (
      e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>
    ) => void;
    startAdornment?: React.ReactNode;
    endAdornment?: React.ReactNode;
  }[];
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

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, delimiter = '>' }) => {
  const delimiterNode =
    typeof delimiter === 'string' ? (
      <ApTypography aria-hidden="true" color="var(--color-foreground-de-emp)">
        {delimiter}
      </ApTypography>
    ) : (
      delimiter
    );

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
                  {item.startAdornment ?? <></>}
                  <ApTooltip smartTooltip content={item.label}>
                    <ApTypography
                      variant={
                        index === items.length - 1
                          ? FontVariantToken.fontSizeMBold
                          : FontVariantToken.fontSizeM
                      }
                      style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                      data-testid={`breadcrumb-item-${item.label}`}
                    >
                      {item.label}
                    </ApTypography>
                  </ApTooltip>
                  {item.endAdornment ?? <></>}
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
                <ApTooltip smartTooltip content={item.label}>
                  <ApTypography
                    variant={
                      index === items.length - 1
                        ? FontVariantToken.fontSizeMBold
                        : FontVariantToken.fontSizeM
                    }
                    style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                    data-testid={`breadcrumb-item-${item.label}`}
                  >
                    {item.label}
                  </ApTypography>
                </ApTooltip>
                {item.endAdornment}
              </Row>
            )}
            {index < items.length - 1 && delimiterNode}
          </LiStyled>
        ))}
      </OlStyled>
    </Row>
  );
};

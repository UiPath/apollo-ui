import { ApIcon, ApIconButton, ApTypography } from '@uipath/portal-shell-react';
import { Row } from '@uipath/apollo-react/canvas/layouts';
import { FontVariantToken } from '@uipath/apollo-core';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onBack, showBackButton }) => {
  const isBackButtonVisible = showBackButton && onBack;

  return (
    <Row h={32} align="center">
      <div
        style={{
          width: isBackButtonVisible ? '32px' : '0px',
          opacity: isBackButtonVisible ? 1 : 0,
          transform: isBackButtonVisible ? 'translateX(0)' : 'translateX(20px)',
          marginRight: isBackButtonVisible ? '8px' : '0px',
          transition:
            'width 0.3s ease-in-out, opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
          overflow: 'hidden',
        }}
      >
        {isBackButtonVisible && (
          <ApIconButton
            aria-label="Back"
            color="secondary"
            onClick={onBack}
            style={{
              transition: 'transform 0.3s ease-in-out',
            }}
          >
            <ApIcon name="chevron_left" size="20px" />
          </ApIconButton>
        )}
      </div>
      <ApTypography
        variant={FontVariantToken.fontSizeLBold}
        color="var(--uix-canvas-foreground-emp)"
        style={{
          transition: 'transform 0.3s ease-in-out, margin 0.3s ease-in-out',
        }}
      >
        {title}
      </ApTypography>
    </Row>
  );
};

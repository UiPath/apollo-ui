import { Row } from '@uipath/apollo-react/canvas/layouts';
import { Button } from '@uipath/apollo-wind';
import { memo } from 'react';
import { CanvasIcon } from '../../utils/icon-registry';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export const Header = memo(function Header({ title, onBack, showBackButton }: HeaderProps) {
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Back"
            onClick={onBack}
            style={{
              transition: 'transform 0.3s ease-in-out',
            }}
          >
            <CanvasIcon icon="chevron-left" size={20} />
          </Button>
        )}
      </div>
      <span
        className="text-base font-bold"
        style={{
          transition: 'transform 0.3s ease-in-out, margin 0.3s ease-in-out',
          margin: 0,
        }}
      >
        {title}
      </span>
    </Row>
  );
});

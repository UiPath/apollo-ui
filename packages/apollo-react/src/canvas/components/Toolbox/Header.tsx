import { Row } from '@uipath/apollo-react/canvas/layouts';
import { cx } from '@uipath/apollo-react/canvas/utils';
import { Button } from '@uipath/apollo-wind';
import { memo } from 'react';
import { CanvasIcon } from '../../utils/icon-registry';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

interface HeaderProps {
  title: string;
  headingLevel?: HeadingLevel;
  showBackButton?: boolean;
  onBack?: () => void;
}

// The slot collapses to zero width rather than unmounting, so the title slides
// across instead of jumping when the back button appears or leaves.
const BACK_SLOT_CLASS =
  'overflow-hidden transition-[width,opacity,transform,margin] duration-300 ease-in-out';
const BACK_SLOT_VISIBLE_CLASS = 'mr-2 w-8 translate-x-0 opacity-100';
const BACK_SLOT_HIDDEN_CLASS = 'mr-0 w-0 translate-x-5 opacity-0';

export const Header = memo(function Header({
  title,
  headingLevel = 2,
  onBack,
  showBackButton,
}: HeaderProps) {
  const isBackButtonVisible = showBackButton && onBack;

  return (
    <Row h={32} align="center">
      <div
        className={cx(
          BACK_SLOT_CLASS,
          isBackButtonVisible ? BACK_SLOT_VISIBLE_CLASS : BACK_SLOT_HIDDEN_CLASS
        )}
      >
        {isBackButtonVisible && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 transition-transform duration-300 ease-in-out"
            aria-label="Back"
            onClick={onBack}
          >
            <CanvasIcon icon="chevron-left" size={20} />
          </Button>
        )}
      </div>
      {/* biome-ignore lint/a11y/useSemanticElements: hosts such as Studio Web restyle native h1-h6 with unlayered CSS that beats Tailwind. */}
      <span role="heading" aria-level={headingLevel} className="text-base font-bold">
        {title}
      </span>
    </Row>
  );
});

import { cx } from '../../utils/CssUtil';

export type HandleType = 'artifact' | 'input' | 'output';

const getNotchWidth = (handleType: HandleType, isVertical?: boolean): string => {
  if (handleType === 'input' && !isVertical) return 'w-2';
  if (handleType === 'artifact') return 'w-2.5';
  return 'w-3';
};

const getNotchHeight = (handleType: HandleType, isVertical?: boolean): string => {
  if (handleType === 'input' && isVertical) return 'h-2';
  if (handleType === 'artifact') return 'h-2.5';
  return 'h-3';
};

export const HandleNotch = ({
  handleType,
  isVertical,
  selected,
  hovered,
  showNotch,
}: {
  handleType: HandleType;
  isVertical?: boolean;
  selected: boolean;
  hovered?: boolean;
  showNotch?: boolean;
}) => {
  const isActive = selected || hovered;
  return (
    <div
      className={cx(
        'border-2 pointer-events-none transition-all duration-250 ease-in-out',
        getNotchWidth(handleType, isVertical),
        getNotchHeight(handleType, isVertical),
        handleType === 'artifact' || handleType === 'input' ? 'rounded-none' : 'rounded-full',
        handleType === 'artifact' && 'rotate-45',
        isActive ? 'border-brand bg-brand' : 'border-border bg-surface',
        showNotch ? 'opacity-100' : 'opacity-0'
      )}
    />
  );
};

import { Skeleton } from '@uipath/apollo-wind';
import { memo } from 'react';

interface BaseInnerShapeProps {
  loading?: boolean;
  color?: string;
  background?: string;
  children: React.ReactNode;
}

export const BaseInnerShape = memo(
  ({ loading, color, background, children }: BaseInnerShapeProps) => (
    <div
      className="
        flex items-center justify-center overflow-hidden bg-surface text-foreground 
        w-(--inner-size) h-(--inner-size) rounded-(--inner-radius) 
        [&>svg]:w-(--icon-size) [&>svg]:h-(--icon-size) 
        [&>img]:w-(--icon-size) [&>img]:h-(--icon-size) [&>img]:object-contain
      "
      style={color || background ? { color, background } : undefined}
    >
      {loading ? (
        <Skeleton
          data-testid="skeleton-icon"
          className="rounded-lg w-(--icon-size) h-(--icon-size)"
        />
      ) : (
        children
      )}
    </div>
  )
);

interface SegmentLabelProps {
  children: string;
}

/**
 * A segment's label that keeps one width chosen or not: an invisible
 * copy in the chosen segment's heavier weight, drawn as generated
 * content, holds the room, so heavier text never moves what's beside the
 * control. Being hidden generated content, it isn't in the label's text
 * or its accessible name.
 */
export function SegmentLabel({ children }: SegmentLabelProps) {
  return (
    <span
      data-label={children}
      className="inline-flex flex-col after:invisible after:h-0 after:overflow-hidden after:font-semibold after:content-[attr(data-label)]"
    >
      {children}
    </span>
  );
}

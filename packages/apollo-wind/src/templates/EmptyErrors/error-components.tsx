// ============================================================================
// ErrorVideo — Looping decorative video in a circular clip
//
// Used as a visual element in error/empty state pages.
// Pass as the `icon` prop on EmptyState:
//   <EmptyState icon={<ErrorVideo />} title="..." />
// ============================================================================

const VIMEO_SRC =
  'https://player.vimeo.com/video/1145746394?h=3c42d6f39b&autoplay=1&muted=1&loop=1&background=1';

export function ErrorVideo({ size = 180 }: { size?: number }) {
  // Oversized iframe so the video fills the circle without letterboxing
  const iframeSize = size + 120;
  const offset = -(iframeSize - size) / 2;

  return (
    <div
      className="overflow-hidden rounded-full border border-border bg-surface-raised"
      style={{ width: size, height: size }}
    >
      <iframe
        src={VIMEO_SRC}
        width={iframeSize}
        height={iframeSize}
        allow="autoplay"
        title="Decorative animation"
        className="pointer-events-none border-0"
        style={{ marginTop: offset, marginLeft: offset, transform: 'scale(1.15)' }}
      />
    </div>
  );
}

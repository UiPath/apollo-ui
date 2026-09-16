/**
 * Layers icon with an "open/navigate out" arrow, used for the Data Fabric
 * "Read Entity" canvas node. The whole glyph inherits the node's text color
 * via `currentColor`.
 */
export const LayersArrowUpRightIcon = ({
  w = 16,
  h = 16,
}: {
  w?: number | string;
  h?: number | string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="layers-arrow-up-right-icon"
    width={w}
    height={h}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 13.74 2.5 8.87a1 1 0 0 1 0-1.74L11 2.26a2 2 0 0 1 2 0l8.5 4.87a1 1 0 0 1 0 1.74l-2 1.15" />
    <path d="M11 21.74l-8.5-4.87a1 1 0 0 1 0-1.74l1.5-.845" />
    <path d="M16 14h6v6" />
    <path d="m16 20 6-6" />
  </svg>
);

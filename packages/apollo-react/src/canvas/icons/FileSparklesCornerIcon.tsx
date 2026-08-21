/**
 * File with a sparkle in an opened corner, for nodes whose output is mocked by
 * generation. Sibling of Lucide's `file-braces-corner`, which marks a static
 * mock: both share the same truncated file outline so the two states read as one
 * family, and the outline stops short of the glyph so no stroke passes behind it.
 *
 * The glyph follows Lucide's `sparkles`: a star with a cross up-right and a dot
 * down-left, seated on a 45 degree axis at offsets of +/-8 scaled by the star's
 * 0.5, so +/-4 from the star's centre at (8, 17). Every mark stays inside the
 * 2..22 box Lucide keeps its paths in, and the cluster clears the outline's cut
 * end at x=14.
 *
 * Every mark runs lighter than the outline's 2: the star's interior counter
 * closes up and fills in solid at that weight, so a concave glyph needs a
 * thinner stroke than a plain outline does to read at the same size.
 */
export const FileSparklesCornerIcon = ({
  w = 24,
  h = 24,
  color = 'currentColor',
}: {
  w?: number | string;
  h?: number | string;
  color?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="file-sparkles-corner-icon"
    width={w}
    height={h}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Outline truncated at the bottom-left, identical to `file-braces-corner`. */}
    <path d="M14 22h4a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v6" />
    <path d="M14 2v5a1 1 0 0 0 1 1h5" />
    {/* Lucide `sparkle` at 0.5; stroke is 1.4/0.5 so it renders at 1.4. */}
    <g transform="translate(2 11) scale(0.5)" strokeWidth={2.8}>
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
    </g>
    <g strokeWidth={0.75}>
      <path d="M10.8 13h2.4" />
      <path d="M12 11.8v2.4" />
    </g>
    <circle cx="4" cy="21" r="1" strokeWidth={0.75} />
  </svg>
);

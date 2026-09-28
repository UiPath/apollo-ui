type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type BodyTag = "p" | "span";

interface TypeSpecimenProps {
  tag: HeadingTag | BodyTag;
  label: string;
  className: string;
  size: string;
  specimen?: string;
  fontFamily?: "sans" | "serif" | "mono";
}

const DEFAULT_SPECIMEN = "The quick brown fox jumps over the lazy dog.";

export function TypeSpecimen({
  tag: Tag,
  label: _label,
  className,
  size,
  specimen = DEFAULT_SPECIMEN,
  fontFamily = "sans",
}: TypeSpecimenProps) {
  const fontClass =
    fontFamily === "serif"
      ? "font-serif"
      : fontFamily === "mono"
        ? "font-mono"
        : "font-sans";

  return (
    <div className="not-prose border-b border-border py-6 last:border-0">
      <Tag
        className={`${className} ${fontClass} text-foreground leading-tight mb-3`}
      >
        {specimen}
      </Tag>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <code className="font-mono text-sm font-semibold text-foreground">
          {className}
        </code>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1">
        <span className="font-mono text-xs text-muted-foreground">
          <span className="text-muted-foreground">tag </span>
          {`<${Tag}>`}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          <span className="text-muted-foreground">size </span>
          {size}
        </span>
      </div>
    </div>
  );
}

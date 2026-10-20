import type { ReactNode } from "react";

export type LayerId = "components" | "patterns" | "surfaces" | "templates";

// Isometric projection: x runs to the lower right, y to the lower left and
// z straight up, all in the same SVG user units.
type Point = [x: number, y: number, z: number];

const COS_30 = Math.cos(Math.PI / 6);

function project([x, y, z]: Point) {
  return `${((x - y) * COS_30).toFixed(2)},${((x + y) / 2 - z).toFixed(2)}`;
}

function points(corners: Point[]) {
  return corners.map((corner) => project(corner)).join(" ");
}

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** Height of the bottom face. */
  z: number;
  /** Thickness; 0 draws a flat outline. */
  h?: number;
}

interface SlabProps {
  box: Box;
  top: string;
  side?: string;
  children?: ReactNode;
}

// A box seen from above: the top face plus the two faces turned to the viewer.
function Slab({
  box: { x0, y0, x1, y1, z, h = 0 },
  top,
  side,
  children,
}: SlabProps) {
  const zt = z + h;
  return (
    <g>
      {h > 0 && (
        <>
          <polygon
            className={side}
            points={points([
              [x1, y0, zt],
              [x1, y1, zt],
              [x1, y1, z],
              [x1, y0, z],
            ])}
          />
          <polygon
            className={side}
            points={points([
              [x0, y1, zt],
              [x1, y1, zt],
              [x1, y1, z],
              [x0, y1, z],
            ])}
          />
        </>
      )}
      <polygon
        className={top}
        points={points([
          [x0, y0, zt],
          [x1, y0, zt],
          [x1, y1, zt],
          [x0, y1, zt],
        ])}
      />
      {children}
    </g>
  );
}

// Text placeholder lines drawn flat on a top face.
function Lines({
  x,
  ys,
  lengths,
  z,
  className,
}: {
  x: number;
  ys: number[];
  lengths: number[];
  z: number;
  className: string;
}) {
  return ys.map((y, i) => (
    <polyline
      key={y}
      className={className}
      points={points([
        [x, y, z],
        [x + lengths[i % lengths.length], y, z],
      ])}
    />
  ));
}

function Leader({
  x,
  y,
  from,
  to,
}: {
  x: number;
  y: number;
  from: number;
  to: number;
}) {
  return (
    <polyline
      className="fill-none stroke-muted-foreground/60"
      strokeDasharray="0.8 1.6"
      strokeLinecap="round"
      strokeWidth={0.6}
      points={points([
        [x, y, from],
        [x, y, to],
      ])}
    />
  );
}

const SHEET_TOP = "fill-card stroke-muted-foreground/45";
const SHEET_SIDE = "fill-muted stroke-muted-foreground/45";
const LINE = "fill-none stroke-muted-foreground/35";
const SURFACE_TOP =
  "fill-primary-100 stroke-primary-600 dark:fill-primary-800/55 dark:stroke-primary-500";
const SURFACE_SIDE =
  "fill-primary-200 stroke-primary-600 dark:fill-primary-900 dark:stroke-primary-500";

// Heights of each layer in the stack.
const Z_SURFACES = 16;
const Z_PATTERNS = 34;
const Z_COMPONENTS = 54;

function Templates() {
  const dashed = "fill-none stroke-muted-foreground/50";
  return (
    <g strokeDasharray="2 1.6" strokeWidth={0.6}>
      <Slab
        box={{ x0: 0, y0: 0, x1: 120, y1: 90, z: 0 }}
        top="fill-muted/60 stroke-muted-foreground/50"
      />
      <Slab box={{ x0: 0, y0: 0, x1: 120, y1: 8, z: 0 }} top={dashed} />
      <Slab box={{ x0: 0, y0: 8, x1: 16, y1: 90, z: 0 }} top={dashed} />
      <Slab box={{ x0: 86, y0: 8, x1: 120, y1: 90, z: 0 }} top={dashed} />
    </g>
  );
}

function Surfaces() {
  return (
    <g strokeWidth={0.5} strokeLinejoin="round">
      <Slab
        box={{ x0: 18, y0: 11, x1: 84, y1: 88, z: Z_SURFACES, h: 3 }}
        top={SURFACE_TOP}
        side={SURFACE_SIDE}
      />
      <Slab
        box={{ x0: 88, y0: 11, x1: 118, y1: 88, z: Z_SURFACES, h: 3 }}
        top={SURFACE_TOP}
        side={SURFACE_SIDE}
      />
    </g>
  );
}

function Patterns() {
  const z = Z_PATTERNS + 1.2;
  return (
    <g strokeWidth={0.5} strokeLinejoin="round">
      {/* Work queue */}
      <Slab
        box={{ x0: 22, y0: 15, x1: 80, y1: 47, z: Z_PATTERNS, h: 1.2 }}
        top={SHEET_TOP}
        side={SHEET_SIDE}
      >
        <g strokeWidth={1.4} strokeLinecap="round">
          <Lines
            x={27}
            ys={[22, 28, 34, 40]}
            lengths={[38, 44, 30, 40]}
            z={z}
            className={LINE}
          />
        </g>
      </Slab>
      {/* Record detail */}
      <Slab
        box={{ x0: 22, y0: 51, x1: 80, y1: 84, z: Z_PATTERNS, h: 1.2 }}
        top={SHEET_TOP}
        side={SHEET_SIDE}
      >
        <g strokeWidth={1.4} strokeLinecap="round">
          <Lines
            x={27}
            ys={[57, 63, 69]}
            lengths={[22, 30, 18]}
            z={z}
            className={LINE}
          />
        </g>
      </Slab>
      {/* AI chat panel */}
      <Slab
        box={{ x0: 91, y0: 15, x1: 115, y1: 84, z: Z_PATTERNS, h: 1.2 }}
        top="fill-insight-50 stroke-insight-500 dark:fill-insight-800/70 dark:stroke-insight-400"
        side="fill-insight-100 stroke-insight-500 dark:fill-insight-800 dark:stroke-insight-400"
      >
        <Slab
          box={{ x0: 94, y0: 20, x1: 108, y1: 26, z }}
          top="fill-insight-200 stroke-none dark:fill-insight-600"
        />
        <Slab
          box={{ x0: 98, y0: 30, x1: 112, y1: 36, z }}
          top="fill-card stroke-insight-300 dark:stroke-insight-500"
        />
        <Slab
          box={{ x0: 94, y0: 40, x1: 106, y1: 46, z }}
          top="fill-insight-200 stroke-none dark:fill-insight-600"
        />
      </Slab>
    </g>
  );
}

function Components() {
  const z = Z_COMPONENTS + 1.5;
  const patternTop = Z_PATTERNS + 1.2;
  return (
    <g strokeWidth={0.5} strokeLinejoin="round">
      <Leader x={37} y={24.5} from={Z_COMPONENTS} to={patternTop} />
      <Leader x={62} y={21} from={Z_COMPONENTS} to={patternTop} />
      <Leader x={67} y={65} from={Z_COMPONENTS} to={patternTop} />
      <Leader x={102} y={56} from={Z_COMPONENTS} to={patternTop} />
      {/* Button */}
      <Slab
        box={{ x0: 30, y0: 22, x1: 44, y1: 27, z: Z_COMPONENTS, h: 1.5 }}
        top="fill-primary-700 stroke-primary-800 dark:fill-primary-500 dark:stroke-primary-400"
        side="fill-primary-800 stroke-primary-800 dark:fill-primary-700 dark:stroke-primary-400"
      />
      {/* Input */}
      <Slab
        box={{ x0: 50, y0: 18, x1: 74, y1: 24, z: Z_COMPONENTS, h: 1.5 }}
        top={SHEET_TOP}
        side={SHEET_SIDE}
      >
        <g strokeWidth={1.2} strokeLinecap="round">
          <Lines x={53} ys={[21]} lengths={[9]} z={z} className={LINE} />
        </g>
      </Slab>
      {/* Chart */}
      <Slab
        box={{ x0: 56, y0: 57, x1: 78, y1: 73, z: Z_COMPONENTS, h: 1.5 }}
        top={SHEET_TOP}
        side={SHEET_SIDE}
      >
        <polyline
          className="fill-none stroke-primary-600 dark:stroke-primary-400"
          strokeWidth={1.1}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points([
            [59, 70, z],
            [63, 66, z],
            [67, 68, z],
            [71, 62, z],
            [75, 63.5, z],
          ])}
        />
      </Slab>
      {/* Suggestion chip */}
      <Slab
        box={{ x0: 96, y0: 53, x1: 109, y1: 59, z: Z_COMPONENTS, h: 1.5 }}
        top="fill-insight-500 stroke-insight-600 dark:fill-insight-400 dark:stroke-insight-300"
        side="fill-insight-600 stroke-insight-600 dark:fill-insight-500 dark:stroke-insight-300"
      />
    </g>
  );
}

const LAYERS: { id: LayerId; draw: () => ReactNode }[] = [
  { id: "templates", draw: Templates },
  { id: "surfaces", draw: Surfaces },
  { id: "patterns", draw: Patterns },
  { id: "components", draw: Components },
];

/**
 * The four layers every Vertex page is built from, stacked as one exploded
 * page. Passing `active` lifts that layer and dims the others.
 */
export function LayerStack({ active }: { active: LayerId | null }) {
  return (
    <svg
      viewBox="-82 -36 190 146"
      role="img"
      aria-label="A page exploded into four stacked layers: a dashed floor plan, teal panels, content sheets and small floating components."
      className="h-auto w-full overflow-visible"
    >
      {LAYERS.map(({ id, draw: Draw }, index) => (
        <g
          key={id}
          // Settle the layers into place bottom-up, once, on page load.
          className="animate-in fade-in slide-in-from-top-3 fill-mode-backwards duration-700 ease-out motion-reduce:animate-none"
          style={{ animationDelay: `${index * 140}ms` }}
        >
          <g
            className={`transition-[translate,opacity] duration-300 ease-out motion-reduce:transition-none ${
              active === id ? "-translate-y-[5px]" : active ? "opacity-30" : ""
            }`}
          >
            <Draw />
          </g>
        </g>
      ))}
    </svg>
  );
}

/** A single layer drawn small, used as the key in the layer legend. */
export function LayerGlyph({ id }: { id: LayerId }) {
  const glyphs: Record<LayerId, ReactNode> = {
    templates: (
      <g strokeDasharray="2 1.6" strokeWidth={0.8}>
        <Slab
          box={{ x0: 0, y0: 0, x1: 20, y1: 20, z: 0 }}
          top="fill-none stroke-muted-foreground"
        />
      </g>
    ),
    surfaces: (
      <g strokeWidth={0.8}>
        <Slab
          box={{ x0: 0, y0: 0, x1: 20, y1: 20, z: 0, h: 3 }}
          top={SURFACE_TOP}
          side={SURFACE_SIDE}
        />
      </g>
    ),
    patterns: (
      <g strokeWidth={0.8}>
        <Slab
          box={{ x0: 0, y0: 0, x1: 20, y1: 20, z: 0, h: 1.5 }}
          top={SHEET_TOP}
          side={SHEET_SIDE}
        >
          <g strokeWidth={1.6} strokeLinecap="round">
            <Lines
              x={4}
              ys={[6, 11]}
              lengths={[11, 7]}
              z={1.5}
              className={LINE}
            />
          </g>
        </Slab>
      </g>
    ),
    components: (
      <g strokeWidth={0.8}>
        <Slab
          box={{ x0: 3, y0: 6, x1: 17, y1: 13, z: 0, h: 2 }}
          top="fill-primary-700 stroke-primary-800 dark:fill-primary-500 dark:stroke-primary-400"
          side="fill-primary-800 stroke-primary-800 dark:fill-primary-700 dark:stroke-primary-400"
        />
      </g>
    ),
  };

  return (
    <svg
      viewBox="-19 -5 38 27"
      aria-hidden="true"
      className="h-7 w-auto self-start overflow-visible"
    >
      {glyphs[id]}
    </svg>
  );
}

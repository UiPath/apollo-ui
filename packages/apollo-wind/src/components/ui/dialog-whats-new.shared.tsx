// Decorative hero for the "What's New" Modal story: a label-free node graph on a
// perspective-tilted plane, drawn from theme tokens so both themes stay true and
// no image has to be bundled.
import { Bot, Cloud, Cpu, GitBranch, type LucideIcon, Users, Zap } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

interface GraphNode {
  id: string;
  x: number;
  y: number;
  Icon: LucideIcon;
  /** Tailwind gradient stops, e.g. `from-violet-500 to-purple-400`. */
  grad: string;
  /** Entry points read as circles; every other node is a rounded square. */
  trigger?: boolean;
}

const NODES: GraphNode[] = [
  { id: 'a', x: 8, y: 30, Icon: Zap, grad: 'from-violet-500 to-purple-400', trigger: true },
  { id: 'b', x: 32, y: 30, Icon: Bot, grad: 'from-fuchsia-500 to-violet-400' },
  { id: 'c', x: 56, y: 30, Icon: GitBranch, grad: 'from-purple-500 to-indigo-400' },
  { id: 'd', x: 80, y: 30, Icon: Cloud, grad: 'from-violet-400 to-purple-300' },
  { id: 'e', x: 56, y: 66, Icon: Users, grad: 'from-indigo-500 to-violet-400' },
  { id: 'f', x: 80, y: 66, Icon: Cpu, grad: 'from-purple-500 to-fuchsia-400' },
];

const EDGES: Array<[string, string]> = [
  ['a', 'b'],
  ['b', 'c'],
  ['c', 'd'],
  ['c', 'e'],
  ['e', 'f'],
];

const SHADOW = 'shadow-violet-500/40';
/** Half-width of a node in grid units; edges leave and enter at the node sides. */
const NODE_RADIUS = 7;

/** One gradient node. `depth` below 1 pushes it back (smaller, dimmer, softer). */
function Node({
  x,
  y,
  Icon,
  grad,
  trigger,
  depth = 1,
}: Omit<GraphNode, 'id'> & { depth?: number }) {
  const back = depth < 1;
  const style: CSSProperties = {
    left: `${x}%`,
    top: `${y}%`,
    width: 52 * depth,
    height: 52 * depth,
    opacity: back ? 0.55 + depth * 0.3 : 1,
    filter: back ? `blur(${(1 - depth) * 3}px)` : undefined,
  };
  return (
    <span
      style={style}
      className={`absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center bg-linear-to-br text-foreground-on-accent shadow-xl ${SHADOW} ${grad} ${
        trigger ? 'rounded-full' : 'rounded-[30%]'
      }`}
    >
      <Icon size={Math.round(20 * depth)} strokeWidth={1.75} />
    </span>
  );
}

/**
 * Canvas-style routing: an edge leaves the source's right side and enters the
 * target's left side with horizontal tangents at both ends. A target almost
 * straight below its source takes the bottom handle instead, otherwise the edge
 * would loop back on itself.
 */
function edgePath(a: GraphNode, b: GraphNode): string {
  const r = NODE_RADIUS;
  const ry = r * 1.3;
  if (Math.abs(b.x - a.x) < r * 2 && b.y > a.y) {
    const sy = a.y + ry;
    const ty = b.y - ry;
    const my = (sy + ty) / 2;
    return `M ${a.x} ${sy} C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${ty}`;
  }
  const sx = a.x + r;
  const tx = b.x - r;
  const off = Math.max(4, (tx - sx) / 2);
  return `M ${sx} ${a.y} C ${sx + off} ${a.y}, ${tx - off} ${b.y}, ${tx} ${b.y}`;
}

function Edges() {
  const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
      className="absolute inset-0 h-full w-full text-violet-300"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
    >
      {EDGES.map(([from, to]) => {
        const d = edgePath(byId[from], byId[to]);
        return (
          // A wide soft pass under a thin bright one gives the glow.
          <g key={`${from}-${to}`}>
            <path d={d} strokeWidth="6" className="opacity-25" vectorEffect="non-scaling-stroke" />
            <path d={d} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </g>
        );
      })}
    </svg>
  );
}

/** The tilted plane: a dotted grid fading out at its edges, graph on top. */
function Plane({ children }: { children: ReactNode }) {
  return (
    <div
      style={{ transform: 'rotateX(28deg) rotateY(-16deg) rotateZ(5deg)' }}
      className="absolute inset-x-[4%] inset-y-[10%] [transform-style:preserve-3d]"
    >
      <div className="pointer-events-none absolute -inset-[12%] opacity-40 [background-image:radial-gradient(circle,var(--foreground-muted)_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]" />
      {children}
    </div>
  );
}

/** A branching process on a plane receding into the distance, in purple. */
export function WhatsNewVisual() {
  return (
    <div aria-hidden className="relative h-full min-h-[268px] [perspective:900px]">
      {/* far behind the plane */}
      <Node x={14} y={82} Icon={Zap} grad="from-violet-500 to-purple-400" depth={0.55} />
      <Node x={90} y={12} Icon={Bot} grad="from-fuchsia-500 to-violet-400" depth={0.45} trigger />
      <Plane>
        <Edges />
        {NODES.map(({ id, ...node }) => (
          <Node key={id} {...node} />
        ))}
      </Plane>
      {/* close, out of focus */}
      <span className="pointer-events-none absolute left-[6%] top-[10%] size-16 rounded-[30%] bg-linear-to-br from-violet-500/70 to-purple-400/70 blur-[3px]" />
      <span className="pointer-events-none absolute left-[70%] top-[86%] size-10 rounded-full bg-linear-to-br from-fuchsia-400/60 to-violet-400/60 blur-[2px]" />
    </div>
  );
}

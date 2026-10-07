import type { TemplateHost } from "@/app/_components/template-hosts";
import {
  type LayoutChoices,
  type LayoutRegion,
  type ResolvedLayout,
  resolveLayout,
} from "@/lib/layout";

/*
 * A picture of the page as composed, for review: no screenshot library,
 * so the template's declared layout is drawn as an SVG diagram, from
 * resolveLayout(), with each slot's name and what it holds, then turned
 * into a PNG. It works for any template. The shell, when it has width,
 * is a column beside the page, as wide as its share of the page.
 */

/** The picture's colors: the theme's, resolved when it's drawn. */
export interface PictureColors {
  background: string;
  foreground: string;
  muted: string;
  border: string;
  mutedForeground: string;
}

/** What the picture shows of a slot: its lines of text, its name first. */
export type SlotWords = (slot: string) => readonly string[];

interface PictureOptions {
  host: TemplateHost;
  layout: LayoutChoices;
  /** The page's width and the shell's, in px; the picture keeps their share. */
  pageWidth: number;
  shellWidth: number;
  shellName: string;
  words: SlotWords;
  colors: PictureColors;
  /** The picture's own size, in px. */
  width?: number;
  height?: number;
}

const GAP = 6;
/** How wide a closed slot's strip is, in the picture. */
const STRIP = 14;

const escape = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/** Where each used track starts and how long it is, along one length. */
function spans(
  tracks: ResolvedLayout["columns"],
  start: number,
  length: number,
  narrow: ReadonlySet<string>,
) {
  const used = tracks.filter((track) => track.used);
  const fixed = used.filter((t) => narrow.has(t.name)).length * STRIP;
  const total = used
    .filter((t) => !narrow.has(t.name))
    .reduce((sum, t) => sum + t.size, 0);
  const free = Math.max(0, length - fixed - GAP * (used.length - 1));
  const out = new Map<string, { at: number; size: number }>();
  let at = start;
  for (const track of used) {
    const size = narrow.has(track.name)
      ? STRIP
      : total
        ? (free * track.size) / total
        : 0;
    out.set(track.name, { at, size });
    at += size + GAP;
  }
  return out;
}

/** The tracks only closed slots sit in, along one axis: drawn as strips. */
function closedOnly(layout: ResolvedLayout, axis: "columns" | "rows") {
  const tracks = layout[axis];
  const index = (name: string) => tracks.findIndex((t) => t.name === name);
  const covers = (region: LayoutRegion, name: string) => {
    const [first, last] = region[axis];
    return index(name) >= index(first) && index(name) <= index(last);
  };
  return new Set(
    tracks
      .filter((track) => {
        const over = layout.regions.filter((r) => covers(r, track.name));
        return over.length > 0 && over.every((r) => !r.open);
      })
      .map((t) => t.name),
  );
}

/** Where a region spans: the used tracks within its first and last. */
const extent = (
  placed: Map<string, { at: number; size: number }>,
  tracks: ResolvedLayout["columns"],
  [first, last]: readonly [string, string],
) => {
  const from = tracks.findIndex((t) => t.name === first);
  const to = tracks.findIndex((t) => t.name === last);
  const inside = tracks
    .slice(from, to + 1)
    .flatMap((t) => placed.get(t.name) ?? []);
  return inside.length > 0 ? [inside[0], inside.at(-1)] : [];
};

/** The page as an SVG diagram, with its slots named and their contents listed. */
export function pictureSvg({
  host,
  layout,
  pageWidth,
  shellWidth,
  shellName,
  words,
  colors,
  width = 1200,
  height = 720,
}: PictureOptions): string {
  const resolved = resolveLayout(host.spec, layout);
  const pad = 16;
  const shell =
    shellWidth > 0 && pageWidth > shellWidth
      ? ((width - pad * 2) * shellWidth) / pageWidth
      : 0;
  const left = pad + (shell ? shell + GAP : 0);
  const columns = spans(
    resolved.columns,
    left,
    width - pad - left,
    closedOnly(resolved, "columns"),
  );
  const rows = spans(
    resolved.rows,
    pad,
    height - pad * 2,
    closedOnly(resolved, "rows"),
  );
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${colors.background}"/>`,
  ];
  if (shell)
    parts.push(
      `<rect x="${pad}" y="${pad}" width="${shell}" height="${height - pad * 2}" rx="8" fill="${colors.muted}" stroke="${colors.border}"/>`,
      `<text x="${pad + 12}" y="${pad + 24}" font-size="14" fill="${colors.mutedForeground}">${escape(shellName)}</text>`,
    );
  for (const region of resolved.regions) {
    const [x0, x1] = extent(columns, resolved.columns, region.columns);
    const [y0, y1] = extent(rows, resolved.rows, region.rows);
    if (!x0 || !x1 || !y0 || !y1) continue;
    const x = x0.at;
    const y = y0.at;
    const w = x1.at + x1.size - x;
    const h = y1.at + y1.size - y;
    parts.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${region.open ? colors.background : colors.muted}" stroke="${colors.border}"${region.open ? "" : ' stroke-dasharray="6 4"'} data-region="${escape(region.slot)}"/>`,
    );
    if (!region.open) continue;
    const [name = "", ...rest] = words(region.slot);
    parts.push(
      `<text x="${x + 14}" y="${y + 26}" font-size="16" font-weight="600" fill="${colors.foreground}">${escape(name)}</text>`,
      ...rest.map(
        (line, index) =>
          `<text x="${x + 14}" y="${y + 50 + index * 22}" font-size="14" fill="${colors.mutedForeground}">${escape(line)}</text>`,
      ),
    );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="system-ui, sans-serif">${parts.join("")}</svg>`;
}

/** An SVG as a PNG, at twice its size, for a sharp picture. */
export async function svgToPng(
  svg: string,
  width: number,
  height: number,
): Promise<Blob> {
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = width * 2;
  canvas.height = height * 2;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No 2D context");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No PNG"));
    }, "image/png");
  });
}

/**
 * Every clip or overflow inside a surface's inner element, measured in the
 * browser. The same rules as the occupant checks
 * (tests/e2e/occupant-inspect.ts): nothing may be wider than its box or
 * outside the surface's padding, except inside a horizontal scroller
 * ([data-scroll-x]), and truncation passes only when the full text stays
 * available in a title or a tooltip. Anything aria-hidden is left out, and
 * decorative layers are hidden while measuring.
 */
const describe = (el: Element) =>
  `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 24)}"`;

export function overflowProblems(box: Element): string[] {
  // Decorative layers (aria-hidden, absolute, no pointer events) may bleed by
  // design: take them out while measuring, as the checks do.
  const decorative = [
    ...box.querySelectorAll<HTMLElement>("[aria-hidden=true]"),
  ].filter((el) => {
    const cs = getComputedStyle(el);
    return (
      cs.pointerEvents === "none" &&
      cs.position === "absolute" &&
      cs.visibility !== "hidden"
    );
  });
  const saved = decorative.map((el) => [el, el.style.display] as const);
  for (const el of decorative) el.style.display = "none";
  try {
    return measure(box);
  } finally {
    for (const [el, display] of saved) el.style.display = display;
  }
}

function measure(box: Element): string[] {
  const inBox = (el: Element | null) => el !== null && box.contains(el);
  const style = getComputedStyle(box);
  const r = box.getBoundingClientRect();
  const bounds = {
    left: r.left + Number.parseFloat(style.paddingLeft),
    right: r.right - Number.parseFloat(style.paddingRight),
  };
  const problems: string[] = [];
  for (const el of box.querySelectorAll("*")) {
    if (el instanceof SVGElement && !(el instanceof SVGSVGElement)) continue;
    // Hidden from assistive tech: decorative, like a glow or a ruler.
    if (inBox(el.closest("[aria-hidden=true]"))) continue;
    const cs = getComputedStyle(el);
    const er = el.getBoundingClientRect();
    if (
      cs.display === "none" ||
      cs.display === "contents" ||
      cs.visibility === "hidden"
    )
      continue;
    if (er.width === 0 || (er.width <= 1 && er.height <= 1)) continue;
    const scroller = el.closest("[data-scroll-x]");
    const inside = scroller !== null && scroller !== el && inBox(scroller);
    const isScroller = el instanceof HTMLElement && "scrollX" in el.dataset;
    if (
      !inside &&
      !isScroller &&
      el.scrollWidth > el.clientWidth + 1 &&
      el.clientWidth > 0
    ) {
      const truncated = cs.textOverflow === "ellipsis";
      const fullText = el.closest("[title], [data-slot=tooltip-trigger]");
      if (!(truncated && fullText)) problems.push(describe(el));
    }
    if (!inside && (er.right > bounds.right + 1 || er.left < bounds.left - 1))
      problems.push(describe(el));
  }
  return [...new Set(problems)];
}

/** Resolves after two frames: long enough for a width change to lay out. */
export const nextLayout = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });

/**
 * Resolves with what `find` returns once it returns something, checking
 * after each layout, or null after `frames` tries. Occupants render once
 * their copy has loaded, a moment after the page.
 */
export async function afterLayout<T>(
  find: () => T | null | undefined,
  frames = 120,
): Promise<T | null> {
  await nextLayout();
  const found = find();
  if (found) return found;
  if (frames <= 1) return null;
  return afterLayout(find, frames - 1);
}

/**
 * Every clip or overflow inside a surface's inner element (the one that
 * holds its padding), as one line each. The occupant checks, measure:occupant,
 * and the occupant workbench all use it.
 *
 * - Nothing may be wider than its box, or outside the surface's padding,
 *   except inside a horizontal scroller ([data-scroll-x]).
 * - Truncated text passes only when the full text stays available, in a
 *   title or a tooltip.
 * - A surface with no room inside its padding clips, whatever it holds.
 * - Anything aria-hidden is left out, and decorative layers (aria-hidden,
 *   absolute, no pointer events) are hidden while measuring: they may bleed
 *   by design.
 * - Endless animations are held at their first frame, as under reduced
 *   motion, where the checks run.
 *
 * Self-contained, with no imports or outer variables, so a test can pass it
 * to page.evaluate.
 */
export function overflowProblems(box: Element): string[] {
  const inBox = (el: Element | null) => el !== null && box.contains(el);
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- the page receives this function as source, so its helpers must live inside it
  const describe = (el: Element) => {
    const slot = el instanceof HTMLElement ? el.dataset.slot : "";
    const text = (el.textContent ?? "").trim().slice(0, 24);
    return `${el.tagName.toLowerCase()}${slot ? `[${slot}]` : ""} "${text}"`;
  };

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
  const hidden = decorative.map((el) => [el, el.style.display] as const);
  for (const el of decorative) el.style.display = "none";
  const endless = box
    .getAnimations({ subtree: true })
    .filter(
      (animation) =>
        animation.effect?.getComputedTiming().endTime ===
        Number.POSITIVE_INFINITY,
    )
    .map((animation) => {
      const at = animation.currentTime;
      const playing = animation.playState === "running";
      animation.pause();
      animation.currentTime = 0;
      return { animation, at, playing };
    });

  try {
    const style = getComputedStyle(box);
    const r = box.getBoundingClientRect();
    const bounds = {
      left: r.left + Number.parseFloat(style.paddingLeft),
      right: r.right - Number.parseFloat(style.paddingRight),
    };
    if (bounds.right - bounds.left < 1 && box.childElementCount > 0)
      return ["no room inside the padding"];
    const problems: string[] = [];
    for (const el of box.querySelectorAll("*")) {
      if (el instanceof SVGElement && !(el instanceof SVGSVGElement)) continue;
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
        if (!(truncated && fullText))
          problems.push(
            `${truncated ? "truncated without a title" : "clipped"} ${describe(el)} (${el.scrollWidth} > ${el.clientWidth})`,
          );
      }
      if (!inside && (er.right > bounds.right + 1 || er.left < bounds.left - 1))
        problems.push(`outside ${describe(el)}`);
    }
    return [...new Set(problems)];
  } finally {
    for (const [el, display] of hidden) el.style.display = display;
    for (const { animation, at, playing } of endless) {
      animation.currentTime = at;
      if (playing) animation.play();
    }
  }
}

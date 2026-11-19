export interface RevealTarget {
  vertical: Element;
  horizontal: Element;
  block: 'start' | 'center';
}

const pxOf = (value: string): number => Number.parseFloat(value) || 0;

/** Scrolls only `scroller`: `vertical`'s top to the padded top (or its middle to the padded middle) and the least sideways move that shows `horizontal` inside the padding. */
export const revealIn = (
  scroller: HTMLElement,
  { vertical, horizontal, block }: RevealTarget
): void => {
  const style = getComputedStyle(scroller);
  const padTop = pxOf(style.scrollPaddingTop);
  const padStart = pxOf(style.scrollPaddingInlineStart);
  const padEnd = pxOf(style.scrollPaddingInlineEnd);
  const rtl = style.direction === 'rtl';
  const padLeft = rtl ? padEnd : padStart;
  const padRight = rtl ? padStart : padEnd;
  const port = scroller.getBoundingClientRect();
  const portTop = port.top + scroller.clientTop;
  const portLeft = port.left + scroller.clientLeft;

  const row = vertical.getBoundingClientRect();
  const rowTop = row.top - portTop;
  const topDelta =
    block === 'start'
      ? rowTop - padTop
      : rowTop + row.height / 2 - (padTop + (scroller.clientHeight - padTop) / 2);

  const span = horizontal.getBoundingClientRect();
  const start = span.left - portLeft - padLeft;
  const end = span.right - portLeft - (scroller.clientWidth - padRight);
  const leftDelta = start < 0 ? start : end > 0 ? Math.min(end, start) : 0;

  scroller.scrollTo({
    top: scroller.scrollTop + topDelta,
    left: scroller.scrollLeft + leftDelta,
  });
};

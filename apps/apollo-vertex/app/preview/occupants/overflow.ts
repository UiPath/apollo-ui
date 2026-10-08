/** Resolves after two frames: long enough for a width change to lay out. */
const nextLayout = () =>
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

/**
 * Resolves once a width change has fully laid out: after layout, and after
 * any transition it started (a side panel animates its width) has finished.
 * Measuring mid-transition reads a box that's still moving.
 */
export async function settled(root: Element): Promise<void> {
  await nextLayout();
  // Only finite ones: a spinner or a pulse never finishes.
  const finite = root
    .getAnimations({ subtree: true })
    .filter(
      (animation) =>
        animation.effect?.getComputedTiming().endTime !==
        Number.POSITIVE_INFINITY,
    );
  await Promise.all(
    finite.map((animation) => animation.finished.catch(() => null)),
  );
  await nextLayout();
}

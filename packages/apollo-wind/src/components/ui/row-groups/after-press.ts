import * as React from 'react';

// Whether a pointer is held down anywhere on the page, while any editor tracks it.
let trackers = 0;
let pressed = false;
const press = () => {
  pressed = true;
};
const release = () => {
  pressed = false;
};

/** Tracks presses for `afterPress` while the calling component is mounted. */
export function usePressTracking() {
  React.useEffect(() => {
    if (trackers++ === 0) {
      window.addEventListener('pointerdown', press, true);
      window.addEventListener('pointerup', release, true);
      window.addEventListener('pointercancel', release, true);
    }
    return () => {
      if (--trackers > 0) return;
      window.removeEventListener('pointerdown', press, true);
      window.removeEventListener('pointerup', release, true);
      window.removeEventListener('pointercancel', release, true);
      pressed = false;
    };
  }, []);
}

/**
 * Runs `effect` now or, while a pointer is held down, once its click has landed. A blur that shows
 * a message moves what sits below it, so a press on a button there would otherwise miss its click.
 */
export function afterPress(effect: () => void) {
  if (!pressed) {
    effect();
    return;
  }
  const done = () => {
    window.removeEventListener('pointerup', done, true);
    window.removeEventListener('pointercancel', done, true);
    // After the click, which follows the release in the same input.
    setTimeout(effect, 0);
  };
  window.addEventListener('pointerup', done, true);
  window.addEventListener('pointercancel', done, true);
}

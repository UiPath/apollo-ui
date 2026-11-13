import type React from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { addConditionOf, cardOf, cellOf, valueChipOf } from './sentenceTargets';
import type { SentenceValueId } from './sentenceTypes';
import type { RuleWindow } from './useRuleWindow';

export interface EditorPlacementParams {
  container: RuleWindow['container'];
  target: SentenceValueId;
}

/** Where the editor overlay sits, in the scroll container's content box. */
export interface EditorPlacement {
  top: number;
  left: number;
}

export interface EditorPlacementResult {
  overlayRef: React.RefObject<HTMLFieldSetElement | null>;
  /** Null until the empty overlay is measured, so the editor mounts and takes focus already placed. */
  placement: EditorPlacement | null;
}

/** What the editor of a value hangs from: its chip, else its cell's first chip, else its rule's add-condition button. */
const anchorOf = (section: HTMLElement, target: SentenceValueId): HTMLElement | undefined => {
  const card = cardOf(section, target.rowId);
  return (
    card &&
    (valueChipOf(card, target) ?? cellOf(card, target.columnId) ?? addConditionOf(card) ?? card)
  );
};

/** Under the anchor, or above it when only that fits, its margin counted, and kept inside the container's width. */
const placementOf = (
  section: HTMLElement | null,
  target: SentenceValueId,
  overlay: HTMLElement
): EditorPlacement => {
  const anchor = section && anchorOf(section, target);
  if (!section || !anchor) return { top: 0, left: 0 };
  const frame = section.getBoundingClientRect();
  const box = anchor.getBoundingClientRect();
  const margin = Number.parseFloat(getComputedStyle(overlay).marginTop) || 0;
  const height = overlay.offsetHeight + margin;
  const fitsBelow = box.bottom + height <= frame.top + section.clientHeight;
  const fitsAbove = box.top - height >= frame.top;
  const top = fitsBelow || !fitsAbove ? box.bottom : box.top - height - margin;
  const left = Math.min(box.left - frame.left, section.clientWidth - overlay.offsetWidth);
  return {
    top: top - frame.top + section.scrollTop,
    left: Math.max(0, left) + section.scrollLeft,
  };
};

const samePlacement = (left: EditorPlacement | null, right: EditorPlacement): boolean =>
  left?.top === right.top && left?.left === right.left;

/** Places the editor overlay at its value after every render, and again when the container or the overlay resizes, anything in the container scrolls, or a web font loads. */
export const useEditorPlacement = ({
  container,
  target,
}: EditorPlacementParams): EditorPlacementResult => {
  const overlayRef = useRef<HTMLFieldSetElement | null>(null);
  const [placement, setPlacement] = useState<EditorPlacement | null>(null);
  const targetRef = useRef(target);
  targetRef.current = target;
  const place = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const next = placementOf(container(), targetRef.current, overlay);
    setPlacement((current) => (samePlacement(current, next) ? current : next));
  }, [container]);

  useLayoutEffect(() => place());

  useLayoutEffect(() => {
    const section = container();
    const overlay = overlayRef.current;
    const resizes = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(place);
    if (section) resizes?.observe(section);
    if (overlay) resizes?.observe(overlay);
    let frame = 0;
    const placeNextFrame = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };
    section?.addEventListener('scroll', placeNextFrame, true);
    const fonts = document.fonts;
    fonts?.addEventListener('loadingdone', placeNextFrame);
    return () => {
      resizes?.disconnect();
      section?.removeEventListener('scroll', placeNextFrame, true);
      fonts?.removeEventListener('loadingdone', placeNextFrame);
      cancelAnimationFrame(frame);
    };
  }, [container, place]);

  return { overlayRef, placement };
};

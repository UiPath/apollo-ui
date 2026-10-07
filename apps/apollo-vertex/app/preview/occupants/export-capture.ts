import { domToCanvas } from "modern-screenshot";

/*
 * Export's picture: the page frame as composed, captured from the page
 * itself. Only the frame, never the workbench around it, and as Preview
 * shows it: at its real size, whatever the stage's zoom, not faded as
 * Edit fades it (Edit's outlines sit outside the frame). At twice the
 * pixels, in the theme it's in, with its fonts embedded.
 */

/** The pixel density of the picture. */
export const CAPTURE_SCALE = 2;

/** The page frame on the template view's stage. */
const pageFrame = () =>
  document.querySelector<HTMLElement>("[data-slot=workbench-page]");

/** The next frame, twice: layout and paint have caught up. */
const settled = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });

export interface Capture {
  /** A PNG data URL, for the thumbnail. */
  url: string;
  /** The same PNG, for the download. */
  blob: Blob;
  /** Its size in pixels: the page's, at CAPTURE_SCALE. */
  width: number;
  height: number;
}

/** The page frame, captured as Preview shows it, once fonts and layout settle. */
export async function capturePage(): Promise<Capture | null> {
  const frame = pageFrame();
  if (!frame) return null;
  await document.fonts.ready;
  await settled();
  // Its real size: the stage scales it, but its layout box isn't scaled.
  const width = frame.offsetWidth;
  const height = frame.offsetHeight;
  const canvas = await domToCanvas(frame, {
    width,
    height,
    scale: CAPTURE_SCALE,
    backgroundColor: getComputedStyle(frame).getPropertyValue("--background"),
    // The clone at 100% and unfaded, whatever the stage's zoom and mode.
    style: { scale: "none", transform: "none", opacity: "1" },
  });
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
  if (!blob) return null;
  return {
    url: canvas.toDataURL("image/png"),
    blob,
    width: canvas.width,
    height: canvas.height,
  };
}

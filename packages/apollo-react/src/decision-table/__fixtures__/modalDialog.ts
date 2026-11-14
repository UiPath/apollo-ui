import { fireEvent } from '@testing-library/react';

const openDialogIn = (root: Document | ShadowRoot): HTMLDialogElement | undefined =>
  [...root.querySelectorAll<HTMLDialogElement>('dialog[open]')].at(-1);

const openDialogFor = (event: Event): HTMLDialogElement | undefined => {
  for (const node of event.composedPath()) {
    if (node instanceof ShadowRoot) {
      const dialog = openDialogIn(node);
      if (dialog) return dialog;
    }
  }
  return openDialogIn(document);
};

/** Stands in for the browser's close request, which happy-dom lacks: an unprevented Escape fires `cancel` at the open dialog and closes it unless that is prevented. */
export const installEscapeCloseRequest = (): (() => void) => {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    if (event.isComposing || event.keyCode === 229) return;
    const dialog = openDialogFor(event);
    if (!dialog) return;
    const cancel = new Event('cancel', { cancelable: true });
    if (dialog.dispatchEvent(cancel) && dialog.isConnected) dialog.close();
  };
  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
};

/** Presses a dialog's backdrop: pointerdown, mousedown, then the button's click, all at a point outside its box. */
export const pressOutside = (
  dialog: Element,
  { button = 0, pointerType = 'mouse' }: { button?: number; pointerType?: string } = {}
) => {
  const at = { clientX: -10, clientY: -10, button };
  fireEvent.pointerDown(dialog, { ...at, pointerType });
  fireEvent.mouseDown(dialog, at);
  if (button === 1) fireEvent(dialog, new MouseEvent('auxclick', { ...at, bubbles: true }));
  else if (button === 2) fireEvent.contextMenu(dialog, at);
  else fireEvent.click(dialog, { ...at, detail: 1 });
};

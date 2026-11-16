import { fireEvent } from '@testing-library/react';

const openDialogIn = (root: Document | ShadowRoot): HTMLDialogElement | undefined =>
  [...root.querySelectorAll<HTMLDialogElement>('dialog[open]')].at(-1);

const openDialogFor = (target: EventTarget): HTMLDialogElement | undefined => {
  for (let root = target instanceof Node ? target.getRootNode() : document; ; ) {
    if (!(root instanceof ShadowRoot)) return openDialogIn(document);
    const dialog = openDialogIn(root);
    if (dialog) return dialog;
    root = root.host.getRootNode();
  }
};

/** Stands in for the browser's close request, which happy-dom lacks: once an Escape's dispatch ends unprevented, however far it propagated, `cancel` fires at the open dialog, which closes unless that is prevented. */
export const installEscapeCloseRequest = (): (() => void) => {
  let target: EventTarget = Node.prototype;
  while (!Object.hasOwn(target, 'dispatchEvent')) target = Object.getPrototypeOf(target);
  const dispatch = target.dispatchEvent;
  let depth = 0;
  target.dispatchEvent = function (this: EventTarget, event: Event) {
    depth += 1;
    let result: boolean;
    try {
      result = dispatch.call(this, event);
    } finally {
      depth -= 1;
    }
    if (depth > 0 || event.type !== 'keydown' || !(event instanceof KeyboardEvent)) return result;
    if (event.key !== 'Escape' || event.defaultPrevented) return result;
    const dialog = openDialogFor(this);
    const cancel = new Event('cancel', { cancelable: true });
    if (dialog?.dispatchEvent(cancel) && dialog.isConnected) dialog.close();
    return result;
  };
  return () => {
    target.dispatchEvent = dispatch;
  };
};

/** Stands in for the inertness a modal dialog gives the page, which happy-dom lacks: focus() on an element outside the open dialog does nothing. */
export const installModalInertness = (): (() => void) => {
  const prototype = HTMLElement.prototype;
  const own = Object.getOwnPropertyDescriptor(prototype, 'focus');
  const focus = prototype.focus;
  Object.defineProperty(prototype, 'focus', {
    configurable: true,
    writable: true,
    value(this: HTMLElement, options?: FocusOptions) {
      const dialog = openDialogFor(this);
      let at: Node = this;
      for (let root = at.getRootNode(); root instanceof ShadowRoot && !dialog?.contains(at); ) {
        at = root.host;
        root = at.getRootNode();
      }
      if (!dialog || dialog.contains(at)) focus.call(this, options);
    },
  });
  return () => {
    if (own) Object.defineProperty(prototype, 'focus', own);
    else Reflect.deleteProperty(prototype, 'focus');
  };
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

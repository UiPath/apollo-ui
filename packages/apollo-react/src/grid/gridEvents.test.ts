import type React from 'react';
import { vi } from 'vitest';
import { emptyAreaPressHandler, isBlankContainerPress } from './gridEvents';

const pointerEvent = (
  target: Element,
  currentTarget: HTMLElement,
  init: { button?: number; clientX?: number; clientY?: number } = {}
) =>
  ({
    button: 0,
    clientX: 10,
    clientY: 10,
    ...init,
    target,
    currentTarget,
  }) as unknown as React.PointerEvent<HTMLElement>;

/** jsdom lays nothing out, so an element is given a client box for the scrollbar check to measure against. */
const sized = <T extends HTMLElement>(element: T): T => {
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: 400 });
  Object.defineProperty(element, 'clientHeight', { configurable: true, value: 300 });
  return element;
};

const chrome = (html = '') => {
  const bar = document.createElement('div');
  bar.innerHTML = html;
  document.body.append(bar);
  return bar;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('emptyAreaPressHandler', () => {
  it("reports a primary press on the chrome's own area and on its plain text", () => {
    const onEmptyAreaPress = vi.fn();
    const bar = chrome(`<span id="label">Hit policy</span>`);

    emptyAreaPressHandler(onEmptyAreaPress)(pointerEvent(bar, bar));
    emptyAreaPressHandler(onEmptyAreaPress)(
      pointerEvent(bar.querySelector('#label') as Element, bar)
    );

    expect(onEmptyAreaPress).toHaveBeenCalledTimes(2);
  });

  it('ignores any button but the primary one', () => {
    const onEmptyAreaPress = vi.fn();
    const bar = chrome();

    emptyAreaPressHandler(onEmptyAreaPress)(pointerEvent(bar, bar, { button: 2 }));

    expect(onEmptyAreaPress).not.toHaveBeenCalled();
  });

  // An input group's addon and padding forward to its input, so pressing them is using the control.
  it("ignores a press on a control, an input group's chrome or a tab panel's content", () => {
    const onEmptyAreaPress = vi.fn();
    const bar = chrome(`
      <button><svg id="icon"></svg></button>
      <div role="group"><span id="addon"></span><input /></div>
      <div role="tabpanel"><p id="content"></p></div>
    `);

    for (const id of ['icon', 'addon', 'content']) {
      emptyAreaPressHandler(onEmptyAreaPress)(
        pointerEvent(bar.querySelector(`#${id}`) as Element, bar)
      );
    }

    expect(onEmptyAreaPress).not.toHaveBeenCalled();
  });

  it("ignores a press on the chrome's scrollbar", () => {
    const onEmptyAreaPress = vi.fn();
    const bar = sized(chrome());

    emptyAreaPressHandler(onEmptyAreaPress)(pointerEvent(bar, bar, { clientX: 100, clientY: 305 }));
    expect(onEmptyAreaPress).not.toHaveBeenCalled();

    emptyAreaPressHandler(onEmptyAreaPress)(pointerEvent(bar, bar, { clientX: 100, clientY: 200 }));
    expect(onEmptyAreaPress).toHaveBeenCalledTimes(1);
  });

  // React bubbles a portaled menu's events through the component that rendered it.
  it("ignores a press from outside the chrome's DOM", () => {
    const onEmptyAreaPress = vi.fn();
    const bar = chrome();
    const portaledMenu = chrome();

    emptyAreaPressHandler(onEmptyAreaPress)(pointerEvent(portaledMenu, bar));

    expect(onEmptyAreaPress).not.toHaveBeenCalled();
  });
});

describe('isBlankContainerPress', () => {
  it("is the container's own space, not its content or its scrollbar", () => {
    const container = sized(chrome(`<table id="table"></table>`));

    expect(
      isBlankContainerPress(pointerEvent(container, container, { clientX: 100, clientY: 200 }))
    ).toBe(true);
    expect(
      isBlankContainerPress(pointerEvent(container.querySelector('#table') as Element, container))
    ).toBe(false);
    expect(
      isBlankContainerPress(pointerEvent(container, container, { clientX: 405, clientY: 200 }))
    ).toBe(false);
  });
});

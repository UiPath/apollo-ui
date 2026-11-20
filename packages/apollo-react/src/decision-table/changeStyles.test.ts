import {
  CELL_CHANGE_CLASS,
  CELL_MARK_CLASS,
  HEADER_CHANGE_CLASS,
  ROW_GUTTER_CHANGE_CLASS,
  ROW_GUTTER_MARK_CLASS,
} from './gridStyles';
import type { MarkChange } from './marks';
import { CHANGED_CHIP_CLASS, ROW_CHANGE_CLASS } from './sentenceStyles';

/**
 * Tailwind finds classes only as literal strings, so the change washes are written out in each
 * class rather than shared as constants; these tests hold the copies to one another instead.
 */

const utilities = (classes: string) => classes.split(/\s+/).filter(Boolean);

/** The washes a class paints for `change`, wherever the variant puts it. */
const washesFor = (classes: string, change: MarkChange) =>
  new Set(
    utilities(classes)
      .filter((utility) => utility.includes(`data-[change=${change}]`))
      .map((utility) => utility.match(/bg-\[color-mix\([^\]]+\)\]/)?.[0])
      .filter((wash): wash is string => wash !== undefined)
  );

describe('the change washes', () => {
  it.each([
    [
      'add',
      [
        CELL_CHANGE_CLASS,
        HEADER_CHANGE_CLASS,
        ROW_GUTTER_CHANGE_CLASS,
        CHANGED_CHIP_CLASS,
        ROW_CHANGE_CLASS,
      ],
    ],
    ['update', [CELL_CHANGE_CLASS, HEADER_CHANGE_CLASS, CHANGED_CHIP_CLASS]],
    [
      'delete',
      [
        CELL_CHANGE_CLASS,
        HEADER_CHANGE_CLASS,
        ROW_GUTTER_CHANGE_CLASS,
        CHANGED_CHIP_CLASS,
        ROW_CHANGE_CLASS,
      ],
    ],
  ] as const)('paint %s in one hue in the grid and the text view', (change, classes) => {
    const washes = new Set(classes.flatMap((each) => [...washesFor(each, change)]));
    expect(washes.size).toBe(1);
  });
});

describe('which mark paints a cell', () => {
  /**
   * jsdom applies no Tailwind, so these read the selectors: each wash must carry the guard that keeps
   * it off the cells another wash owns, or two would match one cell and the order Tailwind emits them
   * in would pick the winner.
   */
  const backgrounds = (classes: string) =>
    utilities(classes).filter((utility) => utility.includes(':bg-'));

  it("leaves a cell with a change of its own to that change, not its row's", () => {
    const rowWashes = backgrounds(CELL_CHANGE_CLASS).filter((utility) =>
      utility.startsWith('group-data-[change=')
    );
    expect(rowWashes).not.toHaveLength(0);
    for (const utility of rowWashes) expect(utility).toContain(':not-data-[change]:');
  });

  it('leaves a cell under review to the change, not to a tone', () => {
    const toneWashes = backgrounds(CELL_MARK_CLASS);
    expect(toneWashes).toHaveLength(6);
    for (const utility of toneWashes) {
      expect(utility).toContain('[data-change],[data-change=add]_*,[data-change=delete]_*');
    }
  });

  it("leaves a changed row's gutter rail to the change, not to a tone", () => {
    const toneRails = utilities(ROW_GUTTER_MARK_CLASS).filter((utility) =>
      utility.startsWith('group-data-[tone=')
    );
    expect(toneRails).not.toHaveLength(0);
    for (const utility of toneRails) expect(utility).toContain('group-not-data-[change]/row:');
  });
});

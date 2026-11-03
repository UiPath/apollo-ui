import { groupColumnRuns } from './DecisionTable';
import type { GridColumn, GridColumnGroup, VisibleGridColumn } from './gridTypes';

const inputs: GridColumnGroup = { id: 'inputs', label: 'Inputs' };
const outputs: GridColumnGroup = { id: 'outputs', label: 'Outputs' };
const columns: GridColumn[] = [
  { id: 'a0', name: 'a0', defaultWidth: 100, group: inputs },
  { id: 'a1', name: 'a1', defaultWidth: 100, group: inputs },
  { id: 'a2', name: 'a2', defaultWidth: 100, group: inputs },
  { id: 'b0', name: 'b0', defaultWidth: 100, group: outputs },
];

const mounted = (flexIndex: number): VisibleGridColumn => ({
  type: 'column',
  column: columns[flexIndex]!,
  flexIndex,
  windowIndex: flexIndex,
  omitBorders: [],
});
const spacer = (...coveredIds: string[]): VisibleGridColumn => ({
  type: 'spacer',
  widthPx: 100 * coveredIds.length,
  coveredIds,
  separatorPx: 0,
});

const groupRuns = (
  visible: VisibleGridColumn[],
  pinnedLeftPxOf: (flexIndex: number) => number | undefined = () => undefined
) =>
  groupColumnRuns(columns, visible, pinnedLeftPxOf).flatMap((run) =>
    run.type === 'group'
      ? [
          {
            group: run.group.id,
            first: run.first.id,
            isFirstRunOfGroup: run.isFirstRunOfGroup,
            startsGroup: run.startsGroup,
            endsGroup: run.endsGroup,
          },
        ]
      : []
  );

describe('groupColumnRuns', () => {
  it('gives a band split by a spacer its start on the first run and its end on the last', () => {
    expect(groupRuns([mounted(0), spacer('a1'), mounted(2), mounted(3)])).toEqual([
      {
        group: 'inputs',
        first: 'a0',
        isFirstRunOfGroup: true,
        startsGroup: true,
        endsGroup: false,
      },
      {
        group: 'inputs',
        first: 'a2',
        isFirstRunOfGroup: false,
        startsGroup: false,
        endsGroup: true,
      },
      {
        group: 'outputs',
        first: 'b0',
        isFirstRunOfGroup: true,
        startsGroup: true,
        endsGroup: true,
      },
    ]);
  });

  it('gives a band split by the pinned boundary its start and end on either side of it', () => {
    const pinnedFirst = (flexIndex: number) => (flexIndex === 0 ? 0 : undefined);
    expect(groupRuns([mounted(0), mounted(1), mounted(2), mounted(3)], pinnedFirst)).toEqual([
      {
        group: 'inputs',
        first: 'a0',
        isFirstRunOfGroup: true,
        startsGroup: true,
        endsGroup: false,
      },
      {
        group: 'inputs',
        first: 'a1',
        isFirstRunOfGroup: false,
        startsGroup: false,
        endsGroup: true,
      },
      {
        group: 'outputs',
        first: 'b0',
        isFirstRunOfGroup: true,
        startsGroup: true,
        endsGroup: true,
      },
    ]);
  });

  it('does not start a band scrolled past its first column, though its run is the first mounted', () => {
    expect(groupRuns([spacer('a0'), mounted(1), mounted(2), mounted(3)])).toEqual([
      {
        group: 'inputs',
        first: 'a1',
        isFirstRunOfGroup: true,
        startsGroup: false,
        endsGroup: true,
      },
      {
        group: 'outputs',
        first: 'b0',
        isFirstRunOfGroup: true,
        startsGroup: true,
        endsGroup: true,
      },
    ]);
  });
});

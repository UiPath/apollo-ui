'use client';

import { Link } from '@tanstack/react-router';
import type {
  ColumnDef,
  ColumnFiltersState,
  ExpandedState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import { ChevronRightIcon, Play, PlayCircle, Square, Trash2 } from 'lucide-react';
/* eslint-disable max-lines -- page-level view composition */
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderNav,
  PageHeaderTitle,
  PageHeaderTitleGroup,
} from '@/components/ui/page-header';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { renderValueOrEmptyState } from '@/lib/renderValueOrEmptyState';
import { defaultRunStatusLabels, defaultTestStatusLabels } from './constants';
import { useSolutionTestsConfig } from './context';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { KpiBar } from './kpi-bar';
import { RunConfirmDialog } from './run-confirm-dialog';
import { runStatusBadgeMap, testStatusBadgeMap } from './status-maps';
import type { SolutionTestsTab } from './tabs';
import type { SolutionTest, SolutionTestBatchRun } from './types';
import { SolutionTestStatus } from './types';
import { UserMessagesIcon } from './user-messages-view';
import { isRunDone } from './utils';

export type TabValue = SolutionTestsTab;

/** The pending run awaiting confirmation: all active tests, a single test, or the selected tests. */
export type RunConfirmTarget =
  | { mode: 'all' }
  | { mode: 'test'; testId: string }
  | { mode: 'selected'; testIds: string[] };

/**
 * The apollo-vertex DataTable is controlled — the caller owns table state.
 * This bundles the minimum state each table needs (in-memory, no persistence)
 * so the view stays self-contained with no extra hook dependency.
 */
function useControlledTable(initialSorting: SortingState = []) {
  const [sorting, onSortingChange] = useState<SortingState>(initialSorting);
  const [columnFilters, onColumnFiltersChange] = useState<ColumnFiltersState>([]);
  const [columnVisibility, onColumnVisibilityChange] = useState<VisibilityState>({});
  const [columnOrder, onColumnOrderChange] = useState<string[]>([]);
  const [globalFilter, onGlobalFilterChange] = useState('');
  const [pagination, onPaginationChange] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [expanded, onExpandedChange] = useState<ExpandedState>({});
  const [rowSelection, onRowSelectionChange] = useState<RowSelectionState>({});
  return {
    sorting,
    onSortingChange,
    columnFilters,
    onColumnFiltersChange,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    globalFilter,
    onGlobalFilterChange,
    pagination,
    onPaginationChange,
    expanded,
    onExpandedChange,
    rowSelection,
    onRowSelectionChange,
  };
}

export interface SolutionTestsViewProps {
  tests: SolutionTest[];
  batchRuns: SolutionTestBatchRun[];
  loading: boolean;
  error?: string;
  hasActiveRuns: boolean;
  runningAll: boolean;
  runningSelected: boolean;
  runningTestId: string | null;
  togglingTestId: string | null;
  isDeleting: boolean;
  forceStoppingBatchId: string | null;
  deleteConfirmId: string | null;
  setDeleteConfirmId: (id: string | null) => void;
  runConfirm: RunConfirmTarget | null;
  setRunConfirm: (target: RunConfirmTarget | null) => void;
  /** Confirms the pending run (the run-confirmation dialog's primary action). */
  onConfirmRun: () => void;
  onToggleActive: (testId: string, newValue: boolean) => void;
  onDeleteTest: (testId: string) => void;
  onForceStopBatch: (batchId: string) => void;
  /** Renders the expanded content for a test case row (baseline agents). */
  renderExpandedTest: (test: SolutionTest) => ReactNode;
  /** Renders the expanded content for a batch-run row (per-run results). */
  renderExpandedRun: (batch: SolutionTestBatchRun) => ReactNode;
  /** Controlled active tab; falls back to internal state when omitted. */
  activeTab?: TabValue;
  /** Notified when the active tab changes (pair with `activeTab` to control). */
  onTabChange?: (tab: TabValue) => void;
}

export const SolutionTestsView = ({
  tests,
  batchRuns,
  loading,
  error,
  hasActiveRuns,
  runningAll,
  runningSelected,
  runningTestId,
  togglingTestId,
  isDeleting,
  forceStoppingBatchId,
  deleteConfirmId,
  setDeleteConfirmId,
  runConfirm,
  setRunConfirm,
  onConfirmRun,
  onToggleActive,
  onDeleteTest,
  onForceStopBatch,
  renderExpandedTest,
  renderExpandedRun,
  activeTab: activeTabProp,
  onTabChange,
}: SolutionTestsViewProps) => {
  const { t } = useTranslation();
  const config = useSolutionTestsConfig();
  const [internalTab, setInternalTab] = useState<TabValue>('cases');
  const activeTab = activeTabProp ?? internalTab;
  const handleTabChange = (tab: TabValue) => {
    // When controlled, `activeTab` resolves to the prop so this is ignored.
    setInternalTab(tab);
    onTabChange?.(tab);
  };
  const casesTable = useControlledTable();
  // Runs default to newest-first by run date; the user can re-sort.
  const runsTable = useControlledTable([{ id: 'StartedAt', desc: true }]);
  // `getRowId` is the test `Id`, so selection keys are test ids directly.
  const selectedTestIds = Object.keys(casesTable.rowSelection).filter(
    (id) => casesTable.rowSelection[id],
  );

  const testCasesColumns: ColumnDef<SolutionTest>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          aria-label={t('select_all')}
          checked={
            table.getIsAllRowsSelected()
              ? true
              : table.getIsSomeRowsSelected()
                ? 'indeterminate'
                : false
          }
          onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
        />
      ),
      size: 48,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <Checkbox
          aria-label={t('select_row')}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      id: 'expand',
      header: () => null,
      size: 48,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={row.getIsExpanded() ? t('collapse') : t('expand')}
          onClick={(e) => {
            e.stopPropagation();
            row.toggleExpanded();
          }}
        >
          <ChevronRightIcon
            className={`size-4 transition-transform ${row.getIsExpanded() ? 'rotate-90' : ''}`}
          />
        </Button>
      ),
    },
    {
      accessorKey: 'TestName',
      meta: { displayName: t('test_name') },
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('test_name')} />,
      cell: ({ row }) => {
        const test = row.original;
        const href = config.getSubjectHref?.(test);
        const label = test.TestName ?? test.Id;
        return href ? (
          <Link
            to={href}
            className="text-sm font-medium text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {label}
          </Link>
        ) : (
          <span className="text-sm font-medium">{label}</span>
        );
      },
      enableSorting: true,
    },
    ...config.subjectColumns,
    {
      accessorKey: 'VerticalSolutionVersion',
      meta: { displayName: t('version') },
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('version')} />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.VerticalSolutionVersion ?? '-'}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'Status',
      meta: { displayName: t('status') },
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('status')} />,
      cell: ({ row }) => (
        <Badge variant="secondary" status={testStatusBadgeMap[row.original.Status] ?? 'info'}>
          {defaultTestStatusLabels[row.original.Status] ?? 'Unknown'}
        </Badge>
      ),
      enableSorting: true,
    },
    {
      id: 'testMessages',
      header: () => null,
      enableSorting: false,
      size: 24,
      cell: ({ row }) => <UserMessagesIcon messages={row.original.UserMessages} />,
    },
    {
      id: 'actions',
      header: () => (
        <span className="text-xs font-semibold text-muted-foreground">{t('actions')}</span>
      ),
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const test = row.original;
        const isRunning = runningTestId === test.Id;
        const isDisabling = togglingTestId === test.Id;
        const isReady = test.Status === SolutionTestStatus.Ready;

        return (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!isReady || isRunning || runningAll || hasActiveRuns}
                    onClick={() => setRunConfirm({ mode: 'test', testId: test.Id })}
                  >
                    {isRunning ? <Spinner className="size-3" /> : <Play className="size-3" />}
                    {t('run')}
                  </Button>
                </span>
              </TooltipTrigger>
              {hasActiveRuns && <TooltipContent>{t('runs_in_progress')}</TooltipContent>}
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center">
                  <Switch
                    aria-label={test.IsActive === false ? t('disabled') : t('enabled')}
                    checked={test.IsActive !== false}
                    disabled={isDisabling}
                    onCheckedChange={(val) => onToggleActive(test.Id, val)}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {test.IsActive === false ? t('disabled') : t('enabled')}
              </TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('delete')}
              disabled={isDeleting}
              onClick={() => setDeleteConfirmId(test.Id)}
            >
              <Trash2 className="size-3 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];

  const testRunsColumns: ColumnDef<SolutionTestBatchRun>[] = [
    {
      id: 'expand',
      header: () => null,
      size: 48,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={row.getIsExpanded() ? t('collapse') : t('expand')}
          onClick={(e) => {
            e.stopPropagation();
            row.toggleExpanded();
          }}
        >
          <ChevronRightIcon
            className={`size-4 transition-transform ${row.getIsExpanded() ? 'rotate-90' : ''}`}
          />
        </Button>
      ),
    },
    {
      id: 'StartedAt',
      accessorFn: (row) => row.StartedAt ?? row.CreateTime,
      meta: { displayName: t('run_date') },
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('run_date')} />,
      cell: ({ row }) => (
        <span className="text-sm">
          {renderValueOrEmptyState(row.original.StartedAt ?? row.original.CreateTime, {
            type: 'datetime',
          })}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'VerticalSolutionVersion',
      meta: { displayName: t('version') },
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('version')} />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.VerticalSolutionVersion ?? '-'}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: 'testsPassed',
      header: () => (
        <span className="text-xs font-semibold text-muted-foreground">
          {config.subjectNoun
            ? t('subject_passed', { subject: config.subjectNoun.plural })
            : t('tests_passed')}
        </span>
      ),
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm">
          {`${row.original.TestsPassed ?? 0}/${row.original.TestsTotal ?? 0}`}
        </span>
      ),
    },
    {
      accessorKey: 'Status',
      meta: { displayName: t('status') },
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('status')} />,
      cell: ({ row }) => (
        <Badge variant="secondary" status={runStatusBadgeMap[row.original.Status] ?? 'info'}>
          {defaultRunStatusLabels[row.original.Status] ?? 'Unknown'}
        </Badge>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'OverallScore',
      meta: { displayName: t('overall_score') },
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('overall_score')} />,
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {renderValueOrEmptyState(row.original.OverallScore, {
            type: 'number',
            options: { style: 'percent', maximumFractionDigits: 0 },
          })}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: 'messages',
      header: () => null,
      enableSorting: false,
      size: 24,
      cell: ({ row }) => <UserMessagesIcon messages={row.original.UserMessages} />,
    },
    {
      id: 'actions',
      header: () => (
        <span className="text-xs font-semibold text-muted-foreground">{t('actions')}</span>
      ),
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const batch = row.original;
        if (isRunDone(batch.Status)) return null;
        const isStopping = forceStoppingBatchId === batch.Id;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              disabled={isStopping}
              onClick={() => onForceStopBatch(batch.Id)}
            >
              {isStopping ? <Spinner className="size-3" /> : <Square className="size-3" />}
              {t('force_stop')}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col">
      <PageHeader>
        <PageHeaderNav>
          <PageHeaderTitleGroup>
            <PageHeaderTitle>{t('solution_tests')}</PageHeaderTitle>
          </PageHeaderTitleGroup>
          {hasActiveRuns && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              {t('runs_in_progress')}
            </div>
          )}
        </PageHeaderNav>
        <PageHeaderActions>
          <Button
            variant="outline"
            disabled={
              selectedTestIds.length === 0 ||
              runningSelected ||
              runningAll ||
              loading ||
              hasActiveRuns
            }
            onClick={() => setRunConfirm({ mode: 'selected', testIds: selectedTestIds })}
          >
            {runningSelected ? <Spinner className="size-4" /> : <Play className="size-4" />}
            {t('run_selected', { count: selectedTestIds.length })}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  disabled={runningAll || loading || tests.length === 0 || hasActiveRuns}
                  onClick={() => setRunConfirm({ mode: 'all' })}
                >
                  {runningAll ? <Spinner className="size-4" /> : <PlayCircle className="size-4" />}
                  {t('run_all')}
                </Button>
              </span>
            </TooltipTrigger>
            {hasActiveRuns && <TooltipContent>{t('runs_in_progress')}</TooltipContent>}
          </Tooltip>
        </PageHeaderActions>
      </PageHeader>

      <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-4 px-4 sm:px-6 lg:px-8 pb-4">
        {error && (
          <div className="col-span-4 sm:col-span-8 lg:col-span-12">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <div className="col-span-4 sm:col-span-8 lg:col-span-12">
          <KpiBar batchRuns={batchRuns} loading={loading} />
        </div>

        <div className="col-span-4 sm:col-span-8 lg:col-span-12">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              if (v === 'cases' || v === 'runs') handleTabChange(v);
            }}
          >
            <TabsList>
              <TabsTrigger value="cases">
                {t('test_cases', { subject: config.subjectNoun?.plural.toLowerCase() ?? 'cases' })}
              </TabsTrigger>
              <TabsTrigger value="runs">{t('test_runs')}</TabsTrigger>
            </TabsList>

            <TabsContent value="cases">
              <DataTable
                {...casesTable}
                columns={testCasesColumns}
                data={tests}
                isLoading={loading}
                getRowId={(row) => row.Id}
                renderExpandedRow={(row) => renderExpandedTest(row.original)}
              />
            </TabsContent>

            <TabsContent value="runs">
              <DataTable
                {...runsTable}
                columns={testRunsColumns}
                data={batchRuns}
                isLoading={loading}
                getRowId={(row) => row.Id}
                renderExpandedRow={(row) => renderExpandedRun(row.original)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {deleteConfirmId != null && (
        <DeleteConfirmDialog
          open
          deleting={isDeleting}
          onConfirm={() => {
            if (deleteConfirmId != null) onDeleteTest(deleteConfirmId);
          }}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}

      {runConfirm != null && (
        <RunConfirmDialog
          open
          confirmLabel={
            runConfirm.mode === 'all'
              ? t('run_all')
              : runConfirm.mode === 'selected'
                ? t('run_selected', { count: runConfirm.testIds.length })
                : t('run')
          }
          onConfirm={onConfirmRun}
          onCancel={() => setRunConfirm(null)}
        />
      )}
    </div>
  );
};

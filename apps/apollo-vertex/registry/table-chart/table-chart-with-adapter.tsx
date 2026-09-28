import { useIsFetching, useSuspenseQuery } from "@tanstack/react-query";
import { useDeferredValue } from "react";
import { useTranslation } from "react-i18next";
import {
  ChartLoadingBoundary,
  type DataAdapter,
  dataTypeAlignment,
  format,
  SpinnerWithChildren,
  type TableChartConfiguration,
  type TableChartData,
  type TableChartState,
  type TableDataModel,
  type TableDataModelField,
} from "@/lib/charts-core";
import {
  TableChart,
  type TableChartColumn,
  type TableChartSort,
} from "./table-chart-view";

const DEFAULT_TABLE_STATE: TableChartState = { sortBy: null };

export interface TableChartWithAdapterProps {
  configuration: TableChartConfiguration;
  dataModel: TableDataModel;
  dataAdapter: DataAdapter;
  state?: TableChartState;
  onStateChange?: (newState: TableChartState) => void;
}

export function TableChartWithAdapter({
  configuration,
  dataModel,
  dataAdapter,
  state = DEFAULT_TABLE_STATE,
  onStateChange,
}: TableChartWithAdapterProps) {
  return (
    <ChartLoadingBoundary configuration={configuration} dataModel={dataModel}>
      <TableChartResolver
        configuration={configuration}
        dataModel={dataModel}
        dataAdapter={dataAdapter}
        state={state}
        onStateChange={onStateChange}
      />
    </ChartLoadingBoundary>
  );
}

function TableChartResolver({
  configuration,
  dataModel,
  dataAdapter,
  state = DEFAULT_TABLE_STATE,
  onStateChange,
}: TableChartWithAdapterProps) {
  const {
    i18n: { language },
  } = useTranslation();

  const deferrableProps = useDeferredValue({
    configuration,
    dataModel,
    state,
    dataAdapter,
  });
  const query = dataAdapter.charts.table(configuration, dataModel, state);
  const deferredQuery = deferrableProps.dataAdapter.charts.table(
    deferrableProps.configuration,
    deferrableProps.dataModel,
    deferrableProps.state,
  );

  const isFetching = useIsFetching(query) > 0;
  const rows: TableChartData = useSuspenseQuery(deferredQuery).data;

  const fields: TableDataModelField[] = configuration.dimensions
    .map((id) => dataModel.fields.find((f) => f.id === id))
    .filter((f): f is TableDataModelField => f != null);

  const columns: TableChartColumn[] = fields.map((field) => ({
    id: field.id,
    label: field.display,
    align: dataTypeAlignment(field),
    format: (value) =>
      value == null ? "" : (format(language, value, field.type) ?? ""),
  }));

  const sort: TableChartSort | null = state.sortBy
    ? { field: state.sortBy.field, direction: state.sortBy.direction }
    : null;

  return (
    <SpinnerWithChildren loading={isFetching}>
      <TableChart
        columns={columns}
        rows={rows}
        sort={sort}
        onSortChange={(next) =>
          onStateChange?.({
            ...state,
            sortBy: next
              ? { field: next.field, direction: next.direction }
              : null,
          })
        }
      />
    </SpinnerWithChildren>
  );
}

import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

const generateSkeletonKey = (
  type: string,
  rowIndex: number,
  colIndex?: number,
) => `skeleton-${type}-${rowIndex}${colIndex == null ? "" : `-${colIndex}`}`;

function DataTableSkeleton({
  columnCount = 3,
  rowCount = 5,
}: {
  columnCount?: number;
  rowCount?: number;
}) {
  const columns = (rowIndex: number) =>
    Array.from({ length: columnCount }, (_col, colIndex) => (
      <TableCell key={generateSkeletonKey("cell", rowIndex, colIndex)}>
        <Skeleton className="h-4 w-36" />
      </TableCell>
    ));

  return (
    <>
      {Array.from({ length: rowCount }, (_row, rowIndex) => (
        <TableRow key={generateSkeletonKey("row", rowIndex)}>
          {columns(rowIndex)}
        </TableRow>
      ))}
    </>
  );
}

export { DataTableSkeleton };

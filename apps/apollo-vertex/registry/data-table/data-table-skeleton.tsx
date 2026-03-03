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
  return (
    <>
      {Array.from({ length: rowCount }, (_, rowIndex) => (
        <TableRow key={generateSkeletonKey("row", rowIndex)}>
          {Array.from({ length: columnCount }, (_, colIndex) => (
            <TableCell key={generateSkeletonKey("cell", rowIndex, colIndex)}>
              <Skeleton className="h-4 w-36" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export { DataTableSkeleton };

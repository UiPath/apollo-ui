import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export interface FolderCrumb {
  /** The path this crumb jumps to, unique down the trail. */
  key: string;
  label: string;
  stack: string[];
}

export interface FolderBreadcrumbProps {
  crumbs: FolderCrumb[];
  onJump: (stack: string[]) => void;
  /** Accessible name for the breadcrumb's navigation landmark. */
  label?: string;
}

/** The path above the list. Every segment but the last jumps back up. */
export function FolderBreadcrumb({ crumbs, onJump, label = 'breadcrumb' }: FolderBreadcrumbProps) {
  return (
    <Breadcrumb aria-label={label} className="border-b border-border px-3 py-2">
      <BreadcrumbList className="flex-nowrap gap-0.5 overflow-hidden text-xs sm:gap-0.5">
        {crumbs.map((crumb, index) => {
          const isCurrent = index === crumbs.length - 1;
          // The separator is an `<li>` of its own, so it sits beside the item
          // it precedes rather than inside it, where it would nest one list
          // item in another.
          return (
            <Fragment key={crumb.key}>
              {index > 0 && (
                <BreadcrumbSeparator className="shrink-0 text-foreground-subtle [&>svg]:size-3" />
              )}
              <BreadcrumbItem className="min-w-0">
                {isCurrent ? (
                  <BreadcrumbPage className="truncate text-xs font-medium text-foreground">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <button
                      type="button"
                      className="cursor-pointer truncate rounded px-0.5 text-xs text-foreground-muted transition-colors hover:text-foreground"
                      onClick={() => onJump(crumb.stack)}
                    >
                      {crumb.label}
                    </button>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

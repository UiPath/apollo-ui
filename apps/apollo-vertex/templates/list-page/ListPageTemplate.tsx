"use client";

import dynamic from "next/dynamic";
import { ClinicalReviewList } from "./ClinicalReviewList";

function ListPageTemplateContent() {
  // Preview-only: hide the unresolved "{{selected}} of {{total}}" i18n
  // placeholder (real apps provide an i18n instance via ApolloShell's
  // LocaleProvider), and pull pagination nav to the right.
  const previewOnlyClasses =
    "[&_[data-slot=data-table-pagination]>div:first-child]:hidden" +
    " [&_[data-slot=data-table-pagination]>div:last-child]:flex-1" +
    " [&_[data-slot=data-table-pagination]>div:last-child>div:first-child]:mr-auto";
  return (
    <div
      className={`h-full bg-background dark:bg-sidebar overflow-y-auto custom-scrollbar ${previewOnlyClasses}`}
    >
      <ClinicalReviewList />
    </div>
  );
}

export const ListPageTemplate = dynamic(
  () => Promise.resolve(ListPageTemplateContent),
  { ssr: false },
);

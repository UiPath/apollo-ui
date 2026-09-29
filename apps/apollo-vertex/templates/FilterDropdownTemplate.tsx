"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FilterDropdown,
  type FilterDropdownOption,
} from "@/components/ui/filter-dropdown";

// ---------------------------------------------------------------------------
// Multi-select example options
// ---------------------------------------------------------------------------

const statusOptions: FilterDropdownOption[] = [
  { label: "Success", value: "success" },
  { label: "Processing", value: "processing" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
];

// ---------------------------------------------------------------------------
// Single-select example options
// ---------------------------------------------------------------------------

const regionOptions: FilterDropdownOption[] = [
  { label: "North America", value: "na" },
  { label: "Europe", value: "eu" },
  { label: "Asia Pacific", value: "apac" },
  { label: "Latin America", value: "latam" },
];

// ---------------------------------------------------------------------------
// Searchable example (many options)
// ---------------------------------------------------------------------------

const countryOptions: FilterDropdownOption[] = [
  { label: "Argentina", value: "AR" },
  { label: "Australia", value: "AU" },
  { label: "Brazil", value: "BR" },
  { label: "Canada", value: "CA" },
  { label: "China", value: "CN" },
  { label: "France", value: "FR" },
  { label: "Germany", value: "DE" },
  { label: "India", value: "IN" },
  { label: "Japan", value: "JP" },
  { label: "Mexico", value: "MX" },
  { label: "South Korea", value: "KR" },
  { label: "United Kingdom", value: "GB" },
  { label: "United States", value: "US" },
];

// ---------------------------------------------------------------------------
// Async example (paged + server-side search, mocked)
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

const reviewerOptions: FilterDropdownOption[] = Array.from(
  { length: 200 },
  (_, i) => {
    const n = String(i + 1).padStart(3, "0");
    return { label: `Reviewer ${n}`, value: `reviewer-${n}` };
  },
);

interface ReviewerPage {
  items: FilterDropdownOption[];
  hasMore: boolean;
}

function fetchReviewers(
  query: string,
  page: number,
  fail: boolean,
): Promise<ReviewerPage> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (fail) {
        reject(new Error("Simulated network error"));
        return;
      }
      const matches = reviewerOptions.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase()),
      );
      const start = page * PAGE_SIZE;
      resolve({
        items: matches.slice(start, start + PAGE_SIZE),
        hasMore: start + PAGE_SIZE < matches.length,
      });
    }, 600);
  });
}

function AsyncFilterExample() {
  const [selected, setSelected] = useState<string[]>([]);
  const [options, setOptions] = useState<FilterDropdownOption[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [simulateError, setSimulateError] = useState(false);
  // Read at fetch time so toggling doesn't trigger a refetch
  const simulateErrorRef = useRef(false);

  // Fetch the current page; a changed query/page/attempt cancels stale responses
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(false);
    fetchReviewers(query, page, simulateErrorRef.current)
      .then((result) => {
        if (cancelled) return;
        setOptions((prev) =>
          page === 0 ? result.items : [...prev, ...result.items],
        );
        setHasMore(result.hasMore);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, page, attempt]);

  return (
    <div className="flex items-center gap-4">
      <FilterDropdown
        title="Reviewer"
        options={options}
        value={selected}
        onChange={(v) => {
          if (Array.isArray(v)) setSelected(v);
        }}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={() => setPage((p) => p + 1)}
        onSearchChange={(q) => {
          setQuery(q);
          setPage(0);
          setOptions([]);
          setHasMore(false);
        }}
        searchPlaceholder="Search reviewers..."
        error={error}
        onRetry={() => setAttempt((a) => a + 1)}
      />
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Checkbox
          checked={simulateError}
          onCheckedChange={(checked) => {
            simulateErrorRef.current = checked === true;
            setSimulateError(checked === true);
          }}
        />
        Simulate errors
      </label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

function FilterDropdownTemplateContent() {
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [regionFilter, setRegionFilter] = useState<string>("na");
  const [countryFilter, setCountryFilter] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-8 p-6">
      {/* Multi-select */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Multi-select (default)
        </p>
        <FilterDropdown
          title="Status"
          options={statusOptions}
          value={statusFilter}
          onChange={(v) => {
            if (Array.isArray(v)) setStatusFilter(v);
          }}
        />
      </div>

      {/* Single-select */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Single-select
        </p>
        <FilterDropdown
          title="Region"
          options={regionOptions}
          multiSelect={false}
          value={regionFilter}
          onChange={(v) => {
            if (typeof v === "string") setRegionFilter(v);
          }}
        />
      </div>

      {/* Searchable (auto-enabled with 8+ options) */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Searchable (auto-enabled with 8+ options)
        </p>
        <FilterDropdown
          title="Country"
          options={countryOptions}
          value={countryFilter}
          onChange={(v) => {
            if (Array.isArray(v)) setCountryFilter(v);
          }}
        />
      </div>

      {/* Async: paged options, server-side search, loading and error states */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Async (paged + server-side search)
        </p>
        <AsyncFilterExample />
      </div>
    </div>
  );
}

export const FilterDropdownTemplate = dynamic(
  () => Promise.resolve(FilterDropdownTemplateContent),
  { ssr: false },
);

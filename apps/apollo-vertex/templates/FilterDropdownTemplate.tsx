"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
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
          onChange={(v) => setStatusFilter(v as string[])}
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
          onChange={(v) => setRegionFilter(v as string)}
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
          onChange={(v) => setCountryFilter(v as string[])}
        />
      </div>
    </div>
  );
}

export const FilterDropdownTemplate = dynamic(
  () => Promise.resolve(FilterDropdownTemplateContent),
  { ssr: false },
);

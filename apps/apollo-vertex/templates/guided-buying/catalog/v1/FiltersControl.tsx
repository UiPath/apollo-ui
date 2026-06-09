import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  CATALOG_BRANDS,
  CATALOG_CATEGORIES,
  CATALOG_PRICE_MAX,
  CATALOG_PRICE_MIN,
} from "./data";
import type { CatalogCategory, Filters } from "./types";

interface FiltersControlProps {
  filters: Filters;
  activeCount: number;
  onChange: (filters: Filters) => void;
  onClearAll: () => void;
}

/** Toolbar Filters button + anchored overlay panel (live apply). */
export function FiltersControl({
  filters,
  activeCount,
  onChange,
  onClearAll,
}: FiltersControlProps) {
  const toggleBrand = (brand: string, checked: boolean) => {
    onChange({
      ...filters,
      brands: checked
        ? [...filters.brands, brand]
        : filters.brands.filter((b) => b !== brand),
    });
  };

  const toggleCategory = (category: CatalogCategory, checked: boolean) => {
    onChange({
      ...filters,
      categories: checked
        ? [...filters.categories, category]
        : filters.categories.filter((c) => c !== category),
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <SlidersHorizontal className="size-4" />
          Filters
          {activeCount > 0 && (
            <span className="text-muted-foreground">· {activeCount}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[300px] p-0">
        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
          <FilterGroup label="Brand">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              {CATALOG_BRANDS.map((brand) => (
                <CheckRow
                  key={brand}
                  id={`brand-${brand}`}
                  label={brand}
                  checked={filters.brands.includes(brand)}
                  onCheckedChange={(checked) => toggleBrand(brand, checked)}
                />
              ))}
            </div>
          </FilterGroup>

          <Separator />

          <FilterGroup label="Category">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              {CATALOG_CATEGORIES.map((category) => (
                <CheckRow
                  key={category}
                  id={`category-${category}`}
                  label={category}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={(checked) =>
                    toggleCategory(category, checked)
                  }
                />
              ))}
            </div>
          </FilterGroup>

          <Separator />

          <FilterGroup label="Price">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={CATALOG_PRICE_MIN}
                max={CATALOG_PRICE_MAX}
                value={filters.priceMin}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    priceMin: Number(event.target.value) || CATALOG_PRICE_MIN,
                  })
                }
                aria-label="Minimum price"
                className="h-9"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="number"
                min={CATALOG_PRICE_MIN}
                max={CATALOG_PRICE_MAX}
                value={filters.priceMax}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    priceMax: Number(event.target.value) || CATALOG_PRICE_MAX,
                  })
                }
                aria-label="Maximum price"
                className="h-9"
              />
            </div>
          </FilterGroup>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="in-stock-only" className="font-normal">
                In stock only
              </Label>
              <Switch
                id="in-stock-only"
                checked={filters.inStockOnly}
                onCheckedChange={(checked) =>
                  onChange({ ...filters, inStockOnly: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="epp-pricing" className="font-normal">
                EPP pricing
              </Label>
              <Switch
                id="epp-pricing"
                checked={filters.priceBasis === "epp"}
                onCheckedChange={(checked) =>
                  onChange({ ...filters, priceBasis: checked ? "epp" : "list" })
                }
              />
            </div>
          </div>
        </div>

        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={onClearAll}
          >
            Clear all
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2.5 text-xs font-semibold text-muted-foreground">
        {label}
      </h3>
      {children}
    </div>
  );
}

function CheckRow({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <Label
        htmlFor={id}
        className="truncate text-sm font-normal text-foreground"
      >
        {label}
      </Label>
    </div>
  );
}

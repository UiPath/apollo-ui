import { useFocusTrap, useHotkeys } from "@mantine/hooks";
import { ArrowLeft, Check, Plus, X } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { AutopilotIcon } from "@/registry/ai-chat/components/icons/autopilot";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { activePrice, formatPrice, leadTime, showsListStrike } from "./data";
import { usePriceBasis } from "./price-basis-context";
import { BrandMark } from "./ScanRow";
import type { CatalogItem, PriceBasis } from "./types";

const ACCENT = "bg-[#0f7b8a] text-white hover:bg-[#0c6976]";

interface CompareRow {
  label: string;
  values: (string | null)[];
  /** "price" rows get a "best" (lowest) indicator. */
  kind?: "price";
}
interface CompareGroup {
  label: string;
  rows: CompareRow[];
}

function buildGroups(
  products: CatalogItem[],
  basis: PriceBasis,
): CompareGroup[] {
  const groups: CompareGroup[] = [
    {
      label: "Price & source",
      rows: [
        {
          label: "Price",
          kind: "price",
          values: products.map((p) =>
            formatPrice(activePrice(p, basis), p.currency),
          ),
        },
        {
          label: "List price",
          values: products.map((p) =>
            p.eppPrice ? formatPrice(p.listPrice, p.currency) : "—",
          ),
        },
        { label: "Source", values: products.map((p) => p.source) },
        {
          label: "Availability",
          values: products.map((p) =>
            p.inStock ? "In stock" : "Out of stock",
          ),
        },
        { label: "Lead time", values: products.map((p) => leadTime(p)) },
      ],
    },
  ];

  // Spec groups: union of group/row labels in first-seen order.
  const groupOrder: string[] = [];
  for (const p of products) {
    for (const g of p.specGroups ?? []) {
      if (!groupOrder.includes(g.label)) groupOrder.push(g.label);
    }
  }
  for (const groupLabel of groupOrder) {
    const rowOrder: string[] = [];
    for (const p of products) {
      const group = p.specGroups?.find((g) => g.label === groupLabel);
      for (const row of group?.rows ?? []) {
        if (!rowOrder.includes(row.label)) rowOrder.push(row.label);
      }
    }
    groups.push({
      label: groupLabel,
      rows: rowOrder.map((rowLabel) => ({
        label: rowLabel,
        values: products.map(
          (p) =>
            p.specGroups
              ?.find((g) => g.label === groupLabel)
              ?.rows.find((r) => r.label === rowLabel)?.value ?? null,
        ),
      })),
    });
  }
  return groups;
}

interface CompareViewProps {
  products: CatalogItem[];
  /** Items available to add to the comparison. */
  addable: CatalogItem[];
  recommendation: string;
  onClose: () => void;
  onRemove: (item: CatalogItem) => void;
  onAdd: (item: CatalogItem) => void;
  onAddToCart: (item: CatalogItem) => void;
}

/** Full-canvas comparison table (conventional, sticky headers). */
export function CompareView({
  products,
  addable,
  recommendation,
  onClose,
  onRemove,
  onAdd,
  onAddToCart,
}: CompareViewProps) {
  const focusTrapRef = useFocusTrap(true);
  useHotkeys([["Escape", onClose]]);
  const [highlightDiff, setHighlightDiff] = useState(false);
  const [recoOpen, setRecoOpen] = useState(true);

  const restoreRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement | null;
    return () => restoreRef.current?.focus?.();
  }, []);

  const basis = usePriceBasis();
  const groups = buildGroups(products, basis);
  // Lowest price column (best indicator).
  const prices = products.map((p) => activePrice(p, basis));
  const bestPrice = Math.min(...prices);

  return (
    <div
      ref={focusTrapRef}
      role="dialog"
      aria-modal="true"
      aria-label="Compare products"
      className="absolute inset-0 z-30 flex flex-col bg-background"
    >
      <header className="flex items-center justify-between gap-4 border-b px-6 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Back to catalog"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Compare</h1>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="highlight-diff" className="text-sm font-normal">
            Highlight differences
          </Label>
          <Switch
            id="highlight-diff"
            checked={highlightDiff}
            onCheckedChange={setHighlightDiff}
          />
        </div>
      </header>

      {recommendation && recoOpen && (
        <div className="flex items-center gap-2 border-b bg-muted/40 px-6 py-2.5 text-sm">
          <AutopilotIcon
            size={16}
            className="shrink-0 text-[#0f7b8a]"
            aria-hidden
          />
          <p className="flex-1 text-foreground">{recommendation}</p>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setRecoOpen(false)}
            aria-label="Dismiss recommendation"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 w-44 min-w-44 border-b border-r bg-background" />
              {products.map((product) => (
                <th
                  key={product.id}
                  className="sticky top-0 z-20 min-w-56 border-b border-r bg-background p-4 text-left align-top font-normal last:border-r-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <BrandMark item={product} />
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onRemove(product)}
                      aria-label={`Remove ${product.name}`}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                  <div className="mt-2 font-medium text-foreground">
                    {product.name}
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-semibold text-foreground">
                      {formatPrice(
                        activePrice(product, basis),
                        product.currency,
                      )}
                    </span>
                    {showsListStrike(product, basis) && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(product.listPrice, product.currency)}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className={cn("mt-3 w-full", ACCENT)}
                    onClick={() => onAddToCart(product)}
                  >
                    <Plus className="size-4" />
                    Add to cart
                  </Button>
                </th>
              ))}
              {addable.length > 0 && products.length < 4 && (
                <th className="sticky top-0 z-20 min-w-48 border-b bg-background p-4 align-top font-normal">
                  <Select
                    onValueChange={(id) => {
                      const item = addable.find((i) => i.id === id);
                      if (item) onAdd(item);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Add product…" />
                    </SelectTrigger>
                    <SelectContent>
                      {addable.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Group
                key={group.label}
                label={group.label}
                span={products.length}
              >
                {group.rows.map((row) => {
                  const allSame = row.values.every((v) => v === row.values[0]);
                  const dim = highlightDiff && allSame;
                  return (
                    <tr key={row.label} className={cn(dim && "opacity-40")}>
                      <th
                        scope="row"
                        className="sticky left-0 z-10 border-b border-r bg-background p-3 text-left font-normal text-muted-foreground"
                      >
                        {row.label}
                      </th>
                      {products.map((product, index) => {
                        const value = row.values[index];
                        const isBest =
                          row.kind === "price" && prices[index] === bestPrice;
                        return (
                          <td
                            key={product.id}
                            className="border-b border-r p-3 align-top text-foreground last:border-r-0"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              {value ?? "—"}
                              {isBest && (
                                <span className="inline-flex items-center gap-0.5 text-xs font-medium text-[#0f7b8a]">
                                  <Check className="size-3" />
                                  Best
                                </span>
                              )}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </Group>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Group({
  label,
  span,
  children,
}: {
  label: string;
  span: number;
  children: ReactNode;
}) {
  return (
    <>
      <tr>
        <th
          scope="colgroup"
          colSpan={span + 2}
          className="sticky left-0 z-10 border-b bg-muted/60 p-2 px-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {label}
        </th>
      </tr>
      {children}
    </>
  );
}

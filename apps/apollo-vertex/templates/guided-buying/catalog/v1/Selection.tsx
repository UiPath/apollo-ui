"use client";

// oxlint-disable max-lines -- /buy workspace orchestrator; holds the wired state
import { useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Columns3, ShoppingCart, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AutopilotIcon } from "@/registry/ai-chat/components/icons/autopilot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderNav,
  PageHeaderTitle,
  PageHeaderTitleGroup,
} from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import {
  activePrice,
  CATALOG_ITEMS,
  CATALOG_PRICE_MAX,
  CATALOG_PRICE_MIN,
  defaultQuantityFor,
  eppSavings,
  formatPrice,
  RECOMMENDATION,
  SAMPLE_REQUEST,
} from "./data";
import { useCart } from "./cart-context";
import { CartDrawer } from "./CartDrawer";
import { CompareView } from "./CompareView";
import { type FilterChip, FilterChips } from "./FilterChips";
import { NotInCatalogBanner } from "./NotInCatalogBanner";
import { ProductCard } from "./ProductCard";
import { ProductDetail } from "./ProductDetail";
import { ProductDetailOverlay } from "./ProductDetailOverlay";
import { RecommendationCard } from "./RecommendationCard";
import { RailDock } from "./RailDock";
import { PriceBasisProvider } from "./price-basis-context";
import { ScanRow } from "./ScanRow";
import { Toolbar } from "./Toolbar";
import { useRail } from "./useRail";
import { useConversation } from "./conversation-context";
import type {
  CatalogCategory,
  CatalogItem,
  Filters,
  LayoutMode,
  PriceBasis,
  SortKey,
} from "./types";

const MAX_COMPARE = 4;

const DEFAULT_FILTERS: Filters = {
  brands: [],
  categories: [],
  priceMin: CATALOG_PRICE_MIN,
  priceMax: CATALOG_PRICE_MAX,
  // The agent's inferences, promoted to real state.
  inStockOnly: true,
  priceBasis: "epp",
};

// "Clear all" strips every constraint, including the agent's inferences.
const CLEARED_FILTERS: Filters = {
  brands: [],
  categories: [],
  priceMin: CATALOG_PRICE_MIN,
  priceMax: CATALOG_PRICE_MAX,
  inStockOnly: false,
  priceBasis: "list",
};

function sortItems(
  items: CatalogItem[],
  sort: SortKey,
  basis: PriceBasis,
): CatalogItem[] {
  switch (sort) {
    case "price-asc":
      return items.toSorted(
        (a, b) => activePrice(a, basis) - activePrice(b, basis),
      );
    case "price-desc":
      return items.toSorted(
        (a, b) => activePrice(b, basis) - activePrice(a, basis),
      );
    case "name":
      return items.toSorted((a, b) => a.name.localeCompare(b.name));
    // "recommended" — keep curated order
    default:
      return items;
  }
}

/** Whether an item satisfies the active facet filters + search query. */
function matches(item: CatalogItem, filters: Filters, query: string): boolean {
  if (filters.inStockOnly && !item.inStock) return false;
  if (filters.brands.length > 0 && !filters.brands.includes(item.vendor)) {
    return false;
  }
  if (
    filters.categories.length > 0 &&
    !filters.categories.includes(item.category)
  ) {
    return false;
  }
  const price = activePrice(item, filters.priceBasis);
  if (price < filters.priceMin || price > filters.priceMax) return false;
  if (query) {
    const haystack =
      `${item.name} ${item.vendor} ${item.category} ${item.specs.join(" ")}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  return true;
}

interface SelectionProps {
  /** "photo" shows product images; "logo" shows brand logos. */
  imageMode?: "photo" | "logo";
}

/** Selection step of Guided Buying — catalog browse-and-pick (catalog goods only). */
export function Selection({ imageMode = "photo" }: SelectionProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recommended");
  const [layout, setLayout] = useState<LayoutMode>("rows");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [detailSlug, setDetailSlug] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [railUnread, setRailUnread] = useState(false);

  // Cart state lives above the router so Review (a separate route) shares it.
  const {
    quantities,
    count: cartCount,
    open: cartOpen,
    setOpen: setCartOpen,
    inCart,
    setQuantity: addToCart,
  } = useCart();

  // Adding lands the item's default quantity (2 for the recommended item);
  // toggling again removes it. Quantity then lives in cart state everywhere.
  const toggleCart = (item: CatalogItem) =>
    addToCart(item, inCart(item.id) ? 0 : defaultQuantityFor(item));

  // Quantity surfaced on the Add button: cart qty once added, else the qty that
  // adding would land (the request quantity for laptops).
  const addQuantityFor = (item: CatalogItem) =>
    inCart(item.id) ? (quantities[item.id] ?? 1) : defaultQuantityFor(item);
  const rail = useRail();
  const navigate = useNavigate();
  const { addNote } = useConversation();
  const reduceMotion = useReducedMotion();
  const pushedRef = useRef(false);

  // Reflect detail/compare state in the real browser URL (?item / ?compare) so
  // it's shareable and deep-linkable. The shell runs in an in-memory router, so
  // we drive this directly off window.history / popstate.
  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setDetailSlug(params.get("item"));
      const compareParam = params.get("compare");
      if (compareParam) {
        setCompareIds(
          compareParam.split(",").filter(Boolean).slice(0, MAX_COMPARE),
        );
        setCompareOpen(true);
      } else {
        setCompareOpen(false);
      }
      pushedRef.current = false;
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  // Keep the URL in sync as products are added/removed within the compare view.
  useEffect(() => {
    if (compareOpen && compareIds.length > 0) {
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?compare=${compareIds.join(",")}`,
      );
    }
  }, [compareOpen, compareIds]);

  const recommendedItem = CATALOG_ITEMS.find(
    (item) => item.id === RECOMMENDATION.itemId,
  );
  const query = search.trim().toLowerCase();
  // Feature the recommendation only on the default landing, under EPP, and only
  // when it satisfies the active filters — never contradict the filter state.
  const showRecommendation = Boolean(
    sort === "recommended" &&
      query === "" &&
      filters.priceBasis === "epp" &&
      recommendedItem &&
      matches(recommendedItem, filters, query),
  );

  const baseItems = showRecommendation
    ? CATALOG_ITEMS.filter((item) => item.id !== RECOMMENDATION.itemId)
    : CATALOG_ITEMS;
  const gridItems = sortItems(
    baseItems.filter((item) => matches(item, filters, query)),
    sort,
    filters.priceBasis,
  );

  const subtotal = CATALOG_ITEMS.reduce(
    (sum, item) =>
      sum + activePrice(item, filters.priceBasis) * (quantities[item.id] ?? 0),
    0,
  );
  const compareItems = CATALOG_ITEMS.filter((item) =>
    compareIds.includes(item.id),
  );
  const detailItem = detailSlug
    ? (CATALOG_ITEMS.find((item) => item.id === detailSlug) ?? null)
    : null;
  // The rail yields the right edge to the cart/compare surfaces, then restores.
  const railVisible = rail.open && !cartOpen && !compareOpen;

  // Clear the launcher's unread dot once the rail is visible again.
  useEffect(() => {
    if (railVisible) setRailUnread(false);
  }, [railVisible]);

  // Agent-authored notes (filter changes) append to the shared thread; flag the
  // launcher when the rail isn't on screen to see them.
  const addRailNote = (text: string) => {
    addNote(text);
    if (!railVisible) setRailUnread(true);
  };

  const reviewSubmit = () => {
    setCartOpen(false);
    void navigate({ to: "/review" });
  };

  const toggleCompare = (item: CatalogItem) => {
    setCompareIds((prev) =>
      prev.includes(item.id)
        ? prev.filter((id) => id !== item.id)
        : prev.length >= MAX_COMPARE
          ? prev
          : [...prev, item.id],
    );
  };

  const addToCompare = (item: CatalogItem) => {
    setCompareIds((prev) =>
      prev.includes(item.id) || prev.length >= MAX_COMPARE
        ? prev
        : [...prev, item.id],
    );
  };

  const openCompare = () => {
    if (compareIds.length < 2) return;
    setCompareOpen(true);
    window.history.pushState(
      {},
      "",
      `${window.location.pathname}?compare=${compareIds.join(",")}`,
    );
    pushedRef.current = true;
  };

  const closeCompare = () => {
    setCompareOpen(false);
    if (pushedRef.current) {
      pushedRef.current = false;
      window.history.back();
    } else {
      window.history.pushState({}, "", window.location.pathname);
    }
  };

  const removeFromCompare = (item: CatalogItem) => {
    const next = compareIds.filter((id) => id !== item.id);
    setCompareIds(next);
    if (next.length === 0) closeCompare();
  };

  const openDetail = (item: CatalogItem) => {
    setDetailSlug(item.id);
    window.history.pushState(
      {},
      "",
      `${window.location.pathname}?item=${item.id}`,
    );
    pushedRef.current = true;
  };

  const closeDetail = () => {
    if (pushedRef.current) {
      pushedRef.current = false;
      // popstate clears detailSlug from the URL
      window.history.back();
    } else {
      window.history.pushState({}, "", window.location.pathname);
      setDetailSlug(null);
    }
  };

  // AiChat owns its composer, so we just surface the rail; the user types there.
  const askAgent = () => rail.expand();

  const visibleCount = (f: Filters) =>
    CATALOG_ITEMS.filter((item) => matches(item, f, query)).length;

  const applyFilters = (next: Filters, label: string) => {
    const delta = visibleCount(next) - visibleCount(filters);
    addRailNote(delta > 0 ? `${label} — showing ${delta} more results` : label);
    setFilters(next);
  };

  const removeInStock = () =>
    applyFilters({ ...filters, inStockOnly: false }, "Removed In stock");
  const removeEpp = () => {
    setFilters((f) => ({ ...f, priceBasis: "list" }));
    addRailNote("Showing list pricing");
  };
  const removeBrand = (brand: string) =>
    applyFilters(
      { ...filters, brands: filters.brands.filter((b) => b !== brand) },
      `Removed ${brand}`,
    );
  const removeCategory = (category: CatalogCategory) =>
    applyFilters(
      {
        ...filters,
        categories: filters.categories.filter((c) => c !== category),
      },
      `Removed ${category}`,
    );
  const removePrice = () =>
    applyFilters(
      { ...filters, priceMin: CATALOG_PRICE_MIN, priceMax: CATALOG_PRICE_MAX },
      "Removed price range",
    );
  const clearAllFilters = () => {
    setFilters(CLEARED_FILTERS);
    addRailNote("Cleared all filters · showing list pricing");
  };

  // Agent-applied chips (sparkle) first, then user-applied facet chips.
  const chips: FilterChip[] = [];
  if (filters.inStockOnly) {
    chips.push({
      key: "stock",
      label: "In stock",
      isAgent: true,
      onRemove: removeInStock,
    });
  }
  if (filters.priceBasis === "epp") {
    chips.push({
      key: "epp",
      label: "EPP pricing",
      isAgent: true,
      onRemove: removeEpp,
    });
  }
  for (const brand of filters.brands) {
    chips.push({
      key: `brand-${brand}`,
      label: brand,
      isAgent: false,
      onRemove: () => removeBrand(brand),
    });
  }
  for (const category of filters.categories) {
    chips.push({
      key: `cat-${category}`,
      label: category,
      isAgent: false,
      onRemove: () => removeCategory(category),
    });
  }
  if (
    filters.priceMin > CATALOG_PRICE_MIN ||
    filters.priceMax < CATALOG_PRICE_MAX
  ) {
    chips.push({
      key: "price",
      label: `${formatPrice(filters.priceMin, "USD")}–${formatPrice(filters.priceMax, "USD")}`,
      isAgent: false,
      onRemove: removePrice,
    });
  }

  // Over-filtered: suggest the single removal that surfaces the most results.
  const overFiltered = gridItems.length === 0 && !showRecommendation;
  const relaxCandidates: {
    label: string;
    count: number;
    onRemove: () => void;
  }[] = [];
  if (overFiltered) {
    if (query) {
      relaxCandidates.push({
        label: `search “${search.trim()}”`,
        count: CATALOG_ITEMS.filter((i) => matches(i, filters, "")).length,
        onRemove: () => setSearch(""),
      });
    }
    if (filters.inStockOnly) {
      relaxCandidates.push({
        label: "In stock",
        count: visibleCount({ ...filters, inStockOnly: false }),
        onRemove: removeInStock,
      });
    }
    for (const brand of filters.brands) {
      relaxCandidates.push({
        label: brand,
        count: visibleCount({
          ...filters,
          brands: filters.brands.filter((b) => b !== brand),
        }),
        onRemove: () => removeBrand(brand),
      });
    }
    for (const category of filters.categories) {
      relaxCandidates.push({
        label: category,
        count: visibleCount({
          ...filters,
          categories: filters.categories.filter((c) => c !== category),
        }),
        onRemove: () => removeCategory(category),
      });
    }
    if (
      filters.priceMin > CATALOG_PRICE_MIN ||
      filters.priceMax < CATALOG_PRICE_MAX
    ) {
      relaxCandidates.push({
        label: "price range",
        count: visibleCount({
          ...filters,
          priceMin: CATALOG_PRICE_MIN,
          priceMax: CATALOG_PRICE_MAX,
        }),
        onRemove: removePrice,
      });
    }
  }
  const relaxSuggestion =
    relaxCandidates.toSorted((a, b) => b.count - a.count)[0] ?? null;

  const recommendationNote = recommendedItem
    ? `Matches your request · ${formatPrice(eppSavings(recommendedItem), recommendedItem.currency)}/unit cheaper with EPP applied`
    : "";

  return (
    <PriceBasisProvider value={filters.priceBasis}>
      <div className="relative z-10 flex h-full min-h-0">
        {/* Main column — catalog grid + detail overlay */}
        <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <div
            className={cn(
              "flex h-full flex-col overflow-y-auto",
              detailItem && "overflow-hidden",
            )}
          >
            <PageHeader>
              <PageHeaderNav>
                <PageHeaderTitleGroup>
                  <PageHeaderTitle>Catalog</PageHeaderTitle>
                  <PageHeaderDescription>
                    Sourcing {SAMPLE_REQUEST.summary.replace(/\.$/, "")} ·
                    prices shown per unit
                  </PageHeaderDescription>
                </PageHeaderTitleGroup>
              </PageHeaderNav>
              <PageHeaderActions>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setCartOpen(true)}
                >
                  <span>Cart</span>
                  <ShoppingCart className="size-4" />
                  {cartCount > 0 && (
                    <>
                      <motion.span
                        key={cartCount}
                        animate={reduceMotion ? {} : { scale: [1, 1.3, 1] }}
                        transition={{
                          duration: 0.32,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="inline-flex"
                      >
                        <Badge variant="secondary" className="px-1.5">
                          {cartCount}
                        </Badge>
                      </motion.span>
                      <span className="text-muted-foreground">
                        {formatPrice(subtotal, "USD")}
                      </span>
                    </>
                  )}
                </Button>
              </PageHeaderActions>
            </PageHeader>

            <div className="space-y-4 px-6 pb-6">
              <Toolbar
                search={search}
                onSearchChange={setSearch}
                sort={sort}
                onSortChange={setSort}
                layout={layout}
                onLayoutChange={setLayout}
                filters={filters}
                activeFilterCount={chips.length}
                onFiltersChange={setFilters}
                onClearAllFilters={clearAllFilters}
                canCompare={compareIds.length >= 2}
                onCompare={openCompare}
              />

              <FilterChips chips={chips} onClearAll={clearAllFilters} />

              <NotInCatalogBanner />

              {gridItems.length > 0 || showRecommendation ? (
                layout === "rows" ? (
                  <div className="space-y-2">
                    {showRecommendation && recommendedItem && (
                      <ScanRow
                        item={recommendedItem}
                        inCart={inCart(recommendedItem.id)}
                        quantity={addQuantityFor(recommendedItem)}
                        comparing={compareIds.includes(recommendedItem.id)}
                        recommended
                        note={recommendationNote}
                        onToggleCart={toggleCart}
                        onToggleCompare={toggleCompare}
                        onOpenDetail={openDetail}
                      />
                    )}
                    {gridItems.map((item) => (
                      <ScanRow
                        key={item.id}
                        item={item}
                        inCart={inCart(item.id)}
                        quantity={addQuantityFor(item)}
                        comparing={compareIds.includes(item.id)}
                        onToggleCart={toggleCart}
                        onToggleCompare={toggleCompare}
                        onOpenDetail={openDetail}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {showRecommendation && recommendedItem && (
                      <RecommendationCard
                        item={recommendedItem}
                        alternatives={RECOMMENDATION.alternatives}
                        totalCount={CATALOG_ITEMS.length}
                        inCart={inCart(recommendedItem.id)}
                        quantity={addQuantityFor(recommendedItem)}
                        imageMode={imageMode}
                        onToggleCart={toggleCart}
                        onOpenDetail={openDetail}
                      />
                    )}
                    {gridItems.map((item) => (
                      <ProductCard
                        key={item.id}
                        item={item}
                        inCart={inCart(item.id)}
                        quantity={addQuantityFor(item)}
                        imageMode={imageMode}
                        onToggleCart={toggleCart}
                        onOpenDetail={openDetail}
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AutopilotIcon
                      size={16}
                      className="shrink-0 text-[#0f7b8a]"
                      aria-hidden
                    />
                    {relaxSuggestion && relaxSuggestion.count > 0
                      ? `Nothing matches — drop ${relaxSuggestion.label} to show ${relaxSuggestion.count}?`
                      : "Nothing matches the current filters."}
                  </p>
                  {relaxSuggestion && relaxSuggestion.count > 0 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={relaxSuggestion.onRemove}
                    >
                      Drop {relaxSuggestion.label}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={clearAllFilters}
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {detailItem && (
            <ProductDetailOverlay onClose={closeDetail}>
              <ProductDetail
                item={detailItem}
                defaultQuantity={defaultQuantityFor(detailItem)}
                cartQuantity={quantities[detailItem.id] ?? 0}
                inCart={inCart(detailItem.id)}
                comparing={compareIds.includes(detailItem.id)}
                isPicked={detailItem.id === RECOMMENDATION.itemId}
                recommendationNote={recommendationNote}
                imageMode={imageMode}
                onAddToCart={(quantity) => addToCart(detailItem, quantity)}
                onToggleCompare={() => toggleCompare(detailItem)}
                onAskAgent={askAgent}
                onClose={closeDetail}
              />
            </ProductDetailOverlay>
          )}

          {/* Sticky compare bar (selection from the row checkboxes) */}
          {compareIds.length > 0 && !compareOpen && !detailItem && (
            <div className="absolute inset-x-0 bottom-4 z-20 mx-auto flex w-fit items-center gap-2 rounded-full border bg-card px-3 py-2 shadow-lg">
              <span className="px-1 text-sm font-medium text-foreground">
                {compareIds.length} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCompareIds([])}
              >
                <X className="size-4" />
                Clear
              </Button>
              <Button
                size="sm"
                onClick={openCompare}
                disabled={compareIds.length < 2}
              >
                <Columns3 className="size-4" />
                Compare
              </Button>
            </div>
          )}

          {compareOpen && compareItems.length > 0 && (
            <CompareView
              products={compareItems}
              addable={CATALOG_ITEMS.filter(
                (item) => !compareIds.includes(item.id),
              )}
              recommendation={
                recommendedItem
                  ? `For design work, the ${recommendedItem.name}'s OLED and 32GB make it the strongest fit.`
                  : ""
              }
              onClose={closeCompare}
              onRemove={removeFromCompare}
              onAdd={addToCompare}
              onAddToCart={(item) => addToCart(item, defaultQuantityFor(item))}
            />
          )}
        </main>

        {/* Docked assistant rail (collapsible) */}
        <RailDock
          open={railVisible}
          hasUpdates={railUnread}
          onCollapse={rail.collapse}
          onExpand={rail.expand}
        />

        <CartDrawer onReviewSubmit={reviewSubmit} />
      </div>
    </PriceBasisProvider>
  );
}

"use client";

// oxlint-disable max-lines -- /buy workspace orchestrator; holds the wired state
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Columns3, ShoppingCart, X } from "lucide-react";
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
import { ProductCard } from "./ProductCard";
import { ProductDetail } from "./ProductDetail";
import { ProductDetailOverlay } from "./ProductDetailOverlay";
import { RecommendationCard } from "./RecommendationCard";
import { PriceBasisProvider } from "./price-basis-context";
import { ScanRow } from "./ScanRow";
import { Toolbar } from "./Toolbar";
import { useAutopilotChat } from "../../autopilot-chat-context";
import type {
  CatalogCategory,
  CatalogItem,
  Filters,
  LayoutMode,
  PriceBasis,
  SortKey,
} from "./types";

const MAX_COMPARE = 4;

// Staggered fade-up for catalog items on entry. Soft ease-out; the per-item
// delay is capped so long lists don't lag.
const ITEM_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

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
  /**
   * Cold browse (Catalog nav, no active request): no intent line, no agent
   * filters, no Picked-for-you, no escalation banner, Add defaults to 1.
   * Scoped (reached via "See all in catalog") keeps the request framing.
   */
  cold?: boolean;
}

/** Selection step of Guided Buying — catalog browse-and-pick (catalog goods only). */
export function Selection({
  imageMode = "photo",
  cold = false,
}: SelectionProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recommended");
  const [layout, setLayout] = useState<LayoutMode>("rows");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [detailSlug, setDetailSlug] = useState<string | null>(null);
  // Cold browse starts neutral (no agent inferences); scoped starts with them.
  const [filters, setFilters] = useState<Filters>(
    cold ? CLEARED_FILTERS : DEFAULT_FILTERS,
  );
  // Transient "added to cart" confirmation anchored to the cart button.
  const [added, setAdded] = useState<{
    name: string;
    qty: number;
    amount: string;
  } | null>(null);

  // Cart state lives above the router so Review (a separate route) shares it.
  const {
    quantities,
    count: cartCount,
    open: cartOpen,
    setOpen: setCartOpen,
    inCart,
    setQuantity: addToCart,
  } = useCart();

  // Quantity an Add lands: the request quantity when scoped (2 for laptops),
  // but 1 in cold browse where there's no request.
  const qtyFor = (item: CatalogItem) => (cold ? 1 : defaultQuantityFor(item));

  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    [],
  );

  // Show (and auto-dismiss) the cart confirmation; hovering pauses the timer.
  const notifyAdded = (item: CatalogItem, qty: number) => {
    const amount = formatPrice(
      activePrice(item, filters.priceBasis) * qty,
      item.currency,
    );
    setAdded({ name: item.name, qty, amount });
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(null), 3000);
  };
  const pauseAdded = () => {
    if (addedTimer.current) clearTimeout(addedTimer.current);
  };
  const resumeAdded = () => {
    addedTimer.current = setTimeout(() => setAdded(null), 1500);
  };

  // Adding lands the default quantity (+ a confirmation); toggling again
  // removes it. Quantity then lives in cart state everywhere.
  const toggleCart = (item: CatalogItem) => {
    const adding = !inCart(item.id);
    addToCart(item, adding ? qtyFor(item) : 0);
    if (adding) notifyAdded(item, qtyFor(item));
  };

  // Quantity surfaced on the Add button: cart qty once added, else the qty that
  // adding would land.
  const addQuantityFor = (item: CatalogItem) =>
    inCart(item.id) ? (quantities[item.id] ?? 1) : qtyFor(item);
  const navigate = useNavigate();
  // The ask affordance is the global Autopilot FAB; filter changes surface there.
  const { note: agentNote, setOpen: openAutopilot } = useAutopilotChat();
  const reduceMotion = useReducedMotion();
  const pushedRef = useRef(false);

  // Sticky toolbar: pin it to the top once the user scrolls past it. A sentinel
  // just above the toolbar flips `toolbarStuck` via IntersectionObserver.
  const scrollRef = useRef<HTMLDivElement>(null);
  const toolbarSentinelRef = useRef<HTMLDivElement>(null);
  const [toolbarStuck, setToolbarStuck] = useState(false);
  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = toolbarSentinelRef.current;
    if (!root || !sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setToolbarStuck(!entry.isIntersecting);
      },
      { root, threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

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
  // Feature the recommendation only when scoped to a request, on the default
  // landing, under EPP, and only when it satisfies the active filters — never in
  // cold browse, and never contradicting the filter state.
  const showRecommendation = Boolean(
    !cold &&
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

  // Agent-authored notes (filter changes) surface in the Autopilot FAB thread.
  const addRailNote = (text: string) => agentNote(text);

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

  // Open the Autopilot FAB to ask about this item.
  const askAgent = () => openAutopilot(true);

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

  // Per-item entrance props (fade-up, staggered by position).
  const itemMotion = (i: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.3,
            ease: ITEM_EASE,
            delay: Math.min(i, 14) * 0.04,
          },
        };

  return (
    <PriceBasisProvider value={filters.priceBasis}>
      <div className="relative z-10 flex h-full min-h-0">
        {/* Main column — catalog grid + detail overlay */}
        <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <div
            ref={scrollRef}
            className={cn(
              "flex h-full flex-col overflow-y-auto",
              detailItem && "overflow-hidden",
            )}
          >
            <PageHeader>
              <PageHeaderNav>
                <PageHeaderTitleGroup>
                  <PageHeaderTitle>Catalog</PageHeaderTitle>
                  {cold ? (
                    <PageHeaderDescription>
                      Browse the full catalog — laptops, monitors, docking, and
                      accessories
                    </PageHeaderDescription>
                  ) : (
                    <PageHeaderDescription>
                      Sourcing {SAMPLE_REQUEST.summary.replace(/\.$/, "")} ·
                      prices shown per unit
                    </PageHeaderDescription>
                  )}
                </PageHeaderTitleGroup>
              </PageHeaderNav>
              <PageHeaderActions>
                <div className="relative">
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

                  {/* Transient add-to-cart confirmation, anchored under the cart. */}
                  <AnimatePresence>
                    {added && !cartOpen && (
                      <motion.div
                        role="status"
                        onMouseEnter={pauseAdded}
                        onMouseLeave={resumeAdded}
                        initial={
                          reduceMotion
                            ? false
                            : { opacity: 0, y: -6, scale: 0.98 }
                        }
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{
                          duration: 0.22,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="absolute right-0 top-full z-30 mt-2 flex w-64 items-start gap-2.5 rounded-xl bg-foreground p-3 text-left text-background shadow-lg"
                      >
                        <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[#0f7b8a] text-white">
                          <Check className="size-2.5" aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {added.qty} {added.name} added
                            <span className="font-normal text-background/65">
                              {" · "}
                              {added.amount}
                            </span>
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </PageHeaderActions>
            </PageHeader>

            <div className="px-6 pb-6">
              {/* Sentinel: when it scrolls out of view, the toolbar is pinned. */}
              <div ref={toolbarSentinelRef} aria-hidden className="h-0" />
              <div
                className={cn(
                  "sticky top-0 z-20 transition-[margin,padding,background-color,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                  toolbarStuck &&
                    "-mx-6 border-b border-border bg-background/80 px-10 py-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70",
                )}
              >
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
                  stuck={toolbarStuck}
                  cartCount={cartCount}
                  onOpenCart={() => setCartOpen(true)}
                />
              </div>

              <div className="space-y-4 pt-4">
                <FilterChips chips={chips} onClearAll={clearAllFilters} />

                {gridItems.length > 0 || showRecommendation ? (
                  layout === "rows" ? (
                    <div className="space-y-2">
                      {showRecommendation && recommendedItem && (
                        <motion.div {...itemMotion(0)}>
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
                        </motion.div>
                      )}
                      {gridItems.map((item, i) => (
                        <motion.div
                          key={item.id}
                          {...itemMotion(showRecommendation ? i + 1 : i)}
                        >
                          <ScanRow
                            item={item}
                            inCart={inCart(item.id)}
                            quantity={addQuantityFor(item)}
                            comparing={compareIds.includes(item.id)}
                            onToggleCart={toggleCart}
                            onToggleCompare={toggleCompare}
                            onOpenDetail={openDetail}
                          />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {showRecommendation && recommendedItem && (
                        <motion.div
                          className="sm:col-span-2"
                          {...itemMotion(0)}
                        >
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
                        </motion.div>
                      )}
                      {gridItems.map((item, i) => (
                        <motion.div
                          key={item.id}
                          {...itemMotion(showRecommendation ? i + 1 : i)}
                        >
                          <ProductCard
                            item={item}
                            inCart={inCart(item.id)}
                            quantity={addQuantityFor(item)}
                            imageMode={imageMode}
                            onToggleCart={toggleCart}
                            onOpenDetail={openDetail}
                          />
                        </motion.div>
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
          </div>

          <AnimatePresence>
            {detailItem && (
              <ProductDetailOverlay key="product-detail" onClose={closeDetail}>
                <ProductDetail
                  item={detailItem}
                  defaultQuantity={qtyFor(detailItem)}
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
          </AnimatePresence>

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
              onAddToCart={(item) => addToCart(item, qtyFor(item))}
            />
          )}
        </main>

        <CartDrawer onReviewSubmit={reviewSubmit} />
      </div>
    </PriceBasisProvider>
  );
}

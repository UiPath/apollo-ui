// oxlint-disable max-lines -- mock catalog dataset (fixtures); grows with items
import type {
  BuyRequest,
  CatalogCategory,
  CatalogItem,
  PriceBasis,
  SortKey,
} from "./types";

/**
 * Stubbed Intake output. Replacing this (or passing a different `request` prop
 * to <Selection />) is the seam where real intake wires in later.
 */
export const SAMPLE_REQUEST: BuyRequest = {
  summary: "2 ThinkPad X1 laptops for our new designers.",
  agentNote: "Found 12 catalog matches · applied EPP pricing · in-stock only.",
};

/** Quantity inferred from the request ("2 ThinkPad X1 laptops…"). */
export const INFERRED_REQUEST_QUANTITY = 2;

/** Mock self-service approval limit; orders under this need no approver. */
export const APPROVAL_LIMIT = 10000;

// Every mock item ships from the same tier/source as in the reference design.
const TIER = "Standard";
const SOURCE = "CDW Netherlands";

/**
 * Curated, verified product imagery (Unsplash CDN, category-appropriate).
 * <ProductImage> falls back to a category icon if a URL ever fails. Swap to
 * local /public assets here for exact-SKU shots.
 */
function unsplashImage(id: string): string {
  return `https://images.unsplash.com/photo-${id}?w=600&h=450&fit=crop&q=80`;
}

/** Mock catalog — laptops plus the accessories a new-hire setup needs. */
export const CATALOG_ITEMS: CatalogItem[] = [
  {
    id: "lnv-x1c-g12",
    name: "Lenovo ThinkPad X1 Carbon",
    vendor: "Lenovo",
    category: "Laptops",
    tier: TIER,
    source: SOURCE,
    listPrice: 2199,
    eppPrice: 1849,
    currency: "USD",
    specs: ["Carbon Gen 12", '14" 2.8K OLED', "32GB · 1TB"],
    inStock: true,
    image: unsplashImage("1763162410742-1d0097cea556"),
    specGroups: [
      {
        label: "Display",
        rows: [
          { label: "Size", value: '14" 2.8K (2880×1800)' },
          { label: "Panel", value: "OLED · 400 nits · anti-glare" },
        ],
      },
      {
        label: "Performance",
        rows: [
          { label: "Processor", value: "Intel Core Ultra 7 165U" },
          { label: "Graphics", value: "Intel Arc integrated" },
        ],
      },
      {
        label: "Memory & storage",
        rows: [
          { label: "Memory", value: "32GB LPDDR5x" },
          { label: "Storage", value: "1TB PCIe Gen4 SSD" },
        ],
      },
      {
        label: "Connectivity",
        rows: [
          { label: "Ports", value: "2× Thunderbolt 4 · 2× USB-A · HDMI 2.1" },
          { label: "Wireless", value: "Wi-Fi 6E · Bluetooth 5.3" },
        ],
      },
      {
        label: "Physical",
        rows: [
          { label: "Weight", value: "1.12 kg" },
          { label: "Battery", value: "57Wh · up to 15h" },
        ],
      },
      {
        label: "Warranty/support",
        rows: [{ label: "Coverage", value: "3-year onsite · Premier Support" }],
      },
    ],
  },
  {
    id: "lnv-x1-yoga-g9",
    name: "Lenovo ThinkPad X1 Yoga",
    vendor: "Lenovo",
    category: "Laptops",
    tier: TIER,
    source: SOURCE,
    listPrice: 2399,
    eppPrice: 1999,
    currency: "USD",
    specs: ["Gen 9", '14" 2.8K touch', "16GB · 1TB"],
    inStock: true,
    image: unsplashImage("1673431738089-c4fc9c2e96a7"),
    specGroups: [
      {
        label: "Display",
        rows: [
          { label: "Size", value: '14" 2.8K (2880×1800)' },
          { label: "Panel", value: "OLED touch · pen support" },
        ],
      },
      {
        label: "Performance",
        rows: [{ label: "Processor", value: "Intel Core Ultra 7 165U" }],
      },
      {
        label: "Memory & storage",
        rows: [
          { label: "Memory", value: "16GB LPDDR5x" },
          { label: "Storage", value: "1TB PCIe Gen4 SSD" },
        ],
      },
      {
        label: "Connectivity",
        rows: [
          { label: "Ports", value: "2× Thunderbolt 4 · 2× USB-A · HDMI" },
          { label: "Wireless", value: "Wi-Fi 6E · Bluetooth 5.3" },
        ],
      },
      {
        label: "Physical",
        rows: [
          { label: "Weight", value: "1.38 kg" },
          { label: "Form factor", value: "360° convertible" },
        ],
      },
      {
        label: "Warranty/support",
        rows: [{ label: "Coverage", value: "3-year onsite · Premier Support" }],
      },
    ],
  },
  {
    id: "dell-xps-14",
    name: "Dell XPS 14",
    vendor: "Dell",
    category: "Laptops",
    tier: TIER,
    source: SOURCE,
    listPrice: 2099,
    eppPrice: 1799,
    currency: "USD",
    specs: ["9440", '14.5" 3.2K', "32GB · 1TB"],
    inStock: true,
    image: unsplashImage("1611186871348-b1ce696e52c9"),
    specGroups: [
      {
        label: "Display",
        rows: [
          { label: "Size", value: '14.5" 3.2K (3200×2000)' },
          { label: "Panel", value: "OLED touch · 120Hz" },
        ],
      },
      {
        label: "Performance",
        rows: [
          { label: "Processor", value: "Intel Core Ultra 7 155H" },
          { label: "Graphics", value: "Intel Arc integrated" },
        ],
      },
      {
        label: "Memory & storage",
        rows: [
          { label: "Memory", value: "32GB LPDDR5x" },
          { label: "Storage", value: "1TB PCIe Gen4 SSD" },
        ],
      },
      {
        label: "Connectivity",
        rows: [
          { label: "Ports", value: "3× Thunderbolt 4" },
          { label: "Wireless", value: "Wi-Fi 6E · Bluetooth 5.4" },
        ],
      },
      {
        label: "Physical",
        rows: [
          { label: "Weight", value: "1.69 kg" },
          { label: "Battery", value: "70Wh · up to 13h" },
        ],
      },
      {
        label: "Warranty/support",
        rows: [{ label: "Coverage", value: "3-year ProSupport" }],
      },
    ],
  },
  {
    id: "apple-mbp-14",
    name: "Apple MacBook Pro",
    vendor: "Apple",
    category: "Laptops",
    tier: TIER,
    source: SOURCE,
    listPrice: 2199,
    eppPrice: 2035,
    currency: "USD",
    specs: ['14" M4 Pro', "24GB", "1TB SSD"],
    inStock: true,
    image: unsplashImage("1517336714731-489689fd1ca8"),
    specGroups: [
      {
        label: "Display",
        rows: [
          { label: "Size", value: '14.2" Liquid Retina XDR' },
          { label: "Panel", value: "3024×1964 · 120Hz ProMotion" },
        ],
      },
      {
        label: "Performance",
        rows: [
          { label: "Chip", value: "Apple M4 Pro (12-core CPU)" },
          { label: "GPU", value: "16-core" },
        ],
      },
      {
        label: "Memory & storage",
        rows: [
          { label: "Memory", value: "24GB unified" },
          { label: "Storage", value: "1TB SSD" },
        ],
      },
      {
        label: "Connectivity",
        rows: [
          { label: "Ports", value: "3× Thunderbolt 5 · HDMI · SDXC · MagSafe" },
          { label: "Wireless", value: "Wi-Fi 6E · Bluetooth 5.3" },
        ],
      },
      {
        label: "Physical",
        rows: [
          { label: "Weight", value: "1.55 kg" },
          { label: "Battery", value: "Up to 22h video" },
        ],
      },
      {
        label: "Warranty/support",
        rows: [
          { label: "Coverage", value: "AppleCare+ for Business · 3-year" },
        ],
      },
    ],
  },
  {
    id: "apple-mbp-16",
    name: "Apple MacBook Pro",
    vendor: "Apple",
    category: "Laptops",
    tier: TIER,
    source: SOURCE,
    listPrice: 2835,
    currency: "USD",
    specs: ['16" M4 Pro', "48GB", "1TB SSD"],
    inStock: true,
    image: unsplashImage("1541807084-5c52b6b3adef"),
    specGroups: [
      {
        label: "Display",
        rows: [
          { label: "Size", value: '16.2" Liquid Retina XDR' },
          { label: "Panel", value: "3456×2234 · 120Hz ProMotion" },
        ],
      },
      {
        label: "Performance",
        rows: [
          { label: "Chip", value: "Apple M4 Pro (14-core CPU)" },
          { label: "GPU", value: "20-core" },
        ],
      },
      {
        label: "Memory & storage",
        rows: [
          { label: "Memory", value: "48GB unified" },
          { label: "Storage", value: "1TB SSD" },
        ],
      },
      {
        label: "Connectivity",
        rows: [
          { label: "Ports", value: "3× Thunderbolt 5 · HDMI · SDXC · MagSafe" },
          { label: "Wireless", value: "Wi-Fi 6E · Bluetooth 5.3" },
        ],
      },
      {
        label: "Physical",
        rows: [
          { label: "Weight", value: "2.14 kg" },
          { label: "Battery", value: "Up to 24h video" },
        ],
      },
      {
        label: "Warranty/support",
        rows: [
          { label: "Coverage", value: "AppleCare+ for Business · 3-year" },
        ],
      },
    ],
  },
  {
    id: "dell-u2724de",
    name: "Dell UltraSharp 27 4K",
    vendor: "Dell",
    category: "Monitors",
    tier: TIER,
    source: SOURCE,
    listPrice: 689,
    eppPrice: 579,
    currency: "USD",
    specs: ['27" 4K IPS', "120Hz", "USB-C hub"],
    inStock: true,
    image: unsplashImage("1484788984921-03950022c9ef"),
  },
  {
    id: "lg-27uq850",
    name: "LG 27UQ850 4K UHD",
    vendor: "LG",
    category: "Monitors",
    tier: TIER,
    source: SOURCE,
    listPrice: 649,
    currency: "USD",
    specs: ['27" Nano IPS', "USB-C 90W", "Height adj."],
    inStock: true,
    image: unsplashImage("1527443224154-c4a3942d3acf"),
  },
  {
    id: "lnv-tb4-dock",
    name: "ThinkPad Thunderbolt 4 Dock",
    vendor: "Lenovo",
    category: "Docking",
    tier: TIER,
    source: SOURCE,
    listPrice: 299,
    eppPrice: 249,
    currency: "USD",
    specs: ["Dual 4K", "100W", "Wired"],
    inStock: true,
    image: unsplashImage("1527800792452-506aacb2101f"),
  },
  {
    id: "caldigit-ts4",
    name: "CalDigit TS4 Dock",
    vendor: "CalDigit",
    category: "Docking",
    tier: TIER,
    source: SOURCE,
    listPrice: 399,
    currency: "USD",
    specs: ["18 ports", "98W", "2.5GbE"],
    inStock: true,
    image: unsplashImage("1567521463850-4939134bcd4a"),
  },
  {
    id: "logi-mx-master-3s",
    name: "Logitech MX Master 3S",
    vendor: "Logitech",
    category: "Accessories",
    tier: TIER,
    source: SOURCE,
    listPrice: 99,
    eppPrice: 79,
    currency: "USD",
    specs: ["8K DPI", "Quiet", "Multi-device"],
    inStock: true,
    image: unsplashImage("1527864550417-7fd91fc51a46"),
  },
  {
    id: "logi-mx-keys-s",
    name: "Logitech MX Keys S",
    vendor: "Logitech",
    category: "Accessories",
    tier: TIER,
    source: SOURCE,
    listPrice: 109,
    eppPrice: 89,
    currency: "USD",
    specs: ["Backlit", "Multi-device", "USB-C"],
    inStock: true,
    image: unsplashImage("1618384887929-16ec33fab9ef"),
  },
  {
    id: "jabra-evolve2-65",
    name: "Jabra Evolve2 65",
    vendor: "Jabra",
    category: "Accessories",
    tier: TIER,
    source: SOURCE,
    listPrice: 269,
    eppPrice: 219,
    currency: "USD",
    specs: ["ANC", "Wireless", "37h"],
    inStock: true,
    image: unsplashImage("1505740420928-5e560c06d30e"),
  },
];

/** The agent's top recommendation — surfaced in the gradient promo card. */
export const RECOMMENDATION = {
  itemId: "lnv-x1c-g12",
  alternatives: 2,
} as const;

/** Distinct brands (vendors), for the Brand filter facet. */
export const CATALOG_BRANDS: string[] = Array.from(
  new Set(CATALOG_ITEMS.map((item) => item.vendor)),
).toSorted();

/** Distinct categories present in the catalog, for the Category facet. */
export const CATALOG_CATEGORIES: CatalogCategory[] = Array.from(
  new Set(CATALOG_ITEMS.map((item) => item.category)),
);

/** Lowest / highest list price, spanning the price-range facet. */
export const CATALOG_PRICE_MIN: number = Math.min(
  ...CATALOG_ITEMS.map((item) => item.listPrice),
);
export const CATALOG_PRICE_MAX: number = Math.max(
  ...CATALOG_ITEMS.map((item) => item.listPrice),
);

/** Sort options for the toolbar dropdown. */
export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name", label: "Name" },
];

// Vendors with a Simple Icons brand logo (verified). Others fall back to a
// brand wordmark in the logo variant.
const VENDOR_LOGO_SLUG: Record<string, string> = {
  Apple: "apple",
  Lenovo: "lenovo",
  Dell: "dell",
  LG: "lg",
};

/** Brand logo URL for a vendor, or "" if none is available. */
export function vendorLogoUrl(vendor: string): string {
  const slug = VENDOR_LOGO_SLUG[vendor];
  return slug ? `https://cdn.simpleicons.org/${slug}` : "";
}

/** The price a buyer actually pays — EPP when present, otherwise list. */
export function effectivePrice(item: CatalogItem): number {
  return item.eppPrice ?? item.listPrice;
}

/** EPP savings per unit, or 0 when there's no special pricing. */
export function eppSavings(item: CatalogItem): number {
  return item.eppPrice ? item.listPrice - item.eppPrice : 0;
}

/** The active price given the price basis (EPP when applied, else list). */
export function activePrice(item: CatalogItem, basis: PriceBasis): number {
  return basis === "epp" ? effectivePrice(item) : item.listPrice;
}

/** Active per-unit savings — only meaningful under EPP pricing. */
export function activeSavings(item: CatalogItem, basis: PriceBasis): number {
  return basis === "epp" ? eppSavings(item) : 0;
}

/** Whether to show the struck-through list price (only under EPP). */
export function showsListStrike(item: CatalogItem, basis: PriceBasis): boolean {
  return basis === "epp" && Boolean(item.eppPrice);
}

/** The agreement / price basis with a recency note, for the source panel. */
export function priceBasis(item: CatalogItem): string {
  return item.eppPrice
    ? "EPP pricing · validated today"
    : "List pricing · standard catalog rate";
}

/** Stocking / lead-time line for the source panel. */
export function leadTime(item: CatalogItem): string {
  return item.inStock
    ? "Ships in 2–3 business days"
    : "Backordered · 3–4 weeks";
}

/** Format a price for display, e.g. $1,849. */
export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

import { Cable, Laptop, type LucideIcon, Monitor, Package } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { vendorLogoUrl } from "./data";
import type { CatalogCategory } from "./types";

const CATEGORY_ICON: Record<CatalogCategory, LucideIcon> = {
  Laptops: Laptop,
  Monitors: Monitor,
  Docking: Cable,
  Accessories: Package,
};

interface ProductImageProps {
  src?: string;
  alt: string;
  category: CatalogCategory;
  vendor: string;
  /** "photo" shows the product image; "logo" shows the brand logo. */
  mode?: "photo" | "logo";
  className?: string;
}

/**
 * Product visual with graceful degradation. In "photo" mode it shows the remote
 * product image (icon fallback on error); in "logo" mode it shows the vendor's
 * brand logo (brand-wordmark fallback when no logo is available).
 */
export function ProductImage({
  src,
  alt,
  category,
  vendor,
  mode = "photo",
  className,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const Icon = CATEGORY_ICON[category];

  if (mode === "logo") {
    const logo = vendorLogoUrl(vendor);
    return (
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden bg-white p-6",
          className,
        )}
      >
        {logo && !failed ? (
          // oxlint-disable-next-line next/no-img-element
          <img
            src={logo}
            alt={`${vendor} logo`}
            loading="lazy"
            onError={() => setFailed(true)}
            className="max-h-12 w-auto object-contain"
          />
        ) : (
          <span className="text-xl font-semibold tracking-tight text-foreground/70">
            {vendor}
          </span>
        )}
      </div>
    );
  }

  const showImage = src && !failed;
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden bg-white",
        className,
      )}
    >
      {showImage ? (
        // oxlint-disable-next-line next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <Icon className="size-12 text-muted-foreground/50" aria-hidden />
      )}
    </div>
  );
}

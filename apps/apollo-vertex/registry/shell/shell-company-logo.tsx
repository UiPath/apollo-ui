import { Box } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompanyLogo } from "./shell";

interface CompanyLogoIconProps {
  companyLogo?: CompanyLogo;
}

export const CompanyLogoIcon = ({ companyLogo }: CompanyLogoIconProps) => {
  if (!companyLogo) {
    return <Box className="w-4 h-4 text-white" />;
  }

  // Non-custom logos (e.g. UiPath) have the background baked into the SVG —
  // render them full-size so they fill the container. Custom logos are small
  // marks displayed over a CSS background.
  const sizeClass = companyLogo.isCustom
    ? "w-4 h-auto"
    : "h-8 w-8 object-contain";

  return (
    <>
      <img
        src={companyLogo.url}
        alt={companyLogo.alt}
        className={cn(sizeClass, companyLogo.darkUrl && "dark:hidden")}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      {companyLogo.darkUrl && (
        <img
          src={companyLogo.darkUrl}
          alt={companyLogo.alt}
          className={cn(sizeClass, "hidden dark:block")}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
    </>
  );
};

import { cn } from "@/lib/utils";
import type { CompanyLogo } from "./shell";
import { CompanyLogoIcon } from "./shell-company-logo";

interface MinimalCompanyProps {
  companyName: string;
  productName: string;
  companyLogo?: CompanyLogo;
}

export const MinimalCompany = ({
  companyName,
  productName,
  companyLogo,
}: MinimalCompanyProps) => {
  const isCustomLogo = companyLogo?.isCustom ?? false;
  const logoBgClass = isCustomLogo
    ? "bg-white border border-border"
    : "bg-[oklch(0.6533_0.2227_34.41)]";

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "w-8 h-8 rounded-md flex items-center justify-center shrink-0 overflow-hidden",
          logoBgClass,
        )}
      >
        <CompanyLogoIcon companyLogo={companyLogo} />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-foreground">
          {companyName}
        </span>
        <span className="text-sm text-muted-foreground">{productName}</span>
      </div>
    </div>
  );
};

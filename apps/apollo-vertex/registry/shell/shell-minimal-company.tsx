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
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-[4px] bg-primary-700 dark:bg-primary-400 flex items-center justify-center shrink-0">
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

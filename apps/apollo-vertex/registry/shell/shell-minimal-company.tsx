import type { CompanyLogo } from "./shell";

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
      <div className="w-8 h-8 rounded-md bg-linear-to-r from-primary/5 via-secondary/5 to-primary/5 flex items-center justify-center shrink-0">
        {companyLogo ? (
          <img
            src={companyLogo.url}
            alt={companyLogo.alt}
            className="w-8 h-8"
          />
        ) : (
          <div className="w-4 h-4 bg-primary rounded" />
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-foreground">
          {companyName}
        </span>
        <span className="text-sm text-muted-foreground">{productName}</span>
      </div>
    </div>
  );
};

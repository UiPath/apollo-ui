import { Box } from "lucide-react";
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
      <div className="w-8 h-8 rounded-[4px] bg-primary-700 dark:bg-primary-400 flex items-center justify-center shrink-0">
        {companyLogo ? (
          <>
            <img
              src={companyLogo.url}
              alt={companyLogo.alt}
              className={`w-4 h-auto ${companyLogo.darkUrl ? 'dark:hidden' : ''}`}
            />
            {companyLogo.darkUrl && (
              <img
                src={companyLogo.darkUrl}
                alt={companyLogo.alt}
                className="w-4 h-auto hidden dark:block"
              />
            )}
          </>
        ) : (
          <Box className="w-4 h-4 text-background" />
        )}
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

import { Box } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompanyLogo } from "./shell";

interface CompanyLogoIconProps {
  companyLogo?: CompanyLogo;
}

export const CompanyLogoIcon = ({ companyLogo }: CompanyLogoIconProps) => {
  if (!companyLogo) {
    return <Box className="w-4 h-4 text-background" />;
  }

  return (
    <>
      <img
        src={companyLogo.url}
        alt={companyLogo.alt}
        className={cn("w-4 h-auto", companyLogo.darkUrl ? "dark:hidden" : "")}
      />
      {companyLogo.darkUrl && (
        <img
          src={companyLogo.darkUrl}
          alt={companyLogo.alt}
          className="w-4 h-auto hidden dark:block"
        />
      )}
    </>
  );
};

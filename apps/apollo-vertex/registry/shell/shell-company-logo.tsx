import { Box } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompanyLogo } from "./shell";

interface CompanyLogoIconProps {
  companyLogo?: CompanyLogo;
}

export const CompanyLogoIcon = ({ companyLogo }: CompanyLogoIconProps) => {
  if (!companyLogo) {
    return <Box className="w-5 h-5 text-sidebar-foreground" />;
  }

  return (
    <>
      <img
        src={companyLogo.url}
        alt={companyLogo.alt}
        className={cn(
          "h-8 w-8 object-contain",
          companyLogo.darkUrl ? "dark:hidden" : "",
        )}
      />
      {companyLogo.darkUrl && (
        <img
          src={companyLogo.darkUrl}
          alt={companyLogo.alt}
          className="h-8 w-8 object-contain hidden dark:block"
        />
      )}
    </>
  );
};

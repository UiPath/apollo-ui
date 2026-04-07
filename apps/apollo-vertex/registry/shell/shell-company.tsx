import { PanelLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CompanyLogo } from "./shell";
import { CompanyLogoIcon } from "./shell-company-logo";

interface CompanyProps {
  companyName: string;
  productName: string;
  companyLogo?: CompanyLogo;
}

export const Company = ({ productName, companyLogo }: CompanyProps) => {
  const { t } = useTranslation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [hoverEnabled, setHoverEnabled] = useState(false);

  // Delay enabling hover until collapse animation completes (200ms)
  useEffect(() => {
    if (isCollapsed) {
      const timer = setTimeout(() => setHoverEnabled(true), 200);
      return () => clearTimeout(timer);
    }
    setHoverEnabled(false);
  }, [isCollapsed]);

  return (
    <div className="flex items-center justify-between h-8 gap-2">
      {!isCollapsed && (
        <div className="flex items-center gap-2 flex-1 overflow-hidden">
          <div className="w-8 h-8 flex items-center justify-center shrink-0 rounded-md overflow-hidden">
            <CompanyLogoIcon companyLogo={companyLogo} />
          </div>
          <span className="text-sm text-foreground font-bold line-clamp-2 leading-tight min-w-0 flex-1">
            {productName}
          </span>
        </div>
      )}

      {isCollapsed && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggleSidebar}
              className={`flex items-center justify-center cursor-pointer w-8 h-8 rounded-md overflow-hidden ${hoverEnabled ? "group-hover:bg-transparent group-hover:hover:bg-sidebar-accent" : ""}`}
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <span className={hoverEnabled ? "group-hover:hidden" : ""}>
                  <CompanyLogoIcon companyLogo={companyLogo} />
                </span>
                <PanelLeft
                  className={`size-5 hidden text-sidebar-foreground ${hoverEnabled ? "group-hover:block group-hover:hover:text-sidebar-accent-foreground" : ""}`}
                />
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" align="center">
            {t("open_sidebar")}
          </TooltipContent>
        </Tooltip>
      )}

      {!isCollapsed && (
        <button
          type="button"
          onClick={toggleSidebar}
          className="h-8 w-8 ml-auto shrink-0 flex items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground cursor-pointer"
        >
          <PanelLeft className="size-5" />
        </button>
      )}
    </div>
  );
};

import { AnimatePresence, motion } from "framer-motion";
import { PanelLeft } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CompanyLogo } from "./shell";
import {
  fastFadeTransition,
  iconHoverScale,
  scaleVariants,
  textFadeVariants,
} from "./shell-animations";
import { CompanyLogoIcon } from "./shell-company-logo";

interface CompanyProps {
  companyName: string;
  productName: string;
  companyLogo?: CompanyLogo;
  sidebarHovered?: boolean;
}

interface CollapsedLogoProps {
  companyLogo?: CompanyLogo;
  sidebarHovered: boolean;
  onExpand: () => void;
}

function CollapsedLogo({
  companyLogo,
  sidebarHovered,
  onExpand,
}: CollapsedLogoProps) {
  const { t } = useTranslation();
  const [buttonHovered, setButtonHovered] = useState(false);
  const isCustomLogo = companyLogo?.isCustom ?? false;
  const panelBgClass = isCustomLogo
    ? "bg-white border border-border"
    : "bg-[oklch(0.6533_0.2227_34.41)]";
  const iconColorClass = isCustomLogo ? "text-black" : "text-white";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onExpand}
            onMouseEnter={() => setButtonHovered(true)}
            onMouseLeave={() => setButtonHovered(false)}
            className="flex items-center justify-center cursor-pointer"
            type="button"
          >
            <motion.div
              className={cn(
                "w-8 h-8 rounded-md flex items-center justify-center shrink-0 overflow-hidden",
                panelBgClass,
              )}
              animate={
                buttonHovered ? { scale: iconHoverScale.scale } : { scale: 1 }
              }
              transition={{ duration: 0.2 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {sidebarHovered ? (
                  <motion.div
                    key="panel"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <PanelLeft className={`w-4 h-4 ${iconColorClass}`} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="logo"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <CompanyLogoIcon companyLogo={companyLogo} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{t("open_sidebar")}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const Company = ({
  companyName,
  productName,
  companyLogo,
  sidebarHovered = false,
}: CompanyProps) => {
  const { t } = useTranslation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isCustomLogo = companyLogo?.isCustom ?? false;
  const logoBgClass = isCustomLogo
    ? "bg-white border border-border"
    : "bg-[oklch(0.6533_0.2227_34.41)]";

  const iconElement = (
    <div
      className={cn(
        "w-8 h-8 rounded-md flex items-center justify-center shrink-0 overflow-hidden",
        logoBgClass,
      )}
    >
      <CompanyLogoIcon companyLogo={companyLogo} />
    </div>
  );

  return (
    <div className="flex items-center justify-between h-7 pt-4">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {isCollapsed ? (
          <CollapsedLogo
            companyLogo={companyLogo}
            sidebarHovered={sidebarHovered}
            onExpand={toggleSidebar}
          />
        ) : (
          iconElement
        )}

        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              key="company-text"
              className="flex flex-col min-w-0"
              variants={{
                initial: textFadeVariants.initial,
                animate: textFadeVariants.animate,
                exit: textFadeVariants.exit,
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={fastFadeTransition}
            >
              <span className="text-sm font-semibold text-sidebar-foreground leading-tight truncate">
                {companyName}
              </span>
              {productName && (
                <span className="text-xs text-sidebar-foreground/60 leading-tight truncate">
                  {productName}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            variants={{
              initial: scaleVariants.initial,
              animate: scaleVariants.animate,
              exit: scaleVariants.exit,
            }}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={fastFadeTransition}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={toggleSidebar}
                    className="ml-auto shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground cursor-pointer"
                  >
                    <PanelLeft className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t("close_sidebar")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

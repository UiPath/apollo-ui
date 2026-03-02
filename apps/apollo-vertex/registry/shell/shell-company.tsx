"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Box, PanelLeft } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/registry/use-local-storage/use-local-storage";
import type { CompanyLogo } from "./shell";
import {
  fastFadeTransition,
  iconHoverScale,
  scaleVariants,
  textFadeVariants,
} from "./shell-animations";

interface CompanyProps {
  companyName: string;
  productName: string;
  companyLogo?: CompanyLogo;
}

function CollapsedLogo({
  companyLogo,
  companyName,
  productName,
  onExpand,
}: {
  companyLogo?: CompanyLogo;
  companyName: string;
  productName: string;
  onExpand: () => void;
}) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onExpand}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="flex items-center justify-center cursor-pointer"
            type="button"
          >
            <motion.div
              className="w-8 h-8 rounded-md bg-brand-orange flex items-center justify-center shrink-0"
              whileHover={iconHoverScale}
            >
              <AnimatePresence mode="wait" initial={false}>
                {hovered ? (
                  <motion.div
                    key="panel"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <PanelLeft className="w-4 h-4 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="logo"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {companyLogo ? (
                      <img
                        src={companyLogo.url}
                        alt={companyLogo.alt}
                        className="w-4 h-auto"
                      />
                    ) : (
                      <Box className="w-4 h-4 text-white" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {t("open_sidebar")}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const Company = ({
  companyName,
  productName,
  companyLogo,
}: CompanyProps) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useLocalStorage(
    "sidebar-collapsed",
    false,
  );
  const iconElement = (
    <motion.div
      className="w-8 h-8 rounded-md bg-brand-orange flex items-center justify-center shrink-0"
      {...(isCollapsed ? { whileHover: iconHoverScale } : {})}
    >
      {companyLogo ? (
        <img
          src={companyLogo.url}
          alt={companyLogo.alt}
          className="w-4 h-auto"
        />
      ) : (
        <Box className="w-4 h-4 text-white" />
      )}
    </motion.div>
  );

  return (
    <div className="flex items-center justify-between h-7 pt-4">
      <div className="flex items-center gap-2">
        {isCollapsed ? (
          <CollapsedLogo
            companyLogo={companyLogo}
            companyName={companyName}
            productName={productName}
            onExpand={() => setIsCollapsed(false)}
          />
        ) : (
          iconElement
        )}

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              key="company-text"
              className="flex flex-col min-w-0 whitespace-nowrap"
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
              <span className="text-sm font-semibold text-sidebar-foreground truncate">
                {companyName}
              </span>
              <span className="text-xs text-sidebar-foreground/70 truncate">
                {productName}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
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
                  <button
                    type="button"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="h-8 w-8 ml-auto shrink-0 flex items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors cursor-pointer"
                  >
                    <PanelLeft className="w-4 h-4" />
                  </button>
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

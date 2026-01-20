"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Box, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { sidebarSpring, fastFadeTransition, textFadeVariants, scaleVariants, iconHoverScale } from "./animations";
import { useLocalStorage } from "@/registry/use-local-storage/use-local-storage";

interface CompanyProps {
  companyName: string;
  productName: string;
}

export const Company = ({
  companyName,
  productName,
}: CompanyProps) => {
  const [isCollapsed, setIsCollapsed] = useLocalStorage("sidebar-collapsed", false);
  const iconElement = (
    <motion.div
      className="w-8 h-8 rounded-md bg-linear-to-r from-primary/5 via-secondary/5 to-primary/5 flex items-center justify-center shrink-0"
      whileHover={isCollapsed ? iconHoverScale : undefined}
    >
      <Box className="w-4 h-4 text-primary" />
    </motion.div>
  );

  return (
    <div className="flex items-center justify-between h-7 pt-2">
      <div className="flex items-center gap-2">
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex items-center justify-center cursor-pointer"
                type="button"
              >
                {iconElement}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="flex flex-col gap-0.5">
                <span className="font-xs">{companyName}</span>
                <span className="text-xs opacity-70">{productName}</span>
              </div>
            </TooltipContent>
          </Tooltip>
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
              <span className="text-sm text-sidebar-foreground truncate">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 ml-auto shrink-0"
            >
              <PanelLeft className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

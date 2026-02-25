"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLocalStorage } from "@/registry/use-local-storage/use-local-storage";
import { ShellTemplate } from "@/templates/ShellTemplate";
import { InvoiceDashboard } from "./invoice-dashboard";

function VisibilityToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  const [isCollapsed] = useLocalStorage("sidebar-collapsed", false);
  const Icon = visible ? Eye : EyeOff;

  const content = (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center rounded-md transition-colors duration-200 h-8 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground w-full"
    >
      <span className="w-8 h-8 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span
            key="toggle-text"
            className="truncate whitespace-nowrap pl-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            Toggle Content
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            Toggle Content
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

export default function ShellPreviewPage() {
  const [contentVisible, setContentVisible] = useState(true);

  return (
    <ShellTemplate
      sidebarActions={
        <VisibilityToggle
          visible={contentVisible}
          onToggle={() => setContentVisible((v) => !v)}
        />
      }
    >
      <InvoiceDashboard visible={contentVisible} />
    </ShellTemplate>
  );
}

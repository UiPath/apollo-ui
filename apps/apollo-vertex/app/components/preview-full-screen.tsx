"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/registry/button/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/registry/dialog/dialog";

export function PreviewFullScreen({
  children,
  height = 600,
  title,
}: {
  children: ReactNode;
  height?: number;
  title: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div
        className="relative not-prose my-8 rounded-lg overflow-hidden group"
        style={{ height }}
      >
        {!isOpen && (
          <div className="[&_.h-screen]:!h-full h-full">{children}</div>
        )}
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon-sm"
            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-300 bg-background/80 backdrop-blur-sm"
            aria-label={t("enter_full_screen")}
            title={t("enter_full_screen")}
          >
            <Maximize2 className="size-4" />
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent fullscreen showCloseButton={false}>
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogClose asChild>
          <Button
            variant="outline"
            size="icon-sm"
            className="absolute top-4 right-4 z-20"
            aria-label={t("exit_full_screen")}
            title={t("exit_full_screen")}
          >
            <Minimize2 className="size-4" />
          </Button>
        </DialogClose>
        <div className="[&_.h-screen]:!h-full h-full">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

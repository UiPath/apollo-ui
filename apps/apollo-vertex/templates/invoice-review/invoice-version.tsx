"use client";

import { Layers } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Dev-only switch for the invoice-review detail area (everything right of the
 * "My Queue" left nav: header, middle, and right panels). Lets us flip between
 * the current design and an in-progress "next" version to compare them.
 */
export type InvoiceVersion = "current" | "next";

const STORAGE_KEY = "invoice-review:version";

interface InvoiceVersionContextValue {
  version: InvoiceVersion;
  setVersion: (v: InvoiceVersion) => void;
}

const InvoiceVersionContext = createContext<InvoiceVersionContextValue | null>(
  null,
);

export function InvoiceVersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersionState] = useState<InvoiceVersion>("current");

  // Restore the last-used version on mount (dev convenience across reloads).
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "current" || saved === "next") setVersionState(saved);
  }, []);

  const setVersion = (v: InvoiceVersion) => {
    setVersionState(v);
    localStorage.setItem(STORAGE_KEY, v);
  };

  return (
    <InvoiceVersionContext.Provider value={{ version, setVersion }}>
      {children}
    </InvoiceVersionContext.Provider>
  );
}

export function useInvoiceVersion(): InvoiceVersionContextValue {
  const ctx = useContext(InvoiceVersionContext);
  if (!ctx) {
    throw new Error(
      "useInvoiceVersion must be used within an InvoiceVersionProvider",
    );
  }
  return ctx;
}

/**
 * A profile-menu item that switches the detail-area version. Rendered inside the
 * shell user-profile dropdown via the shell's profile-extras slot.
 */
export function LayoutVersionMenuItem() {
  const { version, setVersion } = useInvoiceVersion();
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Layers className="w-4 h-4" />
        <span>Layout ({version === "next" ? "New" : "Current"})</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem
          onClick={() => setVersion("current")}
          className={cn(version === "current" ? "bg-accent" : "")}
        >
          Current
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setVersion("next")}
          className={cn(version === "next" ? "bg-accent" : "")}
        >
          New
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

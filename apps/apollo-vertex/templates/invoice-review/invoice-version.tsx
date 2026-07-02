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
 * layout variants to compare them.
 *
 * v1 = the original design (was "current"). v2 = the timeline redesign (was
 * "next"). v3 = an in-progress variant; it currently mirrors v2 as a starting
 * point until it diverges.
 */
export type InvoiceVersion = "v1" | "v2" | "v3";

const VERSIONS: InvoiceVersion[] = ["v1", "v2", "v3"];

const STORAGE_KEY = "invoice-review:version";

interface InvoiceVersionContextValue {
  version: InvoiceVersion;
  setVersion: (v: InvoiceVersion) => void;
}

const InvoiceVersionContext = createContext<InvoiceVersionContextValue | null>(
  null,
);

function isVersion(value: string | null): value is InvoiceVersion {
  return value === "v1" || value === "v2" || value === "v3";
}

export function InvoiceVersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersionState] = useState<InvoiceVersion>("v1");

  // Restore the last-used version on mount, migrating the legacy names.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const migrated =
      saved === "current" ? "v1" : saved === "next" ? "v2" : saved;
    if (isVersion(migrated)) setVersionState(migrated);
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
        <span>Layout ({version})</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {VERSIONS.map((v) => (
          <DropdownMenuItem
            key={v}
            onClick={() => setVersion(v)}
            className={cn(version === v ? "bg-accent" : "")}
          >
            {v}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

"use client";

import { createContext, type ReactNode, useContext } from "react";

/**
 * Optional slot for injecting extra items into the shell's user-profile menu.
 * Apps wrap their tree in `ShellProfileExtrasProvider` and pass menu items
 * (e.g. `DropdownMenuItem`s); they render below the built-in theme/language
 * entries. Empty by default, so the shell is unaffected when unused.
 */
const ShellProfileExtrasContext = createContext<ReactNode>(null);

export function ShellProfileExtrasProvider({
  items,
  children,
}: {
  items: ReactNode;
  children: ReactNode;
}) {
  return (
    <ShellProfileExtrasContext.Provider value={items}>
      {children}
    </ShellProfileExtrasContext.Provider>
  );
}

export function useShellProfileExtras(): ReactNode {
  return useContext(ShellProfileExtrasContext);
}

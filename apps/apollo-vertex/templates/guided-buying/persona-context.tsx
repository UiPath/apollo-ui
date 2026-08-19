"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { PersonaId } from "./personas";

interface PersonaContextValue {
  personaId: PersonaId;
  setPersonaId: (id: PersonaId) => void;
}

const PersonaContext = createContext<PersonaContextValue | null>(null);

/**
 * Exposes GuidedBuyingLayout's own persona state to route components
 * beneath it (Chunk C1: Approvals needs to know which approver seat is
 * active to filter its list, and had no way to read persona state at all
 * before this). The provider takes the state as props rather than owning
 * it: GuidedBuyingLayout already computes `personaId` from `personaForPath`
 * at mount and drives `switchPersona`'s navigation side effect, neither of
 * which this duplicates, this only makes the existing value reachable
 * further down the tree, the same role TierProvider already plays for
 * `tier`.
 */
export function PersonaProvider({
  personaId,
  setPersonaId,
  children,
}: {
  personaId: PersonaId;
  setPersonaId: (id: PersonaId) => void;
  children: ReactNode;
}) {
  return (
    <PersonaContext.Provider value={{ personaId, setPersonaId }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona(): PersonaContextValue {
  const ctx = useContext(PersonaContext);
  if (!ctx) {
    throw new Error("usePersona must be used within a PersonaProvider");
  }
  return ctx;
}

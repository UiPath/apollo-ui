"use client";

import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { ApolloShell } from "@/registry/shell/shell";
import { AutopilotFab } from "./AutopilotFab";
import {
  PERSONA_MENU_ORDER,
  PERSONAS,
  type PersonaId,
  personaForPath,
} from "./personas";
import { avatarColorFor } from "./requests/avatar-color";
import { getDecisionDetail } from "./requests/data";
import { useTier } from "./tier-context";

function TierMenuSection() {
  const { tier, setTier } = useTier();
  return (
    <>
      <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Prototype tier
      </DropdownMenuLabel>
      <DropdownMenuItem
        onClick={() => setTier("p1")}
        className="justify-between"
      >
        <span className="flex items-center gap-2">
          <span className="flex size-4 items-center justify-center shrink-0">
            <span className="size-2 rounded-full bg-primary" />
          </span>
          P1 · Now (CGA)
        </span>
        {tier === "p1" && <Check className="size-3.5 shrink-0 text-primary" />}
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => setTier("p2")}
        className="justify-between"
      >
        <span className="flex items-center gap-2">
          <span className="flex size-4 items-center justify-center shrink-0">
            <span className="size-2 rounded-full bg-(--insight-600)" />
          </span>
          P2 · Next (V2)
        </span>
        {tier === "p2" && (
          <Check className="size-3.5 shrink-0 text-(--insight-600)" />
        )}
      </DropdownMenuItem>
    </>
  );
}

// Same section-label and checked-state treatment as TierMenuSection, no
// colored dots, personas have no color semantics and inventing three would
// read as meaningful when it isn't.
function PersonaMenuSection({
  personaId,
  onSelect,
}: {
  personaId: PersonaId;
  onSelect: (id: PersonaId) => void;
}) {
  return (
    <>
      <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Prototype persona
      </DropdownMenuLabel>
      {PERSONA_MENU_ORDER.map((id) => {
        const persona = PERSONAS[id];
        return (
          <DropdownMenuItem
            key={id}
            onClick={() => onSelect(id)}
            className="justify-between"
          >
            <span>
              {persona.name} · {persona.role}
            </span>
            {personaId === id && (
              <Check className="size-3.5 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        );
      })}
    </>
  );
}

export function GuidedBuyingLayout() {
  const navigate = useNavigate();
  // Selector-scoped, not a bare useRouterState() destructure, this file's
  // own established pattern (see BuyFlow.tsx) to avoid re-rendering the
  // root layout on every router-internal state change, not just pathname.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Seeded from the entry route (see personaForPath) so a direct load onto
  // an approver/buyer surface doesn't show the requester's identity, see
  // that function's own comment for why this isn't a route-derived
  // override on every navigation, just the initial value.
  const [personaId, setPersonaId] = useState<PersonaId>(() =>
    personaForPath(pathname),
  );

  // Persona state is the single authority over the identity chip now, no
  // route-derived override past the initial value above.
  const persona = PERSONAS[personaId];
  const user = { name: persona.name, email: persona.chipSubtitle };
  // Same person, same avatar color everywhere they appear, the identity
  // chip is no longer tier-tinted, since tier isn't who this is.
  const personaAvatarColor = avatarColorFor(persona.name);
  const avatarClassName = cn(personaAvatarColor.bg, personaAvatarColor.fg);

  // The only context-preserving switch in scope: from a request's own detail
  // page, switching to the approver lands on that same request's decision
  // instead of a fresh queue, this is what replaces the deleted "Approver
  // view (demo)" affordance. Guarded on getDecisionDetail actually having
  // that id, so any request other than REQ-2052 falls back to the approver's
  // own queue rather than a "Decision request not found" dead end. The
  // buyer has no equivalent, there's no /workbench/$id to land on (see the
  // step 2 report), so switching to Sam Rivera always goes to /workbench.
  const switchPersona = (target: PersonaId) => {
    if (target === personaId) return;

    if (target === "approver") {
      const requestId = pathname.match(/^\/requests\/([^/]+)$/)?.[1];
      if (requestId && getDecisionDetail(requestId)) {
        setPersonaId(target);
        void navigate({ to: "/decision/$id", params: { id: requestId } });
        return;
      }
    }

    setPersonaId(target);
    void navigate({ to: PERSONAS[target].homeRoute });
  };

  return (
    <ApolloShell
      companyName="UiPath"
      productName="Guided Buying"
      companyLogo={{
        url: "/UiPath.svg",
        darkUrl: "/UiPath_dark.svg",
        alt: "UiPath logo",
      }}
      navItems={persona.navItems}
      user={user}
      userMenuAdditionalItems={
        <>
          <PersonaMenuSection personaId={personaId} onSelect={switchPersona} />
          <TierMenuSection />
        </>
      }
      avatarClassName={avatarClassName}
    >
      {/* Clips the Buy↔Configure horizontal slide so it can't flash a
          scrollbar. */}
      <div className="relative h-full overflow-hidden">
        <Outlet />
      </div>
      {/* One Autopilot home, the orb FAB, same corner on every surface. */}
      <AutopilotFab />
      {/* One toast host for the whole prototype, top-center, per the
          in-product notification guidelines. */}
      <Toaster />
    </ApolloShell>
  );
}

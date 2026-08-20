import type { RoutePaths } from "@tanstack/router-core";
import {
  ClipboardCheck,
  ClipboardList,
  Home as HomeIcon,
  ShoppingCart,
  Store,
  Wrench,
} from "lucide-react";
import type { ShellNavItem } from "@/registry/shell/shell";
import { PEOPLE } from "./data/people";
// Type-only: breaks what would otherwise be a real runtime cycle
// (route-tree.ts needs GuidedBuyingLayout.tsx's component, which needs this
// module's PERSONAS). Erased entirely at build time, so it carries no
// runtime dependency on route-tree.ts, only the path-safety of its type.
// See the report for why this is the chosen fix for the circularity, not a
// runtime registry.
import type { routeTree } from "./route-tree";

// Home, Buy, and Catalog are requester surfaces. Home is the composer +
// "Your requests"; Buy creates a request; Catalog (Selection.tsx under the
// hood) has its own add-to-cart affordances writing into the same unscoped
// cart/conversation state Buy uses (see the step 2 report on Catalog), none
// of the three has a notion of whose request it is, so none of them are
// safe to also expose to the buyer or approver nav. Each of those gets only
// its own queue.
const requesterNavItems: ShellNavItem[] = [
  { path: "/home", label: "home", icon: HomeIcon },
  { path: "/buy", label: "buy", icon: ShoppingCart },
  { path: "/catalog", label: "catalog", icon: Store },
  { path: "/requests", label: "requests", icon: ClipboardList },
];

const buyerNavItems: ShellNavItem[] = [
  { path: "/workbench", label: "workbench", icon: Wrench },
];

const approverNavItems: ShellNavItem[] = [
  { path: "/approvals", label: "approvals", icon: ClipboardCheck },
];

export type PersonaId =
  | "requester"
  | "buyer"
  | "approver"
  | "priya"
  | "budget-owner";

export interface Persona {
  id: PersonaId;
  name: string;
  /** The word the popover's persona list uses for "{name} · {role}". See
   * the step 1 report: "Buyer" and "Approver" are new words, not present
   * in today's seed data. */
  role: string;
  /** The identity chip's subtitle, authored directly rather than derived,
   * the three legacy strings (role+location, department, job title) don't
   * share a composition rule. See the step 2 report. */
  chipSubtitle: string;
  /** Validated against the actual route tree (RoutePaths), not a
   * hand-written union, see the step 2 report on why a plain `string`
   * let an unregistered route through undetected. */
  homeRoute: RoutePaths<typeof routeTree>;
  navItems: ShellNavItem[];
}

export const PERSONAS: Record<PersonaId, Persona> = {
  requester: {
    id: "requester",
    name: "Marcus Webb",
    role: "Requester",
    // Same "{role} · {org}" shape Priya's own chip already uses — the
    // format was never actually inconsistent between the two, only the
    // value was (cleanup report): his own org is "Denver team", hers is
    // "IT, Denver", each keeps their own.
    chipSubtitle: "Requester · Denver team",
    homeRoute: "/requests",
    navItems: requesterNavItems,
  },
  buyer: {
    id: "buyer",
    name: "Sam Rivera",
    role: "Buyer",
    chipSubtitle: "Procurement",
    homeRoute: "/workbench",
    navItems: buyerNavItems,
  },
  approver: {
    id: "approver",
    name: "Alex Chen",
    role: "Approver",
    chipSubtitle: "Design Director",
    homeRoute: "/approvals",
    navItems: approverNavItems,
  },
  // J3's own requester, a distinct named identity from Marcus, not a
  // second entry for the "requester" role.
  priya: {
    id: "priya",
    name: PEOPLE["priya-nair"].name,
    role: PEOPLE["priya-nair"].role,
    chipSubtitle: `${PEOPLE["priya-nair"].role} · ${PEOPLE["priya-nair"].org}`,
    // Requester parity: one home route, one nav array, shared with
    // Marcus. Disambiguated on a cold /home load via the ?as=priya
    // search param (see personaForPath below), not by a distinct path.
    homeRoute: "/home",
    navItems: requesterNavItems,
  },
  // J3's second approver (Chunk C1): a distinct named identity from Alex,
  // sharing the same prototype role and the same approver nav, since both
  // seats do the same job in this prototype. "Approver" stays a literal
  // here, matching Alex's own entry above, not PEOPLE["dana-kim"].role
  // (her real job title, "Sr. Director, budget owner"): the two aren't the
  // same value, the persona's own `role` is the prototype-level word every
  // approver seat shares, not a per-person title. Name and chip subtitle
  // still derive from her people.ts record rather than restating it.
  "budget-owner": {
    id: "budget-owner",
    name: PEOPLE["dana-kim"].name,
    role: "Approver",
    chipSubtitle: `${PEOPLE["dana-kim"].role} · ${PEOPLE["dana-kim"].org}`,
    homeRoute: "/approvals",
    navItems: approverNavItems,
  },
};

// Menu order: Requester, Buyer, Approver per the spec, Priya appended,
// Dana appended after her (Chunk C1's own second approver seat).
export const PERSONA_MENU_ORDER: PersonaId[] = [
  "requester",
  "buyer",
  "approver",
  "priya",
  "budget-owner",
];

// Which persona owns a given route prefix, used once, at mount, to pick
// the identity chip that matches the surface actually being viewed. Landing
// straight on an approver or buyer route (a link from elsewhere, a shared
// URL, a fresh load) previously always started on the requester's identity
// regardless of the route, since persona state had no route-derived value
// at all. This doesn't reintroduce a route-derived override on every
// navigation, it only seeds the initial value, so the switcher stays the
// single authority once mounted, per GuidedBuyingLayout's own comment on
// `switchPersona`.
//
// FINDING (Chunk C1, partially resolved in the C1 cleanup): /decision and
// /approvals now serve two approver seats, Alex and Dana, and this
// function has no way to tell which one a bare URL belongs to (a request
// id alone doesn't say whose queue it's in) — it still returns "approver"
// unconditionally for both prefixes here. GuidedBuyingLayout.tsx's own
// persona seed now resolves a /decision/$id load from that request's own
// approverPersonaId first, falling back to this function's guess only when
// there's no id to resolve from (can't live here: that lookup needs
// requests/data.ts, which imports PersonaId from this module, so the
// reverse import would be circular). /approvals still has no single
// request to resolve from, so a bare load there keeps guessing "approver"
// (Alex) regardless of who last used it — unresolved, the switcher itself
// already reaches the right persona correctly (see PersonaMenuSection).
//
// Requester parity: Marcus and Priya now share every requesterNavItems
// path (/home, /buy, /catalog, /requests), not just /home, so the path
// alone can no longer tell them apart on any of those the way /start's
// own distinct path used to. Unlike the approver ambiguity above, this
// one has a real resolution source: switchPersona (see
// GuidedBuyingLayout.tsx) stamps a ?as=priya search param onto the URL
// whenever it navigates to Priya's home, and each of the shared routes'
// own validateSearch carries it through (see route-tree.tsx), so a
// reload of any of those exact URLs still resolves her correctly. No
// search param present means Marcus, matching today's default.
//
// cleanup FINDING: this used to check `pathname === "/home"` only, so a
// cold load of e.g. /requests?as=priya fell through to the "requester"
// default below even though the shell's own identity (fed by this same
// function) should have shown Priya — reusing requesterNavItems here
// (rather than a second hardcoded path list) closes that gap for every
// one of her shared surfaces at once.
export function personaForPath(pathname: string, search?: unknown): PersonaId {
  const isPriyaRequesterSurface =
    requesterNavItems.some((item) => item.path === pathname) &&
    search != null &&
    typeof search === "object" &&
    "as" in search &&
    search.as === "priya";
  if (isPriyaRequesterSurface) {
    return "priya";
  }
  if (pathname.startsWith("/decision") || pathname.startsWith("/approvals")) {
    return "approver";
  }
  if (pathname.startsWith("/workbench")) return "buyer";
  if (pathname.startsWith("/intake")) return "priya";
  return "requester";
}

import type { RoutePaths } from "@tanstack/router-core";
import {
  ClipboardCheck,
  ClipboardList,
  FileText,
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

// Same ShellNavItem shape and home/intake labels the requester's own nav
// uses, pointing at Priya's own routes rather than Marcus's, so her sidebar
// stays a real map of her product instead of a link to his.
const priyaNavItems: ShellNavItem[] = [
  { path: "/start", label: "home", icon: HomeIcon },
  { path: "/intake", label: "intake", icon: FileText },
];

export type PersonaId = "requester" | "buyer" | "approver" | "priya";

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
    homeRoute: "/start",
    navItems: priyaNavItems,
  },
};

// Menu order: Requester, Buyer, Approver per the spec, Priya appended.
export const PERSONA_MENU_ORDER: PersonaId[] = [
  "requester",
  "buyer",
  "approver",
  "priya",
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
export function personaForPath(pathname: string): PersonaId {
  if (pathname.startsWith("/decision") || pathname.startsWith("/approvals")) {
    return "approver";
  }
  if (pathname.startsWith("/workbench")) return "buyer";
  if (pathname.startsWith("/intake") || pathname.startsWith("/start")) {
    return "priya";
  }
  return "requester";
}

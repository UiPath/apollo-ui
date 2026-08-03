import { GuidedBuyingMount } from "../guided-buying-mount";

// Non-optional catch-all: handles every *nested* path
// (/guided-buying/requests/REQ-2031, /guided-buying/decision/REQ-2052, ...)
// so a reload or a shared deep link resolves here instead of 404ing. The bare
// /guided-buying root is handled by the sibling literal page.tsx — Nextra's
// page-map scan needs a real page directly in app/guided-buying/ (it doesn't
// resolve into a dynamic-segment folder), and a literal page + non-optional
// catch-all can coexist in the same parent without a route conflict; an
// *optional* catch-all here would collide with that sibling instead.
// The slug itself is never read — GuidedBuyingMount's shell owns its own
// router (browser history, basepath /guided-buying), which reads
// window.location and resolves the matching internal route once mounted.
export default function GuidedBuyingCatchAllPage() {
  return <GuidedBuyingMount />;
}

// Coded App builds (output: "export") require every dynamic segment to
// enumerate its paths — only these are pre-rendered there; anything deeper
// (e.g. a specific request id) still needs the host's SPA fallback to serve
// this same bundle for an unmatched path. See the routing report for detail.
export function generateStaticParams() {
  return [
    { slug: ["buy"] },
    { slug: ["catalog"] },
    { slug: ["configure"] },
    { slug: ["workbench"] },
    { slug: ["requests"] },
    { slug: ["review"] },
    { slug: ["track"] },
  ];
}

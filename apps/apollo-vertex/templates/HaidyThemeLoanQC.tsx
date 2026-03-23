"use client";

import {
  ArrowLeft,
  Bell,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Minus,
  Settings,
  User,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Shared glass styles (accessible — all text ≥ 4.5:1 on ~#eff3f7)
// ---------------------------------------------------------------------------

/** Standard glass card — fully rounded */
const glassCard = [
  "rounded-2xl",
  "bg-white/50",
  "backdrop-blur-[20px]",
  "border border-white/70",
  "shadow-[0_0_0_1px_rgba(255,255,255,0.7),0_0_48px_-2px_rgba(185,205,230,0.45),0_0_28px_0_rgba(220,232,245,0.30),0_0_12px_0_rgba(255,255,255,0.25),inset_0_2px_20px_0_rgba(255,255,255,0.60),inset_0_-1px_6px_0_rgba(200,215,235,0.12)]",
].join(" ");

/** Left sidebar — no rounding, flush to left edge, right border acts as divider */
const glassSidebar = [
  "rounded-none",
  "bg-white/50",
  "backdrop-blur-[20px]",
  "border-r border-white/60",
].join(" ");

// ---------------------------------------------------------------------------
// Data — Credit Approval Memo
// ---------------------------------------------------------------------------

const memoProfile = {
  relationship: "TILBRAE LOGISTICS GROUP LLC",
  loanOfficer: "NELA MORVINE",
  date: "04/07/2025",
  creditAnalyst: "MARISSA DRENLOW",
  borrowerMember: "TILBRAE LOGISTICS GROUP LLC",
  memberNumber: "7654321-00",
  memberSince: "06/06/2025",
  streetAddress: "1914 East Varella Parkway",
  cityStateZip: "Stonefield, WY 82932",
  legalStructure: "LLC",
  dateEstablished: "18/03/2025",
  tinSsn: "71-8493026",
  naicsCode: "484121 — General Freight",
  naicsDesc: "Trucking, Long-Distance;",
  currentTotalExposure: "$31,000",
  proposedChanges: "$50,900",
  plusOutstandingApprovals: "$0",
  proposedTotalExposure: "$81,900",
  averageYtdDeposits: "$0",
  totalCurrentDeposits: "$4,999",
};

const memoNotes = `The member established since 06/06/2025: registered with Sumcompany on 01/01/2025. Both business and personal deposits $4,999 with ABC, credit pulled 03/17/2025 (700) and SMTHSmth on 03/24/2025. Bus SMTHSmth Free of any judgments, liens, foreclosures. Personal SMTHSmth Judgment $1000, liens, foreclosures. John Free of any judgments, liens, foreclosures. The members are 50/50 of TILBRAE LOGISTICS GROUP LLC MICRO Equipment Loan  ***`;

const memoNotes2 = `The member established since 03/04/2025: registered with Sumcompany on 01/01/2025. The members are 50/50 owners of TILBRAE LOGISTICS GROUP LLC ***  (Micro Equipment Loan)  MICRO Equipment loan to purchase a Commercial Truck (VIN 7FZKBYA22MN014983), Projected Annual Gross Revenue - $200,000 based on the application provided. No existing business liabilities. certificate of origin, and course certificate has been saved to  the Z drive.`;

// ---------------------------------------------------------------------------
// Compliance rules
// ---------------------------------------------------------------------------

type RuleEvaluation =
  | "yes"
  | "no"
  | "na"
  | "inconclusive"
  | "needs_review"
  | null;

interface ComplianceRule {
  label: string;
  agentEval: string | null;
  agentReasoning: string | null;
  humanEval: RuleEvaluation;
  showHumanButtons:
    | "yes_no_na"
    | "yes_person_minus"
    | "no_person_minus"
    | "inconclusive_needs_review";
}

const complianceRules: ComplianceRule[] = [
  {
    label: "Rule name-",
    agentEval: "No",
    agentReasoning: "[Agent reasoning goes here...]",
    humanEval: null,
    showHumanButtons: "yes_no_na",
  },
  {
    label: "Loan amount does not exceed approved amount",
    agentEval: null,
    agentReasoning: null,
    humanEval: "yes",
    showHumanButtons: "yes_person_minus",
  },
  {
    label: "Lender's address matches Credit Memo",
    agentEval: null,
    agentReasoning: null,
    humanEval: "no",
    showHumanButtons: "no_person_minus",
  },
  {
    label: "Borrower's name for signature matches ID",
    agentEval: null,
    agentReasoning: null,
    humanEval: "inconclusive",
    showHumanButtons: "inconclusive_needs_review",
  },
];

// ---------------------------------------------------------------------------
// Small reusable components
// ---------------------------------------------------------------------------

function GlassButton({
  children,
  variant = "default",
  active = false,
  className = "",
}: {
  children: React.ReactNode;
  variant?: "default" | "yes" | "no" | "inconclusive" | "needs_review";
  active?: boolean;
  className?: string;
}) {
  const base =
    "px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer backdrop-blur-[6px] border";

  const variants: Record<string, string> = {
    default: active
      ? "bg-white/60 text-slate-700 border-slate-200/40 shadow-[0_0_10px_-2px_rgba(185,205,230,0.15),inset_0_1px_4px_0_rgba(255,255,255,0.35)]"
      : "bg-white/30 text-slate-600 border-white/40 hover:bg-white/50 hover:shadow-[0_0_12px_-2px_rgba(185,205,230,0.25)]",
    yes: active
      ? "bg-[#0e7490]/10 text-[#0e7490] border-[#0e7490]/20 shadow-[0_0_10px_-2px_rgba(14,116,144,0.15),inset_0_1px_4px_0_rgba(255,255,255,0.35)]"
      : "bg-white/30 text-slate-600 border-white/40 hover:bg-[#0e7490]/5 hover:text-[#0e7490] hover:border-[#0e7490]/15 hover:shadow-[0_0_12px_-2px_rgba(14,116,144,0.15)]",
    no: active
      ? "bg-rose-100/50 text-rose-700 border-rose-200/40 shadow-[0_0_10px_-2px_rgba(244,63,94,0.10),inset_0_1px_4px_0_rgba(255,255,255,0.4)]"
      : "bg-white/30 text-slate-600 border-white/40 hover:bg-rose-50/40 hover:text-rose-700 hover:border-rose-200/30 hover:shadow-[0_0_12px_-2px_rgba(244,63,94,0.10)]",
    inconclusive: active
      ? "bg-white/60 text-slate-700 border-slate-300/40 shadow-[0_0_10px_-2px_rgba(185,205,230,0.15),inset_0_1px_4px_0_rgba(255,255,255,0.35)]"
      : "bg-white/30 text-slate-600 border-white/40 hover:bg-white/50 hover:shadow-[0_0_12px_-2px_rgba(185,205,230,0.2)]",
    needs_review: active
      ? "bg-amber-100/50 text-amber-800 border-amber-200/40 shadow-[0_0_10px_-2px_rgba(245,158,11,0.12),inset_0_1px_4px_0_rgba(255,255,255,0.4)]"
      : "bg-white/30 text-slate-600 border-white/40 hover:bg-amber-50/40 hover:text-amber-800 hover:border-amber-200/30 hover:shadow-[0_0_12px_-2px_rgba(245,158,11,0.10)]",
  };

  return (
    <button
      type="button"
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function IconButton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`size-8 flex items-center justify-center rounded-xl bg-white/30 backdrop-blur-[6px] border border-white/40 text-slate-600 hover:bg-white/50 hover:text-slate-700 hover:shadow-[0_0_12px_-2px_rgba(185,205,230,0.2)] transition-all cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Zoom controls
// ---------------------------------------------------------------------------

function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  return (
    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-white/70 backdrop-blur-[16px] border border-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.6),0_0_24px_-2px_rgba(185,205,230,0.35),0_4px_12px_-2px_rgba(0,0,0,0.06),inset_0_1px_8px_0_rgba(255,255,255,0.5)]">
      <button
        type="button"
        onClick={onZoomOut}
        className="size-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-white/60 hover:text-slate-700 transition-all cursor-pointer"
      >
        <ZoomOut className="size-3.5 stroke-[1.5]" />
      </button>
      <span className="text-[10px] font-medium text-slate-700 min-w-[32px] text-center tabular-nums">
        {Math.round(zoom * 100)}%
      </span>
      <button
        type="button"
        onClick={onZoomIn}
        className="size-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-white/60 hover:text-slate-700 transition-all cursor-pointer"
      >
        <ZoomIn className="size-3.5 stroke-[1.5]" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Credit Approval Memo Document
// ---------------------------------------------------------------------------

function CreditMemoDocument({ zoom }: { zoom: number }) {
  return (
    <div
      className="px-8 py-8 space-y-5 text-[11px] leading-relaxed text-slate-700 origin-top-left"
      style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%` }}
    >
      <h3 className="text-center text-sm font-bold text-slate-700 mb-4">
        Credit Approval Memo
      </h3>

      {/* Header fields */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-1">
        <div className="flex gap-2">
          <span className="font-semibold text-slate-700 whitespace-nowrap">
            Relationship:
          </span>
          <span className="text-slate-600">{memoProfile.relationship}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-semibold text-slate-700 whitespace-nowrap">
            Date:
          </span>
          <span className="text-slate-600">{memoProfile.date}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-semibold text-slate-700 whitespace-nowrap">
            Loan Officer:
          </span>
          <span className="text-slate-600">{memoProfile.loanOfficer}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-semibold text-slate-700 whitespace-nowrap">
            Credit Analyst:
          </span>
          <span className="text-slate-600">{memoProfile.creditAnalyst}</span>
        </div>
      </div>

      {/* PROFILE section */}
      <div>
        <h4 className="text-center text-xs font-bold text-slate-700 mb-2 tracking-wide">
          PROFILE
        </h4>
        <div className="grid grid-cols-2 gap-x-6">
          {/* Left column */}
          <div className="space-y-0.5">
            <ProfileRow
              label="Borrower/Member:"
              value={memoProfile.borrowerMember}
            />
            <ProfileRow
              label="Street Address:"
              value={memoProfile.streetAddress}
            />
            <ProfileRow
              label="City/ State/ Zip:"
              value={memoProfile.cityStateZip}
            />
            <ProfileRow
              label="Legal Structure:"
              value={memoProfile.legalStructure}
            />
            <ProfileRow
              label="Date Established:"
              value={memoProfile.dateEstablished}
            />
            <ProfileRow label="TIN/SSN:" value={memoProfile.tinSsn} />
            <ProfileRow label="NAICS Code:" value={memoProfile.naicsCode} />
            <div className="pl-24 text-slate-600">{memoProfile.naicsDesc}</div>
          </div>
          {/* Right column */}
          <div className="space-y-0.5">
            <ProfileRow
              label="Member Number:"
              value={memoProfile.memberNumber}
            />
            <ProfileRow
              label="Member Since:"
              value={memoProfile.memberSince}
            />
            <ProfileRow
              label="Current Total Exposure:"
              value={memoProfile.currentTotalExposure}
            />
            <ProfileRow
              label="Proposed Changes:"
              value={memoProfile.proposedChanges}
            />
            <ProfileRow
              label="Plus Outstanding Approvals:"
              value={memoProfile.plusOutstandingApprovals}
            />
            <ProfileRow
              label="Proposed Total Exposure:"
              value={memoProfile.proposedTotalExposure}
            />
            <ProfileRow
              label="Average YTD Deposits:"
              value={memoProfile.averageYtdDeposits}
            />
            <ProfileRow
              label="Total Current Deposits:"
              value={memoProfile.totalCurrentDeposits}
            />
          </div>
        </div>
      </div>

      {/* Loan Request Purpose */}
      <div>
        <p className="font-semibold text-slate-700">Loan Request Purpose:</p>
        <p className="text-slate-600">
          Micro equipment loan to purchase a Commercial Truck (VIN
          7FZKBYA22MN014983)
        </p>
      </div>

      {/* Notes */}
      <div>
        <p className="font-semibold text-slate-700">Notes:</p>
        <p className="text-slate-600 mt-1">{memoNotes}</p>
      </div>

      {/* Concentration */}
      <div className="text-slate-600">
        <p>Concentration: 26</p>
        <p>Annual Revenue of $ 200K</p>
        <p>Agg Exposure $81,900</p>
      </div>

      {/* Second notes block */}
      <p className="text-slate-600">{memoNotes2}</p>

      {/* Request header row */}
      <div className="flex justify-between items-center border-b border-slate-300/25 pb-1">
        <span className="font-semibold text-slate-700">12345-6</span>
        <span className="text-slate-600">Request 5556677</span>
        <span className="text-slate-600 text-right">
          New Money-
          <br />
          5556677
        </span>
      </div>

      {/* Loan type grid */}
      <div className="grid grid-cols-5 gap-x-3 gap-y-0.5 text-[10px]">
        <div>
          <span className="font-semibold text-slate-700">HOMA</span>{" "}
          <span className="text-slate-600">NO</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700">CRA</span>{" "}
          <span className="text-slate-600">NO</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700">CD</span>{" "}
          <span className="text-slate-600">NO</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700">REG-0</span>{" "}
          <span className="text-slate-600">NO</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700">TDR</span>{" "}
          <span className="text-slate-600">NO</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700">HVCRE</span>{" "}
          <span className="text-slate-600">NO</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700">Gov. Guarantee</span>{" "}
          <span className="text-slate-600">NO</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700">Participation:</span>{" "}
          <span className="text-slate-600">NO</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700">
            Policy Exception:
          </span>{" "}
          <span className="text-slate-600">NO</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700">FLOOD</span>{" "}
          <span className="text-slate-600">NO</span>
        </div>
      </div>

      {/* Borrower/Co-Borrower table */}
      <div>
        <h4 className="text-center text-[10px] font-bold text-slate-700 mb-1 tracking-wide">
          BORROWER/CO-BORROWER INFORMATION
        </h4>
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-slate-300/25">
              <th className="text-left font-medium text-slate-600 py-1 pr-2">
                Name
              </th>
              <th className="text-center font-medium text-slate-600 py-1 px-1">
                Global DSCR
                <br />
                Current
              </th>
              <th className="text-center font-medium text-slate-600 py-1 px-1">
                Proj
              </th>
              <th className="text-center font-medium text-slate-600 py-1 px-1">
                Liquidity
              </th>
              <th className="text-center font-medium text-slate-600 py-1 px-1">
                Adj.
                <br />
                Net Worth
              </th>
              <th className="text-center font-medium text-slate-600 py-1 px-1">
                Net Worth
              </th>
              <th className="text-center font-medium text-slate-600 py-1 px-1">
                DTI
              </th>
              <th className="text-center font-medium text-slate-600 py-1 px-1">
                DSCR
                <br />
                Before/After
              </th>
              <th className="text-center font-medium text-slate-600 py-1 px-1">
                Stmt Date
              </th>
              <th className="text-center font-medium text-slate-600 py-1 px-1">
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-300/25 transition-colors hover:bg-white/40">
              <td className="py-1.5 pr-2 text-slate-600">
                TILBRAE LOGISTICS GROUP -<br />
                Borrower
              </td>
              <td className="text-center text-slate-600 py-1.5">0.00</td>
              <td className="text-center text-slate-600 py-1.5">0.00</td>
              <td className="text-center text-slate-600 py-1.5" />
              <td className="text-center text-slate-600 py-1.5" />
              <td className="text-center text-slate-600 py-1.5" />
              <td className="text-center text-slate-600 py-1.5">N/A</td>
              <td className="text-center text-slate-600 py-1.5">0.00/0.00</td>
              <td className="text-center text-slate-600 py-1.5" />
              <td className="text-center text-slate-600 py-1.5">N/A</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="font-semibold text-slate-700 whitespace-nowrap text-[11px]">
        {label}
      </span>
      <span className="text-slate-600 text-[11px]">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compliance Rule Card
// ---------------------------------------------------------------------------

function RuleCard({ rule }: { rule: ComplianceRule }) {
  return (
    <div className="px-4 py-4 transition-colors hover:bg-white/40 cursor-default">
      {/* Rule label with dot */}
      <div className="flex items-start gap-2.5 mb-3">
        <div className="mt-1.5 size-2.5 rounded-full bg-[#0e7490] shrink-0" />
        <span className="text-sm font-semibold text-slate-700 leading-snug">
          {rule.label}
        </span>
      </div>

      {/* Agent evaluation */}
      {rule.agentEval !== null && (
        <div className="ml-5 mb-3 space-y-1">
          <p className="text-xs text-slate-600">
            <span className="font-medium">Agent evaluation:</span>{" "}
            {rule.agentEval}
          </p>
          {rule.agentReasoning && (
            <p className="text-xs text-slate-600">{rule.agentReasoning}</p>
          )}
        </div>
      )}

      {/* Human evaluation */}
      <div className="ml-5">
        {rule.agentEval !== null && (
          <p className="text-xs font-medium text-slate-700 mb-2">
            Human evaluation
          </p>
        )}

        <div className="flex items-center gap-2">
          {rule.showHumanButtons === "yes_no_na" && (
            <>
              <GlassButton variant="yes">Yes</GlassButton>
              <GlassButton variant="no">No</GlassButton>
              <GlassButton variant="default">N/A</GlassButton>
              <IconButton>
                <MessageSquare className="size-3.5 stroke-[1.5]" />
              </IconButton>
            </>
          )}

          {rule.showHumanButtons === "yes_person_minus" && (
            <>
              <GlassButton variant="yes" active>
                Yes
              </GlassButton>
              <IconButton>
                <User className="size-3.5 stroke-[1.5]" />
              </IconButton>
              <IconButton>
                <Minus className="size-3.5 stroke-[1.5]" />
              </IconButton>
            </>
          )}

          {rule.showHumanButtons === "no_person_minus" && (
            <>
              <GlassButton variant="no" active>
                No
              </GlassButton>
              <IconButton>
                <User className="size-3.5 stroke-[1.5]" />
              </IconButton>
              <IconButton>
                <Minus className="size-3.5 stroke-[1.5]" />
              </IconButton>
            </>
          )}

          {rule.showHumanButtons === "inconclusive_needs_review" && (
            <>
              <GlassButton variant="inconclusive" active>
                Inconclusive
              </GlassButton>
              <GlassButton variant="needs_review" active>
                <span className="flex items-center gap-1.5">
                  <User className="size-3 stroke-[1.5]" />
                  Needs review
                </span>
              </GlassButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export function HaidyThemeLoanQC() {
  const [currentCategory] = useState(1);
  const totalCategories = 6;

  // Independent zoom state for each document pane
  const [leftZoom, setLeftZoom] = useState(1);
  const [rightZoom, setRightZoom] = useState(1);

  const ZOOM_STEP = 0.1;
  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 2;

  const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

  return (
    <div className="h-screen flex flex-col bg-[#dfe6ef] overflow-hidden">
      {/* ── Top header bar — same bg as left pane, extends behind ── */}
      <header className="shrink-0 flex items-center justify-between px-4 py-3 bg-white/50 backdrop-blur-[20px]">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl flex items-center justify-center bg-white/40 backdrop-blur-[6px] border border-white/50 shadow-[0_0_10px_-2px_rgba(185,205,230,0.15),inset_0_1px_4px_0_rgba(255,255,255,0.3)]">
            <Settings className="size-4 text-slate-600 stroke-[1.5]" />
          </div>
          <span className="text-sm font-semibold text-slate-700">
            Loan processing - QC
          </span>
        </div>
        <div className="flex items-center gap-3">
          <IconButton>
            <Bell className="size-4 stroke-[1.5]" />
          </IconButton>
          <div className="size-8 rounded-full bg-amber-100/60 backdrop-blur-[6px] border border-amber-200/30 shadow-[0_0_10px_-2px_rgba(245,158,11,0.12),inset_0_1px_4px_0_rgba(255,255,255,0.35)] flex items-center justify-center overflow-hidden">
            <User className="size-4 text-amber-800 stroke-[1.5]" />
          </div>
        </div>
      </header>

      {/* ── Section header — same bg, full-width horizontal line below ── */}
      <div className="shrink-0 px-4 py-4 flex items-center gap-3 bg-white/50 backdrop-blur-[20px] border-b border-slate-400/20">
        <button
          type="button"
          className="size-9 flex items-center justify-center rounded-xl bg-white/40 backdrop-blur-[6px] border border-white/50 shadow-[0_0_10px_-2px_rgba(185,205,230,0.15),inset_0_1px_4px_0_rgba(255,255,255,0.3)] text-slate-600 hover:bg-white/60 hover:text-slate-700 transition-all cursor-pointer"
        >
          <ArrowLeft className="size-4 stroke-[1.5]" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-700 tracking-tight leading-tight">
            Section name
          </h1>
          <p className="text-xs text-slate-600">CRE #00000000000-00</p>
        </div>
      </div>

      {/* ── Main content: 12-col grid, 16px gutters ── */}
      <div
        className="flex-1 min-h-0 grid overflow-hidden"
        style={{
          gridTemplateColumns: "repeat(12, 1fr)",
          columnGap: "0px",
        }}
      >
        {/* Left sidebar — spans 3 cols, no rounding, flush to left edge */}
        <aside
          className={`flex flex-col overflow-hidden ${glassSidebar}`}
          style={{ gridColumn: "1 / 4" }}
        >
          <div className="flex-1 overflow-y-auto">
            {/* Commercial guarantee 1 */}
            <div className="px-4 pt-4 pb-2 border-b border-slate-300/25">
              <span className="text-xs font-medium text-slate-600 tracking-wide">
                Commercial guarantee 1
              </span>
            </div>

            <div className="divide-y divide-slate-300/25">
              {complianceRules.map((rule) => (
                <RuleCard key={rule.label} rule={rule} />
              ))}
            </div>

            {/* Commercial guarantee 2 */}
            <div className="px-4 pt-5 pb-2">
              <span className="text-xs font-medium text-slate-600 tracking-wide">
                Commercial guarantee 2
              </span>
            </div>
          </div>

          {/* Bottom pagination */}
          <div className="shrink-0 px-4 py-3 border-t border-slate-300/25 flex items-center justify-between bg-white/30">
            <span className="text-xs text-slate-700">
              Compliance category <span className="font-semibold">{currentCategory}</span> of <span className="font-semibold">{totalCategories}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="size-7 flex items-center justify-center rounded-lg bg-white/30 border border-white/40 text-slate-600 hover:bg-white/50 hover:text-slate-700 transition-all cursor-pointer"
              >
                <ChevronLeft className="size-3.5 stroke-[1.5]" />
              </button>
              <button
                type="button"
                className="size-7 flex items-center justify-center rounded-lg bg-white/30 border border-white/40 text-slate-600 hover:bg-white/50 hover:text-slate-700 transition-all cursor-pointer"
              >
                <ChevronRight className="size-3.5 stroke-[1.5]" />
              </button>
            </div>
          </div>
        </aside>

        {/* Document area — spans 9 cols, no container, sits on background */}
        <div
          className="flex min-w-0 overflow-hidden"
          style={{ gridColumn: "4 / 13" }}
        >
          {/* Left document pane */}
          <div className="flex-1 min-w-0 relative flex flex-col">
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-5">
              <div className="bg-white rounded-sm shadow-[0_1px_4px_rgba(0,0,0,0.08)] min-h-full">
                <CreditMemoDocument zoom={leftZoom} />
              </div>
            </div>
            <ZoomControls
              zoom={leftZoom}
              onZoomIn={() =>
                setLeftZoom((z) => clampZoom(z + ZOOM_STEP))
              }
              onZoomOut={() =>
                setLeftZoom((z) => clampZoom(z - ZOOM_STEP))
              }
            />
          </div>

          {/* Vertical divider */}
          <div className="w-px shrink-0 bg-slate-400/20" />

          {/* Right document pane */}
          <div className="flex-1 min-w-0 relative flex flex-col">
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-5">
              <div className="bg-white rounded-sm shadow-[0_1px_4px_rgba(0,0,0,0.08)] min-h-full">
                <CreditMemoDocument zoom={rightZoom} />
              </div>
            </div>
            <ZoomControls
              zoom={rightZoom}
              onZoomIn={() =>
                setRightZoom((z) => clampZoom(z + ZOOM_STEP))
              }
              onZoomOut={() =>
                setRightZoom((z) => clampZoom(z - ZOOM_STEP))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

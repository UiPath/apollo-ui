"use client";

import {
  BarChart3,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  FolderOpen,
  Home,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const invoices = [
  {
    id: "INV-4021",
    vendor: "Acme Corp",
    amount: "$12,450.00",
    date: "Feb 25, 2026",
    status: "Processed",
  },
  {
    id: "INV-4020",
    vendor: "Global Supplies Ltd",
    amount: "$3,280.50",
    date: "Feb 25, 2026",
    status: "Pending",
  },
  {
    id: "INV-4019",
    vendor: "TechParts Inc",
    amount: "$8,920.00",
    date: "Feb 24, 2026",
    status: "In Review",
  },
  {
    id: "INV-4018",
    vendor: "Office Depot",
    amount: "$1,150.75",
    date: "Feb 24, 2026",
    status: "Processed",
  },
  {
    id: "INV-4017",
    vendor: "CloudServ Solutions",
    amount: "$24,000.00",
    date: "Feb 23, 2026",
    status: "Failed",
  },
  {
    id: "INV-4016",
    vendor: "Metro Logistics",
    amount: "$6,780.00",
    date: "Feb 23, 2026",
    status: "Processed",
  },
];

const chartData = [
  { day: "Mon", processed: 32 },
  { day: "Tue", processed: 28 },
  { day: "Wed", processed: 45 },
  { day: "Thu", processed: 38 },
  { day: "Fri", processed: 52 },
  { day: "Sat", processed: 18 },
  { day: "Sun", processed: 12 },
];

const chartConfig = {
  processed: {
    label: "Processed",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

const activities = [
  { text: "INV-4021 processed successfully", time: "2 min ago" },
  { text: "INV-4020 submitted for review", time: "15 min ago" },
  { text: "Batch processing completed (42 invoices)", time: "1 hr ago" },
  {
    text: "INV-4017 failed \u2014 missing PO number",
    time: "3 hrs ago",
  },
];

const pipeline = [
  { label: "OCR Extraction", value: 96, color: "bg-primary" },
  { label: "Field Validation", value: 88, color: "bg-amber-400" },
  { label: "Approval Routing", value: 72, color: "bg-violet-500" },
];

// ---------------------------------------------------------------------------
// Shared glass card styles
// ---------------------------------------------------------------------------

const glassCard = [
  "rounded-2xl",
  "bg-white/50",
  "backdrop-blur-[20px]",
  "border border-white/70",
  "shadow-[0_0_0_1px_rgba(255,255,255,0.7),0_0_48px_-2px_rgba(185,205,230,0.45),0_0_28px_0_rgba(220,232,245,0.30),0_0_12px_0_rgba(255,255,255,0.25),inset_0_2px_20px_0_rgba(255,255,255,0.60),inset_0_-1px_6px_0_rgba(200,215,235,0.12)]",
].join(" ");

// ---------------------------------------------------------------------------
// Accessible active nav color — darker teal (#0e7490) at 4.81:1 contrast
// ---------------------------------------------------------------------------

const glassNavActive = "text-[#0e7490] font-semibold";

// ---------------------------------------------------------------------------
// Status badge helper — accessible text colors
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { className: string }> = {
    Processed: {
      className:
        "bg-emerald-100/60 text-emerald-700 border-emerald-200/40 shadow-[0_0_10px_-2px_rgba(16,185,129,0.12),inset_0_1px_4px_0_rgba(255,255,255,0.4)]",
    },
    Pending: {
      className:
        "bg-white/50 text-slate-700 border-slate-200/40 shadow-[0_0_10px_-2px_rgba(185,205,230,0.15),inset_0_1px_4px_0_rgba(255,255,255,0.35)]",
    },
    "In Review": {
      className:
        "bg-white/50 text-slate-700 border-slate-200/40 shadow-[0_0_10px_-2px_rgba(185,205,230,0.15),inset_0_1px_4px_0_rgba(255,255,255,0.35)]",
    },
    Failed: {
      className:
        "bg-rose-100/50 text-rose-700 border-rose-200/40 shadow-[0_0_10px_-2px_rgba(244,63,94,0.10),inset_0_1px_4px_0_rgba(255,255,255,0.4)]",
    },
  };

  const style = map[status] ?? map.Pending;

  return (
    <Badge
      variant="outline"
      className={`rounded-full text-xs font-medium px-2.5 py-0.5 backdrop-blur-[6px] ${style.className}`}
    >
      {status}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Stat Card — accessible version
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  change,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  change: string;
}) {
  const isPositive = change.startsWith("+");
  return (
    <div className={`${glassCard} p-5 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <Icon className="size-4 text-slate-500 stroke-[1.5]" />
      </div>
      <div className="text-2xl font-bold text-slate-700 tracking-tight">
        {value}
      </div>
      <span
        className={`text-xs font-medium ${isPositive ? "text-emerald-700" : "text-rose-600"}`}
      >
        {change} from last week
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar — accessible version
// ---------------------------------------------------------------------------

const navItems = [
  { icon: Home, label: "Dashboard", active: true },
  { icon: FolderOpen, label: "Projects" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Users, label: "Team" },
  { icon: Settings, label: "Settings" },
  { icon: Eye, label: "Toggle Content" },
];

function GlassSidebar() {
  return (
    <aside className="w-[220px] shrink-0 flex flex-col py-5 px-3 gap-1 bg-white/50 backdrop-blur-[20px] border-r border-white/60">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 mb-6">
        <div
          className={`size-9 rounded-xl flex items-center justify-center bg-slate-800/90 backdrop-blur-[10px] border border-white/10 shadow-[0_0_20px_-2px_rgba(30,40,60,0.25),inset_0_1px_8px_0_rgba(255,255,255,0.08)]`}
        >
          <span className="text-white text-xs font-bold">Ui</span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold text-slate-700">UiPath</span>
          <span className="text-[11px] text-slate-600">Apollo Vertex</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
              item.active
                ? glassNavActive
                : "text-slate-600 hover:bg-white/35 hover:text-slate-700 hover:shadow-[0_0_12px_-2px_rgba(200,215,235,0.2)]"
            }`}
          >
            <item.icon className="size-4 stroke-[1.5]" />
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="mt-auto pt-4">
        <div className="flex items-center gap-2.5 px-2">
          <div className="size-8 rounded-full bg-white/50 backdrop-blur-[10px] border border-white/50 shadow-[0_0_12px_-2px_rgba(185,205,230,0.25),inset_0_1px_6px_0_rgba(255,255,255,0.35)] flex items-center justify-center text-xs font-semibold text-slate-600">
            DU
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-medium text-slate-700">
              Dev User
            </span>
            <span className="text-[11px] text-slate-600">dev@localhost</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard — Accessible Version
// ---------------------------------------------------------------------------

export function HaidyThemeDashboardAccessible() {
  return (
    <div className="h-screen flex bg-[#dfe6ef] overflow-hidden">
      {/* Sidebar */}
      <GlassSidebar />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-slate-700 tracking-tight">
            Invoice Processing
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Monitor and manage invoice automation workflows
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            label="Total Invoices"
            value="1,247"
            change="+12%"
          />
          <StatCard
            icon={Clock}
            label="Pending Review"
            value="83"
            change="-5%"
          />
          <StatCard
            icon={CheckCircle2}
            label="Processed Today"
            value="156"
            change="+23%"
          />
          <StatCard
            icon={TrendingUp}
            label="Success Rate"
            value="98.2%"
            change="+0.4%"
          />
        </div>

        {/* Invoices table */}
        <div className={`${glassCard} overflow-hidden`}>
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-base font-semibold text-slate-700">
              Recent Invoices
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-300/25">
                  <th className="text-left font-medium text-slate-600 px-5 py-2.5">
                    Invoice
                  </th>
                  <th className="text-left font-medium text-slate-600 px-5 py-2.5">
                    Vendor
                  </th>
                  <th className="text-left font-medium text-slate-600 px-5 py-2.5">
                    Amount
                  </th>
                  <th className="text-left font-medium text-slate-600 px-5 py-2.5">
                    Status
                  </th>
                  <th className="text-left font-medium text-slate-600 px-5 py-2.5">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-slate-300/25 last:border-0 transition-colors hover:bg-white/40"
                  >
                    <td className="px-5 py-3 font-medium text-slate-700">
                      {inv.id}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{inv.vendor}</td>
                    <td className="px-5 py-3 text-slate-700 font-medium">
                      {inv.amount}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-3 text-slate-600">{inv.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart + Activity row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Processing Activity chart */}
          <div className={`${glassCard} p-5`}>
            <h2 className="text-base font-semibold text-slate-700 mb-4">
              Processing Activity
            </h2>
            <ChartContainer
              config={chartConfig}
              className="h-[200px] w-full"
            >
              <BarChart data={chartData}>
                <defs>
                  <filter
                    id="tealGlowA11y"
                    x="-30%"
                    y="-30%"
                    width="160%"
                    height="160%"
                  >
                    <feGaussianBlur
                      in="SourceAlpha"
                      stdDeviation="6"
                      result="blur1"
                    />
                    <feColorMatrix
                      in="blur1"
                      type="matrix"
                      values="0 0 0 0 0.39  0 0 0 0 0.78  0 0 0 0 0.86  0 0 0 0.8 0"
                      result="glow1"
                    />
                    <feGaussianBlur
                      in="SourceAlpha"
                      stdDeviation="12"
                      result="blur2"
                    />
                    <feColorMatrix
                      in="blur2"
                      type="matrix"
                      values="0 0 0 0 0.39  0 0 0 0 0.78  0 0 0 0 0.86  0 0 0 0.4 0"
                      result="glow2"
                    />
                    <feMerge>
                      <feMergeNode in="glow2" />
                      <feMergeNode in="glow1" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="rgba(148,163,184,0.12)"
                />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#475569", fontSize: 12 }}
                />
                <YAxis hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="processed"
                  fill="var(--color-primary)"
                  radius={[6, 6, 0, 0]}
                  opacity={0.8}
                  activeBar={{
                    filter: "url(#tealGlowA11y)",
                    opacity: 1,
                  }}
                />
              </BarChart>
            </ChartContainer>
          </div>

          {/* Recent Activity */}
          <div className={`${glassCard} p-5`}>
            <h2 className="text-base font-semibold text-slate-700 mb-4">
              Recent Activity
            </h2>
            <div className="divide-y divide-slate-300/25">
              {activities.map((a) => (
                <div
                  key={a.text}
                  className="flex items-start gap-3 px-2 py-3 -mx-2 rounded-lg transition-colors hover:bg-white/40 cursor-default"
                >
                  <div className="mt-1.5 size-2 rounded-full bg-primary/60 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-700 leading-snug">
                      {a.text}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Processing Pipeline */}
        <div className={`${glassCard} p-5`}>
          <h2 className="text-base font-semibold text-slate-700 mb-4">
            Processing Pipeline
          </h2>
          <div className="space-y-5">
            {pipeline.map((p) => (
              <div key={p.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{p.label}</span>
                  <span className="text-slate-600 font-medium">
                    {p.value}%
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-white/40 shadow-[inset_0_1px_4px_0_rgba(185,205,230,0.25),0_0_0_1px_rgba(255,255,255,0.3)] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${p.color} transition-all`}
                    style={{ width: `${p.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

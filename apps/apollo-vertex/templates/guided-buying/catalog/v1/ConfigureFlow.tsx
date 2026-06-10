"use client";

// oxlint-disable max-lines -- two-step cell-service configurator (scripted)
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { Fragment, type ReactNode, useState } from "react";
import { AutopilotIcon } from "@/registry/ai-chat/components/icons/autopilot";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  PageHeaderBackButton,
  PageHeaderDescription,
  PageHeaderNav,
  PageHeaderTitle,
  PageHeaderTitleGroup,
} from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { formatPrice } from "./data";

// Flags carried on the back-navigation: `fromConfigure` makes /buy slide in from
// the left; `resetChat` forces a fresh Intake hero (used by the finish line,
// where the request is already submitted) instead of restoring the thread.
declare module "@tanstack/react-router" {
  interface HistoryState {
    fromConfigure?: boolean;
    resetChat?: boolean;
  }
}

const LINES = 12;
const AI_GRADIENT = { background: "var(--ai-gradient-strong)" };
const ACCENT = "bg-[#0f7b8a] text-white hover:bg-[#0c6976]";
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface Option {
  id: string;
  name: string;
  priceLabel: string;
  /** Per-line $/mo this option contributes to the running total. */
  amount: number;
  features?: string;
  chips: string[];
  agentPick?: boolean;
}

const TIERS: Option[] = [
  {
    id: "pro",
    name: "Business Pro",
    priceLabel: "$55/line/mo",
    amount: 55,
    features:
      "Unlimited talk/text/data · 50 GB hotspot · 5 GB intl roaming · priority data",
    chips: ["Matches SE usage", "MSA tier 2"],
    agentPick: true,
  },
  {
    id: "essentials",
    name: "Business Essentials",
    priceLabel: "$40/line/mo",
    amount: 40,
    features: "Unlimited talk/text/data · 15 GB hotspot · no roaming",
    chips: ["$180/mo cheaper total", "No international"],
  },
  {
    id: "unlimited",
    name: "Business Unlimited+",
    priceLabel: "$75/line/mo",
    amount: 75,
    features: "Unlimited talk/text/data · 100 GB hotspot · 30 GB intl",
    chips: ["$240/mo more", "Likely over-spec"],
  },
];

const DEVICES: Option[] = [
  {
    id: "byod",
    name: "Bring your own device",
    priceLabel: "$0/line",
    amount: 0,
    chips: ["No added cost", "Devices < 1 yr old"],
    agentPick: true,
  },
  {
    id: "standard",
    name: "Standard subsidy",
    priceLabel: "+$15/line/mo",
    amount: 15,
    chips: ["Mid-range refresh"],
  },
  {
    id: "premium",
    name: "Premium subsidy",
    priceLabel: "+$25/line/mo",
    amount: 25,
    chips: ["Flagship devices"],
  },
];

// Resolved automatically on confirm.
const AUTO_STEPS = [
  { label: "MDM enrollment", value: "Intune · included" },
  { label: "Activation", value: "Next billing cycle" },
  { label: "Billing", value: "Cost center · CC-4421" },
];

type Step = "plan" | "device";
type StepState = "done" | "current" | "pending";

function StepDot({ state }: { state: StepState }) {
  if (state === "done")
    return (
      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#0f7b8a] text-white">
        <Check className="size-2.5" aria-hidden />
      </span>
    );
  if (state === "current")
    return (
      <span
        className="size-4 shrink-0 rounded-full ring-2 ring-[#0f7b8a]/40"
        style={AI_GRADIENT}
        aria-hidden
      />
    );
  return (
    <span
      className="size-4 shrink-0 rounded-full border border-dashed border-muted-foreground/40"
      aria-hidden
    />
  );
}

/** One node of the rail timeline: a dot column (dot + connecting line) + content. */
function TimelineRow({
  dot,
  isLast = false,
  children,
}: {
  dot: ReactNode;
  isLast?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-2.5">
      <div className="flex w-4 flex-col items-center">
        <span className="mt-0.5">{dot}</span>
        {!isLast && <div className="my-1 min-h-[12px] w-px flex-1 bg-border" />}
      </div>
      <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-4")}>
        {children}
      </div>
    </div>
  );
}

function OptionCard({
  option,
  selected,
  onSelect,
}: {
  option: Option;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "w-full rounded-xl border bg-card p-4 text-left transition-shadow",
        selected
          ? "border-[#0f7b8a] shadow-sm ring-1 ring-[#0f7b8a]"
          : "hover:shadow-sm",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{option.name}</h3>
            {option.agentPick && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                style={AI_GRADIENT}
              >
                <AutopilotIcon size={11} aria-hidden />
                Agent pick
              </span>
            )}
          </div>
          {option.features && (
            <p className="mt-1 text-sm text-muted-foreground">
              {option.features}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {option.chips.map((chip) => (
              <span
                key={chip}
                className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="whitespace-nowrap text-base font-semibold text-foreground">
            {option.priceLabel}
          </span>
          <span
            className={cn(
              "flex size-5 items-center justify-center rounded-full border",
              selected
                ? "border-[#0f7b8a] bg-[#0f7b8a] text-white"
                : "border-muted-foreground/40",
            )}
            aria-hidden
          >
            {selected && <Check className="size-3" />}
          </span>
        </div>
      </div>
    </button>
  );
}

/**
 * "Configure with agent" — the cell-service configurator for the off-catalog
 * mobile-lines (T-Mobile MSA) path. A guided form: the agent asks one focused
 * question at a time (Plan tier, then Device subsidy) while the configuration
 * assembles in the rail; the rest auto-resolve on confirm and the order lands in
 * the Workbench as REQ-2051. Scripted/mocked.
 */
export function ConfigureFlow() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [step, setStep] = useState<Step>("plan");
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [tierId, setTierId] = useState("pro");
  const [deviceId, setDeviceId] = useState("byod");
  const [quoteStub, setQuoteStub] = useState(false);
  const [trackStub, setTrackStub] = useState(false);
  const [showOtherDevices, setShowOtherDevices] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveReset, setLeaveReset] = useState(false);

  const tier = TIERS.find((t) => t.id === tierId) ?? TIERS[0];
  const device = DEVICES.find((d) => d.id === deviceId) ?? DEVICES[0];

  // Device cost joins the total once the device step is reached.
  const deviceChosen = step === "device" || confirmed;
  const monthly = LINES * (tier.amount + (deviceChosen ? device.amount : 0));

  // The two calls the user makes (+ the two the agent pre-filled). The remaining
  // agent-handled steps are grouped in the rail, not listed as individual stops.
  const mainSteps: { label: string; value: string; state: StepState }[] = [
    { label: "Carrier", value: "T-Mobile MSA", state: "done" },
    { label: "Quantity", value: "12 lines · Denver", state: "done" },
    {
      label: "Plan tier",
      value: tier.name,
      state: step === "plan" && !confirmed ? "current" : "done",
    },
    {
      label: "Device subsidy",
      value: deviceChosen ? device.name : "—",
      state: confirmed ? "done" : step === "device" ? "current" : "pending",
    },
  ];

  // Soft step-to-step swap (collapse up / slide in), reduced-motion-safe.
  const anim = {
    initial: reduceMotion ? false : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 },
    transition: { duration: reduceMotion ? 0.12 : 0.24, ease: EASE },
  };

  // Shift the whole screen out to the right and return to the chat (which slides
  // back in from the left). In-flow backs restore the thread; the finish line
  // passes reset so /buy comes up fresh (the request is already submitted).
  const goBackToChat = (reset = false) => {
    if (reduceMotion) {
      void navigate({
        to: "/buy",
        state: { fromConfigure: true, resetChat: reset },
      });
      return;
    }
    setLeaveReset(reset);
    setLeaving(true);
  };

  // One consistent back (top-left), stepping between config steps and then out
  // to the chat — matching the Buy scaffold's single-step back.
  const goBack = () => {
    if (confirmed) {
      setConfirmed(false);
      return;
    }
    if (step === "device") {
      setStep("plan");
      return;
    }
    goBackToChat();
  };

  return (
    // Configure is an expansion of the Bridge, not a peer screen: the header
    // stays anchored (no entrance), the rail reveals in from the right, and the
    // center fades in. On back it collapses with a fade. No horizontal swipe.
    <motion.div
      className="flex h-full min-h-0"
      initial={false}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: reduceMotion ? 0.12 : 0.3, ease: EASE }}
      onAnimationComplete={() => {
        if (leaving)
          void navigate({
            to: "/buy",
            state: { fromConfigure: true, resetChat: leaveReset },
          });
      }}
    >
      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <PageHeader>
          <PageHeaderNav>
            {/* No in-flow back once submitted — it's a terminal screen. */}
            {!submitted && <PageHeaderBackButton onClick={goBack} />}
            <PageHeaderTitleGroup>
              <PageHeaderTitle>Configure with agent</PageHeaderTitle>
              <PageHeaderDescription>
                Mobile service · 12 lines for Denver · REQ-2051{" "}
                {submitted ? "· Pending approval" : "(draft)"}
              </PageHeaderDescription>
            </PageHeaderTitleGroup>
          </PageHeaderNav>
        </PageHeader>

        <div className="mx-auto w-full max-w-3xl space-y-6 px-6 py-6">
          <AnimatePresence mode="wait">
            {confirmed ? (
              <motion.div key="confirmed" className="space-y-6" {...anim}>
                {submitted ? (
                  <>
                    {/* The finish line — outcome first, in the agent's voice. */}
                    <div className="flex items-start gap-3">
                      <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0f7b8a] text-white">
                        <Check className="size-5" aria-hidden />
                      </span>
                      <div className="space-y-2">
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                          Submitted. Procurement has it from here.
                        </h2>
                        <p className="text-sm text-foreground">
                          12 {tier.name} lines · {device.name} ·{" "}
                          {formatPrice(monthly, "USD")}/mo ·{" "}
                          {formatPrice(monthly * 12, "USD")}/yr, under your
                          T-Mobile MSA.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {
                            "They'll review and approve. You'll be notified when it's decided."
                          }
                        </p>
                      </div>
                    </div>

                    {/* Defaults — quiet reference, demoted below the outcome. */}
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Filled with defaults
                      </p>
                      <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1.5 text-xs">
                        {AUTO_STEPS.map((s) => (
                          <Fragment key={s.label}>
                            <dt className="text-muted-foreground">{s.label}</dt>
                            <dd className="text-foreground">{s.value}</dd>
                          </Fragment>
                        ))}
                      </dl>
                    </div>

                    {/* One clear action; tracking stays a quiet stub. */}
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setTrackStub(true)}
                        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                      >
                        Track request
                      </button>
                      <Button
                        className={ACCENT}
                        onClick={() => goBackToChat(true)}
                      >
                        Back to Buy
                        <ArrowRight className="size-4" aria-hidden />
                      </Button>
                    </div>
                    {trackStub && (
                      <p className="text-right text-xs text-muted-foreground">
                        Request tracking is coming soon.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border bg-card p-5">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-full bg-[#0f7b8a] text-white">
                          <Check className="size-4" aria-hidden />
                        </span>
                        <h2 className="text-lg font-semibold text-foreground">
                          Configuration complete
                        </h2>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        12 {tier.name} lines · {device.name} ·{" "}
                        {formatPrice(monthly, "USD")}/mo ·{" "}
                        {formatPrice(monthly * 12, "USD")}/yr. I filled the rest
                        with recommended defaults:
                      </p>
                      <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
                        {AUTO_STEPS.map((s) => (
                          <Fragment key={s.label}>
                            <dt className="text-muted-foreground">{s.label}</dt>
                            <dd className="text-foreground">{s.value}</dd>
                          </Fragment>
                        ))}
                      </dl>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        className={ACCENT}
                        onClick={() => setSubmitted(true)}
                      >
                        Submit for approval
                        <ArrowRight className="size-4" aria-hidden />
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div key={step} className="space-y-6" {...anim}>
                {step === "plan" ? (
                  <div className="space-y-3">
                    <h2 className="text-xl font-semibold text-foreground">
                      Which plan tier for the Denver lines?
                    </h2>
                    <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3">
                      <AutopilotIcon
                        size={16}
                        className="mt-0.5 shrink-0 text-[#0f7b8a]"
                        aria-hidden
                      />
                      <p className="text-sm text-foreground">
                        {
                          "Your T-Mobile MSA includes three business tiers. Based on the SE team's usage, Business Pro fits."
                        }
                      </p>
                    </div>
                    <div className="space-y-3 pt-1">
                      {TIERS.map((t) => (
                        <OptionCard
                          key={t.id}
                          option={t}
                          selected={t.id === tierId}
                          onSelect={() => setTierId(t.id)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h2 className="text-xl font-semibold text-foreground">
                      Devices for the 12 lines?
                    </h2>
                    <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3">
                      <AutopilotIcon
                        size={16}
                        className="mt-0.5 shrink-0 text-[#0f7b8a]"
                        aria-hidden
                      />
                      <p className="text-sm text-foreground">
                        {
                          "The Denver team refreshed devices last quarter, so I'd skip the subsidy."
                        }
                      </p>
                    </div>
                    {/* Lead with the agent pick; tuck the alternatives away. */}
                    <div className="space-y-3 pt-1">
                      <OptionCard
                        option={DEVICES[0]}
                        selected={deviceId === DEVICES[0].id}
                        onSelect={() => setDeviceId(DEVICES[0].id)}
                      />
                      {showOtherDevices ? (
                        DEVICES.slice(1).map((d) => (
                          <OptionCard
                            key={d.id}
                            option={d}
                            selected={d.id === deviceId}
                            onSelect={() => setDeviceId(d.id)}
                          />
                        ))
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowOtherDevices(true)}
                          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Other options
                          <ChevronDown className="size-4" aria-hidden />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions — back lives in the header (consistent, top-left). */}
                <div className="flex justify-end">
                  {step === "plan" ? (
                    <Button
                      className={ACCENT}
                      onClick={() => setStep("device")}
                    >
                      Continue
                      <ArrowRight className="size-4" aria-hidden />
                    </Button>
                  ) : (
                    <Button
                      className={ACCENT}
                      onClick={() => setConfirmed(true)}
                    >
                      Confirm and continue
                      <ArrowRight className="size-4" aria-hidden />
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* A quiet path alternative — not an agent ask, so it stays center. */}
          {!confirmed && (
            <div className="space-y-2 border-t pt-4">
              <button
                type="button"
                onClick={() => setQuoteStub(true)}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Prefer a custom quote? Request one
              </button>
              {quoteStub && (
                <p className="text-xs text-muted-foreground">
                  Custom RFQ is coming soon — for now, configure with the agent.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Building-so-far rail (envelope styling) — reveals in from the right as
          the workspace opens; its first two items are the Bridge's confirmed
          Carrier (T-Mobile MSA) + Quantity (12 lines · Denver). */}
      <motion.aside
        className="hidden w-[320px] shrink-0 flex-col overflow-y-auto border-l bg-card/40 px-5 pb-5 pt-10 lg:flex"
        initial={reduceMotion ? false : { x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{
          duration: reduceMotion ? 0.12 : 0.36,
          ease: EASE,
          delay: reduceMotion ? 0 : 0.06,
        }}
      >
        <div className="flex items-center gap-1.5">
          <AutopilotIcon size={16} className="text-[#0f7b8a]" aria-hidden />
          <span className="text-xs font-semibold text-muted-foreground">
            {confirmed ? "Configured" : "Building so far"}
          </span>
        </div>
        <div className="mt-6">
          {mainSteps.map((s) => (
            <TimelineRow key={s.label} dot={<StepDot state={s.state} />}>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p
                className={cn(
                  "truncate text-sm font-medium",
                  s.value === "—"
                    ? "text-muted-foreground/60"
                    : "text-foreground",
                )}
              >
                {s.value}
              </p>
            </TimelineRow>
          ))}

          {/* The rest is the agent's job — one grouped node, not seven stops. */}
          <TimelineRow
            dot={<StepDot state={confirmed ? "done" : "pending"} />}
            isLast
          >
            <p className="text-xs font-medium text-muted-foreground">
              {confirmed ? "Agent handled" : "Agent handles next"}
            </p>
            <ul className="mt-1.5 space-y-1">
              {AUTO_STEPS.map((s) => (
                <li
                  key={s.label}
                  className="flex items-baseline justify-between gap-2 text-xs"
                >
                  <span
                    className={
                      confirmed ? "text-foreground" : "text-muted-foreground/70"
                    }
                  >
                    {s.label}
                  </span>
                  {confirmed && (
                    <span className="truncate text-right text-muted-foreground">
                      {s.value}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </TimelineRow>
        </div>
        <div className="mt-6 border-t pt-4">
          <p className="text-xs font-semibold text-muted-foreground">
            {confirmed ? "Monthly" : "Running monthly"}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {formatPrice(monthly, "USD")}
            <span className="text-sm font-normal text-muted-foreground">
              /mo
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            12 lines
            {deviceChosen && device.amount > 0
              ? ` · +${formatPrice(device.amount, "USD")}/line device`
              : ""}
          </p>
        </div>
      </motion.aside>
    </motion.div>
  );
}

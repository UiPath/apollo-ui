"use client";

import { useState, useEffect } from "react";
import { ShellLayout } from "@/registry/shell/internal/shell-layout";
import { Card } from "@/registry/card/card";
import { Button } from "@/registry/button/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/select/select";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/registry/input-group/input-group";
import { Sparkles, Mic, Eye, EyeOff, ArrowUpRight, X, Loader2, AlertCircle, Inbox } from "lucide-react";
import { FullscreenShellToggle } from "./components/FullscreenShellToggle";
import { GradientBars } from "./components/GradientBars";
import { UserActivityBars } from "./components/UserActivityBars";
import { DonutChart } from "./components/DonutChart";
import { Sparkline } from "./components/Sparkline";
import { TrendChart } from "./components/TrendChart";

export function DashboardLayoutTemplate() {
  const [backgroundMode, setBackgroundMode] = useState("flat");
  const [viewState, setViewState] = useState("default");
  const [showContent, setShowContent] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [fadingFromSkeleton, setFadingFromSkeleton] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [cardData, setCardData] = useState({
    totalDocs: 1247,
    pending: 342,
    approved: 891,
    rejected: 14,
    accuracyRate: 96.8,
    processingSpeed: 1.2,
    docsProcessed: 8942,
    errorRate: 3.2,
    qualityScore: 87,
    targetScore: 95,
    activeAlerts: 23,
    criticalIssues: 5,
    resolvedToday: 12,
    complianceRate: 94,
  });

  const [heroContent, setHeroContent] = useState({
    greeting: "Good morning, Peter",
    headline: "Automation up 5%, cycle time down 15% over the last 30 days",
    subheadline: "12,120 invoices process with 77% touch-less automation and an average posting time of 2.8 days. SLA risk remains low",
  });

  const [cardTitles, setCardTitles] = useState({
    card1: "Document review status",
    card2: "AI processing metrics",
    card3: "Quality score trends",
    card4: "Compliance alerts",
  });

  const [issueBreakdown, setIssueBreakdown] = useState([
    { label: "Missing documentation", percentage: 85, gradient: "#9875FF", shadowColor: "rgba(152, 117, 255, 0.4)" },
    { label: "Incomplete data fields", percentage: 65, gradient: "#D582E3", shadowColor: "rgba(213, 130, 227, 0.4)" },
    { label: "Quality check failures", percentage: 45, gradient: "#EE77A2", shadowColor: "rgba(238, 119, 162, 0.4)" },
    { label: "Processing delays", percentage: 60, gradient: "#FFC775", shadowColor: "rgba(255, 199, 117, 0.4)" },
  ]);

  const [extractionPerformance, setExtractionPerformance] = useState([
    { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&crop=face", percentage: 98, color: "rgb(6, 182, 212)", shadowColor: "rgba(6, 182, 212, 0.4)" },
    { name: "Michael Rodriguez", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face", percentage: 96, color: "rgb(6, 182, 212)", shadowColor: "rgba(6, 182, 212, 0.4)" },
    { name: "Emily Johnson", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face", percentage: 94, color: "rgb(6, 182, 212)", shadowColor: "rgba(6, 182, 212, 0.4)" },
    { name: "David Park", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face", percentage: 92, color: "rgb(6, 182, 212)", shadowColor: "rgba(6, 182, 212, 0.4)" },
  ]);

  const [qualityBreakdown, setQualityBreakdown] = useState([
    { label: "Document accuracy", percentage: 92, gradient: "linear-gradient(90deg, #06B6D4 0%, #3B82F6 100%)", shadowColor: "rgba(6, 182, 212, 0.4)" },
    { label: "Processing speed", percentage: 88, gradient: "linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)", shadowColor: "rgba(59, 130, 246, 0.4)" },
    { label: "SLA compliance", percentage: 85, gradient: "linear-gradient(90deg, #8B5CF6 0%, #A855F7 100%)", shadowColor: "rgba(139, 92, 246, 0.4)" },
    { label: "Exception rate", percentage: 82, gradient: "linear-gradient(90deg, #A855F7 0%, #D946EF 100%)", shadowColor: "rgba(168, 85, 247, 0.4)" },
  ]);

  const [alertBreakdown, setAlertBreakdown] = useState([
    { label: "Critical - Regulatory violations", percentage: 22, gradient: "#EF4444", shadowColor: "rgba(239, 68, 68, 0.4)" },
    { label: "High - Missing required docs", percentage: 35, gradient: "#F97316", shadowColor: "rgba(249, 115, 22, 0.4)" },
    { label: "Medium - Data inconsistencies", percentage: 52, gradient: "#F59E0B", shadowColor: "rgba(245, 158, 11, 0.4)" },
    { label: "Low - Minor discrepancies", percentage: 78, gradient: "#FBBF24", shadowColor: "rgba(251, 191, 36, 0.4)" },
  ]);

  const generateNewData = () => {
    const automationChange = Math.floor(Math.random() * 10) - 2; // -2 to +7
    const cycleChange = Math.floor(Math.random() * 20) + 5; // 5 to 24
    const invoiceCount = Math.floor(Math.random() * 5000) + 10000;
    const touchlessPercent = Math.floor(Math.random() * 15) + 70;
    const postingTime = (Math.random() * 2 + 1.5).toFixed(1);

    const greetings = ["Good morning, Peter", "Hello Peter", "Welcome back, Peter", "Good afternoon, Peter"];
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

    setHeroContent({
      greeting: randomGreeting,
      headline: `Automation ${automationChange >= 0 ? 'up' : 'down'} ${Math.abs(automationChange)}%, cycle time ${cycleChange >= 0 ? 'down' : 'up'} ${Math.abs(cycleChange)}% over the last 30 days`,
      subheadline: `${invoiceCount.toLocaleString()} invoices processed with ${touchlessPercent}% touch-less automation and an average posting time of ${postingTime} days. SLA risk remains low`,
    });

    const titleOptions = {
      card1: ["Document review status", "Processing overview", "Review analytics", "Document insights"],
      card2: ["AI processing metrics", "AI performance", "Machine learning stats", "Automation metrics"],
      card3: ["Quality score trends", "Performance indicators", "Quality metrics", "Operational excellence"],
      card4: ["Compliance alerts", "Risk monitoring", "Compliance dashboard", "Regulatory status"],
    };

    setCardTitles({
      card1: titleOptions.card1[Math.floor(Math.random() * titleOptions.card1.length)],
      card2: titleOptions.card2[Math.floor(Math.random() * titleOptions.card2.length)],
      card3: titleOptions.card3[Math.floor(Math.random() * titleOptions.card3.length)],
      card4: titleOptions.card4[Math.floor(Math.random() * titleOptions.card4.length)],
    });

    setCardData({
      totalDocs: Math.floor(Math.random() * 500) + 1000,
      pending: Math.floor(Math.random() * 200) + 250,
      approved: Math.floor(Math.random() * 300) + 700,
      rejected: Math.floor(Math.random() * 30) + 5,
      accuracyRate: Math.floor((Math.random() * 5 + 94) * 10) / 10,
      processingSpeed: Math.floor((Math.random() * 1 + 0.8) * 10) / 10,
      docsProcessed: Math.floor(Math.random() * 2000) + 7500,
      errorRate: Math.floor((Math.random() * 3 + 2) * 10) / 10,
      qualityScore: Math.floor(Math.random() * 15) + 80,
      targetScore: 95,
      activeAlerts: Math.floor(Math.random() * 20) + 15,
      criticalIssues: Math.floor(Math.random() * 8) + 2,
      resolvedToday: Math.floor(Math.random() * 15) + 5,
      complianceRate: Math.floor(Math.random() * 8) + 90,
    });

    // Generate new issue breakdown percentages
    setIssueBreakdown([
      { label: "Missing documentation", percentage: Math.floor(Math.random() * 30) + 65, gradient: "#9875FF", shadowColor: "rgba(152, 117, 255, 0.4)" },
      { label: "Incomplete data fields", percentage: Math.floor(Math.random() * 30) + 50, gradient: "#D582E3", shadowColor: "rgba(213, 130, 227, 0.4)" },
      { label: "Quality check failures", percentage: Math.floor(Math.random() * 30) + 30, gradient: "#EE77A2", shadowColor: "rgba(238, 119, 162, 0.4)" },
      { label: "Processing delays", percentage: Math.floor(Math.random() * 30) + 45, gradient: "#FFC775", shadowColor: "rgba(255, 199, 117, 0.4)" },
    ]);

    // Generate new extraction performance with random avatars and names
    const avatars = [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=32&h=32&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=32&h=32&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=32&h=32&fit=crop&crop=face",
    ];
    const shuffledAvatars = [...avatars].sort(() => Math.random() - 0.5);

    const firstNames = ["Sarah", "Michael", "Emily", "David", "Jessica", "James", "Ashley", "Christopher", "Amanda", "Daniel", "Olivia", "Matthew", "Sophia", "Andrew", "Emma", "Joshua", "Isabella", "Ryan", "Mia", "Brandon"];
    const lastNames = ["Chen", "Rodriguez", "Johnson", "Park", "Williams", "Garcia", "Martinez", "Davis", "Miller", "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris", "Clark"];

    const generateRandomName = () => {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      return `${firstName} ${lastName}`;
    };

    setExtractionPerformance([
      { name: generateRandomName(), avatar: shuffledAvatars[0], percentage: Math.floor(Math.random() * 8) + 92, color: "rgb(6, 182, 212)", shadowColor: "rgba(6, 182, 212, 0.4)" },
      { name: generateRandomName(), avatar: shuffledAvatars[1], percentage: Math.floor(Math.random() * 8) + 90, color: "rgb(6, 182, 212)", shadowColor: "rgba(6, 182, 212, 0.4)" },
      { name: generateRandomName(), avatar: shuffledAvatars[2], percentage: Math.floor(Math.random() * 8) + 88, color: "rgb(6, 182, 212)", shadowColor: "rgba(6, 182, 212, 0.4)" },
      { name: generateRandomName(), avatar: shuffledAvatars[3], percentage: Math.floor(Math.random() * 8) + 86, color: "rgb(6, 182, 212)", shadowColor: "rgba(6, 182, 212, 0.4)" },
    ]);

    // Generate new quality breakdown
    setQualityBreakdown([
      { label: "Document accuracy", percentage: Math.floor(Math.random() * 15) + 85, gradient: "linear-gradient(90deg, #06B6D4 0%, #3B82F6 100%)", shadowColor: "rgba(6, 182, 212, 0.4)" },
      { label: "Processing speed", percentage: Math.floor(Math.random() * 15) + 80, gradient: "linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)", shadowColor: "rgba(59, 130, 246, 0.4)" },
      { label: "SLA compliance", percentage: Math.floor(Math.random() * 15) + 78, gradient: "linear-gradient(90deg, #8B5CF6 0%, #A855F7 100%)", shadowColor: "rgba(139, 92, 246, 0.4)" },
      { label: "Exception rate", percentage: Math.floor(Math.random() * 15) + 75, gradient: "linear-gradient(90deg, #A855F7 0%, #D946EF 100%)", shadowColor: "rgba(168, 85, 247, 0.4)" },
    ]);

    // Generate new alert breakdown
    setAlertBreakdown([
      { label: "Critical - Regulatory violations", percentage: Math.floor(Math.random() * 20) + 15, gradient: "#EF4444", shadowColor: "rgba(239, 68, 68, 0.4)" },
      { label: "High - Missing required docs", percentage: Math.floor(Math.random() * 20) + 25, gradient: "#F97316", shadowColor: "rgba(249, 115, 22, 0.4)" },
      { label: "Medium - Data inconsistencies", percentage: Math.floor(Math.random() * 20) + 40, gradient: "#F59E0B", shadowColor: "rgba(245, 158, 11, 0.4)" },
      { label: "Low - Minor discrepancies", percentage: Math.floor(Math.random() * 20) + 65, gradient: "#FBBF24", shadowColor: "rgba(251, 191, 36, 0.4)" },
    ]);
  };

  useEffect(() => {
    if (expandedCard) {
      // Wait for other cards to fade out before expanding
      const timer = setTimeout(() => setIsExpanding(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsExpanding(false);
    }
  }, [expandedCard]);

  useEffect(() => {
    if (viewState === 'loading' || viewState === 'skeleton') {
      setShowLoadingOverlay(true);
      setFadingFromSkeleton(false);
      const timer = setTimeout(() => {
        setShowLoadingOverlay(false);
        if (viewState === 'skeleton') {
          setFadingFromSkeleton(true);
          setTimeout(() => setViewState('default'), 10);
        } else {
          setViewState('default');
        }
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowLoadingOverlay(false);
    }
  }, [viewState]);

  return (
    <ShellLayout companyName="UiPath" productName="Apollo Vertex" backgroundMode={backgroundMode}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <FullscreenShellToggle />
      <div className="flex h-full flex-col gap-6 p-6 relative">
        {/* Background Elements for Default Mode */}
        {backgroundMode === "default" && (
          <>
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
              {/* Ellipse 744 - Dark Blue */}
              <div
                style={{
                  position: 'absolute',
                  width: '771.9px',
                  height: '509.45px',
                  left: '734.46px',
                  top: '-20.95px',
                  background: 'rgba(31, 89, 117, 0.6)',
                  filter: 'blur(149.643px)',
                  transform: 'matrix(0.69, -0.72, -0.72, -0.69, 0, 0)',
                  borderRadius: '50%',
                }}
              />
              {/* Ellipse 743 - Gray */}
              <div
                style={{
                  position: 'absolute',
                  width: '758.99px',
                  height: '710.5px',
                  left: '316.48px',
                  top: '269.96px',
                  background: 'rgba(152, 166, 184, 0.15)',
                  filter: 'blur(149.643px)',
                  transform: 'matrix(-1, 0, 0, 1, 0, 0)',
                  borderRadius: '50%',
                }}
              />
              {/* Ellipse 742 - Cyan */}
              <div
                style={{
                  position: 'absolute',
                  width: '735.76px',
                  height: '653.99px',
                  left: '844.91px',
                  top: '223.27px',
                  background: 'rgba(87, 194, 214, 0.11)',
                  filter: 'blur(149.643px)',
                  transform: 'matrix(-1, 0, 0, 1, 0, 0)',
                  borderRadius: '50%',
                }}
              />
              {/* Ellipse 745 - Light Cyan */}
              <div
                style={{
                  position: 'absolute',
                  width: '798px',
                  height: '346px',
                  left: '297px',
                  top: '425px',
                  background: 'rgba(199, 240, 254, 0.25)',
                  filter: 'blur(149.643px)',
                  transform: 'matrix(-1, 0, 0, 1, 0, 0)',
                  borderRadius: '50%',
                }}
              />
            </div>
            {/* Dampening overlay */}
            <div className="absolute inset-0 bg-sidebar/50 pointer-events-none -z-10" />
          </>
        )}

        {/* Expressive Background Elements on Input Focus */}
        <div
          className="absolute overflow-hidden pointer-events-none"
          style={{
            width: '2184.47px',
            height: '1494.44px',
            left: '-208px',
            top: '-252px',
            zIndex: -10,
          }}
        >
          {/* Vector 210 */}
          <div
            className="absolute"
            style={{
              width: '807px',
              height: '789px',
              left: '650px',
              top: '257px',
              background: 'rgba(78, 9, 77, 0.6)',
              filter: 'blur(90px)',
              opacity: isInputFocused ? 1 : 0,
              transition: isInputFocused ? 'opacity 600ms ease-in-out 0ms' : 'opacity 100ms ease-in-out 0ms',
            }}
          />

          {/* Vector 212 */}
          <div
            className="absolute"
            style={{
              width: '1309px',
              height: '737px',
              left: '-70px',
              top: '-46px',
              background: '#223045',
              filter: 'blur(60px)',
              opacity: isInputFocused ? 1 : 0,
              transition: isInputFocused ? 'opacity 600ms ease-in-out 50ms' : 'opacity 100ms ease-in-out 0ms',
            }}
          />

          {/* Vector 211 */}
          <div
            className="absolute"
            style={{
              width: '1260px',
              height: '800px',
              left: '-208px',
              top: '0px',
              background: 'rgba(244, 66, 35, 0.27)',
              filter: 'blur(90px)',
              transform: 'rotate(23.94deg)',
              opacity: isInputFocused ? 1 : 0,
              transition: isInputFocused ? 'opacity 600ms ease-in-out 100ms' : 'opacity 100ms ease-in-out 0ms',
            }}
          />

          {/* Vector 213 */}
          <div
            className="absolute"
            style={{
              width: '1408px',
              height: '523.77px',
              left: '484px',
              top: '-252px',
              background: 'linear-gradient(257.56deg, rgba(152, 166, 184, 0.5) 36.7%, rgba(68, 74, 82, 0.5) 88.5%)',
              filter: 'blur(100px)',
              transform: 'rotate(-13.86deg)',
              opacity: isInputFocused ? 1 : 0,
              transition: isInputFocused ? 'opacity 600ms ease-in-out 150ms' : 'opacity 100ms ease-in-out 0ms',
            }}
          />
        </div>

        {/* CoverLayer for Input Focus */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: '1440px',
            height: '813px',
            left: '0px',
            top: '0px',
            background: 'rgba(25, 13, 51, 0.79)',
            mixBlendMode: 'overlay',
            opacity: isInputFocused ? 1 : 0,
            transition: isInputFocused ? 'opacity 600ms ease-in-out 200ms' : 'opacity 100ms ease-in-out 0ms',
            zIndex: -10,
          }}
        />

        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs">
              <span className="font-bold">UiPath™</span> Vertical Solutions
            </p>
            <h1 className="text-2xl font-bold">Loan QC Management</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowContent(!showContent)}
            >
              {showContent ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
            </Button>
            <Select defaultValue="flat" onValueChange={setBackgroundMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flat">Flat</SelectItem>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="expressive">Expressive</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="default" onValueChange={setViewState}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="loading">Loading</SelectItem>
                <SelectItem value="skeleton">Skeleton</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="empty">Empty</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Button
                onClick={generateNewData}
                style={{
                  boxShadow: '0 0px 24px rgba(6, 182, 212, 0.4)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.3)',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                Generate view
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 relative">
          {/* Loading Component */}
          {viewState === 'loading' && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-40"
              style={{
                opacity: showLoadingOverlay ? 1 : 0,
                transition: 'opacity 400ms ease-in-out',
                pointerEvents: 'none',
              }}
            >
              <Loader2 className="size-12 text-foreground animate-spin" />
              <p className="text-sm text-foreground">Loading dashboard data...</p>
            </div>
          )}

          {/* Error Component */}
          {viewState === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-40">
              <AlertCircle className="size-12 text-destructive" />
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-medium text-foreground">Failed to load dashboard data</p>
                <p className="text-xs text-muted-foreground">An error occurred while fetching the data</p>
              </div>
              <Button
                onClick={() => setViewState('default')}
                variant="outline"
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Empty Component */}
          {viewState === 'empty' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-40">
              <Inbox className="size-12 text-muted-foreground" />
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-medium text-foreground">No data available</p>
                <p className="text-xs text-muted-foreground">There's no dashboard data to display yet</p>
              </div>
              <Button
                onClick={() => setViewState('default')}
                className="mt-2"
              >
                View Sample Data
              </Button>
            </div>
          )}

          {/* Expanded Card Overlay */}
          {expandedCard && (
            <Card
              className={`absolute top-0 bottom-0 right-0 gap-1 rounded-md border-0 p-6 shadow-none overflow-y-auto z-50 ${
                backgroundMode === "default"
                  ? "bg-primary-foreground/40"
                  : "bg-accent-foreground/6"
              }`}
              style={{
                left: 'calc(50% + 0.5rem)',
                transform: isExpanding ? 'scale(1)' : 'scale(0.98)',
                opacity: isExpanding ? 1 : 0,
                transformOrigin: 'left center',
                transition: 'opacity 400ms cubic-bezier(0.25, 0.1, 0.25, 1), transform 400ms cubic-bezier(0.25, 0.1, 0.25, 1)',
                pointerEvents: isExpanding ? 'auto' : 'none',
              }}
            >
              <button
                onClick={() => setExpandedCard(null)}
                className="absolute top-7 right-6 p-1 rounded-md hover:bg-accent-foreground/10 transition-colors cursor-pointer"
                aria-label="Close expanded view"
              >
                <X className="size-4 text-foreground" />
              </button>

              {expandedCard === 'card1' && (
                <div className="flex flex-col gap-6 h-full">
                  <div>
                    <h3 className="text-left text-xl font-bold text-foreground">
                      {cardTitles.card1}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Track completion rates and pending reviews across all loan documents
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Total documents</span>
                      <span className="text-2xl font-bold text-foreground">{cardData.totalDocs.toLocaleString()}</span>
                      <span className="text-xs text-green-500">+12% this month</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Pending review</span>
                      <span className="text-2xl font-bold text-foreground">{cardData.pending}</span>
                      <span className="text-xs text-orange-500">-5% this week</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Approved</span>
                      <span className="text-2xl font-bold text-foreground">{cardData.approved}</span>
                      <span className="text-xs text-green-500">+18% this month</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Rejected</span>
                      <span className="text-2xl font-bold text-foreground">{cardData.rejected}</span>
                      <span className="text-xs text-muted-foreground">No change</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Issue breakdown</h4>
                    <GradientBars bars={issueBreakdown} />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm">
                      Export report
                    </Button>
                    <Button size="sm">
                      Take action
                    </Button>
                  </div>
                </div>
              )}

              {expandedCard === 'card2' && (
                <div className="flex flex-col gap-6 h-full">
                  <div>
                    <h3 className="text-left text-xl font-bold text-foreground">
                      {cardTitles.card2}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Monitor extraction accuracy and processing speed for automated checks
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Accuracy rate</span>
                      <span className="text-2xl font-bold text-foreground">{cardData.accuracyRate}%</span>
                      <span className="text-xs text-green-500">+2.3% this month</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Processing speed</span>
                      <span className="text-2xl font-bold text-foreground">{cardData.processingSpeed}s</span>
                      <span className="text-xs text-green-500">-0.3s faster</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Documents processed</span>
                      <span className="text-2xl font-bold text-foreground">{cardData.docsProcessed.toLocaleString()}</span>
                      <span className="text-xs text-green-500">+24% this month</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Error rate</span>
                      <span className="text-2xl font-bold text-foreground">{cardData.errorRate}%</span>
                      <span className="text-xs text-muted-foreground">Within target</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Extraction performance by field</h4>
                    <UserActivityBars users={extractionPerformance} />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm">
                      Configure AI
                    </Button>
                    <Button size="sm">
                      View logs
                    </Button>
                  </div>
                </div>
              )}

              {expandedCard === 'card3' && (
                <div className="flex flex-col gap-6 h-full">
                  <div>
                    <h3 className="text-left text-xl font-bold text-foreground">
                      {cardTitles.card3}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Overall quality metrics and performance indicators across all processes
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Current score</span>
                      <span className="text-2xl font-bold text-foreground">{cardData.qualityScore}</span>
                      <span className="text-xs text-green-500">+5 points</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Target score</span>
                      <span className="text-2xl font-bold text-foreground">{cardData.targetScore}</span>
                      <span className="text-xs text-muted-foreground">{cardData.targetScore - cardData.qualityScore} points to go</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Improvement</span>
                      <span className="text-2xl font-bold text-foreground">+12%</span>
                      <span className="text-xs text-green-500">Last quarter</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Time to target</span>
                      <span className="text-2xl font-bold text-foreground">2.8mo</span>
                      <span className="text-xs text-muted-foreground">Estimated</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Score breakdown by category</h4>
                    <GradientBars bars={qualityBreakdown} />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm">
                      View details
                    </Button>
                    <Button size="sm">
                      Generate report
                    </Button>
                  </div>
                </div>
              )}

              {expandedCard === 'card4' && (
                <div className="flex flex-col gap-6 h-full">
                  <div>
                    <h3 className="text-left text-xl font-bold text-foreground">
                      {cardTitles.card4}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Monitor regulatory compliance and critical alerts requiring attention
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Active alerts</span>
                      <span className="text-2xl font-bold text-foreground">{cardData.activeAlerts}</span>
                      <span className="text-xs text-orange-500">3 new today</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Critical issues</span>
                      <span className="text-2xl font-bold text-foreground">{cardData.criticalIssues}</span>
                      <span className="text-xs text-red-500">Needs attention</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Resolved today</span>
                      <span className="text-2xl font-bold text-foreground">{cardData.resolvedToday}</span>
                      <span className="text-xs text-green-500">Above average</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Compliance rate</span>
                      <span className="text-2xl font-bold text-foreground">{cardData.complianceRate}%</span>
                      <span className="text-xs text-green-500">+3% this week</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Alert breakdown by severity</h4>
                    <GradientBars bars={alertBreakdown} />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm">
                      View all alerts
                    </Button>
                    <Button size="sm">
                      Resolve issues
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Hero Card + Chat Input - Left Side */}
          <div
            className="flex flex-col gap-4 md:col-span-1 lg:col-span-2 lg:row-span-2"
            style={{
              opacity: (viewState === 'error' || viewState === 'empty') ? 0 : (viewState === 'skeleton' ? 1 : (showContent && !showLoadingOverlay ? 1 : 0)),
              transform: viewState === 'skeleton' ? 'translateY(0)' : (showContent ? (showLoadingOverlay ? 'translateY(16px)' : 'translateY(0)') : 'translateY(16px)'),
              transition: viewState === 'skeleton' ? 'none' : `opacity ${fadingFromSkeleton ? '150ms' : '400ms'} ease-in-out 0ms, transform ${fadingFromSkeleton ? '150ms' : '400ms'} ease-in-out 0ms`,
            }}
          >
            {/* Hero Card */}
            <Card
              className="flex-1 gap-1 rounded-md border-0 bg-accent-foreground/6 p-8 shadow-none flex flex-col"
              style={{
                background: 'linear-gradient(152.44deg, rgba(13, 14, 36, 0.95) 2.42%, rgba(37, 27, 40, 0) 43.21%), linear-gradient(227.57deg, rgba(91, 31, 112, 0.4) 10.36%, rgba(251, 70, 22, 0.4) 147.71%), rgba(228, 237, 245, 0.06)'
              }}
            >
              {viewState === 'skeleton' ? (
                <>
                  <div className="size-6 mb-2 bg-foreground/20 rounded animate-pulse" />
                  <div className="h-4 w-48 bg-foreground/20 rounded animate-pulse" />
                  <div className="w-[95%]">
                    <div className="mt-6 space-y-3">
                      <div className="h-10 w-full bg-foreground/20 rounded animate-pulse" />
                      <div className="h-10 w-5/6 bg-foreground/20 rounded animate-pulse" />
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-4 w-full bg-foreground/20 rounded animate-pulse" />
                      <div className="h-4 w-4/5 bg-foreground/20 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="flex-1" />
                  <div className="w-full h-[180px] bg-foreground/20 rounded animate-pulse" />
                  <div className="flex justify-between mt-2">
                    <div className="h-3 w-24 bg-foreground/20 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-foreground/20 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-40 bg-foreground/20 rounded animate-pulse mx-auto mt-2" />
                </>
              ) : (
                <div
                  className="flex flex-col flex-1"
                  style={{
                    opacity: fadingFromSkeleton ? 0 : 1,
                    animation: fadingFromSkeleton ? 'fadeIn 150ms ease-in-out 0ms forwards' : 'none',
                  }}
                >
                  <Sparkles className="mb-2 size-6 text-foreground" />
                  <h3 className="text-left text-base font-bold text-foreground">
                    {heroContent.greeting}
                  </h3>
                  <div className="w-[95%]">
                    <p className="mt-6 text-left text-4xl font-bold text-foreground">
                      {heroContent.headline}
                    </p>
                    <p className="mt-4 text-left text-base text-secondary-foreground">
                      {heroContent.subheadline}
                    </p>
                  </div>
                  <div className="flex-1" />
                  <TrendChart
                    data={[72, 72.5, 73, 73.2, 73.8, 74, 74.5, 74.8, 75.2, 75.5, 76, 76.2, 76.5, 76.8, 77]}
                    startLabel="30 days ago"
                    endLabel="Today"
                    startValue="72%"
                    endValue="77%"
                    subtitle="Touchless vs. manual"
                  />
                </div>
              )}
            </Card>

            {/* AI Chat Input */}
            <InputGroup className="h-16 border-0 bg-foreground/10 px-2">
              <InputGroupInput
                placeholder="Ask about QC trends, document issues, or AI performance..."
                className="text-sm"
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-sm" variant="ghost">
                  <Mic className="size-4" />
                </InputGroupButton>
                <InputGroupButton size="icon-sm" variant="ghost">
                  <Sparkles className="size-4" />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>

          {/* Top Right Card 1 */}
          <Card
            onClick={() => setExpandedCard(expandedCard === 'card1' ? null : 'card1')}
            className={`lg:min-h-[200px] gap-1 rounded-md border-0 p-6 shadow-none cursor-pointer group ${
              backgroundMode === "default"
                ? "bg-primary-foreground/40 hover:bg-primary-foreground/50"
                : "bg-accent-foreground/6 hover:bg-accent-foreground/9"
            }`}
            style={{
              opacity: (viewState === 'error' || viewState === 'empty') ? 0 : (viewState === 'skeleton' ? 1 : (showContent && !showLoadingOverlay ? (expandedCard ? 0 : 1) : 0)),
              transform: viewState === 'skeleton' ? 'translateY(0)' : (showContent ? (showLoadingOverlay ? 'translateY(16px)' : 'translateY(0)') : 'translateY(16px)'),
              transition: viewState === 'skeleton' ? 'none' : `opacity ${fadingFromSkeleton ? '150ms' : '400ms'} ease-in-out ${fadingFromSkeleton ? '50ms' : '25ms'}, transform ${fadingFromSkeleton ? '150ms' : '400ms'} ease-in-out ${fadingFromSkeleton ? '50ms' : '25ms'}`,
            }}
          >
            <ArrowUpRight className="absolute top-7 right-6 size-4 text-foreground opacity-0 translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
            {viewState === 'skeleton' ? (
              <>
                <div className="h-5 w-48 bg-foreground/20 rounded animate-pulse" />
                <div className="h-3 w-full bg-foreground/20 rounded animate-pulse mt-2" />
                <div className="flex flex-col gap-5 mt-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="flex justify-between">
                        <div className="h-3 w-32 bg-foreground/20 rounded animate-pulse" />
                        <div className="h-3 w-10 bg-foreground/20 rounded animate-pulse" />
                      </div>
                      <div className="h-1 w-full rounded-full bg-accent-foreground/10">
                        <div className="h-1 rounded-full bg-foreground/20 animate-pulse" style={{ width: `${80 - i * 10}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div
                className="flex flex-col flex-1"
                style={{
                  opacity: fadingFromSkeleton ? 0 : 1,
                  animation: fadingFromSkeleton ? 'fadeIn 150ms ease-in-out 50ms forwards' : 'none',
                }}
              >
                <h3 className="text-left text-base font-bold text-foreground">
                  {cardTitles.card1}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Track completion rates and pending reviews across all loan documents
                </p>
                <GradientBars bars={issueBreakdown} />
              </div>
            )}
          </Card>

          {/* Top Right Card 2 */}
          <Card
            onClick={() => setExpandedCard(expandedCard === 'card2' ? null : 'card2')}
            className={`lg:min-h-[200px] gap-1 rounded-md border-0 p-6 shadow-none cursor-pointer group ${
              backgroundMode === "default"
                ? "bg-primary-foreground/40 hover:bg-primary-foreground/50"
                : "bg-accent-foreground/6 hover:bg-accent-foreground/9"
            }`}
            style={{
              opacity: (viewState === 'error' || viewState === 'empty') ? 0 : (viewState === 'skeleton' ? 1 : (showContent && !showLoadingOverlay ? (expandedCard ? 0 : 1) : 0)),
              transform: viewState === 'skeleton' ? 'translateY(0)' : (showContent ? (showLoadingOverlay ? 'translateY(16px)' : 'translateY(0)') : 'translateY(16px)'),
              transition: viewState === 'skeleton' ? 'none' : `opacity ${fadingFromSkeleton ? '150ms' : '400ms'} ease-in-out ${fadingFromSkeleton ? '100ms' : '50ms'}, transform ${fadingFromSkeleton ? '150ms' : '400ms'} ease-in-out ${fadingFromSkeleton ? '100ms' : '50ms'}`,
            }}
          >
            <ArrowUpRight className="absolute top-7 right-6 size-4 text-foreground opacity-0 translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
            {viewState === 'skeleton' ? (
              <>
                <div className="h-5 w-48 bg-foreground/20 rounded animate-pulse" />
                <div className="h-3 w-full bg-foreground/20 rounded animate-pulse mt-2" />
                <div className="flex flex-col gap-5 mt-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="size-8 rounded-full bg-foreground/20 animate-pulse" />
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex justify-between">
                          <div className="h-3 w-24 bg-foreground/20 rounded animate-pulse" />
                          <div className="h-3 w-10 bg-foreground/20 rounded animate-pulse" />
                        </div>
                        <div className="h-1 w-full rounded-full bg-accent-foreground/10">
                          <div className="h-1 rounded-full bg-foreground/20 animate-pulse" style={{ width: `${90 - i * 5}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div
                className="flex flex-col flex-1"
                style={{
                  opacity: fadingFromSkeleton ? 0 : 1,
                  animation: fadingFromSkeleton ? 'fadeIn 150ms ease-in-out 100ms forwards' : 'none',
                }}
              >
                <h3 className="text-left text-base font-bold text-foreground">
                  {cardTitles.card2}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Monitor extraction accuracy and processing speed for automated checks
                </p>
                <UserActivityBars users={extractionPerformance} />
              </div>
            )}
          </Card>

          {/* Bottom Right Card 1 */}
          <Card
            onClick={() => setExpandedCard(expandedCard === 'card3' ? null : 'card3')}
            className={`lg:min-h-[200px] gap-1 rounded-md border-0 p-6 pb-4 shadow-none flex flex-col cursor-pointer group ${
              backgroundMode === "default"
                ? "bg-primary-foreground/40 hover:bg-primary-foreground/50"
                : "bg-accent-foreground/6 hover:bg-accent-foreground/9"
            }`}
            style={{
              opacity: (viewState === 'error' || viewState === 'empty') ? 0 : (viewState === 'skeleton' ? 1 : (showContent && !showLoadingOverlay ? (expandedCard ? 0 : 1) : 0)),
              transform: viewState === 'skeleton' ? 'translateY(0)' : (showContent ? (showLoadingOverlay ? 'translateY(16px)' : 'translateY(0)') : 'translateY(16px)'),
              transition: viewState === 'skeleton' ? 'none' : `opacity ${fadingFromSkeleton ? '150ms' : '400ms'} ease-in-out ${fadingFromSkeleton ? '150ms' : '75ms'}, transform ${fadingFromSkeleton ? '150ms' : '400ms'} ease-in-out ${fadingFromSkeleton ? '150ms' : '75ms'}`,
            }}
          >
            <ArrowUpRight className="absolute top-7 right-6 size-4 text-foreground opacity-0 translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
            {viewState === 'skeleton' ? (
              <>
                <div className="h-5 w-48 bg-foreground/20 rounded animate-pulse" />
                <div className="flex-1" />
                <div className="flex flex-col gap-4">
                  <div className="w-full h-[120px] bg-foreground/20 rounded animate-pulse" />
                  <div className="flex items-baseline gap-1">
                    <div className="h-8 w-12 bg-foreground/20 rounded animate-pulse" />
                    <div className="h-6 w-16 bg-foreground/20 rounded animate-pulse" />
                  </div>
                  <div className="h-3 w-full bg-foreground/20 rounded animate-pulse" />
                </div>
              </>
            ) : (
              <div
                className="flex flex-col flex-1"
                style={{
                  opacity: fadingFromSkeleton ? 0 : 1,
                  animation: fadingFromSkeleton ? 'fadeIn 150ms ease-in-out 150ms forwards' : 'none',
                }}
              >
                <h3 className="text-left text-base font-bold text-foreground">
                  {cardTitles.card3}
                </h3>
                <div className="flex-1" />
                <Sparkline
                  data={[65, 68, 72, 70, 75, 78, 82, 80, 85, 88, 90, 87]}
                  value="2.8"
                  unit="days"
                  description="Each day saved improves SLA attainment by ~1.4%"
                />
              </div>
            )}
          </Card>

          {/* Bottom Right Card 2 */}
          <Card
            onClick={() => setExpandedCard(expandedCard === 'card4' ? null : 'card4')}
            className={`lg:min-h-[200px] gap-1 rounded-md border-0 p-6 pb-4 shadow-none flex flex-col cursor-pointer group ${
              backgroundMode === "default"
                ? "bg-primary-foreground/40 hover:bg-primary-foreground/50"
                : "bg-accent-foreground/6 hover:bg-accent-foreground/9"
            }`}
            style={{
              opacity: (viewState === 'error' || viewState === 'empty') ? 0 : (viewState === 'skeleton' ? 1 : (showContent && !showLoadingOverlay ? (expandedCard ? 0 : 1) : 0)),
              transform: viewState === 'skeleton' ? 'translateY(0)' : (showContent ? (showLoadingOverlay ? 'translateY(16px)' : 'translateY(0)') : 'translateY(16px)'),
              transition: viewState === 'skeleton' ? 'none' : `opacity ${fadingFromSkeleton ? '150ms' : '400ms'} ease-in-out ${fadingFromSkeleton ? '200ms' : '100ms'}, transform ${fadingFromSkeleton ? '150ms' : '400ms'} ease-in-out ${fadingFromSkeleton ? '200ms' : '100ms'}`,
            }}
          >
            <ArrowUpRight className="absolute top-7 right-6 size-4 text-foreground opacity-0 translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
            {viewState === 'skeleton' ? (
              <>
                <div className="h-5 w-48 bg-foreground/20 rounded animate-pulse" />
                <div className="flex-1" />
                <div className="flex flex-col items-center justify-center gap-6">
                  <div className="size-40 rounded-full bg-foreground/20 animate-pulse" />
                  <div className="h-3 w-full bg-foreground/20 rounded animate-pulse" />
                  <div className="h-3 w-5/6 bg-foreground/20 rounded animate-pulse" />
                </div>
              </>
            ) : (
              <div
                className="flex flex-col flex-1"
                style={{
                  opacity: fadingFromSkeleton ? 0 : 1,
                  animation: fadingFromSkeleton ? 'fadeIn 150ms ease-in-out 200ms forwards' : 'none',
                }}
              >
                <h3 className="text-left text-base font-bold text-foreground">
                  {cardTitles.card4}
                </h3>
                <div className="flex-1" />
                <DonutChart
                  value={cardData.qualityScore}
                  total={100}
                  description="Quality index combines SLA compliance, average cycle time, and exception rate."
                />
              </div>
            )}
          </Card>
        </div>
      </div>
    </ShellLayout>
  );
}

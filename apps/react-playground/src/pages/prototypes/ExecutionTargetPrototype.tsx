/**
 * Prototype for OR-92995
 * "Enable Run as Myself in context of Windows automations and rename in Execution Target"
 *
 * Changes prototyped:
 * 1. Rename "Run As Myself" → "Inherit parent job identity"
 * 2. Allow the option for Windows processes with a warning callout
 */

import { useState } from "react";
import styled from "styled-components";

// ─── Layout ──────────────────────────────────────────────────────────────────

const Page = styled.div`
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const PageTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: var(--color-foreground-emp);
  margin: 0;
`;

const PageSubtitle = styled.p`
  font-size: 13px;
  color: var(--color-foreground-de-emp);
  margin: 0;
`;

const JiraChip = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  background: var(--color-info-background);
  color: var(--color-info-text);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  width: fit-content;
  &:hover { text-decoration: underline; }
`;

// ─── Process type toggle ──────────────────────────────────────────────────────

const ToggleRow = styled.div`
  display: flex;
  gap: 0;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  overflow: hidden;
  width: fit-content;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  padding: 7px 18px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  background: ${({ $active }) =>
    $active ? "var(--color-primary)" : "var(--color-background)"};
  color: ${({ $active }) =>
    $active ? "#fff" : "var(--color-foreground-de-emp)"};
  &:hover {
    background: ${({ $active }) =>
      $active ? "var(--color-primary-hover)" : "var(--color-background-secondary)"};
  }
`;

// ─── Panel shell ─────────────────────────────────────────────────────────────

const PanelWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-raised);
  overflow: hidden;
  max-width: 580px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

const PanelHeader = styled.div`
  padding: 18px 24px 14px;
  border-bottom: 1px solid var(--color-border-de-emp);
  background: var(--color-background-secondary);
`;

const PanelTitle = styled.h2`
  font-size: 15px;
  font-weight: 700;
  color: var(--color-foreground-emp);
  margin: 0 0 2px;
`;

const PanelDesc = styled.p`
  font-size: 12px;
  color: var(--color-foreground-de-emp);
  margin: 0;
`;

const PanelBody = styled.div`
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const PanelFooter = styled.div`
  padding: 14px 24px;
  border-top: 1px solid var(--color-border-de-emp);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

// ─── Section label ────────────────────────────────────────────────────────────

const SectionLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-foreground-de-emp);
  margin-bottom: 4px;
`;

// ─── Option card ─────────────────────────────────────────────────────────────

const OptionCard = styled.label<{ $selected: boolean; $disabled?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 6px;
  border: 1.5px solid ${({ $selected }) =>
    $selected ? "var(--color-primary)" : "var(--color-border-de-emp)"};
  background: ${({ $selected }) =>
    $selected ? "var(--color-background-selected)" : "var(--color-background)"};
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  transition: border-color 0.15s, background 0.15s;
  &:hover {
    border-color: ${({ $selected, $disabled }) =>
      $disabled ? "var(--color-border-de-emp)" : $selected ? "var(--color-primary)" : "var(--color-border)"};
    background: ${({ $selected, $disabled }) =>
      $disabled
        ? ""
        : $selected
          ? "var(--color-background-selected)"
          : "var(--color-background-secondary)"};
  }
`;

const RadioDot = styled.div<{ $selected: boolean }>`
  width: 16px;
  height: 16px;
  min-width: 16px;
  border-radius: 50%;
  border: 2px solid ${({ $selected }) =>
    $selected ? "var(--color-primary)" : "var(--color-border)"};
  background: ${({ $selected }) =>
    $selected ? "var(--color-primary)" : "transparent"};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
  transition: border-color 0.15s, background 0.15s;
  &::after {
    content: "";
    display: ${({ $selected }) => ($selected ? "block" : "none")};
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #fff;
  }
`;

const OptionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
`;

const OptionTitle = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--color-foreground-emp);
`;

const OptionDesc = styled.span`
  font-size: 12px;
  color: var(--color-foreground-de-emp);
  line-height: 1.5;
`;

const NewBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  background: var(--color-success-background);
  color: var(--color-success-text);
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  margin-left: 7px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const ChangedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  background: var(--color-info-background);
  color: var(--color-info-text);
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  margin-left: 7px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

// ─── Warning callout ──────────────────────────────────────────────────────────

const Callout = styled.div<{ $variant: "warning" | "info" }>`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 13px;
  border-radius: 6px;
  background: ${({ $variant }) =>
    $variant === "warning"
      ? "var(--color-warning-background)"
      : "var(--color-info-background)"};
  border: 1px solid ${({ $variant }) =>
    $variant === "warning" ? "#ffe099" : "var(--color-primary-lighter)"};
  margin-top: 8px;
`;

const CalloutIcon = styled.span<{ $variant: "warning" | "info" }>`
  font-size: 15px;
  line-height: 1.4;
  color: ${({ $variant }) =>
    $variant === "warning"
      ? "var(--color-warning-icon)"
      : "var(--color-info-icon)"};
`;

const CalloutText = styled.p`
  font-size: 12px;
  color: var(--color-foreground);
  margin: 0;
  line-height: 1.6;
`;

const CalloutStrong = styled.strong`
  font-weight: 700;
  color: var(--color-foreground-emp);
`;

// ─── Buttons ─────────────────────────────────────────────────────────────────

const BtnSecondary = styled.button`
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 5px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-foreground);
  cursor: pointer;
  &:hover { background: var(--color-background-secondary); }
`;

const BtnPrimary = styled.button`
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 5px;
  border: none;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  &:hover { background: var(--color-primary-hover); }
`;

// ─── Annotation box ───────────────────────────────────────────────────────────

const DiffAnnotation = styled.div`
  max-width: 580px;
  padding: 16px 20px;
  border-radius: 8px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border-de-emp);
`;

const DiffTitle = styled.h3`
  font-size: 13px;
  font-weight: 700;
  color: var(--color-foreground-emp);
  margin: 0 0 10px;
`;

const DiffList = styled.ul`
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const DiffItem = styled.li`
  font-size: 13px;
  color: var(--color-foreground-de-emp);
  line-height: 1.6;
`;

const DiffHighlight = styled.code`
  background: var(--color-background-raised);
  border: 1px solid var(--color-border-de-emp);
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 12px;
  color: var(--color-foreground-emp);
`;

// ─── Input (for "Specific user" field mockup) ─────────────────────────────────

const SelectMock = styled.div`
  margin-top: 8px;
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  padding: 7px 11px;
  background: var(--color-background-edit);
  gap: 8px;
  color: var(--color-foreground-de-emp);
  font-size: 13px;
`;

const SelectMockChevron = styled.span`
  margin-left: auto;
  font-size: 11px;
`;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

type Identity = "dynamic" | "specific-user" | "inherit-parent";
type ProcessType = "cross-platform" | "windows";

export function ExecutionTargetPrototype() {
  const [processType, setProcessType] = useState<ProcessType>("cross-platform");
  const [identity, setIdentity] = useState<Identity>("dynamic");

  const isWindows = processType === "windows";

  return (
    <Page>
      {/* ── Page header ─────────────────────────────────── */}
      <PageHeader>
        <JiraChip
          href="https://uipath.atlassian.net/browse/OR-92995"
          target="_blank"
          rel="noreferrer"
        >
          🎫 OR-92995
        </JiraChip>
        <PageTitle>Execution Target — Prototype</PageTitle>
        <PageSubtitle>
          Enable "Inherit parent job identity" for Windows automations &amp;
          rename the option in the Execution Target panel.
        </PageSubtitle>
      </PageHeader>

      {/* ── Process type switcher ────────────────────────── */}
      <div>
        <SectionLabel style={{ marginBottom: 8 }}>
          Simulate process type
        </SectionLabel>
        <ToggleRow>
          <ToggleButton
            $active={processType === "cross-platform"}
            onClick={() => setProcessType("cross-platform")}
          >
            Cross-platform
          </ToggleButton>
          <ToggleButton
            $active={processType === "windows"}
            onClick={() => setProcessType("windows")}
          >
            Windows
          </ToggleButton>
        </ToggleRow>
      </div>

      {/* ── Panel ───────────────────────────────────────── */}
      <PanelWrap>
        <PanelHeader>
          <PanelTitle>Execution Target</PanelTitle>
          <PanelDesc>
            Choose how this job's execution identity is resolved when invoked
            by a parent job.
          </PanelDesc>
        </PanelHeader>

        <PanelBody>
          <SectionLabel>Execution identity</SectionLabel>

          {/* Option 1: Dynamically allocated */}
          <OptionCard
            $selected={identity === "dynamic"}
            onClick={() => setIdentity("dynamic")}
          >
            <RadioDot $selected={identity === "dynamic"} />
            <OptionContent>
              <OptionTitle>Dynamically allocated</OptionTitle>
              <OptionDesc>
                Automatically assigns an available Unattended Robot from the
                license pool at runtime.
              </OptionDesc>
            </OptionContent>
          </OptionCard>

          {/* Option 2: Specific user */}
          <OptionCard
            $selected={identity === "specific-user"}
            onClick={() => setIdentity("specific-user")}
          >
            <RadioDot $selected={identity === "specific-user"} />
            <OptionContent>
              <OptionTitle>Specific user</OptionTitle>
              <OptionDesc>
                Run as a fixed user account with credentials configured in
                Orchestrator.
              </OptionDesc>
              {identity === "specific-user" && (
                <SelectMock>
                  <span>Search for a user account…</span>
                  <SelectMockChevron>▼</SelectMockChevron>
                </SelectMock>
              )}
            </OptionContent>
          </OptionCard>

          {/* Option 3: Inherit parent job identity (renamed from Run As Myself) */}
          <OptionCard
            $selected={identity === "inherit-parent"}
            onClick={() => setIdentity("inherit-parent")}
          >
            <RadioDot $selected={identity === "inherit-parent"} />
            <OptionContent>
              <OptionTitle>
                Inherit parent job identity
                <ChangedBadge title='Previously labelled "Run As Myself"'>
                  renamed
                </ChangedBadge>
                {isWindows && <NewBadge>now available</NewBadge>}
              </OptionTitle>
              <OptionDesc>
                The job runs with the same identity as the job that triggered
                it, inheriting its robot credentials and license.
              </OptionDesc>

              {/* Warning only for Windows processes */}
              {isWindows && (
                <Callout $variant="warning">
                  <CalloutIcon $variant="warning">⚠</CalloutIcon>
                  <CalloutText>
                    <CalloutStrong>
                      Windows automations require Unattended Robot credentials.
                    </CalloutStrong>{" "}
                    The job invocation may fail if the triggering job's identity
                    does not have an Unattended Robot license with credentials
                    configured in Orchestrator.
                  </CalloutText>
                </Callout>
              )}

              {/* Info note for cross-platform — no change in behaviour */}
              {!isWindows && identity === "inherit-parent" && (
                <Callout $variant="info">
                  <CalloutIcon $variant="info">ℹ</CalloutIcon>
                  <CalloutText>
                    The identity resolution works the same as before — this
                    option was previously labelled{" "}
                    <DiffHighlight>Run As Myself</DiffHighlight>.
                  </CalloutText>
                </Callout>
              )}
            </OptionContent>
          </OptionCard>
        </PanelBody>

        <PanelFooter>
          <BtnSecondary>Cancel</BtnSecondary>
          <BtnPrimary>Save changes</BtnPrimary>
        </PanelFooter>
      </PanelWrap>

      {/* ── Change summary ───────────────────────────────── */}
      <DiffAnnotation>
        <DiffTitle>📋 Changes in this prototype (OR-92995)</DiffTitle>
        <DiffList>
          <DiffItem>
            <strong>Renamed:</strong>{" "}
            <DiffHighlight>Run As Myself</DiffHighlight> →{" "}
            <DiffHighlight>Inherit parent job identity</DiffHighlight> in the
            Execution Target panel for all process types.
          </DiffItem>
          <DiffItem>
            <strong>New for Windows:</strong> The{" "}
            <DiffHighlight>Inherit parent job identity</DiffHighlight> option
            is now selectable for Windows process automations (previously
            hidden/disabled).
          </DiffItem>
          <DiffItem>
            <strong>Warning callout:</strong> When a Windows process is
            selected and <DiffHighlight>Inherit parent job identity</DiffHighlight>{" "}
            is chosen, a contextual warning is shown explaining that the job
            invocation may fail if the parent job's identity lacks an
            Unattended Robot license with credentials.
          </DiffItem>
        </DiffList>
      </DiffAnnotation>
    </Page>
  );
}

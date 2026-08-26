import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useEffect, useRef } from 'react';
import {
  AgentExperienceComposition,
  FullWorkbenchComposition,
  mapTemplateThemeToChat,
  ResponsiveWorkbenchComposition,
} from '../../../../packages/apollo-react/src/canvas/stories/templates/Flow.stories';
import { withCanvasProviders } from '../../../../packages/apollo-react/src/canvas/storybook-utils';
import variablesResearchHtml from './variables-field-guide.html?raw';

const meta = {
  title: 'Apollo Wind/Patterns/Layout Patterns',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withCanvasProviders({ fullscreen: false })],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const RESEARCH_THEME_TOKENS = {
  '--bg': '--surface',
  '--surface': '--surface-raised',
  '--surface-alt': '--surface-overlay',
  '--ink': '--foreground',
  '--ink-muted': '--foreground-muted',
  '--ink-faint': '--foreground-subtle',
  '--line': '--border-subtle',
  '--line-strong': '--ap-wind-border',
  '--accent': '--brand',
  '--accent-ink': '--foreground-accent',
  '--accent-soft': '--brand-subtle',
  '--dir-in': '--info',
  '--dir-in-soft': '--info-background',
  '--dir-out': '--success',
  '--dir-out-soft': '--success-background',
  '--dir-inout': '--brand',
  '--dir-inout-soft': '--brand-subtle',
  '--dir-node': '--warning',
  '--dir-node-soft': '--warning-background',
} as const;

function VariablesResearchPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const syncTheme = useCallback(() => {
    const researchRoot = iframeRef.current?.contentDocument?.documentElement;
    if (!researchRoot) return;
    const sourceStyles = getComputedStyle(document.body);
    for (const [researchToken, apolloToken] of Object.entries(RESEARCH_THEME_TOKENS)) {
      const value = sourceStyles.getPropertyValue(apolloToken).trim();
      if (value) researchRoot.style.setProperty(researchToken, value);
    }
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true });
    observer.observe(document.body, { attributes: true });
    return () => observer.disconnect();
  }, [syncTheme]);

  return (
    <iframe
      ref={iframeRef}
      title="Variables research field guide"
      srcDoc={variablesResearchHtml}
      onLoad={syncTheme}
      className="block h-screen w-full border-0 bg-surface"
    />
  );
}

export const Form: Story = {
  name: 'UX HITL',
  render: () => <FullWorkbenchComposition rightPanelVariant="forms" />,
};

export const VariablesResearch: Story = {
  name: 'Variables research',
  render: () => <VariablesResearchPage />,
};

export const Variables: Story = {
  name: 'UX Variables',
  render: () => <FullWorkbenchComposition rightPanelVariant="node" />,
};

export const VariableSelect: Story = {
  name: 'UX Variables select',
  render: () => <FullWorkbenchComposition rightPanelVariant="variables" />,
};

export const CollectionFilter: Story = {
  name: 'UX Variable collection',
  render: () => <FullWorkbenchComposition rightPanelVariant="collection" />,
};

export const ResponsiveBehaviors: Story = {
  name: 'UX Responsive behaviors',
  render: () => <ResponsiveWorkbenchComposition />,
};

export const Dap: Story = {
  name: 'UX DAP',
  render: () => <FullWorkbenchComposition rightPanelVariant="dap" />,
};

export const ErrorAndValidation: Story = {
  name: 'UX Error and Validation',
  render: () => <FullWorkbenchComposition rightPanelVariant="validation" />,
};

export const Rule: Story = {
  name: 'UX Rule',
  render: () => <FullWorkbenchComposition rightPanelVariant="rules" />,
};

export const Agent: Story = {
  name: 'UX Agent',
  render: (_args, context) => (
    <AgentExperienceComposition theme={mapTemplateThemeToChat(context.globals.theme)} />
  ),
};

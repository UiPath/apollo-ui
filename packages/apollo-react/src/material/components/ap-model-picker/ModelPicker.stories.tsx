import type { Meta, StoryObj } from '@storybook/react-vite';
import type React from 'react';
import { useMemo, useState } from 'react';

import { ModelPicker } from './ModelPicker';
import type { DiscoveryModel } from './types';
import { defaultCostTier } from './utils';

const MOCK_MODELS: DiscoveryModel[] = [
  {
    modelId: 'anthropic.claude-sonnet-4-6-20260301-v1:0',
    modelName: 'anthropic.claude-sonnet-4-6-20260301-v1:0',
    vendor: 'AnthropicClaude',
    modelFamily: 'Claude4',
    modelSubscriptionType: 'UiPathOwned',
    isPreview: true,
    routingDetails: {
      geography: 'GLOBAL',
      model: 'anthropic.claude-sonnet-4-6-20260301-v1:0',
    },
    modelDetails: {
      contextWindowTokens: 200000,
      maxOutputTokens: 8192,
      // Sonnet 4.6: premium tier in defaultCostTier ($3/M input → standard
      // would be wrong; we bump it via the test rate to demonstrate the
      // boundary). Real gateway rates here.
      costDetails: {
        inputTokenCost: 3.0,
        outputTokenCost: 15.0,
        currency: 'USD',
      },
    },
  },
  {
    modelId: 'anthropic.claude-sonnet-4-5-20250929-v1:0',
    modelName: 'anthropic.claude-sonnet-4-5-20250929-v1:0',
    vendor: 'AnthropicClaude',
    modelSubscriptionType: 'UiPathOwned',
    routingDetails: { geography: 'GLOBAL' },
    modelDetails: {
      contextWindowTokens: 200000,
      costDetails: {
        inputTokenCost: 3.0,
        outputTokenCost: 15.0,
        currency: 'USD',
      },
    },
  },
  {
    modelId: 'gemini-3-flash-preview-20260215',
    modelName: 'gemini-3-flash-preview-20260215',
    vendor: 'VertexAi',
    modelSubscriptionType: 'UiPathOwned',
    isPreview: true,
    routingDetails: { geography: 'US' },
    modelDetails: {
      contextWindowTokens: 1000000,
      costDetails: {
        inputTokenCost: 0.35,
        outputTokenCost: 1.5,
        currency: 'USD',
      },
    },
  },
  {
    modelId: 'gpt-5-2025-08-07',
    modelName: 'gpt-5-2025-08-07',
    vendor: 'OpenAi',
    modelSubscriptionType: 'UiPathOwned',
    isPreview: true,
    routingDetails: { geography: 'GLOBAL' },
    modelDetails: {
      contextWindowTokens: 400000,
      maxOutputTokens: 128000,
      // gpt-5 large: premium
      costDetails: {
        inputTokenCost: 6.0,
        outputTokenCost: 18.0,
        currency: 'USD',
      },
    },
  },
  {
    modelId: 'gpt-4o-2024-08-06',
    modelName: 'gpt-4o-2024-08-06',
    vendor: 'OpenAi',
    modelSubscriptionType: 'UiPathOwned',
    routingDetails: { geography: 'EU' },
    deprecationDetails: {
      usageEndDate: '2026-09-01',
      replacedBy: 'gpt-5-2025-08-07',
    },
    modelDetails: {
      contextWindowTokens: 128000,
      maxOutputTokens: 16384,
      costDetails: {
        inputTokenCost: 2.5,
        outputTokenCost: 10.0,
        currency: 'USD',
      },
    },
  },
  {
    modelId: 'byo-cigna-gpt-4o-2024-08-06',
    modelName: 'gpt-4o-2024-08-06',
    vendor: 'OpenAi',
    modelSubscriptionType: 'BYOMReplacedLikeForLike',
    byoConnectionLabel: 'CignaSandboxOkta 1',
    byomDetails: {
      integrationServiceConnectionId: 'b8eb36d1-ca1f-4a90-9b14-795e8acd7ec9',
      availableOperationCodes: ['agents-design-eval-deploy'],
    },
  },
  {
    modelId: 'byo-cigna-gpt-4o-mini',
    modelName: 'gpt-4o-mini-2024-07-18',
    vendor: 'OpenAi',
    modelSubscriptionType: 'BYOMReplacedLikeForLike',
    byoConnectionLabel: 'CignaSandboxOkta 1',
  },
  {
    modelId: 'byo-vlad-gemini-2-0-flash',
    modelName: 'my-gemini-2.0-flash-001',
    vendor: 'VertexAi',
    modelSubscriptionType: 'BYOMReplacedAlternative',
    byoConnectionLabel: "Vlad's Vertex with Anthropic",
  },
  {
    modelId: 'shared-andreis-gemini-flash',
    modelName: 'andreis-gemini-flash',
    vendor: 'VertexAi',
    modelSubscriptionType: 'BYOMAdded',
    byoConnectionLabel: 'Google Vertex #2',
  },
  {
    modelId: 'shared-haiku-4-5',
    modelName: 'anthropic.claude-haiku-4-5-20251001-v1:0',
    vendor: 'AwsBedrock',
    modelSubscriptionType: 'BYOMAdded',
    byoConnectionLabel: 'Amazon Bedrock',
    routingDetails: { geography: 'US' },
  },
  {
    modelId: 'shared-sonnet-4-5',
    modelName: 'anthropic.claude-sonnet-4-5-20250929-v1:0',
    vendor: 'AwsBedrock',
    modelSubscriptionType: 'BYOMAdded',
    byoConnectionLabel: 'Amazon Bedrock',
    routingDetails: { geography: 'US' },
  },
  {
    modelId: 'shared-coe-llama-70b',
    modelName: 'coe-llama-70b',
    vendor: 'OpenAi',
    modelSubscriptionType: 'BYOMAdded',
    byoConnectionLabel: 'fireworks #2',
  },
  {
    modelId: 'shared-gemini-25-flash',
    modelName: 'gemini-2.5-flash',
    vendor: 'VertexAi',
    modelSubscriptionType: 'BYOMAdded',
    isPreview: true,
    byoConnectionLabel: 'Google Vertex #2',
  },
  {
    modelId: 'shared-gemini-25-pro',
    modelName: 'gemini-2.5-pro',
    vendor: 'VertexAi',
    modelSubscriptionType: 'BYOMAdded',
    isPreview: true,
    byoConnectionLabel: 'Google Vertex #2',
  },
  {
    modelId: 'shared-llama-33-irs-1',
    modelName: 'llama-3.3-70b-i',
    vendor: 'OpenAi',
    modelSubscriptionType: 'BYOMAdded',
    byoConnectionLabel: 'IRS Llama 3.3 Test',
  },
  {
    modelId: 'uipath-gpt-41-mini',
    modelName: 'gpt-4.1-mini-2025-04-14',
    vendor: 'OpenAi',
    modelSubscriptionType: 'UiPathOwned',
    routingDetails: { geography: 'EU' },
    modelDetails: {
      contextWindowTokens: 1000000,
      maxOutputTokens: 32768,
      // gpt-4.1-mini: basic
      costDetails: {
        inputTokenCost: 0.4,
        outputTokenCost: 1.6,
        currency: 'USD',
      },
    },
  },
  // A retired model whose traffic is being substituted by the gateway.
  // `effectiveModel` is what the gateway is actually routing to —
  // different from `modelName`, which is what the user picked. Triggers
  // the `Routes to …` tag chip on rows and on the trigger.
  {
    modelId: 'uipath-gpt-5-2025-08-07',
    modelName: 'gpt-5-2025-08-07',
    effectiveModel: 'gpt-6-2026-03-15',
    vendor: 'OpenAi',
    modelSubscriptionType: 'UiPathOwned',
    deprecationDetails: {
      usageEndDate: '2026-05-01',
      replacedBy: 'gpt-6-2026-03-15',
    },
    modelDetails: {
      contextWindowTokens: 400000,
      maxOutputTokens: 128000,
      costDetails: {
        inputTokenCost: 2.5,
        outputTokenCost: 10.0,
        currency: 'USD',
      },
    },
  },
];

const meta: Meta<typeof ModelPicker> = {
  title: 'Components/ModelPicker',
  component: ModelPicker,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Picker for LLM Gateway Discovery API models. Two visual POCs ' +
          'share the same controlled API; switch via the `variant` arg. ' +
          'Tags (Recommended/Preview/Custom/Deprecating/Out-of-region) ' +
          'are derived locally from the Discovery DTO: see `deriveModelTags`.',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'radio' },
      options: ['searchable', 'virtualized'],
    },
    groupBy: {
      control: { type: 'radio' },
      options: ['subscription', 'vendor', 'flat'],
    },
    homeRegion: {
      control: { type: 'select' },
      options: ['EU', 'US', 'CA', 'UK', 'JA', 'IN', 'GLOBAL'],
    },
    onChange: { action: 'onChange' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ModelPicker>;

const Controlled = (args: React.ComponentProps<typeof ModelPicker>) => {
  const [value, setValue] = useState<string | null>(
    args.value ?? 'anthropic.claude-sonnet-4-6-20260301-v1:0'
  );
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 32,
        boxSizing: 'border-box',
        background: '#f4f5f7',
      }}
    >
      <div style={{ maxWidth: 640, width: '100%' }}>
        <ModelPicker
          {...args}
          value={value}
          onChange={(m) => {
            setValue(m.modelId);
            args.onChange?.(m);
          }}
        />
      </div>
    </div>
  );
};

export const Default: Story = {
  name: 'Default',
  render: Controlled,
  args: {
    variant: 'searchable',
    models: MOCK_MODELS,
    label: 'Model',
    required: true,
    groupBy: 'subscription',
    homeRegion: 'EU',
  },
};

export const Virtualized: Story = {
  name: 'Virtualized (500+ models)',
  render: Controlled,
  args: {
    variant: 'virtualized',
    models: MOCK_MODELS,
    label: 'Model',
    required: true,
    groupBy: 'subscription',
    homeRegion: 'EU',
  },
};

export const OutOfRegionWarnings: Story = {
  name: 'Out-of-region warnings (homeRegion=EU)',
  render: Controlled,
  args: {
    variant: 'searchable',
    models: MOCK_MODELS,
    homeRegion: 'EU',
    value: 'shared-haiku-4-5',
  },
};

export const Loading: Story = {
  render: Controlled,
  args: {
    variant: 'searchable',
    models: [],
    loading: true,
  },
};

export const ErrorState: Story = {
  name: 'Error state',
  render: Controlled,
  args: {
    variant: 'searchable',
    models: [],
    error: new Error('Discovery API 403 Forbidden'),
  },
};

export const Empty: Story = {
  render: Controlled,
  args: {
    variant: 'searchable',
    models: [],
  },
};

export const AdminCanManageByo: Story = {
  name: 'Admin: can manage BYO',
  render: Controlled,
  args: {
    variant: 'searchable',
    models: MOCK_MODELS,
    homeRegion: 'EU',
    // Admin viewer: default edit/delete icons render on BYO rows, and
    // the "Use custom model" footer CTA appears at the bottom of the
    // popup. The footer click is wired by `onUseCustomModel`.
    canManageByo: true,
    onUseCustomModel: () => {
      // eslint-disable-next-line no-console
      console.log('[story] open BYO wizard');
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `canManageByo` is true the picker renders the default ' +
          'edit/delete icons on every BYO row and a "Use custom model" ' +
          'CTA at the bottom of the popup. Wire `onUseCustomModel` to ' +
          'open your BYO connection wizard.',
      },
    },
  },
};

export const ViewerCannotManageByo: Story = {
  name: 'Viewer: read-only BYO',
  render: Controlled,
  args: {
    variant: 'searchable',
    models: MOCK_MODELS,
    homeRegion: 'EU',
    // Default for `canManageByo` is false: viewers see the same BYO
    // models as admins but can't mutate connections. The footer CTA
    // is also suppressed.
    canManageByo: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Non-admin users see BYO models in the catalog but cannot ' +
          'edit/delete connections. No row actions, no "Use custom model" ' +
          'CTA. This is the default: opt in to admin affordances via ' +
          '`canManageByo`.',
      },
    },
  },
};

export const ManyModelsStressTest: Story = {
  name: 'Stress test. 500 models',
  render: Controlled,
  args: {
    variant: 'virtualized',
    models: Array.from({ length: 500 }, (_, i) => ({
      modelId: `synthetic-model-${i}`,
      modelName: `synthetic-model-${i}`,
      vendor: i % 3 === 0 ? 'OpenAi' : i % 3 === 1 ? 'AnthropicClaude' : 'VertexAi',
      modelSubscriptionType: i % 5 === 0 ? 'BYOMAdded' : 'UiPathOwned',
      isPreview: i % 11 === 0,
    })),
    groupBy: 'subscription',
  },
};

// ---------------------------------------------------------------------------
// "Section-missing" degradation stories: show what the picker looks like
// when one of the canonical groups (Recommended / Preview / Custom (BYO) /
// Deprecating soon) is empty for a given tenant. The `groupModels` util
// drops empty buckets, so the picker collapses cleanly with no visual
// artifacts. These stories validate that gracefully.
// ---------------------------------------------------------------------------

const BYO_MODELS: DiscoveryModel[] = MOCK_MODELS.filter(
  (m) =>
    m.modelSubscriptionType === 'BYOMAdded' ||
    m.modelSubscriptionType === 'BYOMReplacedAlternative' ||
    m.modelSubscriptionType === 'BYOMReplacedLikeForLike'
);
const PREVIEW_MODELS: DiscoveryModel[] = MOCK_MODELS.filter(
  (m) =>
    m.isPreview && m.modelSubscriptionType === 'UiPathOwned' && !m.deprecationDetails?.usageEndDate
);
const RECOMMENDED_MODELS: DiscoveryModel[] = MOCK_MODELS.filter(
  (m) =>
    m.modelSubscriptionType === 'UiPathOwned' && !m.isPreview && !m.deprecationDetails?.usageEndDate
);
const DEPRECATING_MODELS: DiscoveryModel[] = MOCK_MODELS.filter(
  (m) => m.deprecationDetails?.usageEndDate
);

export const NoRecommendedSection: Story = {
  name: 'Section missing: no Recommended',
  render: Controlled,
  args: {
    variant: 'searchable',
    models: [...PREVIEW_MODELS, ...DEPRECATING_MODELS, ...BYO_MODELS],
    label: 'Model',
    required: true,
    groupBy: 'subscription',
    homeRegion: 'EU',
    value: PREVIEW_MODELS[0]?.modelId,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tenant has no stable UiPath-hosted models: only Preview, Deprecating, and BYO. ' +
          'The Recommended section is dropped entirely (no empty placeholder, no "0 models" heading). ' +
          'Picker still opens to the first Preview model.',
      },
    },
  },
};

export const NoCustomSection: Story = {
  name: 'Section missing: no Custom (BYO)',
  render: Controlled,
  args: {
    variant: 'searchable',
    models: [...RECOMMENDED_MODELS, ...PREVIEW_MODELS, ...DEPRECATING_MODELS],
    label: 'Model',
    required: true,
    groupBy: 'subscription',
    homeRegion: 'EU',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tenant has not configured any BYO connections yet. The "Custom Models (BYO)" ' +
          'section disappears. This is the typical state for a fresh tenant.',
      },
    },
  },
};

export const NoPreviewSection: Story = {
  name: 'Section missing: no Preview',
  render: Controlled,
  args: {
    variant: 'searchable',
    models: [...RECOMMENDED_MODELS, ...DEPRECATING_MODELS, ...BYO_MODELS],
    label: 'Model',
    required: true,
    groupBy: 'subscription',
    homeRegion: 'EU',
  },
  parameters: {
    docs: {
      description: {
        story:
          'No models in early access for this tenant. The Preview section is dropped: ' +
          'the catalog renders as Recommended + Deprecating + Custom.',
      },
    },
  },
};

export const OnlyRecommendedSection: Story = {
  name: 'Section missing: only Recommended',
  render: Controlled,
  args: {
    variant: 'searchable',
    models: RECOMMENDED_MODELS,
    label: 'Model',
    required: true,
    groupBy: 'subscription',
    homeRegion: 'EU',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Best-case minimal picker: only stable, UiPath-hosted models with no BYO, ' +
          'no preview, no deprecations. Demonstrates that with a single section the ' +
          'group header still renders so users know the scope.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Folder-scoped Custom Models: demonstrates the `popupHeader` slot used to
// host a folder switcher. The picker itself knows nothing about folders;
// the host (this story) owns the folder state and re-passes a different
// `models` array per folder. Mirrors the real backend behavior where
// `GET /api/discovery` accepts `X-UiPath-FolderKey` to scope BYO results
// (see useDiscoveryModels.ts).
// ---------------------------------------------------------------------------

// Folder list used by the picker's built-in folder switcher. The
// switcher prepends an "All folders" sentinel automatically, so this
// list holds *real* folders only. `null` is the sentinel value.
const FOLDERS = [
  { id: 'shared', label: 'Shared' },
  { id: 'finance', label: 'Finance' },
  { id: 'engineering', label: 'Engineering' },
];

// Per-folder BYO model lists. UiPath-hosted models stay constant across
// folders (they're tenant-wide); only BYO models change. The "all"
// case (`folder === null`) returns the union of every folder's BYO
// catalog deduped by `modelId`: what the backend returns when the
// caller omits `X-UiPath-FolderKey`.
function dedupeById(models: DiscoveryModel[]): DiscoveryModel[] {
  const seen = new Set<string>();
  const out: DiscoveryModel[] = [];
  for (const m of models) {
    if (seen.has(m.modelId)) continue;
    seen.add(m.modelId);
    out.push(m);
  }
  return out;
}

const BYO_BY_FOLDER: Record<string, DiscoveryModel[]> = {
  shared: BYO_MODELS, // everything visible at the tenant root
  finance: BYO_MODELS.filter((m) => m.byoConnectionLabel?.includes('CignaSandbox')),
  engineering: BYO_MODELS.filter((m) => /Bedrock|Vertex/.test(m.byoConnectionLabel ?? '')),
};
const ALL_FOLDERS_BYO = dedupeById(Object.values(BYO_BY_FOLDER).flat());

const ControlledWithFolderScope = (args: React.ComponentProps<typeof ModelPicker>) => {
  const [folder, setFolder] = useState<string | null>(null);
  const [value, setValue] = useState<string | null>('anthropic.claude-sonnet-4-6-20260301-v1:0');
  const modelsForFolder = useMemo(
    () => [
      ...RECOMMENDED_MODELS,
      ...PREVIEW_MODELS,
      ...DEPRECATING_MODELS,
      ...(folder == null ? ALL_FOLDERS_BYO : (BYO_BY_FOLDER[folder] ?? [])),
    ],
    [folder]
  );
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 32,
        boxSizing: 'border-box',
        background: '#f4f5f7',
      }}
    >
      <div style={{ maxWidth: 640, width: '100%' }}>
        <ModelPicker
          {...args}
          models={modelsForFolder}
          value={value}
          onChange={(m) => {
            setValue(m.modelId);
            args.onChange?.(m);
          }}
          folders={FOLDERS}
          folder={folder}
          onFolderChange={setFolder}
        />
      </div>
    </div>
  );
};

export const FolderScopedCustomModels: Story = {
  name: 'Folder-scoped Custom Models',
  render: ControlledWithFolderScope,
  args: {
    variant: 'searchable',
    label: 'Model',
    required: true,
    groupBy: 'subscription',
    homeRegion: 'EU',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the `popupHeader` slot used to host a folder switcher above ' +
          'the search input. Switching folders re-passes a different `models` array: ' +
          'the picker itself has no concept of folders, and UiPath-hosted models stay ' +
          "constant across folders (they're tenant-wide). In a real consumer, the host " +
          'would re-fetch Discovery with the `X-UiPath-FolderKey` header on folder change.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// "Use custom model" footer. Studio Web / Autopilot agent authoring
// pattern. Tenant has only UiPath-hosted models; the picker exposes a
// CTA that takes the user to the BYO connection page. The picker
// renders the CTA itself when `canManageByo` is true; `onUseCustomModel`
// is the navigation hook.
// ---------------------------------------------------------------------------

const ControlledWithCustomModelCta = (args: React.ComponentProps<typeof ModelPicker>) => {
  const [value, setValue] = useState<string | null>('uipath-gpt-41-mini');
  // Tenant has only UiPath-hosted models in this story: no BYO yet. The
  // "Use custom model" CTA is what gets them started.
  const tenantModels = useMemo(
    () => MOCK_MODELS.filter((m) => m.modelSubscriptionType === 'UiPathOwned'),
    []
  );
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 32,
        boxSizing: 'border-box',
        background: '#f4f5f7',
      }}
    >
      <div style={{ maxWidth: 640, width: '100%' }}>
        <ModelPicker
          {...args}
          models={tenantModels}
          value={value}
          onChange={(m) => {
            setValue(m.modelId);
            args.onChange?.(m);
          }}
          canManageByo
          onUseCustomModel={() => {
            // In production: navigate to the BYO connections page.
            // eslint-disable-next-line no-console
            console.log('[story] navigate to /byo-models');
          }}
        />
      </div>
    </div>
  );
};

export const WithUseCustomModelCta: Story = {
  name: 'With “Use custom model” footer CTA',
  render: ControlledWithCustomModelCta,
  args: {
    variant: 'searchable',
    label: 'Model',
    required: true,
    groupBy: 'subscription',
    homeRegion: 'EU',
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `canManageByo` is true the picker renders a default ' +
          '"Use custom model" CTA at the bottom of the popup. Clicking ' +
          'it closes the popup and calls `onUseCustomModel`: the host ' +
          'navigates to the BYO connection page. The picker no longer ' +
          'opens a wizard dialog inline.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Routing substitution: what to show when the user's selected model has
// been retired and the gateway is silently routing traffic to a different
// upstream. The `Routes to …` chip renders on the trigger and on the row,
// the same way every other status chip does.
// ---------------------------------------------------------------------------

const ControlledSelectingSubstitutedModel = (args: React.ComponentProps<typeof ModelPicker>) => {
  const [value, setValue] = useState<string | null>('uipath-gpt-5-2025-08-07');
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 32,
        boxSizing: 'border-box',
        background: '#f4f5f7',
      }}
    >
      <div style={{ maxWidth: 640, width: '100%' }}>
        <ModelPicker
          {...args}
          models={MOCK_MODELS}
          value={value}
          onChange={(m) => {
            setValue(m.modelId);
            args.onChange?.(m);
          }}
        />
      </div>
    </div>
  );
};

export const RoutingSubstitution: Story = {
  name: 'Routing substitution',
  render: ControlledSelectingSubstitutedModel,
  args: {
    variant: 'searchable',
    label: 'Model',
    required: true,
    groupBy: 'subscription',
    homeRegion: 'EU',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The selected model `gpt-5-2025-08-07` has been retired. The gateway ' +
          'is silently routing its traffic to `gpt-6-2026-03-15`. The trigger ' +
          'shows the stored selection with a `Routes to gpt-6-2026-03-15` ' +
          'warning chip: the same chip the corresponding popup row carries: ' +
          'so the user sees what their config says vs. what is actually ' +
          'running, presented consistently with every other status chip.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Recommended from the Discovery DTO + cost badges as a custom-tag
// example (the agents product pattern).
//
// In production the Recommended signal is authored in
// `Model_hub/<product>.yaml` (gitops-centralized-cluster) and merged
// into the Discovery response server-side: the picker reads it off
// `model.isRecommended`. Cost tiers are NOT a built-in signal: products
// that want them (agents does) stamp them via `customTagsFor`.
// ---------------------------------------------------------------------------

// What the Discovery response looks like once the backend merges
// Model_hub: two Sonnets flagged isRecommended, everything else not.
const DISCOVERY_WITH_RECOMMENDED: DiscoveryModel[] = MOCK_MODELS.map((m) => ({
  ...m,
  isRecommended: [
    'anthropic.claude-sonnet-4-6-20260301-v1:0',
    'anthropic.claude-sonnet-4-5-20250929-v1:0',
  ].includes(m.modelId),
}));

// The agents product's cost badges, built on the exported example
// classifier. Cost is a per-product decision: this is the whole
// integration, no picker feature required.
const COST_TIER_LABELS: Record<string, string> = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
};
const agentsCostBadges = (m: DiscoveryModel) => {
  const tier = defaultCostTier(m);
  return tier ? [{ kind: `cost-${tier}`, label: COST_TIER_LABELS[tier] ?? tier }] : [];
};

export const RecommendedFromDiscovery: Story = {
  name: 'Recommended from Discovery + cost badges (agents example)',
  render: Controlled,
  args: {
    variant: 'searchable',
    models: DISCOVERY_WITH_RECOMMENDED,
    label: 'Model',
    required: true,
    groupBy: 'subscription',
    homeRegion: 'EU',
    customTagsFor: agentsCostBadges,
    value: 'anthropic.claude-sonnet-4-6-20260301-v1:0',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates two production patterns. **(1)** Recommended is ' +
          'read from the Discovery DTO (`model.isRecommended`): the ' +
          'backend merges `Model_hub/<product>.yaml` from ' +
          'gitops-centralized-cluster into the response, so neither the ' +
          'picker nor the product fetches Model_hub. Note Sonnet 4.6 is ' +
          'Recommended here even though its DTO says `isPreview: true`: ' +
          'the merged field wins over the local heuristic. **(2)** The ' +
          '`Basic` / `Standard` / `Premium` chips are NOT a picker ' +
          'feature: they are product badges stamped via `customTagsFor` ' +
          'using the exported `defaultCostTier` example classifier, the ' +
          'way the agents product does it.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Kitchen Sink: every picker capability turned on at once. Useful as the
// "if a designer wants to see EVERYTHING" reference + as a smoke test for
// the built-in folder switcher, default `canManageByo` footer CTA,
// recommended/preview overrides, cost tier, view toggle, and substitution.
// ---------------------------------------------------------------------------

const KITCHEN_RECOMMENDED_IDS = [
  'anthropic.claude-sonnet-4-6-20260301-v1:0',
  'anthropic.claude-sonnet-4-5-20250929-v1:0',
];
const KITCHEN_PREVIEW_IDS = ['gpt-5-2025-08-07', 'gemini-3-flash-preview-20260215'];

const ControlledKitchenSink = (args: React.ComponentProps<typeof ModelPicker>) => {
  const [folder, setFolder] = useState<string | null>(null);
  const [value, setValue] = useState<string | null>('anthropic.claude-sonnet-4-6-20260301-v1:0');

  const modelsForFolder = useMemo(
    () => [
      // Hosted models stay constant across folders.
      ...MOCK_MODELS.filter((m) => m.modelSubscriptionType === 'UiPathOwned'),
      // BYO models scope to the picked folder (or union when "all").
      ...(folder == null ? ALL_FOLDERS_BYO : (BYO_BY_FOLDER[folder] ?? [])),
    ],
    [folder]
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 32,
        boxSizing: 'border-box',
        background: '#f4f5f7',
      }}
    >
      <div style={{ maxWidth: 640, width: '100%' }}>
        <ModelPicker
          {...args}
          models={modelsForFolder}
          value={value}
          onChange={(m) => {
            setValue(m.modelId);
            args.onChange?.(m);
          }}
          recommendedModelIds={KITCHEN_RECOMMENDED_IDS}
          previewModelIds={KITCHEN_PREVIEW_IDS}
          customTagsFor={agentsCostBadges}
          folders={FOLDERS}
          folder={folder}
          onFolderChange={setFolder}
          canManageByo
          onUseCustomModel={() => {
            // In production: navigate to the BYO connections page.
            // eslint-disable-next-line no-console
            console.log('[story:kitchen-sink] navigate to /byo-models');
          }}
        />
      </div>
    </div>
  );
};

export const KitchenSink: Story = {
  name: 'Kitchen sink: everything on',
  render: ControlledKitchenSink,
  args: {
    variant: 'searchable',
    label: 'Model',
    required: true,
    groupBy: 'subscription',
    homeRegion: 'EU',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Reference story exercising every capability at once: ' +
          '**Model_hub overrides** (recommended/preview lists), ' +
          '**cost tier chips** (Basic/Standard/Premium derived by ' +
          '`defaultCostTier`), built-in **folder switcher** with the ' +
          '"All folders" sentinel + per-folder BYO scoping, **view ' +
          'toggle** (Category ⇆ Provider), default **"Use custom ' +
          'model" footer CTA** that calls `onUseCustomModel` (host ' +
          'navigates to the BYO connections page), **substitution ' +
          'marker** on the substituted gpt-5 row, **deprecating chip** ' +
          'on gpt-4o, and **out-of-region warning** on gemini-flash for ' +
          'EU users.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Unknown model: what the picker shows when the host's stored `value`
// is not in the catalog returned by Discovery. Possible causes: model
// retired with no routing rule, customer migrated tenants, BYO
// connection deleted, stale config blob loaded.
// ---------------------------------------------------------------------------

const ControlledUnknownModel = (args: React.ComponentProps<typeof ModelPicker>) => {
  const [value, setValue] = useState<string | null>('org-default-gpt-3-5-deprecated');
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 32,
        boxSizing: 'border-box',
        background: '#f4f5f7',
      }}
    >
      <div style={{ maxWidth: 640, width: '100%' }}>
        <ModelPicker
          {...args}
          models={MOCK_MODELS}
          value={value}
          onChange={(m) => {
            setValue(m.modelId);
            args.onChange?.(m);
          }}
        />
      </div>
    </div>
  );
};

export const UnknownModelFallback: Story = {
  name: 'Unknown model: graceful fallback',
  render: ControlledUnknownModel,
  args: {
    variant: 'searchable',
    label: 'Model',
    required: true,
    groupBy: 'subscription',
    homeRegion: 'EU',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The host passed `value="org-default-gpt-3-5-deprecated"`, but ' +
          'that id is not present in the Discovery catalog the picker ' +
          'received. Rather than silently dropping the value: which ' +
          'would look identical to "nothing selected" and risk ' +
          'accidental overwrites of a stored config: the trigger ' +
          'renders the raw id in error red with the border in error ' +
          'red. The trigger is also marked `aria-invalid`, so any ' +
          'host-provided form validation picks up the broken state. ' +
          'Opening the dropdown lets the user pick a replacement, ' +
          'which clears the unknown state.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Friendly names: the picker's "friendly" mode where each row shows a
// human label up top with the canonical model id in a monospace
// secondary line. Demonstrates `friendlyNameFor`: a product-controlled
// map that lets each FPS team localize or rebrand the catalog without
// touching the design system.
// ---------------------------------------------------------------------------

const FRIENDLY_NAMES: Record<string, string> = {
  'anthropic.claude-sonnet-4-6-20260301-v1:0': 'Claude Sonnet 4.6',
  'anthropic.claude-sonnet-4-5-20250929-v1:0': 'Claude Sonnet 4.5',
  'gemini-3-flash-preview-20260215': 'Gemini 3 Flash',
  'gpt-5-2025-08-07': 'GPT-5',
  'gpt-4o-2024-08-06': 'GPT-4o',
  'uipath-gpt-41-mini': 'GPT-4.1 Mini',
  'shared-haiku-4-5': 'Claude Haiku 4.5',
  'shared-sonnet-4-5': 'Claude Sonnet 4.5 (Bedrock)',
};

export const WithFriendlyNames: Story = {
  name: 'With friendly names (per-product label map)',
  render: Controlled,
  args: {
    variant: 'searchable',
    models: MOCK_MODELS,
    label: 'Model',
    required: true,
    groupBy: 'subscription',
    homeRegion: 'EU',
    friendlyNameFor: (m) => FRIENDLY_NAMES[m.modelId] ?? null,
    value: 'anthropic.claude-sonnet-4-6-20260301-v1:0',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Products hand the picker a `friendlyNameFor` function and ' +
          'the row primary line becomes the human label (e.g. "Claude ' +
          'Sonnet 4.6") with the canonical model id in a monospace ' +
          'secondary line. Models without an entry fall back to the ' +
          'raw `modelName`. The trigger uses the same function so the ' +
          'selected label stays consistent across the trigger + popup.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Custom badges. `customTagsFor` lets products stamp product-specific
// chips on rows (e.g. "Multimodal", "On-Prem") without forking the
// component. New tag kinds get colored via `customTagVariants`.
// ---------------------------------------------------------------------------

export const WithCustomBadges: Story = {
  name: 'With custom badges (per-product chips)',
  render: Controlled,
  args: {
    variant: 'searchable',
    models: MOCK_MODELS,
    label: 'Model',
    required: true,
    groupBy: 'subscription',
    homeRegion: 'EU',
    friendlyNameFor: (m) => FRIENDLY_NAMES[m.modelId] ?? null,
    // Two product-specific chips. The picker doesn't know what
    // "multimodal" or "onprem" mean: it just renders them.
    customTagsFor: (m) => {
      const tags = [] as Array<{
        kind: string;
        label: string;
        tooltip?: string;
      }>;
      // Mark models that have both text + vision modalities. (Hardcoded
      // here for the story: in production this would come from a
      // product config or a model_hub field.)
      if (
        m.modelId.includes('claude') ||
        m.modelId.includes('gpt-4o') ||
        m.modelId.includes('gemini')
      ) {
        tags.push({ kind: 'multimodal', label: 'Multimodal' });
      }
      // Mark BYO models hosted on an on-prem connection.
      if (m.byoConnectionLabel?.toLowerCase().includes('irs')) {
        tags.push({
          kind: 'onprem',
          label: 'On-prem',
          tooltip: 'Routes to an on-prem connection',
        });
      }
      return tags;
    },
    customTagVariants: {
      multimodal: 'info-mini',
      onprem: 'warning-mini',
    },
    value: 'anthropic.claude-sonnet-4-6-20260301-v1:0',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Products can stamp their own chips via `customTagsFor`: the ' +
          'picker concatenates them after the built-in chips. ' +
          'Unknown tag kinds render with a neutral gray pill by ' +
          'default; pass `customTagVariants` to color them. Here we ' +
          'add `Multimodal` (info blue) and `On-prem` (warning amber) ' +
          'chips. Combine with `friendlyNameFor` for the full ' +
          '"product-owned catalog" experience.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Filter: per-product scoping. FPS teams scope the picker to a subset
// of the catalog (e.g. only models that support a given operation
// code, or only the ones the current user has access to).
// ---------------------------------------------------------------------------

export const WithFilter: Story = {
  name: 'With per-product filter',
  render: Controlled,
  args: {
    variant: 'searchable',
    models: MOCK_MODELS,
    label: 'Model',
    required: true,
    groupBy: 'subscription',
    homeRegion: 'EU',
    // Scope the picker to UiPath-hosted + BYO models that have a
    // routing geography of `EU` or `GLOBAL`. Filters out the
    // `US`-routed Bedrock connections so an EU tenant sees only the
    // models its workloads can legally reach.
    filter: (m) => {
      const geo = m.routingDetails?.geography;
      if (!geo) return true;
      return geo === 'EU' || geo === 'GLOBAL';
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Pass `filter={(model) => ...}` to scope the visible catalog. ' +
          'The filter runs **before** grouping and search, so empty ' +
          'sections drop out cleanly. Combine with ' +
          '`recommendedModelIds`/`previewModelIds` to keep grouping ' +
          'consistent with the post-filter catalog.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Dark mode: the picker reads every color through Apollo's --color-*
// custom properties, so flipping the variable set on any ancestor
// re-skins it with no theme provider involved. This story pins the
// dark values inline (from docs/COLOR-TOKENS.md, dark column) to prove
// the web-component story: no MUI ThemeProvider, just CSS variables.
// ---------------------------------------------------------------------------

const DARK_MODE_VARS: Record<string, string> = {
  '--color-background': '#182027',
  '--color-background-secondary': '#273139',
  '--color-background-raised': '#273139',
  '--color-background-selected': '#374652',
  '--color-background-hover': 'rgba(207, 216, 221, 0.078)',
  '--color-foreground': '#f4f5f7',
  '--color-foreground-de-emp': '#cfd8dd',
  '--color-foreground-disable': '#a4b1b8',
  '--color-foreground-light': '#a4b1b8',
  '--color-border-de-emp': '#526069',
  '--color-border-grid': '#273139',
  '--color-primary': '#66adff',
  '--color-primary-hover': '#87bfff',
  '--color-primary-focused': 'rgba(102, 173, 255, 0.3)',
  '--color-primary-lighter': 'rgba(102, 173, 255, 0.15)',
  '--color-error-text': '#ff8484',
  '--color-warning-text': '#ffe19e',
};

const ControlledDarkMode = (args: React.ComponentProps<typeof ModelPicker>) => {
  const [value, setValue] = useState<string | null>('anthropic.claude-sonnet-4-6-20260301-v1:0');
  return (
    <div
      style={
        {
          ...DARK_MODE_VARS,
          minHeight: '100vh',
          padding: 32,
          boxSizing: 'border-box',
          background: '#182027',
        } as React.CSSProperties
      }
    >
      <div style={{ maxWidth: 640, width: '100%' }}>
        <ModelPicker
          {...args}
          models={MOCK_MODELS}
          value={value}
          onChange={(m) => {
            setValue(m.modelId);
            args.onChange?.(m);
          }}
        />
      </div>
    </div>
  );
};

export const DarkMode: Story = {
  name: 'Dark mode (CSS variables only)',
  render: ControlledDarkMode,
  args: {
    variant: 'searchable',
    label: 'Model',
    required: true,
    groupBy: 'subscription',
    homeRegion: 'EU',
    customTagsFor: agentsCostBadges,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The picker re-skins entirely through the `--color-*` custom ' +
          'properties: no MUI ThemeProvider involved. This story pins ' +
          "Apollo's dark-theme variable values on a wrapper div, exactly " +
          'how a web-component host flips themes. Every surface (trigger, ' +
          'toolbar, rows, section bands, chips, footer CTA) adapts.',
      },
    },
  },
};

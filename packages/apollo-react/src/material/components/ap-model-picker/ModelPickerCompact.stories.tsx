import ButtonBase from '@mui/material/ButtonBase';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSafeLingui } from '../../../i18n';
import { mapToChatLocale, mapToChatTheme } from '../../stories/chat-story-support';
import { ApChat, AutopilotChatEvent, AutopilotChatMode, AutopilotChatService } from '..';
import { GroupedOptionList, optionDomId } from './primitives/OptionList';
import { PickerPopup } from './primitives/PickerPopup';
import { PickerSearchInput } from './primitives/PickerSearchInput';
import type { DiscoveryModel } from './types';
import { useModelPickerState } from './useModelPickerState';

// Demo-only proposal: the Autopilot chat composer's model button opening
// the design-system ModelPicker in a compact form instead of the stock
// dropdown. Not committed, not part of the shipped component surface.

const CHAT_INSTANCE = 'storybook-chat-compact-picker';

// The composer's model trigger, both variants DropdownPicker can render:
// the icon-only button (aria-label "Model selector") and the labeled
// pill (generic aria-label "Mode selector"; unique here because this
// story configures no agent modes). English locale only: demo scope.
const TRIGGER_SELECTOR =
  '[aria-label="Model selector"], [role="button"][aria-label="Mode selector"]';

const meta: Meta = {
  title: 'Components/ModelPicker/Compact in Autopilot Chat',
  parameters: {
    layout: 'fullscreen',
    localeRemount: false,
    docs: {
      description: {
        component:
          'Proposal: the model button in the Autopilot chat composer opens ' +
          'the design-system ModelPicker in a compact form instead of the ' +
          'stock dropdown. The popup is composed entirely from the exported ' +
          'primitives (useModelPickerState, PickerPopup, PickerSearchInput, ' +
          'GroupedOptionList in dense mode) and anchors to the same button. ' +
          'Selections flow through AutopilotChatService both ways. ' +
          'No product ships this today.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

/* ── Mock Discovery catalog (BYO first, lifecycle badges included) ──── */

const DISCOVERY: DiscoveryModel[] = [
  {
    modelId: 'byo-cigna-gpt-4o',
    modelName: 'gpt-4o-2024-08-06',
    vendor: 'OpenAi',
    modelSubscriptionType: 'BYOMReplacedLikeForLike',
    byoConnectionLabel: 'CignaSandboxOkta 1',
  },
  {
    modelId: 'shared-coe-llama-70b',
    modelName: 'coe-llama-70b',
    vendor: 'OpenAi',
    modelSubscriptionType: 'BYOMAdded',
    byoConnectionLabel: 'fireworks #2',
  },
  {
    modelId: 'anthropic.claude-sonnet-4-6-20260301-v1:0',
    modelName: 'anthropic.claude-sonnet-4-6-20260301-v1:0',
    vendor: 'AnthropicClaude',
    modelSubscriptionType: 'UiPathOwned',
    isRecommended: true,
    modelDetails: { contextWindowTokens: 200000 },
  },
  {
    modelId: 'gpt-5-2025-08-07',
    modelName: 'gpt-5-2025-08-07',
    vendor: 'OpenAi',
    modelSubscriptionType: 'UiPathOwned',
    isPreview: true,
    modelDetails: { contextWindowTokens: 400000 },
  },
  {
    modelId: 'gpt-4.1-mini-2025-04-14',
    modelName: 'gpt-4.1-mini-2025-04-14',
    vendor: 'OpenAi',
    modelSubscriptionType: 'UiPathOwned',
    isRecommended: false,
    modelDetails: { contextWindowTokens: 1000000 },
  },
  {
    modelId: 'gpt-4o-2024-08-06',
    modelName: 'gpt-4o-2024-08-06',
    vendor: 'OpenAi',
    modelSubscriptionType: 'UiPathOwned',
    deprecationDetails: { usageEndDate: '2026-09-01', replacedBy: 'gpt-5-2025-08-07' },
    modelDetails: { contextWindowTokens: 128000 },
  },
];

// Authored display names: in production these arrive on the DTO.
const FRIENDLY: Record<string, string> = {
  'anthropic.claude-sonnet-4-6-20260301-v1:0': 'Claude Sonnet 4.6',
  'gpt-5-2025-08-07': 'GPT-5',
  'gpt-4.1-mini-2025-04-14': 'GPT-4.1 mini',
  'gpt-4o-2024-08-06': 'GPT-4o',
};

function chatDescription(m: DiscoveryModel): string {
  if (m.byoConnectionLabel) return `Custom model via ${m.byoConnectionLabel}`;
  if (m.isRecommended) return 'Recommended by this product';
  if (m.isPreview) return 'Preview model in early access';
  if (m.deprecationDetails?.usageEndDate) return 'Deprecating soon, plan to migrate';
  return 'Generally available';
}

const CHAT_MODELS = DISCOVERY.map((m) => ({
  id: m.modelId,
  name: FRIENDLY[m.modelId] ?? m.modelName,
  description: chatDescription(m),
}));

// Merge names onto the DTO the way the gateway does server-side.
for (const m of DISCOVERY) {
  m.displayName = FRIENDLY[m.modelId];
}

const INITIAL_MODEL_ID = 'anthropic.claude-sonnet-4-6-20260301-v1:0';

/* ── Compact picker popup, anchored to the chat's own model button ──── */

const CompactPickerOnChatButton: React.FC<{
  value: string | null;
  onChange: (m: DiscoveryModel) => void;
}> = ({ value, onChange }) => {
  const { _ } = useSafeLingui();
  const pickerI18n = useMemo(() => ({ _ }), [_]);
  const state = useModelPickerState({
    models: DISCOVERY,
    value,
    onChange,
    i18n: pickerI18n,
  });
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  // The intercept handler needs the latest state without re-binding the
  // DOM listener on every render.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Delegated capture-phase interception: survives the chat re-rendering
  // or remounting its trigger, and stops the event before React's root
  // listener so the stock dropdown never opens.
  useEffect(() => {
    const intercept = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.(TRIGGER_SELECTOR);
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      setAnchor(el as HTMLElement);
      stateRef.current.setOpen(!stateRef.current.open);
    };
    document.addEventListener('click', intercept, true);
    return () => document.removeEventListener('click', intercept, true);
  }, []);

  const listboxId = `${state.id}-listbox`;
  const active = state.filtered[state.activeIndex];

  // Same toolbar affordance and styling as the full picker's segmented
  // pill: soft gray track, active segment lifts out as a raised white
  // pill with primary text (compact metrics for the dense popup).
  const segment = (label: string, strategy: 'subscription' | 'vendor') => {
    const selected = state.groupBy === strategy;
    return (
      <ButtonBase
        key={strategy}
        onClick={() => state.setGroupBy(strategy)}
        aria-pressed={selected}
        sx={{
          px: 1,
          py: 0.5,
          fontSize: 11.5,
          fontWeight: 600,
          lineHeight: 1.2,
          borderRadius: '6px',
          whiteSpace: 'nowrap',
          color: selected
            ? 'var(--color-primary, #0067df)'
            : 'var(--color-foreground-de-emp, #526069)',
          backgroundColor: selected ? 'var(--color-background-raised, #ffffff)' : 'transparent',
          boxShadow: selected ? '0 1px 2px rgba(16, 24, 40, 0.14)' : 'none',
          transition: 'background-color 120ms, color 120ms, box-shadow 120ms',
          '&:hover': {
            backgroundColor: selected
              ? 'var(--color-background-raised, #ffffff)'
              : 'var(--color-background-hover, rgba(82, 96, 105, 0.078))',
          },
        }}
      >
        {label}
      </ButtonBase>
    );
  };
  const viewToggle = (
    <span
      role="group"
      aria-label="Group models by"
      style={{
        display: 'inline-flex',
        gap: 3,
        padding: 3,
        margin: '0 4px',
        borderRadius: 8,
        backgroundColor: 'var(--color-background-secondary, #f4f5f7)',
      }}
    >
      {segment('Category', 'subscription')}
      {segment('Provider', 'vendor')}
    </span>
  );

  return (
    <PickerPopup
      open={state.open && !!anchor}
      anchorEl={anchor}
      onClose={() => state.setOpen(false)}
      width={400}
      placement="top-start"
      zIndex={2600}
      header={
        <PickerSearchInput
          value={state.query}
          onChange={state.setQuery}
          onKeyDown={state.onSearchKeyDown}
          inputRef={state.searchRef}
          listboxId={listboxId}
          activeDescendantId={active ? optionDomId(listboxId, active.modelId) : undefined}
          trailing={viewToggle}
          dense
        />
      }
    >
      <GroupedOptionList
        id={listboxId}
        options={state.filtered}
        activeIndex={state.activeIndex}
        setActiveIndex={state.setActiveIndex}
        selectedId={value}
        onSelect={state.choose}
        tagContext={{ i18n: pickerI18n }}
        groupCounts={state.groupCounts}
        collapsedGroups={state.collapsedGroups}
        onGroupToggle={state.toggleGroup}
        hideTagKinds={state.groupBy === 'subscription' ? ['recommended', 'preview'] : undefined}
        dense
        maxHeight={340}
      />
    </PickerPopup>
  );
};

/* ── Minimal chat host: the story owns the service and its catalog ──── */

const noteStyle: React.CSSProperties = {
  position: 'fixed',
  top: 76,
  right: 24,
  zIndex: 2500,
  width: 340,
  padding: '10px 14px 12px',
  borderRadius: 10,
  border: '1.5px dashed var(--color-border, #cfd8dd)',
  backgroundColor: 'var(--color-background-raised, #ffffff)',
  color: 'var(--color-foreground, #273139)',
  boxShadow: '0 12px 32px rgba(16, 24, 40, 0.18)',
  fontFamily: 'noto sans, sans-serif',
};

const proposalBadge: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.7,
  padding: '1px 6px',
  borderRadius: 4,
  marginLeft: 8,
  color: 'var(--color-info-foreground, #1665b3)',
  backgroundColor: 'var(--color-info-background, #e9f1fa)',
};

const CompactPickerInChat: React.FC<{
  theme: ReturnType<typeof mapToChatTheme>;
  locale: ReturnType<typeof mapToChatLocale>;
}> = ({ theme, locale }) => {
  const [value, setValue] = useState<string | null>(INITIAL_MODEL_ID);

  // The story owns the chat service: the Discovery catalog IS the chat's
  // native model list, so the composer renders its model button for it
  // and nothing re-seeds demo models behind our back.
  const [chatService] = useState(() =>
    AutopilotChatService.Instantiate({
      instanceName: CHAT_INSTANCE,
      config: {
        mode: AutopilotChatMode.FullScreen,
        models: CHAT_MODELS,
        selectedModel: CHAT_MODELS.find((m) => m.id === INITIAL_MODEL_ID),
        useLocalHistory: false,
      },
    })
  );

  // Chat to panel state: follow any selection the service lands on.
  useEffect(() => {
    const unsubscribe = chatService.on(AutopilotChatEvent.SetSelectedModel, (model: unknown) => {
      const id = (model as { id?: string } | null)?.id;
      if (id && DISCOVERY.some((d) => d.modelId === id)) setValue(id);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [chatService]);

  // Picker to chat: push the pick into the service so the composer button
  // label and tooltip update like a native selection.
  const handleChange = (m: DiscoveryModel) => {
    setValue(m.modelId);
    chatService.setSelectedModel(m.modelId);
  };

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <ApChat chatServiceInstance={chatService} theme={theme} locale={locale} />
      <CompactPickerOnChatButton value={value} onChange={handleChange} />
      <div style={noteStyle}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>
          Composer model button
          <span style={proposalBadge}>PROPOSAL</span>
        </div>
        <p
          style={{
            fontSize: 12,
            color: 'var(--color-foreground-de-emp, #526069)',
            margin: '6px 0 0',
          }}
        >
          The chat carries the Discovery catalog natively, so its composer model button is live
          below. Click it: the stock dropdown is intercepted and the design-system compact picker
          opens anchored to that button, with search, BYO-first grouping and lifecycle badges. The
          pick lands back in AutopilotChatService, so the button reflects it like a native
          selection.
        </p>
      </div>
    </div>
  );
};

export const CompactInChat: Story = {
  name: 'Full screen chat + compact picker',
  render: (_args, context) => (
    <CompactPickerInChat
      theme={mapToChatTheme(context.globals.theme)}
      locale={mapToChatLocale(context.globals.locale)}
    />
  ),
};

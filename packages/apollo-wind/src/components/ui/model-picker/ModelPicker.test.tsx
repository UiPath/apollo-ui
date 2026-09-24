import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ModelPicker } from './ModelPicker';
import { PickerTrigger } from './primitives/PickerTrigger';
import type { DiscoveryModel } from './types';
import { isTextGenerationModel } from './utils';

/**
 * Render helper. No translator on purpose: the picker falls back to
 * `defaultTranslator`, which formats each descriptor's English source
 * text — the picker must work in a host that wires up no i18n at all.
 */
function renderPicker(ui: React.ReactElement) {
  return render(ui);
}

const MODELS: DiscoveryModel[] = [
  {
    modelId: 'anthropic.claude-sonnet-4-6',
    modelName: 'anthropic.claude-sonnet-4-6',
    vendor: 'AnthropicClaude',
    modelSubscriptionType: 'UiPathOwned',
  },
  {
    modelId: 'gpt-4o',
    modelName: 'gpt-4o',
    vendor: 'OpenAi',
    modelSubscriptionType: 'UiPathOwned',
    isPreview: true,
  },
  {
    modelId: 'byo-cigna-gpt-4o',
    modelName: 'gpt-4o',
    vendor: 'OpenAi',
    modelSubscriptionType: 'BYOMAdded',
    byoConnectionLabel: 'CignaSandbox',
  },
];

describe('<ModelPicker>', () => {
  it('renders the trigger with the selected model name', () => {
    renderPicker(
      <ModelPicker models={MODELS} value="anthropic.claude-sonnet-4-6" onChange={() => {}} />
    );
    expect(screen.getByText('anthropic.claude-sonnet-4-6')).toBeInTheDocument();
  });

  it('disambiguates two BYO rows with the same model name by valueConnectionId', async () => {
    const user = userEvent.setup();
    const models: DiscoveryModel[] = [
      {
        modelId: 'byo-gpt-4o-acme',
        modelName: 'gpt-4o',
        vendor: 'OpenAi',
        modelSubscriptionType: 'BYOMAdded',
        byomDetails: { integrationServiceConnectionId: 'conn-acme' },
        byoConnectionLabel: 'Acme Azure',
      },
      {
        modelId: 'byo-gpt-4o-cigna',
        modelName: 'gpt-4o',
        vendor: 'OpenAi',
        modelSubscriptionType: 'BYOMAdded',
        byomDetails: { integrationServiceConnectionId: 'conn-cigna' },
        byoConnectionLabel: 'Cigna Sandbox',
      },
    ];

    // Without valueConnectionId, `value="gpt-4o"` matches the first row (Acme).
    renderPicker(<ModelPicker models={models} value="gpt-4o" onChange={() => {}} />);
    await user.click(screen.getByRole('button', { expanded: false }));
    const acmeRow = await screen.findByRole('option', { name: /Acme Azure/i });
    expect(acmeRow).toHaveAttribute('aria-selected', 'true');

    cleanup();

    // With valueConnectionId="conn-cigna", the Cigna row is selected instead.
    renderPicker(
      <ModelPicker
        models={models}
        value="gpt-4o"
        valueConnectionId="conn-cigna"
        onChange={() => {}}
      />
    );
    await user.click(screen.getByRole('button', { expanded: false }));
    const cignaRow = await screen.findByRole('option', { name: /Cigna Sandbox/i });
    expect(cignaRow).toHaveAttribute('aria-selected', 'true');
  });

  it('renders the Discovery displayName as the friendly label', () => {
    const models = MODELS.map((m) =>
      m.modelId === 'anthropic.claude-sonnet-4-6' ? { ...m, displayName: 'Sonnet From DTO' } : m
    );
    renderPicker(
      <ModelPicker models={models} value="anthropic.claude-sonnet-4-6" onChange={() => {}} />
    );
    expect(screen.getByText('Sonnet From DTO')).toBeInTheDocument();
  });

  it('opens on click and fires onChange when a row is picked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker(<ModelPicker models={MODELS} value={null} onChange={onChange} />);
    await user.click(screen.getByRole('button', { expanded: false }));
    // Listbox should now exist with an accessible name.
    const listbox = await screen.findByRole('listbox', { name: /models/i });
    expect(listbox).toBeInTheDocument();
    // Click an option. There are two `gpt-4o` rows (the hosted one and a BYO
    // clone); the hosted one is the Preview, the clone names its connection.
    const option = within(listbox).getByRole('option', { name: /^gpt-4oPreview$/ });
    await user.click(option);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].modelId).toBe('gpt-4o');
  });

  it('keeps rendering a selection the host filter excluded', () => {
    renderPicker(
      <ModelPicker
        models={MODELS}
        value="gpt-4o"
        onChange={() => {}}
        filter={(m) => m.vendor !== 'OpenAi'}
      />
    );
    // The stored selection resolves from the raw catalog, so the trigger
    // shows the model instead of a blank placeholder (README §1).
    expect(screen.getByText('gpt-4o')).toBeInTheDocument();
  });

  it('falls back to "unknown model" treatment when value does not match catalog', () => {
    renderPicker(<ModelPicker models={MODELS} value="some-retired-model" onChange={() => {}} />);
    expect(screen.getByText('some-retired-model')).toBeInTheDocument();
    // Trigger should be aria-invalid.
    expect(screen.getByRole('button', { expanded: false })).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders the BYO edit action only when canManageByo is true', async () => {
    const user = userEvent.setup();
    const onEditModel = vi.fn();
    const { rerender } = renderPicker(
      <ModelPicker
        canManageByo={false}
        models={MODELS}
        onChange={() => {}}
        onEditModel={onEditModel}
        value={null}
      />
    );
    await user.click(screen.getByRole('button', { expanded: false }));
    // BYO is the first group (top of Category view) and expanded by
    // default, so rows are visible without an extra click.
    await screen.findByRole('listbox');
    // Viewer: no edit button on the BYO row.
    expect(screen.queryByRole('button', { name: /edit configuration/i })).toBeNull();

    rerender(
      <ModelPicker
        canManageByo
        models={MODELS}
        onChange={() => {}}
        onEditModel={onEditModel}
        value={null}
      />
    );
    // After flipping canManageByo on, the edit action renders and calls the
    // host — the picker itself knows nothing about where edit leads.
    const edit = await screen.findByRole('button', { name: /edit configuration/i });
    await user.click(edit);
    expect(onEditModel).toHaveBeenCalledWith(
      expect.objectContaining({ modelSubscriptionType: 'BYOMAdded' })
    );
    // Footer CTA also appears.
    expect(screen.getByText(/use custom model/i)).toBeInTheDocument();
  });

  it('Use custom model CTA closes the popup and calls onUseCustomModel', async () => {
    const user = userEvent.setup();
    const onUseCustomModel = vi.fn();
    renderPicker(
      <ModelPicker
        models={MODELS}
        value={null}
        onChange={() => {}}
        canManageByo
        onUseCustomModel={onUseCustomModel}
      />
    );
    await user.click(screen.getByRole('button', { expanded: false }));
    const cta = await screen.findByText(/use custom model/i);
    await user.click(cta);
    expect(onUseCustomModel).toHaveBeenCalledTimes(1);
    // Popup is closed.
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('keyboard navigation: ArrowDown moves activedescendant, Enter selects, Escape closes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker(<ModelPicker models={MODELS} value={null} onChange={onChange} />);
    await user.click(screen.getByRole('button', { expanded: false }));
    const search = await screen.findByRole('combobox');
    // Initial active descendant is set on open.
    expect(search).toHaveAttribute('aria-activedescendant');
    const firstActive = search.getAttribute('aria-activedescendant');
    // Move down.
    await user.keyboard('{ArrowDown}');
    expect(search.getAttribute('aria-activedescendant')).not.toBe(firstActive);
    // Pick.
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('delete row action asks for confirmation before invoking onDeleteModel', async () => {
    const user = userEvent.setup();
    const onDeleteModel = vi.fn();
    renderPicker(
      <ModelPicker
        models={MODELS}
        value={null}
        onChange={() => {}}
        canManageByo
        onDeleteModel={onDeleteModel}
      />
    );
    await user.click(screen.getByRole('button', { expanded: false }));
    const deleteButton = await screen.findByRole('button', { name: /delete configuration/i });

    // Cancel: nothing happens.
    await user.click(deleteButton);
    await user.click(await screen.findByRole('button', { name: /cancel/i }));
    expect(onDeleteModel).not.toHaveBeenCalled();

    // Confirm: the host handler runs with the BYO row. Opening the dialog
    // closes the popup, so reopen it once the dialog's aria-hidden lifts.
    await user.click(await screen.findByRole('button', { expanded: false }));
    await user.click(await screen.findByRole('button', { name: /delete configuration/i }));
    await user.click(await screen.findByRole('button', { name: /^delete$/i }));
    expect(onDeleteModel).toHaveBeenCalledTimes(1);
    expect(onDeleteModel.mock.calls[0][0]).toMatchObject({ modelSubscriptionType: 'BYOMAdded' });
  });

  it('surfaces a failed delete in its own error region', async () => {
    const user = userEvent.setup();
    const onDeleteModel = vi.fn().mockRejectedValue(new Error('Configuration is in use.'));
    const byo: DiscoveryModel[] = [
      {
        modelId: 'byo-acme-gpt-4o',
        modelName: 'gpt-4o',
        vendor: 'OpenAi',
        modelSubscriptionType: 'BYOMAdded',
        byomDetails: { byoConfigurationId: 'cfg-9' },
      },
    ];

    renderPicker(
      <ModelPicker
        canManageByo
        models={byo}
        onChange={() => {}}
        onDeleteModel={onDeleteModel}
        value={null}
      />
    );
    await user.click(await screen.findByRole('button', { expanded: false }));
    await user.click(await screen.findByRole('button', { name: /delete configuration/i }));
    await user.click(await screen.findByRole('button', { name: /^delete$/i }));

    // The host's own message reaches the user rather than being swallowed by
    // the click handler's floating promise.
    expect(await screen.findByText(/configuration is in use/i)).toBeInTheDocument();
  });

  it('never renders policy-blocked models', async () => {
    const user = userEvent.setup();
    renderPicker(
      <ModelPicker
        models={[...MODELS, { ...MODELS[0]!, modelId: 'blocked-model', isBlockedByPolicy: true }]}
        value={null}
        onChange={() => {}}
      />
    );
    await user.click(screen.getByRole('button', { expanded: false }));
    await screen.findByRole('listbox');
    expect(screen.queryByText('blocked-model')).toBeNull();
  });
});

describe('<ModelPicker> catalog scoping', () => {
  const NON_CHAT_MODELS: DiscoveryModel[] = [
    ...MODELS,
    {
      modelId: 'text-embedding-3-large',
      modelName: 'text-embedding-3-large',
      vendor: 'OpenAi',
      modelSubscriptionType: 'UiPathOwned',
      apiFlavor: 'OpenAiEmbeddings',
    },
    {
      modelId: 'gpt-realtime',
      modelName: 'gpt-realtime',
      vendor: 'OpenAi',
      modelSubscriptionType: 'UiPathOwned',
      modelType: 'Realtime',
    },
  ];

  // Which modalities a product offers is the product's call: an indexing or
  // context-grounding surface picks embeddings from the same catalog.
  it('renders embeddings and realtime models when the host does not filter them', async () => {
    const user = userEvent.setup();
    renderPicker(<ModelPicker models={NON_CHAT_MODELS} value={null} onChange={() => {}} />);
    await user.click(screen.getByRole('button', { expanded: false }));
    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).getByText('text-embedding-3-large')).toBeInTheDocument();
    expect(within(listbox).getByText('gpt-realtime')).toBeInTheDocument();
  });

  it('drops them when the host opts into isTextGenerationModel', async () => {
    const user = userEvent.setup();
    renderPicker(
      <ModelPicker
        models={NON_CHAT_MODELS}
        value={null}
        onChange={() => {}}
        filter={isTextGenerationModel}
      />
    );
    await user.click(screen.getByRole('button', { expanded: false }));
    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).queryByText('text-embedding-3-large')).toBeNull();
    expect(within(listbox).queryByText('gpt-realtime')).toBeNull();
    expect(within(listbox).getByText('anthropic.claude-sonnet-4-6')).toBeInTheDocument();
  });

  it('resolves the selection by modelName when it differs from modelId', () => {
    const models: DiscoveryModel[] = [
      {
        modelId: 'byo-row-guid',
        modelName: 'my-custom-gpt',
        vendor: 'OpenAi',
        modelSubscriptionType: 'BYOMAdded',
      },
    ];
    renderPicker(<ModelPicker models={models} value="my-custom-gpt" onChange={() => {}} />);
    expect(screen.getByText('my-custom-gpt')).toBeInTheDocument();
    expect(screen.getByRole('button', { expanded: false })).not.toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it('accepts a raw OMS region name as homeRegion for out-of-region chips', async () => {
    const user = userEvent.setup();
    const models: DiscoveryModel[] = [
      {
        modelId: 'us-hosted',
        modelName: 'us-hosted',
        vendor: 'OpenAi',
        modelSubscriptionType: 'UiPathOwned',
        routingDetails: { geography: 'US' },
      },
      {
        modelId: 'ja-hosted',
        modelName: 'ja-hosted',
        vendor: 'OpenAi',
        modelSubscriptionType: 'UiPathOwned',
        routingDetails: { geography: 'JA' },
      },
    ];
    renderPicker(
      <ModelPicker models={models} value={null} onChange={() => {}} homeRegion="Japan" />
    );
    await user.click(screen.getByRole('button', { expanded: false }));
    const listbox = await screen.findByRole('listbox');
    // homeRegion "Japan" resolves to JA: the US-routed model is out of
    // region, the JA-routed one is home.
    expect(within(listbox).getByText(/out of region \(US\)/i)).toBeInTheDocument();
    expect(within(listbox).queryByText(/out of region \(JA\)/i)).toBeNull();
  });
});

/*
 * Added in the wind port (no apollo-react counterpart).
 *
 * A host whose catalog arrives asynchronously renders one frame with a stored
 * `value` and no models. Treating that as "unknown model" flashed the field
 * red — and showing the placeholder instead read as "your saved model is
 * gone" — on every form open.
 */
describe('<ModelPicker> pending selection', () => {
  it('renders a stored value as plain text while the catalog is loading', () => {
    renderPicker(<ModelPicker loading models={[]} value="gpt-4o" />);

    const trigger = screen.getByRole('button', { expanded: false });
    expect(trigger).toHaveTextContent('gpt-4o');
    // Not an error state: the catalog simply has not arrived yet.
    expect(trigger).not.toHaveAttribute('aria-invalid');
  });

  it('treats the same value as unknown once the catalog has loaded without it', () => {
    renderPicker(<ModelPicker models={MODELS} value="gpt-4o-not-in-catalog" />);

    const trigger = screen.getByRole('button', { expanded: false });
    expect(trigger).toHaveTextContent('gpt-4o-not-in-catalog');
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
  });
});

/*
 * Added in the wind port (no apollo-react counterpart).
 *
 * Category view once hid the Recommended/Preview chip inside the matching
 * section, on the theory that it only repeated the header. In practice it read
 * as a bug — the same model gained and lost its chip depending on the grouping,
 * and the trigger kept a chip the row had dropped. Chips now render everywhere;
 * `OptionList`'s `hideTagKinds` survives as an opt-in for hosts that compose
 * their own list.
 */
describe('<ModelPicker> chips are not suppressed by grouping', () => {
  const byoRecommended: DiscoveryModel[] = [
    {
      modelId: 'byo-recommended',
      modelName: 'byo-recommended',
      vendor: 'OpenAi',
      modelSubscriptionType: 'BYOMAdded',
      isRecommended: true,
      byomDetails: { integrationServiceConnectionId: 'conn-1' },
    },
    {
      modelId: 'hosted-recommended',
      modelName: 'hosted-recommended',
      vendor: 'OpenAi',
      modelSubscriptionType: 'UiPathOwned',
      isRecommended: true,
    },
  ];

  it('keeps the Recommended chip inside the Recommended section, not just on a BYO row', async () => {
    const user = userEvent.setup();
    renderPicker(<ModelPicker groupBy="subscription" models={byoRecommended} />);
    await user.click(screen.getByRole('button', { expanded: false }));

    const byoRow = screen.getByRole('option', { name: /byo-recommended/ });
    const hostedRow = screen.getByRole('option', { name: /hosted-recommended/ });

    expect(within(byoRow).getByText('Recommended')).toBeInTheDocument();
    expect(within(hostedRow).getByText('Recommended')).toBeInTheDocument();
  });

  it('shows the same chips whichever grouping is active', async () => {
    const user = userEvent.setup();
    renderPicker(<ModelPicker groupBy="vendor" models={byoRecommended} />);
    await user.click(screen.getByRole('button', { expanded: false }));

    const hostedRow = screen.getByRole('option', { name: /hosted-recommended/ });
    expect(within(hostedRow).getByText('Recommended')).toBeInTheDocument();
  });
});

/*
 * Added in the wind port (no apollo-react counterpart).
 *
 * Hosts that already label the field — a guardrail parameter row, a table
 * cell — previously had to hide the picker's own label with CSS.
 */
describe('<ModelPicker> label suppression', () => {
  it('renders no visible label when label is null, keeping an accessible name', () => {
    renderPicker(<ModelPicker ariaLabel="Judge model" label={null} models={MODELS} />);

    expect(screen.queryByText('Model')).toBeNull();
    expect(screen.getByRole('button', { name: 'Judge model' })).toBeInTheDocument();
  });

  it('falls back to the default accessible name when none is given', () => {
    renderPicker(<ModelPicker label={null} models={MODELS} />);

    expect(screen.getByRole('button', { name: 'Model' })).toBeInTheDocument();
  });
});

/*
 * Added in the wind port (no apollo-react counterpart).
 *
 * The chips are inline-flex Badges. Wrapped in a *block* span they generate a
 * line box of the inherited line-height (~21px) around a 16px chip and get
 * baseline-aligned inside it, so `items-center` on the row centres the wrapper
 * rather than the chip and every chip floats ~3px above the model name. The
 * wrappers must stay flex containers; these guard the class that fixes it.
 */
describe('<ModelPicker> chip alignment', () => {
  const tagged: DiscoveryModel[] = [
    {
      modelId: 'gpt-4o',
      modelName: 'gpt-4o',
      vendor: 'OpenAi',
      modelSubscriptionType: 'UiPathOwned',
      isPreview: true,
    },
  ];

  it('wraps a row chip in a flex container, not a block span', async () => {
    const user = userEvent.setup();
    renderPicker(<ModelPicker groupBy="vendor" models={tagged} />);
    await user.click(screen.getByRole('button', { expanded: false }));

    const chip = within(screen.getByRole('option', { name: /gpt-4o/ })).getByText('Preview');
    const wrapper = chip.closest('[data-slot="model-picker-tag"]')?.parentElement;
    expect(wrapper).toHaveClass('flex', 'items-center');
  });

  it('wraps a trigger chip in a flex container, not a block span', () => {
    renderPicker(<ModelPicker models={tagged} value="gpt-4o" />);

    const trigger = screen.getByRole('button', { expanded: false });
    const chip = within(trigger).getByText('Preview');
    const wrapper = chip.closest('[data-slot="model-picker-tag"]')?.parentElement;
    expect(wrapper).toHaveClass('flex', 'items-center');
  });
});

/*
 * Added in the wind port (no apollo-react counterpart).
 *
 * The trigger is a field, not a button: it borrows `Input`'s chrome verbatim so
 * it sits flush with the text inputs around it. These guard the classes that
 * distinguish the two — an opaque fill or a taller box is exactly the drift
 * that made it read as a button before.
 */
describe('<ModelPicker> trigger chrome', () => {
  it('wears the same chrome as the other dropdowns', () => {
    renderPicker(<ModelPicker models={MODELS} />);

    const trigger = screen.getByRole('button', { expanded: false });
    expect(trigger).toHaveClass(
      'border-input',
      'bg-transparent',
      'min-h-9',
      'px-3',
      'py-1',
      // Flat `text-sm`, not Input's `text-base md:text-sm`: the picker often
      // lives in a narrow side panel, where the responsive pair resolves to
      // 16px and the model name towers over every other field on the page.
      'text-sm'
    );
    // Not the button treatment it had before.
    expect(trigger).not.toHaveClass('bg-surface', 'min-h-11', 'py-2', 'text-base');
  });

  it('rings on pointer focus, not only keyboard focus', () => {
    renderPicker(<ModelPicker models={MODELS} />);

    // `focus-visible` alone never fires for a mouse click, so the field
    // showed no ring when clicked. SelectTrigger carries both; so must this.
    const trigger = screen.getByRole('button', { expanded: false });
    expect(trigger).toHaveClass('focus:ring-2', 'focus:ring-ring');
    expect(trigger).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-ring');
  });

  it('shows a pointer cursor on the collapsed field and on the grouping toggle', async () => {
    const user = userEvent.setup();
    // Tailwind's preflight gives buttons `cursor: default`, so every
    // interactive control has to opt in — same as the shared `Button`.
    renderPicker(<ModelPicker models={MODELS} />);

    const trigger = screen.getByRole('button', { expanded: false });
    expect(trigger).toHaveClass('cursor-pointer');

    await user.click(trigger);
    expect(screen.getByRole('button', { name: 'Category' })).toHaveClass('cursor-pointer');
    expect(screen.getByRole('button', { name: 'Provider' })).toHaveClass('cursor-pointer');
  });

  it('leaves the invalid state to aria-invalid, as Input does', () => {
    renderPicker(<ModelPicker invalid models={MODELS} />);

    const trigger = screen.getByRole('button', { expanded: false });
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveClass('aria-invalid:border-error');
    // No conditionally-applied error class — the attribute drives it.
    expect(trigger).not.toHaveClass('border-error');
  });
});

/*
 * Added in the wind port (no apollo-react counterpart).
 *
 * `secondary` resolves to `--surface-overlay`, which is exactly what
 * Input/Select/Combobox paint fields with under the future themes — so a
 * neutral chip sitting on a field was guaranteed to vanish into its own
 * ground. Tinting from the foreground instead contrasts with any surface.
 */
describe('<ModelPicker> chip legibility', () => {
  const costed: DiscoveryModel[] = [
    {
      modelId: 'gpt-4o',
      modelName: 'gpt-4o',
      vendor: 'OpenAi',
      modelSubscriptionType: 'UiPathOwned',
      modelDetails: { costDetails: { flatCosts: { inputTokenCost: 50 } } },
    },
  ];

  it('tints the neutral chip from the foreground, never from a surface token', () => {
    renderPicker(<ModelPicker models={costed} value="gpt-4o" />);

    const chip = within(screen.getByRole('button', { expanded: false })).getByText('Basic');
    const pill = chip.closest('[data-slot="model-picker-tag"]');
    expect(pill).toHaveClass('bg-foreground/10');
    // Not a surface fill, which is what collided with the field ground.
    expect(pill).not.toHaveClass('bg-secondary');
    // And no border — the tint alone carries it.
    expect(pill).toHaveClass('border-transparent');
  });

  it('leaves the semantic chips on their own fills', async () => {
    const user = userEvent.setup();
    renderPicker(<ModelPicker groupBy="vendor" models={[{ ...costed[0], isPreview: true }]} />);
    await user.click(screen.getByRole('button', { expanded: false }));

    const preview = within(screen.getByRole('listbox')).getByText('Preview');
    const pill = preview.closest('[data-slot="model-picker-tag"]');
    expect(pill).not.toHaveClass('bg-foreground/10');
    expect(pill).toHaveClass('border-transparent');
  });
});

/*
 * Added in the wind port (no apollo-react counterpart).
 *
 * `Badge` ships a `hover:bg-<fill>/80` on every variant, for the case where a
 * badge is a clickable filter. These chips are labels, so that hover is a
 * false affordance — and on the neutral chip a harmful one, since the hover
 * class is a separate tailwind-merge key that survives the fill override and
 * restores the surface colour the chip must not use.
 */
describe('<ModelPicker> chips are inert', () => {
  it('does not react to the pointer', () => {
    renderPicker(<ModelPicker models={MODELS} value="anthropic.claude-sonnet-4-6" />);

    const pill = within(screen.getByRole('button', { expanded: false }))
      .getByText('Recommended')
      .closest('[data-slot="model-picker-tag"]');
    expect(pill).toHaveClass('pointer-events-none');
  });
});

/*
 * Guards the one risk in making the chips inert: the tooltip lives on a
 * wrapping trigger, so the pointer must still reach it through the chip.
 */
describe('<ModelPicker> chip tooltips', () => {
  it('still opens a chip tooltip even though the chip ignores the pointer', async () => {
    const user = userEvent.setup();
    renderPicker(<ModelPicker groupBy="vendor" models={MODELS} />);
    await user.click(screen.getByRole('button', { expanded: false }));

    // Recommended carries a tooltip; the chip itself is pointer-events-none.
    const chip = within(screen.getByRole('listbox')).getAllByText('Recommended')[0];
    await user.hover(chip.closest('[data-slot="model-picker-tag"]')!.parentElement!);

    expect(
      await screen.findAllByText('Based on evaluation runs for this product')
    ).not.toHaveLength(0);
  });
});

/*
 * Review follow-ups (PR #1201).
 *
 * Each of these guards a claim the component makes about itself: that every
 * user-facing string goes through `labels`, that requiredness is announced
 * somewhere real, that the listbox keyboard model isn't broken by a stray tab
 * stop, and that composing the exported trigger still opens the popup.
 */
describe('<ModelPicker> review follow-ups', () => {
  const withContext: DiscoveryModel[] = [
    {
      modelId: 'gpt-4o',
      modelName: 'gpt-4o',
      vendor: 'OpenAi',
      modelSubscriptionType: 'UiPathOwned',
      modelDetails: { contextWindowTokens: 128_000 },
    },
  ];

  it('renders the context window through labels, not a hardcoded formatter', async () => {
    const user = userEvent.setup();
    renderPicker(
      <ModelPicker labels={{ contextWindow: (n) => `ctx:${n}` }} models={withContext} />
    );
    await user.click(screen.getByRole('button', { expanded: false }));

    expect(screen.getByText('ctx:128000')).toBeInTheDocument();
    expect(screen.queryByText('128K context')).toBeNull();
  });

  it('still formats the context window in English when no label is supplied', async () => {
    const user = userEvent.setup();
    renderPicker(<ModelPicker models={withContext} />);
    await user.click(screen.getByRole('button', { expanded: false }));

    expect(screen.getByText('128K context')).toBeInTheDocument();
  });

  it('announces requiredness on the search combobox, not the trigger', async () => {
    const user = userEvent.setup();
    renderPicker(<ModelPicker models={MODELS} required />);

    // `aria-required` is not valid on a button role, so the trigger must not
    // carry it however the field is documented.
    expect(screen.getByRole('button', { expanded: false })).not.toHaveAttribute('aria-required');

    await user.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-required', 'true');
  });

  it('leaves aria-required off the combobox when the field is optional', async () => {
    const user = userEvent.setup();
    renderPicker(<ModelPicker models={MODELS} />);
    await user.click(screen.getByRole('button', { expanded: false }));

    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-required');
  });

  it('keeps group headers out of the tab order', async () => {
    const user = userEvent.setup();
    renderPicker(<ModelPicker groupBy="subscription" models={MODELS} />);
    await user.click(screen.getByRole('button', { expanded: false }));

    // A <button> inside role="listbox" is already an invalid child; a tabbable
    // one also hijacks Tab away from the activedescendant model.
    const headers = document.querySelectorAll('[data-slot="model-picker-group-header"]');
    expect(headers.length).toBeGreaterThan(0);
    for (const header of headers) {
      if (header.tagName === 'BUTTON') expect(header).toHaveAttribute('tabindex', '-1');
    }
  });

  it('collapses and expands the Custom Models section with the arrow keys', async () => {
    const user = userEvent.setup();
    // Category view lists BYO first, so the initial highlight sits on a BYO row.
    renderPicker(<ModelPicker groupBy="subscription" models={MODELS} />);
    await user.click(screen.getByRole('button', { expanded: false }));

    const before = screen.getAllByRole('option').length;
    expect(before).toBeGreaterThan(0);

    await user.keyboard('{ArrowLeft}');
    expect(screen.getAllByRole('option').length).toBeLessThan(before);

    // Re-expanding needs the highlight back on the section, which the
    // collapse moved off; header click is the pointer path, ArrowRight the
    // keyboard one once a BYO row is active again.
    await user.click(screen.getByText('Custom Models (BYO)'));
    expect(screen.getAllByRole('option')).toHaveLength(before);
  });

  it('does not collapse sections the renderers cannot collapse', async () => {
    const user = userEvent.setup();
    renderPicker(<ModelPicker groupBy="vendor" models={MODELS} />);
    await user.click(screen.getByRole('button', { expanded: false }));

    const before = screen.getAllByRole('option').length;
    // Provider view still lists BYO first; step onto a hosted row.
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowLeft}');
    // Vendor sections have no chevron; the key must not edit state the
    // grouped renderer ignores but the virtualized one would honour.
    expect(screen.getAllByRole('option')).toHaveLength(before);
  });

  it('moves the highlight off a row hidden by a collapse', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker(<ModelPicker groupBy="subscription" models={MODELS} onChange={onChange} />);
    await user.click(screen.getByRole('button', { expanded: false }));

    await user.keyboard('{ArrowLeft}');

    // activedescendant must name a rendered option, not the hidden BYO row…
    const activeId = screen.getByRole('combobox').getAttribute('aria-activedescendant');
    expect(activeId).toBeTruthy();
    expect(document.getElementById(activeId!)).toHaveAttribute('role', 'option');
    // …and Enter must select something the user can see.
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].modelSubscriptionType).toBe('UiPathOwned');
  });

  it('keeps row action buttons out of the tab order', async () => {
    const user = userEvent.setup();
    renderPicker(
      <ModelPicker canManageByo models={MODELS} onDeleteModel={vi.fn()} onEditModel={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { expanded: false }));

    const edit = screen.getAllByRole('button', { name: 'Edit configuration' })[0];
    const del = screen.getAllByRole('button', { name: 'Delete configuration' })[0];
    expect(edit).toHaveAttribute('tabindex', '-1');
    expect(del).toHaveAttribute('tabindex', '-1');
  });

  it('edits the active BYO row on Shift+Enter and asks to delete it on Delete', async () => {
    const user = userEvent.setup();
    const onEditModel = vi.fn();
    const onChange = vi.fn();
    renderPicker(
      <ModelPicker
        canManageByo
        groupBy="subscription"
        models={MODELS}
        onChange={onChange}
        onDeleteModel={vi.fn()}
        onEditModel={onEditModel}
      />
    );
    await user.click(screen.getByRole('button', { expanded: false }));

    // Initial highlight is the BYO row (Category view lists BYO first).
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(onEditModel).toHaveBeenCalledTimes(1);
    expect(onEditModel.mock.calls[0][0].modelId).toBe('byo-cigna-gpt-4o');
    expect(onChange).not.toHaveBeenCalled();

    await user.keyboard('{Delete}');
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
  });

  it('only claims Delete when the search field has nothing to delete', async () => {
    renderPicker(
      <ModelPicker canManageByo groupBy="subscription" models={MODELS} onDeleteModel={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    const search = screen.getByRole('combobox') as HTMLInputElement;

    // Caret before typed text: Delete is a forward-delete, the picker stays out.
    fireEvent.change(search, { target: { value: 'gp' } });
    search.setSelectionRange(0, 0);
    fireEvent.keyDown(search, { key: 'Delete' });
    expect(screen.queryByRole('alertdialog')).toBeNull();

    // Whitespace with the caret at the end: nothing left to delete, so it is
    // the row action. `filterModels` trims, so the BYO row is still active.
    fireEvent.change(search, { target: { value: '  ' } });
    search.setSelectionRange(2, 2);
    fireEvent.keyDown(search, { key: 'Delete' });
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
  });

  it('composes a consumer onClick with the one Radix injects', async () => {
    // Reviewed as a bug: `PickerTrigger` appears to overwrite Radix's injected
    // `onClick`. It doesn't. `asChild` renders through Radix's `Slot`, which
    // merges event handlers before the child is called, so the trigger only
    // ever receives one already-composed handler.
    const user = userEvent.setup();
    const spy = vi.fn();
    render(
      <Popover>
        <PopoverTrigger asChild>
          <PickerTrigger
            id="test-trigger"
            onClick={spy}
            open={false}
            placeholder="Pick"
            selected={null}
          />
        </PopoverTrigger>
        <PopoverContent>popup body</PopoverContent>
      </Popover>
    );

    await user.click(screen.getByRole('button'));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('popup body')).toBeInTheDocument();
  });

  it('keeps chip tooltip triggers out of the tab order', async () => {
    const user = userEvent.setup();
    renderPicker(<ModelPicker groupBy="vendor" models={MODELS} />);
    await user.click(screen.getByRole('button', { expanded: false }));

    // Recommended carries a tooltip, so its chip is wrapped in a trigger button.
    const chip = within(screen.getByRole('listbox')).getAllByText('Recommended')[0];
    const trigger = chip.closest('button');
    expect(trigger).not.toBeNull();
    expect(trigger).toHaveAttribute('tabindex', '-1');
  });

  it('publishes no activedescendant while the list is not rendered', async () => {
    const user = userEvent.setup();
    const { rerender } = renderPicker(<ModelPicker models={MODELS} />);
    await user.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-activedescendant');

    // A refetch that keeps the old catalog: list unmounts, pointer must go too.
    rerender(<ModelPicker loading models={MODELS} />);
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-activedescendant');

    rerender(<ModelPicker error={new Error('boom')} models={MODELS} />);
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-activedescendant');
  });

  it('resets the grouping when the groupBy prop changes after mount', async () => {
    const user = userEvent.setup();
    const { rerender } = renderPicker(<ModelPicker groupBy="subscription" models={MODELS} />);
    await user.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByText('Custom Models (BYO)')).toBeInTheDocument();

    rerender(<ModelPicker groupBy="vendor" models={MODELS} />);
    // Provider view keeps BYO first but replaces the lifecycle sections
    // (Recommended / Preview / More) with vendor sections.
    const headers = () =>
      [...document.querySelectorAll('[data-slot="model-picker-group-header"]')].map(
        (h) => h.textContent ?? ''
      );
    expect(headers().some((t) => /^Recommended/.test(t))).toBe(false);
    expect(headers().some((t) => /OpenAI|Anthropic/.test(t))).toBe(true);
  });

  it('never collapses a section when the group headers are hidden', async () => {
    const user = userEvent.setup();
    renderPicker(<ModelPicker groupBy="subscription" models={MODELS} showGroupHeaders={false} />);
    await user.click(screen.getByRole('button', { expanded: false }));

    const before = screen.getAllByRole('option').length;
    // The BYO row is active; without a header there is no expand control,
    // so the collapse shortcut must be inert rather than hide rows for good.
    await user.keyboard('{ArrowLeft}');
    expect(screen.getAllByRole('option')).toHaveLength(before);
  });

  it('publishes no activedescendant when every row is collapsed, and can reopen', async () => {
    const user = userEvent.setup();
    const byoOnly = MODELS.filter((m) => m.modelSubscriptionType === 'BYOMAdded');
    renderPicker(<ModelPicker groupBy="subscription" models={byoOnly} />);
    await user.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0);

    await user.keyboard('{ArrowLeft}');
    // All rows hidden: nothing rendered to point at.
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-activedescendant');

    // The keyboard path back must survive: the index still names the section.
    await user.keyboard('{ArrowRight}');
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-activedescendant');
  });

  it('refuses a second delete while the first is still in flight', async () => {
    const user = userEvent.setup();
    let release!: () => void;
    const onDeleteModel = vi.fn(
      () =>
        new Promise<void>((r) => {
          release = r;
        })
    );
    renderPicker(
      <ModelPicker
        canManageByo
        groupBy="subscription"
        models={MODELS}
        onDeleteModel={onDeleteModel}
      />
    );
    const openPopup = async () => {
      if (!screen.queryByRole('listbox'))
        await user.click(screen.getByRole('button', { expanded: false }));
    };

    // First delete: confirm, request hangs. Confirming closes the popup.
    await openPopup();
    await user.keyboard('{Delete}');
    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    expect(onDeleteModel).toHaveBeenCalledTimes(1);

    // The row is still listed; neither path may start a second request.
    await openPopup();
    await user.keyboard('{Delete}');
    expect(screen.queryByRole('alertdialog')).toBeNull();
    await user.click(screen.getAllByRole('button', { name: 'Delete configuration' })[0]);
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onDeleteModel).toHaveBeenCalledTimes(1);

    // Once it settles, deleting is possible again.
    release();
    await new Promise((r) => setTimeout(r, 0));
    await openPopup();
    // The row-button click above left focus on it; the shortcut lives on the search field.
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{Delete}');
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
  });

  it('builds selector-safe dom ids', async () => {
    const user = userEvent.setup();
    renderPicker(<ModelPicker models={withContext} />);
    await user.click(screen.getByRole('button', { expanded: false }));

    const listbox = screen.getByRole('listbox');
    // The whole id, not just the option half, has to survive querySelector.
    expect(() => document.querySelector(`#${listbox.id}`)).not.toThrow();
    expect(listbox.id).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

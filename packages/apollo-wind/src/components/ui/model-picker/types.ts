/**
 * The model shape the picker renders. It follows the LLM Gateway
 * `ModelDiscoveryResponse` DTO field-for-field so a host can hand Discovery
 * rows straight through, but the picker performs no request itself — how
 * the rows are fetched is the host's business.
 *
 * Kept intentionally permissive (string unions, optional fields) so the
 * picker survives backend additions without a coordinated release.
 */

export type ModelVendor =
  | 'OpenAi'
  | 'AzureOpenAi'
  | 'AnthropicClaude'
  | 'AwsBedrock'
  | 'VertexAi'
  | 'Custom'
  | string;

export type ModelSubscriptionType =
  | 'UiPathOwned'
  | 'BYOMReplacedLikeForLike'
  | 'BYOMReplacedAlternative'
  | 'BYOMAdded'
  | string;

export type ModelGeography =
  | 'EU'
  | 'CA'
  | 'US'
  | 'SI'
  | 'JA'
  | 'AU'
  | 'IN'
  | 'UK'
  | 'CH'
  | 'UAE'
  | 'SK'
  | 'GLOBAL'
  | string;

export type ModelType = 'RequestResponse' | 'Realtime' | string;

export interface DeprecationDetails {
  usageEndDate?: string;
  replacedBy?: string;
}

export interface ByomDetails {
  availableOperationCodes?: string[];
  integrationServiceConnectionId?: string;
  defaultModel?: string;
  customFieldMappings?: Record<string, string> | null;
  /**
   * Id of the `ByoProductLlmConfiguration` this model belongs to — the
   * `:id` route segment of the AI Trust Layer LLM-configurations edit
   * page. Served by Discovery as `byoConfigurationId` (UiPath/Arima#2659);
   * when absent, the picker's edit affordance falls back to the
   * configurations list page.
   */
  byoConfigurationId?: string;
}

/** Token costs in cents per million tokens (the gateway's unit). */
export interface ModelFlatCosts {
  inputTokenCost?: number;
  outputTokenCost?: number;
  cacheReadInputTokenCost?: number;
  cacheWriteInputTokenCost?: number;
}

export interface ModelTieredCost extends ModelFlatCosts {
  minimumTokens?: number;
  maximumTokens?: number;
}

export interface ModelCostDetails {
  /** `Flat` | `Tiered` */
  pricingType?: string;
  flatCosts?: ModelFlatCosts;
  tieredCosts?: ModelTieredCost[];
}

export interface ModelDetails {
  maxOutputTokens?: number;
  contextWindowTokens?: number;
  costDetails?: ModelCostDetails;
  shouldUseMaxCompletionTokens?: boolean;
  shouldSkipParallelToolCalls?: boolean;
  shouldSkipTemperature?: boolean;
  shouldSkipTopP?: boolean;
  shouldUseResponseApi?: boolean;
}

export interface RoutingDetails {
  geography?: ModelGeography;
  model?: string;
}

export interface DiscoveryModel {
  modelId: string;
  modelName: string;
  /**
   * Human-friendly display name (e.g. "Claude Sonnet 4.6"). Authored
   * centrally in the product's Model Hub configuration and merged into
   * the Discovery response server-side, exactly like `isRecommended`.
   * `undefined` means the backend has not rolled the field out yet; the
   * picker then renders the raw `modelName`. There is deliberately no
   * per-product rename prop.
   */
  displayName?: string;
  effectiveModel?: string | null;
  vendor: ModelVendor;
  modelFamily?: string;
  apiFlavor?: string;
  modelSubscriptionType?: ModelSubscriptionType;
  /**
   * Whether the product team has promoted this model. Authored
   * centrally in the product's Model Hub configuration and merged into
   * the Discovery response server-side — products should NOT fetch the
   * config themselves. `undefined` means the backend hasn't rolled the
   * field out yet; the picker then falls back to a local heuristic
   * (`UiPathOwned && !preview && !deprecating`).
   */
  isRecommended?: boolean;
  /**
   * AITL governance verdict: the requesting org's policy blocks this
   * model. The picker never renders blocked models — mirroring how the
   * platform's BFFs drop them from their catalogs.
   */
  isBlockedByPolicy?: boolean;
  isPreview?: boolean;
  /**
   * Interaction shape of the model (`RequestResponse` | `Realtime`).
   * The picker renders every modality it is given; a product that offers
   * text generation only passes `filter={isTextGenerationModel}`.
   */
  modelType?: ModelType;
  deprecationDetails?: DeprecationDetails | null;
  byomDetails?: ByomDetails | null;
  modelDetails?: ModelDetails;
  routingDetails?: RoutingDetails | null;
  /**
   * Optional connection metadata. Discovery doesn't surface this directly today
   * but BYO callers can hydrate it from `/api/byom` for richer rendering.
   */
  byoConnectionLabel?: string;
}

/**
 * Tags rendered as chips next to a model. Derived locally from the DTO
 * (`deriveModelTags`) — the API does not return chip strings.
 *
 * Open-ended on purpose: products can mint their own kinds via
 * `customTagsFor` (e.g. `'multimodal'`, `'on-prem'`). Built-in kinds
 * get an Apollo MUI chip variant out of the box; unknown kinds fall
 * back to the neutral gray `mini` chip unless overridden via
 * `ModelPickerProps.customTagVariants` or `ModelTag.variant`.
 */
export type ModelTagKind =
  | 'recommended'
  | 'preview'
  | 'deprecating'
  | 'substituted'
  | 'custom'
  | 'out-of-region'
  | 'thinking'
  | 'cost-basic'
  | 'cost-standard'
  | 'cost-premium'
  | string;

/**
 * Categorical cost tier. By default the picker stamps the matching pool
 * badge (`cost-basic` / `cost-standard` / `cost-premium`) on any model
 * that carries cost data, classified by `defaultCostTier`. A host that
 * wants different bins, or no cost chips, passes `badgesFor` — it
 * replaces the default entirely (return `[]` to suppress).
 */
export type CostTier = 'basic' | 'standard' | 'premium';

export interface ModelTag {
  kind: ModelTagKind;
  label: string;
  /** Optional tooltip shown on hover. */
  tooltip?: string;
  /**
   * Apollo MUI chip variant class to render this tag with. Built-in
   * kinds resolve to a default variant automatically (e.g.
   * `recommended` → `success-mini`). Use this for product-specific
   * kinds, or to override the default on a built-in kind for a single
   * tag. Falls back to `'mini'` (neutral gray) when omitted.
   */
  variant?: string;
}

/**
 * One section in the picker dropdown. The picker groups models by
 * subscription type by default; consumers can override via `groupBy`.
 */
export interface ModelGroup {
  key: string;
  label: string;
  hint?: string;
  models: DiscoveryModel[];
}

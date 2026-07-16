/**
 * Mirrors the LLM Gateway `ModelDiscoveryResponse` DTO returned by
 * `GET /api/discovery` (UiPath.LLMGateway.Web/Discovery/ModelDiscoveryResponse.cs).
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
   * Id of the BYO configuration this model belongs to — the `:id`
   * route segment of the AI Trust Layer LLM-configurations edit page.
   * When absent (older gateways), the picker's edit affordance falls
   * back to the configurations list page.
   */
  byoConfigurationId?: string;
}

export interface ModelCostDetails {
  inputTokenCost?: number;
  outputTokenCost?: number;
  currency?: string;
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
   * picker then falls back to the `friendlyNameFor` prop (if any) and
   * finally the raw `modelName`.
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
  isPreview?: boolean;
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
 * Categorical cost tier. NOT a built-in picker signal — cost chips are
 * a product decision, stamped via `customTagsFor`. The picker ships
 * `defaultCostTier` purely as an example classifier (used by the
 * agents product) that bins Discovery's
 * `modelDetails.costDetails.inputTokenCost`.
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

/**
 * Headers required by the Discovery endpoint. Caller controls these
 * because they're tenant-/product-specific and shouldn't be hardcoded
 * in a design system component.
 */
export interface DiscoveryRequestContext {
  /** Bearer token (no `Bearer ` prefix). */
  token: string;
  /** Override the gateway base URL (defaults to same-origin). */
  baseUrl?: string;
  /** X-UiPath-Internal-AccountId */
  accountId: string;
  /** X-UiPath-Internal-TenantId */
  tenantId: string;
  /** X-UiPath-LlmGateway-RequestingProduct */
  requestingProduct: string;
  /** X-UiPath-LlmGateway-RequestingFeature */
  requestingFeature: string;
  /** X-UiPath-LlmGateway-OperationCode (optional, filters BYO configs). */
  operationCode?: string;
  /**
   * X-UiPath-FolderKey — sent when the picker is scoped to a specific
   * folder. Gated behind a BYOM feature flag in the host app.
   */
  folderKey?: string;
  /** X-UiPath-LlmGateway-FromDedicatedCloud */
  fromDedicatedCloud?: boolean;
  /** Default true. When false, returns models filtered out by governance/region too. */
  onlyAvailableModels?: boolean;
}

/** A provider the user can bring a model from. */
export interface ByoProvider {
  id: string;
  name: string;
}

/** An authentication type the provider's connector offers, e.g. API key or client credentials. */
export interface ByoAuthType {
  value: string;
  label: string;
}

/** One credential field of a provider's connection form. */
export interface ByoFormField {
  key: string;
  label: string;
  /** Rendered as a masked input. */
  secret: boolean;
  required: boolean;
  /** Optional settings shown under "More settings". */
  advanced: boolean;
  /** The authentication type the field belongs to; `null` for every type. */
  group: string | null;
  defaultValue: string;
  placeholder: string;
  hint: string;
}

export interface ByoConnectionForm {
  authTypes: ByoAuthType[];
  defaultAuthType: string | null;
  fields: ByoFormField[];
}

export interface ByoFolder {
  id: string;
  label: string;
}

/** A saved connection to a provider. */
export interface ByoConnection {
  id: string;
  providerId: string;
  name: string;
  folderId: string;
}

export interface ByoProviderModel {
  id: string;
  /** Short trailing text on the row, e.g. the inference profile in use. */
  note?: string;
  /** Short tag for a model that cannot be used, e.g. "Embedding model". */
  short?: string;
  /** Why the model cannot be used; set for incompatible models only. */
  reason?: string;
}

export interface ByoProviderModels {
  compatible: ByoProviderModel[];
  incompatible: ByoProviderModel[];
}

/**
 * A refusal, shown in the dialog until the user changes something.
 * `title` names what failed, `message` is the provider's own text,
 * `detail` the raw response behind "Show full response".
 */
export interface ByoFailure {
  title: string;
  message?: string;
  detail?: string;
}

export type ByoResult<T> = { ok: true; value: T } | { ok: false; failure: ByoFailure };

export interface ByoDialogContext {
  providers: ByoProvider[];
  connections: ByoConnection[];
  folders: ByoFolder[];
  defaultFolderId: string | null;
  /** Names already in the user's model list, compared case-insensitively. */
  takenModelNames: string[];
}

export interface ByoConnectRequest {
  providerId: string;
  form: ByoConnectionForm;
  authType: string | null;
  values: Record<string, string>;
  name: string;
  folderId: string;
}

export interface ByoAddRequest {
  providerId: string;
  connection: ByoConnection;
  modelId: string;
  name: string;
}

export interface ByoAddedModel {
  name: string;
  modelId: string;
  connectionId: string;
  folderId: string;
  /** How long the test call took. */
  latencyMs: number;
}

/**
 * The calls the dialog makes. The dialog renders and sequences them; the host
 * owns how they reach Integration Service and the LLM Gateway.
 */
export interface ByoModelDialogApi {
  loadContext: () => Promise<ByoResult<ByoDialogContext>>;
  loadForm: (providerId: string, folderId: string | null) => Promise<ByoResult<ByoConnectionForm>>;
  connect: (request: ByoConnectRequest) => Promise<ByoResult<ByoConnection>>;
  listModels: (
    providerId: string,
    connection: ByoConnection
  ) => Promise<ByoResult<ByoProviderModels>>;
  /** Tests the model through the connection and, if it passes, adds it to the user's model list. */
  testAndAdd: (request: ByoAddRequest) => Promise<ByoResult<ByoAddedModel>>;
}

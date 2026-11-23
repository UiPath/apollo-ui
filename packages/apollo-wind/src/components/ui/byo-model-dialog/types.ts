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
  /** The values the field takes, rendered as a dropdown; omitted for a free-text field. */
  options?: ByoFieldOption[];
}

/** One value a dropdown field offers. */
export interface ByoFieldOption {
  value: string;
  label: string;
}

export interface ByoConnectionForm {
  authTypes: ByoAuthType[];
  defaultAuthType: string | null;
  fields: ByoFormField[];
}

/**
 * A saved connection's current settings, to fill its edit form.
 * Secret values are never included: a secret left blank keeps its current value.
 */
export interface ByoConnectionValues {
  authType: string | null;
  values: Record<string, string>;
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

/**
 * What using a saved connection here changes in it, which the user agrees to first.
 * The host words it: the dialog shows it under the connection.
 */
export interface ByoConnectionChange {
  title: string;
  message: string;
  /** The checkbox the user ticks to agree to the change. */
  agreement: string;
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
 * `detail` the raw response behind "Show LLM response". When there is a
 * `detail`, the dialog shows it instead of `message`.
 */
export interface ByoFailure {
  title: string;
  message?: string;
  detail?: string;
}

export type ByoResult<T> = { ok: true; value: T } | { ok: false; failure: ByoFailure };

/** An API the model is called through, e.g. OpenAI Responses. */
export interface ByoApiType {
  value: string;
  label: string;
}

/** A UiPath model the user's own model can stand in for, under the UiPath model's name. */
export interface ByoReplaceableModel {
  name: string;
  /** The date the UiPath model retires on (`YYYY-MM-DD`); set only for a model being retired. */
  retiresOn?: string;
  /** Already replaced by one of the user's models, so it cannot be replaced again. */
  replaced: boolean;
}

export interface ByoDialogContext {
  providers: ByoProvider[];
  connections: ByoConnection[];
  folders: ByoFolder[];
  defaultFolderId: string | null;
  /** Names already in the user's model list, compared case-insensitively. */
  takenModelNames: string[];
  /** UiPath models the user's model can replace. */
  replaceableModels: ByoReplaceableModel[];
  /** Whether a model can be added under a name of the user's own. */
  allowsNewNames: boolean;
  /** UiPath model names, which a name of the user's own cannot take. Compared case-insensitively. */
  reservedModelNames: string[];
}

/** Which saved model the dialog edits: the host knows it from its model list. */
export interface ByoEditTarget {
  configurationId: string;
  /** The model's name in the user's model list. */
  name: string;
}

/** A saved model as the edit form starts from. */
export interface ByoModelToEdit {
  configurationId: string;
  providerId: string;
  connectionId: string;
  modelId: string;
  name: string;
  /** The UiPath model it replaces, whose name `name` then is; `null` for a name of the user's own. */
  replaces: string | null;
  /** `null` when the saved model names none. */
  apiType: string | null;
}

export interface ByoConnectRequest {
  providerId: string;
  form: ByoConnectionForm;
  authType: string | null;
  values: Record<string, string>;
  name: string;
  folderId: string;
  /** The saved connection being edited; omitted when creating a connection. */
  existing?: ByoConnection;
}

export interface ByoSaveRequest {
  providerId: string;
  connection: ByoConnection;
  modelId: string;
  name: string;
  /** The UiPath model it replaces, whose name `name` then is; `null` for a name of the user's own. */
  replaces: string | null;
  apiType: string;
  /** The saved model being edited; omitted when adding a model. */
  editing?: ByoModelToEdit;
}

export interface ByoSavedModel {
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
  /** Reads the saved model the dialog was opened to edit. */
  loadModel: (target: ByoEditTarget) => Promise<ByoResult<ByoModelToEdit>>;
  loadForm: (providerId: string, folderId: string | null) => Promise<ByoResult<ByoConnectionForm>>;
  /** Reads a saved connection's current settings for its edit form. */
  loadConnectionValues: (
    providerId: string,
    connection: ByoConnection
  ) => Promise<ByoResult<ByoConnectionValues>>;
  /** Creates a connection, or updates `existing` when one is given. */
  connect: (request: ByoConnectRequest) => Promise<ByoResult<ByoConnection>>;
  listModels: (
    providerId: string,
    connection: ByoConnection
  ) => Promise<ByoResult<ByoProviderModels>>;
  /**
   * What using `connection` here would change in it, or `null` when it can be used as it is.
   * Asked before its models are listed; a host that never changes a connection leaves it out.
   */
  checkConnection?: (
    providerId: string,
    connection: ByoConnection
  ) => Promise<ByoResult<ByoConnectionChange | null>>;
  /** Makes the change `checkConnection` described, once the user has agreed to it. */
  applyConnectionChange?: (
    providerId: string,
    connection: ByoConnection
  ) => Promise<ByoResult<ByoConnection>>;
  /**
   * The API types the provider can call the model through, most suitable first: replacing the
   * UiPath model `replaces`, or under a name of the user's own when it is `null`. Answers from
   * what `loadContext` read.
   */
  apiTypes: (providerId: string, replaces: string | null) => ByoApiType[];
  /**
   * Tests the model through the connection and, if it passes, saves it:
   * adds it to the user's model list, or updates `editing` when one is given.
   */
  testAndSave: (request: ByoSaveRequest) => Promise<ByoResult<ByoSavedModel>>;
}

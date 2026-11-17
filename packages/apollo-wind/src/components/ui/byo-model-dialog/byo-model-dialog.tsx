import {
  AlertCircle,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  KeyRound,
} from 'lucide-react';
import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { PortalContainerOverride } from '@/components/ui/portal-container';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib';
import { type ByoModelDialogLabels, resolveByoModelDialogLabels } from './labels';
import type {
  ByoConnection,
  ByoConnectionForm,
  ByoDialogContext,
  ByoEditTarget,
  ByoFailure,
  ByoFormField,
  ByoModelDialogApi,
  ByoModelToEdit,
  ByoProviderModel,
  ByoProviderModels,
  ByoSavedModel,
} from './types';

export interface ByoModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  api: ByoModelDialogApi;
  /** Called once the model passed its test and was saved. The dialog closes itself afterwards. */
  onSaved: (model: ByoSavedModel) => Promise<void> | void;
  /** A saved model to edit. Without it the dialog adds a new model. */
  editing?: ByoEditTarget;
  labels?: Partial<ByoModelDialogLabels>;
  /** Where the dialog portals to; defaults to the nearest `PortalContainerProvider`. */
  container?: PortalContainerOverride;
}

/**
 * "Use your own model": pick a provider, reuse a saved connection or create
 * one inline from the provider's credentials, pick a model, name it, then test
 * and add it. A saved connection can be edited in place. With `editing`, the
 * same steps start from a saved model and save the changes to it.
 * Every call goes through `api`.
 */
export function ByoModelDialog({ open, onOpenChange, ...rest }: ByoModelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Mounted only while open, so every opening starts clean. */}
      {open && <DialogBody {...rest} onClose={() => onOpenChange(false)} />}
    </Dialog>
  );
}

const NEW = '__new__';
const NO_FORM: FormState = {
  status: 'idle',
  form: { authTypes: [], defaultAuthType: null, fields: [] },
};
const NO_MODELS: ModelsState = { status: 'idle', models: { compatible: [], incompatible: [] } };

type FormState =
  | { status: 'idle' | 'loading' | 'ok'; form: ByoConnectionForm }
  | { status: 'error'; form: ByoConnectionForm; failure: ByoFailure };
type ModelsState = { status: 'idle' | 'loading' | 'ok' | 'error'; models: ByoProviderModels };
type Attempt<T> =
  | { status: 'idle' | 'running' }
  | { status: 'ok'; value: T }
  | { status: 'error'; failure: ByoFailure };
/** What Connect did: created a connection, or updated the saved one being edited. */
interface ConnectOutcome {
  connection: ByoConnection;
  updated: boolean;
}

/** "OpenAI – personal", or "OpenAI – personal 2" if that one is taken. */
function defaultConnectionName(providerName: string, connections: ByoConnection[]) {
  const base = `${providerName} – personal`;
  const taken = new Set(connections.map((c) => c.name.toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  let n = 2;
  while (taken.has(`${base} ${n}`.toLowerCase())) n += 1;
  return `${base} ${n}`;
}

const shownFields = (form: ByoConnectionForm, authType: string | null) =>
  form.fields.filter((f) => !f.group || f.group === authType);

const defaultsOf = (form: ByoConnectionForm) =>
  Object.fromEntries(form.fields.filter((f) => f.defaultValue).map((f) => [f.key, f.defaultValue]));

interface DialogBodyProps extends Omit<ByoModelDialogProps, 'open' | 'onOpenChange'> {
  onClose: () => void;
}

function DialogBody({
  api: apiProp,
  onSaved,
  editing,
  labels: labelOverrides,
  container,
  onClose,
}: DialogBodyProps) {
  const labels = resolveByoModelDialogLabels(labelOverrides);
  // The body mounts once per opening, so its calls and the model being edited are fixed for its
  // lifetime: a host that recreates `api` while the dialog is open does not reload it.
  const [api] = React.useState(apiProp);
  const [editTarget] = React.useState(editing);

  // A provider or connection switch, or the dialog closing, bumps this; each
  // call drops its result when it changed while the call was in flight.
  const generation = React.useRef(0);
  // The connector form depends only on the provider, so it has its own counter: switching
  // connection must not drop a form that is still loading.
  const formLoad = React.useRef(0);
  React.useEffect(
    () => () => {
      generation.current += 1;
      formLoad.current += 1;
    },
    []
  );

  const [context, setContext] = React.useState<Attempt<ByoDialogContext>>({ status: 'running' });
  const [connections, setConnections] = React.useState<ByoConnection[]>([]);
  const [modelToEdit, setModelToEdit] = React.useState<ByoModelToEdit | null>(null);

  const [providerId, setProviderId] = React.useState('');
  const [connectionChoice, setConnectionChoice] = React.useState(NEW);
  const [connName, setConnName] = React.useState('');
  const [folderId, setFolderId] = React.useState('');
  const [formState, setFormState] = React.useState<FormState>(NO_FORM);
  const [authType, setAuthType] = React.useState<string | null>(null);
  // The authentication type of the connection being edited, whose secrets it already holds.
  const [savedAuthType, setSavedAuthType] = React.useState<string | null>(null);
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [editingConnection, setEditingConnection] = React.useState(false);
  const [loadingConnectionValues, setLoadingConnectionValues] = React.useState(false);
  const [connect, setConnect] = React.useState<Attempt<ConnectOutcome>>({ status: 'idle' });

  const [modelsState, setModelsState] = React.useState<ModelsState>(NO_MODELS);
  const [modelId, setModelId] = React.useState('');
  const [modelQuery, setModelQuery] = React.useState('');
  const [modelListOpen, setModelListOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [nameTouched, setNameTouched] = React.useState(false);
  const [test, setTest] = React.useState<Attempt<ByoSavedModel>>({ status: 'idle' });

  const ctx = context.status === 'ok' ? context.value : null;
  const providers = ctx?.providers ?? [];
  const folders = ctx?.folders ?? [];
  const folderLabel = (id: string) => folders.find((f) => f.id === id)?.label ?? id;

  const provider = providers.find((p) => p.id === providerId);
  const providerName = provider?.name ?? '';
  const providerConnections = connections.filter((c) => c.providerId === providerId);

  const form = formState.form;
  const isNew = connectionChoice === NEW;
  const connection = connections.find((c) => c.id === connectionChoice) ?? null;
  const connectOutcome = connect.status === 'ok' ? connect.value : null;
  // While its form is open, the connection is not usable yet.
  const connected = Boolean(connection) && !editingConnection;

  const loadModels = async (pid: string, conn: ByoConnection | null, gen: number) => {
    if (!conn) {
      setModelsState(NO_MODELS);
      return;
    }
    setModelsState({ ...NO_MODELS, status: 'loading' });
    try {
      const result = await api.listModels(pid, conn);
      if (gen !== generation.current) return;
      if (result.ok) {
        setModelsState({ status: 'ok', models: result.value });
      } else {
        setModelsState({ ...NO_MODELS, status: 'error' });
      }
    } catch {
      if (gen === generation.current) setModelsState({ ...NO_MODELS, status: 'error' });
    }
  };

  const loadForm = async (pid: string, folder: string) => {
    formLoad.current += 1;
    const load = formLoad.current;
    setFormState({ ...NO_FORM, status: 'loading' });
    setValues({});
    try {
      const result = await api.loadForm(pid, folder || null);
      if (load !== formLoad.current) return;
      if (!result.ok) {
        setFormState({ ...NO_FORM, status: 'error', failure: result.failure });
        return;
      }
      setFormState({ status: 'ok', form: result.value });
      setAuthType(result.value.defaultAuthType);
      setValues(defaultsOf(result.value));
    } catch (err) {
      if (load === formLoad.current)
        setFormState({ ...NO_FORM, status: 'error', failure: unexpected(err) });
    }
  };

  /** Empties the credentials form back to the connector's defaults. */
  const resetFormValues = () => {
    setAuthType(form.defaultAuthType);
    setValues(defaultsOf(form));
  };

  /** Fills every step from the saved model being edited. */
  const startFromSavedModel = (
    model: ByoModelToEdit,
    loaded: ByoDialogContext,
    defaultFolder: string
  ) => {
    const gen = generation.current;
    const savedConnection = loaded.connections.find((c) => c.id === model.connectionId) ?? null;
    const savedProvider = loaded.providers.find((p) => p.id === model.providerId);
    setModelToEdit(model);
    setProviderId(model.providerId);
    setConnectionChoice(savedConnection ? savedConnection.id : NEW);
    setConnName(defaultConnectionName(savedProvider?.name ?? model.providerId, loaded.connections));
    setModelId(model.modelId);
    setName(model.name);
    setNameTouched(true);
    loadModels(model.providerId, savedConnection, gen);
    loadForm(model.providerId, savedConnection?.folderId ?? defaultFolder);
  };

  // Runs once per opening: `api` and `editTarget` are fixed while the dialog is open.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the helpers it calls are recreated on every render
  React.useEffect(() => {
    const gen = generation.current;
    const load = async () => {
      const contextResult = await api.loadContext();
      if (gen !== generation.current) return;
      if (!contextResult.ok) {
        setContext({ status: 'error', failure: contextResult.failure });
        return;
      }
      const loaded = contextResult.value;

      let savedModel: ByoModelToEdit | null = null;
      if (editTarget) {
        const modelResult = await api.loadModel(editTarget);
        if (gen !== generation.current) return;
        if (!modelResult.ok) {
          setContext({ status: 'error', failure: modelResult.failure });
          return;
        }
        savedModel = modelResult.value;
      }

      const defaultFolder = loaded.defaultFolderId ?? loaded.folders[0]?.id ?? '';
      setContext({ status: 'ok', value: loaded });
      setConnections(loaded.connections);
      setFolderId(defaultFolder);
      if (savedModel) startFromSavedModel(savedModel, loaded, defaultFolder);
    };
    load().catch((err: unknown) => {
      if (gen === generation.current) setContext({ status: 'error', failure: unexpected(err) });
    });
  }, [api, editTarget]);

  const resetDownstream = () => {
    setModelQuery('');
    setModelListOpen(false);
    setModelId('');
    setName('');
    setNameTouched(false);
    setTest({ status: 'idle' });
  };

  const chooseProvider = (id: string) => {
    if (id === providerId) return;
    generation.current += 1;
    const gen = generation.current;
    const p = providers.find((candidate) => candidate.id === id);
    const existing = connections.filter((c) => c.providerId === id);
    setProviderId(id);
    setConnectionChoice(existing[0]?.id ?? NEW);
    setConnName(defaultConnectionName(p?.name ?? id, connections));
    setMoreOpen(false);
    setEditingConnection(false);
    setConnect({ status: 'idle' });
    resetDownstream();
    loadModels(id, existing[0] ?? null, gen);
    loadForm(id, folderId);
  };

  const chooseConnection = (id: string) => {
    generation.current += 1;
    setConnectionChoice(id);
    if (id === NEW) setConnName(defaultConnectionName(providerName, connections));
    setEditingConnection(false);
    setConnect({ status: 'idle' });
    resetFormValues();
    resetDownstream();
    loadModels(providerId, connections.find((c) => c.id === id) ?? null, generation.current);
  };

  // A form not filled with the connection's settings would clear the ones it does not show
  // when saved, so the edit stops; the failure stays shown and Edit connection reads again.
  // Starting the edit dropped any model list still loading, so the list loads again.
  const failConnectionEdit = (failure: ByoFailure) => {
    setEditingConnection(false);
    resetFormValues();
    setConnect({ status: 'error', failure });
    loadModels(providerId, connection, generation.current);
  };

  /** Opens the credentials form for the selected saved connection, filled with its current settings. */
  const startConnectionEdit = async () => {
    if (!connection) return;
    generation.current += 1;
    const gen = generation.current;
    setEditingConnection(true);
    setConnName(connection.name);
    setMoreOpen(false);
    setConnect({ status: 'idle' });
    setTest({ status: 'idle' });
    resetFormValues();
    setLoadingConnectionValues(true);
    try {
      const result = await api.loadConnectionValues(providerId, connection);
      if (gen !== generation.current) return;
      if (!result.ok) {
        failConnectionEdit(result.failure);
        return;
      }
      const saved = result.value.authType ?? form.defaultAuthType;
      setSavedAuthType(saved);
      setAuthType(saved);
      setValues({ ...defaultsOf(form), ...result.value.values });
    } catch (err) {
      if (gen === generation.current) failConnectionEdit(unexpected(err));
    } finally {
      if (gen === generation.current) setLoadingConnectionValues(false);
    }
  };

  const cancelConnectionEdit = () => {
    generation.current += 1;
    setEditingConnection(false);
    setLoadingConnectionValues(false);
    setConnect({ status: 'idle' });
    resetFormValues();
    loadModels(providerId, connection, generation.current);
  };

  const setValue = (key: string, v: string) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    if (connect.status === 'error') setConnect({ status: 'idle' });
  };

  const showConnectionForm = Boolean(provider) && (isNew || editingConnection);
  // An edited connection lives in its own folder; only a new one picks a folder.
  const formFolderId = editingConnection && connection ? connection.folderId : folderId;
  // A secret left blank keeps the connection's current value.
  // A secret the edited connection holds keeps its value when left blank; a secret of another
  // authentication type has none to keep.
  const keepsCurrentValue = (f: ByoFormField) =>
    editingConnection && f.secret && (!f.group || f.group === savedAuthType);
  const isRequired = (f: ByoFormField) => f.required && !keepsCurrentValue(f);
  const fields = shownFields(form, authType);
  const mainFields = fields.filter((f) => !f.advanced);
  const advancedFields = fields.filter((f) => f.advanced);
  const requiredFilled =
    formState.status === 'ok' &&
    fields.filter(isRequired).every((f) => (values[f.key] ?? '').trim());
  const otherConnections = editingConnection
    ? connections.filter((c) => c.id !== connection?.id)
    : connections;
  const connNameClash =
    showConnectionForm &&
    otherConnections.some((c) => c.name.toLowerCase() === connName.trim().toLowerCase());
  const keyLocked = connect.status === 'running' || loadingConnectionValues;
  const canConnect =
    showConnectionForm &&
    requiredFilled &&
    Boolean(connName.trim()) &&
    Boolean(formFolderId) &&
    !connNameClash &&
    !keyLocked;

  /** Creates the connection, or saves the changes to the one being edited. */
  const runConnect = async () => {
    if (!canConnect) return;
    const gen = generation.current;
    const existing = editingConnection && connection ? connection : undefined;
    setConnect({ status: 'running' });
    let result: Awaited<ReturnType<ByoModelDialogApi['connect']>>;
    try {
      result = await api.connect({
        providerId,
        form,
        authType,
        values,
        name: connName.trim(),
        folderId: formFolderId,
        existing,
      });
    } catch (err) {
      result = { ok: false, failure: unexpected(err) };
    }
    if (gen !== generation.current) return;
    if (!result.ok) {
      setConnect({ status: 'error', failure: result.failure });
      return;
    }

    // The connection joins (or replaces its entry in) the saved ones, so the form collapses into the dropdown.
    const saved = result.value;
    if (existing) {
      setConnections((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
    } else {
      setConnections((prev) => [...prev, saved]);
    }
    setConnectionChoice(saved.id);
    setEditingConnection(false);
    resetFormValues();
    setConnect({ status: 'ok', value: { connection: saved, updated: Boolean(existing) } });
    loadModels(providerId, saved, gen);
  };

  const pickModel = (id: string) => {
    setModelId(id);
    if (!nameTouched) setName(id);
    setTest({ status: 'idle' });
  };

  const takenNames = new Set((ctx?.takenModelNames ?? []).map((n) => n.toLowerCase()));
  // The edited model's own name is not a clash.
  if (editTarget) takenNames.delete(editTarget.name.toLowerCase());
  const nameClash = Boolean(name.trim()) && takenNames.has(name.trim().toLowerCase());
  const busy = keyLocked || test.status === 'running' || test.status === 'ok';
  const hasModel = Boolean(modelId.trim());
  const readyToSave = connected && hasModel && Boolean(name.trim()) && !nameClash;

  /** Tests the model, then adds it or saves the changes to the one being edited. */
  const runTest = async () => {
    if (!connection || !readyToSave || busy) return;
    const gen = generation.current;
    setTest({ status: 'running' });
    let result: Awaited<ReturnType<ByoModelDialogApi['testAndSave']>>;
    try {
      result = await api.testAndSave({
        providerId,
        connection,
        modelId: modelId.trim(),
        name: name.trim(),
        editing: modelToEdit ?? undefined,
      });
    } catch (err) {
      result = { ok: false, failure: unexpected(err) };
    }
    const stillOpen = gen === generation.current;
    if (!result.ok) {
      if (stillOpen) setTest({ status: 'error', failure: result.failure });
      return;
    }

    // The model is saved, so the dialog's work is done: close it now rather than wait on
    // the host, whose refresh can be slow. The host hears about the model even when the
    // dialog was closed meanwhile.
    if (stillOpen) onClose();
    try {
      await onSaved(result.value);
    } catch (err) {
      // The save itself succeeded; what the host does next is the host's to report.
      console.error('ByoModelDialog: onSaved failed after the model was saved', err);
    }
  };

  const models = modelsState.models;
  const q = modelQuery.trim().toLowerCase();
  const shownCompatible = models.compatible.filter((m) => m.id.toLowerCase().includes(q));
  const shownIncompatible = models.incompatible.filter((m) => m.id.toLowerCase().includes(q));
  // A provider that lists no models gets a plain field.
  const freeTextModel =
    modelsState.status === 'ok' && models.compatible.length + models.incompatible.length === 0;

  const modelTriggerRef = React.useRef<HTMLButtonElement & HTMLInputElement>(null);
  const modelSearchRef = React.useRef<HTMLInputElement>(null);
  // After Connect, the model field is the next step; it can take focus once the models are listed.
  React.useEffect(() => {
    if (connect.status === 'ok' && modelsState.status === 'ok') modelTriggerRef.current?.focus();
  }, [connect.status, modelsState.status]);

  const fieldInput = (f: ByoFormField, main: boolean) => {
    return (
      <Field
        key={f.key}
        id={`byo-${f.key}`}
        label={f.label}
        hint={keepsCurrentValue(f) ? labels.secretKeepHint : f.hint}
        required={isRequired(f)}
      >
        <Input
          id={`byo-${f.key}`}
          type={f.secret ? 'password' : 'text'}
          autoComplete="off"
          spellCheck={false}
          placeholder={f.placeholder}
          value={values[f.key] ?? ''}
          disabled={keyLocked}
          aria-required={isRequired(f) || undefined}
          onChange={(e) => setValue(f.key, e.target.value)}
          onKeyDown={
            main
              ? (e) => {
                  if (e.key === 'Enter') runConnect();
                }
              : undefined
          }
          className={f.secret ? 'font-mono' : undefined}
        />
      </Field>
    );
  };

  const modelTriggerText = (() => {
    if (!connected) return labels.modelNeedsConnection(providerName);
    if (modelsState.status === 'loading') return labels.modelsLoading(providerName);
    if (modelsState.status === 'error') return labels.modelsFailed(providerName);
    return labels.modelSelect(models.compatible.length);
  })();

  const connectMessage = (() => {
    if (!connectOutcome || editingConnection) return null;
    if (connectionChoice !== connectOutcome.connection.id) return null;
    if (connectOutcome.updated) return labels.connectionUpdated;
    return labels.connectedIn(folderLabel(connectOutcome.connection.folderId));
  })();

  let failure: ByoFailure | null = null;
  if (connect.status === 'error') failure = connect.failure;
  else if (test.status === 'error') failure = test.failure;

  const title = editTarget ? labels.editTitle : labels.title;
  const description = editTarget ? labels.editDescription : labels.description;
  const saveLabel = editTarget ? labels.testAndSave : labels.testAndAdd;
  const saveHint = editTarget ? labels.testAndSaveHint : labels.testAndAddHint;

  return (
    <DialogContent
      container={container}
      strings={{ close: labels.close }}
      className="!flex h-[min(780px,90vh)] !max-w-[600px] flex-col gap-0 overflow-hidden p-0"
    >
      <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden px-6 pb-4">
        {context.status === 'running' && (
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <Spinner size="sm" /> {editTarget ? labels.loadingModel : labels.loadingContext}
          </div>
        )}
        {context.status === 'error' && <FailureAlert failure={context.failure} labels={labels} />}

        {ctx && (
          <>
            <Step n={1} title={labels.providerStep} done={Boolean(provider)}>
              <Select
                value={providerId || undefined}
                onValueChange={chooseProvider}
                disabled={busy}
              >
                <SelectTrigger className="w-full" aria-label={labels.providerStep}>
                  <SelectValue placeholder={labels.providerPlaceholder} />
                </SelectTrigger>
                <SelectContent container={container}>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Step>

            <Step n={2} title={labels.connectionStep} done={connected} disabled={!provider}>
              <div className="flex flex-col gap-3">
                {!provider && (
                  <Input
                    disabled
                    aria-label={labels.connectionStep}
                    placeholder={labels.connectionNeedsProvider}
                  />
                )}
                {provider && providerConnections.length > 0 && (
                  <Select value={connectionChoice} onValueChange={chooseConnection} disabled={busy}>
                    <SelectTrigger className="w-full" aria-label={labels.connectionStep}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent container={container}>
                      {providerConnections.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {labels.savedConnection(c.name, folderLabel(c.folderId))}
                        </SelectItem>
                      ))}
                      <SelectItem value={NEW}>{labels.newConnection}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {connectMessage && (
                  <p className="flex items-center gap-1.5 text-xs text-success">
                    <CircleCheck size={14} className="shrink-0" />
                    {connectMessage}
                  </p>
                )}
                {connection && !editingConnection && (
                  <div>
                    <Button
                      variant="link"
                      size="2xs"
                      className="h-auto p-0 text-xs"
                      disabled={busy || formState.status !== 'ok'}
                      onClick={startConnectionEdit}
                    >
                      {labels.editConnection}
                    </Button>
                  </div>
                )}

                {showConnectionForm && (
                  <>
                    <Group
                      icon={KeyRound}
                      title={labels.credentialsTitle(providerName)}
                      caption={labels.credentialsCaption(providerName)}
                    >
                      {formState.status === 'loading' && (
                        <div className="flex items-center gap-2 text-xs text-foreground-muted">
                          <Spinner size="sm" /> {labels.loadingForm(providerName)}
                        </div>
                      )}
                      {formState.status === 'error' && (
                        <FailureAlert failure={formState.failure} labels={labels} />
                      )}
                      {loadingConnectionValues && (
                        <div className="flex items-center gap-2 text-xs text-foreground-muted">
                          <Spinner size="sm" /> {labels.loadingConnection}
                        </div>
                      )}
                      {form.authTypes.length > 1 && (
                        <Field id="byo-auth-type" label={labels.authType}>
                          <Select
                            value={authType ?? undefined}
                            onValueChange={setAuthType}
                            disabled={keyLocked}
                          >
                            <SelectTrigger id="byo-auth-type" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent container={container}>
                              {form.authTypes.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      )}
                      {mainFields.map((f) => fieldInput(f, true))}
                      {advancedFields.length > 0 && (
                        <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
                          <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-foreground-muted hover:text-foreground">
                            <ChevronRight
                              size={14}
                              className={cn('transition-transform', moreOpen && 'rotate-90')}
                            />
                            {labels.moreSettings(providerName)}
                            <span className="font-normal text-foreground-subtle">
                              · {labels.optional}
                            </span>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-3 flex flex-col gap-3">
                            {advancedFields.map((f) => fieldInput(f, false))}
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </Group>

                    <Group
                      icon={Building2}
                      title={labels.inUiPathTitle}
                      caption={labels.inUiPathCaption(providerName)}
                    >
                      <div className="grid min-w-0 grid-cols-2 gap-3">
                        <Field id="byo-conn-name" label={labels.connectionName}>
                          <Input
                            id="byo-conn-name"
                            value={connName}
                            disabled={keyLocked}
                            onChange={(e) => setConnName(e.target.value)}
                            aria-invalid={connNameClash}
                          />
                        </Field>
                        <Field id="byo-folder" label={labels.folder}>
                          <Select
                            value={formFolderId || undefined}
                            onValueChange={setFolderId}
                            disabled={keyLocked || editingConnection}
                          >
                            <SelectTrigger id="byo-folder" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent container={container}>
                              {folders.map((f) => (
                                <SelectItem key={f.id} value={f.id}>
                                  {f.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>
                      <p
                        className={cn(
                          'text-xs',
                          connNameClash ? 'text-error' : 'text-foreground-muted'
                        )}
                      >
                        {connNameClash ? labels.connectionNameTaken : labels.folderHint}
                      </p>
                    </Group>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!canConnect}
                        onClick={runConnect}
                      >
                        <ConnectButtonText
                          running={connect.status === 'running'}
                          editing={editingConnection}
                          labels={labels}
                        />
                      </Button>
                      {editingConnection && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={connect.status === 'running'}
                          onClick={cancelConnectionEdit}
                        >
                          {labels.cancelConnectionEdit}
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </Step>

            <Step n={3} title={labels.modelStep} done={hasModel} disabled={!connected}>
              {freeTextModel ? (
                <Input
                  ref={modelTriggerRef}
                  aria-label={labels.modelIdLabel}
                  placeholder={labels.modelIdPlaceholder}
                  value={modelId}
                  disabled={busy}
                  onChange={(e) => pickModel(e.target.value)}
                />
              ) : (
                <Popover
                  open={modelListOpen}
                  onOpenChange={(next) => {
                    setModelListOpen(next);
                    if (!next) setModelQuery('');
                  }}
                  modal
                >
                  <PopoverTrigger asChild>
                    <Button
                      ref={modelTriggerRef}
                      variant="outline"
                      role="combobox"
                      aria-expanded={modelListOpen}
                      aria-label={labels.modelStep}
                      disabled={!connected || busy || modelsState.status !== 'ok'}
                      className="w-full justify-between font-normal"
                    >
                      {modelId ? (
                        <span className="truncate font-mono text-xs">{modelId}</span>
                      ) : (
                        <span className="truncate text-foreground-muted">{modelTriggerText}</span>
                      )}
                      <ChevronDown className="shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    container={container}
                    align="start"
                    className="w-[var(--radix-popover-trigger-width)] overflow-hidden p-0"
                    onOpenAutoFocus={(e) => {
                      e.preventDefault();
                      modelSearchRef.current?.focus();
                    }}
                  >
                    <Command shouldFilter={false}>
                      <CommandInput
                        ref={modelSearchRef}
                        aria-label={labels.modelStep}
                        placeholder={labels.modelSearch(
                          models.compatible.length + models.incompatible.length
                        )}
                        value={modelQuery}
                        onValueChange={setModelQuery}
                      />
                      <CommandList className="max-h-[280px]">
                        <CommandEmpty>{labels.modelNoMatch(modelQuery)}</CommandEmpty>
                        {shownCompatible.length > 0 && (
                          <CommandGroup heading={labels.compatibleGroup(shownCompatible.length)}>
                            {shownCompatible.map((m) => (
                              <ModelRow
                                key={m.id}
                                model={m}
                                selected={m.id === modelId}
                                onSelect={() => {
                                  pickModel(m.id);
                                  setModelListOpen(false);
                                  setModelQuery('');
                                }}
                              />
                            ))}
                          </CommandGroup>
                        )}
                        {shownIncompatible.length > 0 && (
                          <CommandGroup
                            heading={labels.incompatibleGroup(shownIncompatible.length)}
                          >
                            {shownIncompatible.map((m) => (
                              <ModelRow key={m.id} model={m} disabled />
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </Step>

            <Step n={4} title={labels.nameStep} done={readyToSave} disabled={!hasModel}>
              <div className="flex flex-col gap-1.5">
                <Input
                  aria-label={labels.nameStep}
                  value={name}
                  disabled={busy}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameTouched(true);
                    setTest({ status: 'idle' });
                  }}
                  aria-invalid={nameClash}
                />
                <p className={cn('text-xs', nameClash ? 'text-error' : 'text-foreground-muted')}>
                  {nameClash ? labels.nameTaken(name.trim()) : labels.nameHint}
                </p>
              </div>
            </Step>
          </>
        )}
      </div>

      {failure && (
        <div className="max-h-[40%] shrink-0 overflow-y-auto border-t border-border-subtle px-6 py-3">
          <FailureAlert failure={failure} labels={labels} />
        </div>
      )}

      <DialogFooter className="shrink-0 items-center border-t border-border-subtle px-6 py-4">
        <Button variant="secondary" onClick={onClose}>
          {labels.cancel}
        </Button>
        <span title={provider ? saveHint(providerName) : undefined}>
          <Button onClick={runTest} disabled={!readyToSave || busy}>
            {test.status === 'running' ? (
              <>
                <Spinner size="sm" /> {labels.testing}
              </>
            ) : (
              saveLabel
            )}
          </Button>
        </span>
      </DialogFooter>
    </DialogContent>
  );
}

interface ConnectButtonTextProps {
  running: boolean;
  editing: boolean;
  labels: ByoModelDialogLabels;
}

/** "Connect" for a new connection, "Save connection" for an edited one. */
function ConnectButtonText({ running, editing, labels }: ConnectButtonTextProps) {
  if (running) {
    return (
      <>
        <Spinner size="sm" /> {editing ? labels.savingConnection : labels.connecting}
      </>
    );
  }
  return <>{editing ? labels.saveConnection : labels.connect}</>;
}

const unexpected = (err: unknown): ByoFailure => ({
  title: err instanceof Error ? err.message : String(err),
});

interface StepProps {
  n: number;
  title: string;
  done: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

function Step({ n, title, done, disabled, children }: StepProps) {
  return (
    // A disabled fieldset disables every control inside it, so a locked step
    // is out of the tab order too.
    <fieldset
      disabled={disabled}
      className={cn('m-0 min-w-0 border-0 p-0', disabled && 'opacity-40')}
    >
      <legend className="mb-2 flex items-center gap-2 p-0">
        <span
          className={cn(
            'grid size-5 shrink-0 place-items-center rounded-full text-xs font-semibold',
            done
              ? 'bg-brand text-foreground-on-accent'
              : 'border border-border text-foreground-muted'
          )}
        >
          {done ? <Check size={12} /> : n}
        </span>
        <span className="text-sm font-medium text-foreground">{title}</span>
      </legend>
      <div className="min-w-0 pl-7">{children}</div>
    </fieldset>
  );
}

interface GroupProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  caption: string;
  children: React.ReactNode;
}

/** A labelled group inside the Connection step: the provider's side or UiPath's side. */
function Group({ icon: Icon, title, caption, children }: GroupProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-border-subtle p-3">
      <div className="flex items-center gap-1.5 text-xs">
        <Icon size={13} className="shrink-0 text-foreground-muted" />
        <span className="font-semibold text-foreground">{title}</span>
        <span className="truncate text-foreground-muted">· {caption}</span>
      </div>
      {children}
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ id, label, hint, required, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
        {required && (
          <span aria-hidden className="text-error">
            {' *'}
          </span>
        )}
      </Label>
      {children}
      {hint && <p className="text-xs text-foreground-muted">{hint}</p>}
    </div>
  );
}

/** What failed, with the raw response one click away (or the message, when there is none). */
function FailureAlert({ failure, labels }: { failure: ByoFailure; labels: ByoModelDialogLabels }) {
  const [showRaw, setShowRaw] = React.useState(false);
  return (
    <Alert variant="destructive" className="min-w-0">
      <AlertCircle />
      <AlertTitle>{failure.title}</AlertTitle>
      {failure.detail && (
        <AlertDescription className="break-words">
          <Button
            variant="link"
            size="2xs"
            className="mt-1 block h-auto p-0 text-xs"
            onClick={() => setShowRaw((v) => !v)}
          >
            {showRaw ? labels.hideResponse : labels.showResponse}
          </Button>
          {showRaw && (
            <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-md bg-surface p-2 font-mono text-xs leading-4 text-foreground-muted">
              {failure.detail}
            </pre>
          )}
        </AlertDescription>
      )}
      {!failure.detail && failure.message && (
        <AlertDescription className="break-words">{failure.message}</AlertDescription>
      )}
    </Alert>
  );
}

interface ModelRowProps {
  model: ByoProviderModel;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}

function ModelRow({ model, selected, disabled, onSelect }: ModelRowProps) {
  return (
    <CommandItem
      value={model.id}
      onSelect={onSelect}
      disabled={disabled}
      title={model.reason}
      // Disabled rows keep pointer events so the reason tooltip still shows.
      className="gap-2 py-1.5 data-[disabled=true]:pointer-events-auto data-[disabled=true]:cursor-default"
    >
      <Check
        size={14}
        className={cn('shrink-0', selected ? 'text-foreground-accent' : 'opacity-0')}
      />
      <span className="min-w-0 truncate font-mono text-xs text-foreground">{model.id}</span>
      <span className="ml-auto min-w-0 shrink truncate pl-2 text-right text-xs text-foreground-muted">
        {model.short ?? model.note}
      </span>
    </CommandItem>
  );
}

import type { GuardrailDefinitionStatus, GuardrailScope } from './builder-types';

/**
 * Hand-written mirrors of the `GET /api/execution/guardrails/definitions` payload.
 *
 * This is the public shape of the transport: `parseGuardrailDefinitions` validates unknown
 * input into it, and hosts that keep their own transport (Agents' SWR, Flow's react-query,
 * Flow vsix's postMessage) assign their equivalents straight across. zod stays private to
 * `definitions-parse.ts` so no schema types reach the emitted declarations; the two are
 * pinned to each other by a compile-time assignability check there.
 *
 * Where the two products' schemas differ in strictness the mirror admits both: Agents marks
 * the numeric constraints and the `text`/`enum` defaults `nullish`, Flow marks the same
 * defaults `nullable` and omits `folderPath`. Scope and status are reused from
 * `builder-types` rather than redeclared, so the wire and display layers cannot drift.
 */

/** The fields every parameter kind carries. */
export interface GuardrailParameterWireBase {
  id: string;
  required: boolean;
  /**
   * Display copy shipped by the manifest. BYO guardrails carry their own; UiPath-managed
   * validators omit it and resolve from the curated copy table instead.
   */
  displayName?: string;
  description?: string;
}

/**
 * One configurable parameter as the backend describes it, discriminated on `type`. The seven
 * kinds match `GuardrailValidatorParameter`'s `$parameterType` one for one.
 */
export type GuardrailParameterDefinitionWire =
  | (GuardrailParameterWireBase & {
      type: 'enum';
      defaultValue?: string | null;
      options: string[];
      optionLabels?: Record<string, string>;
    })
  | (GuardrailParameterWireBase & {
      type: 'enum-list';
      defaultValue: string[];
      options: string[];
      optionLabels?: Record<string, string>;
    })
  | (GuardrailParameterWireBase & {
      type: 'map-enum';
      defaultValue: Record<string, number>;
      /** Id of the sibling `enum-list` parameter whose selection provides the map's keys. */
      keySource: string;
      min?: number | null;
      max?: number | null;
      step?: number | null;
    })
  | (GuardrailParameterWireBase & {
      type: 'number';
      defaultValue: number;
      min?: number | null;
      max?: number | null;
      step?: number | null;
    })
  | (GuardrailParameterWireBase & {
      type: 'text';
      defaultValue?: string | null;
      maxLength?: number | null;
    })
  | (GuardrailParameterWireBase & {
      type: 'text-list';
      /** Absent on some validators (Agents' schema has no such field at all). */
      defaultValue?: string[] | null;
      maxItems?: number | null;
      maxLength?: number | null;
    })
  | (GuardrailParameterWireBase & {
      type: 'boolean';
      defaultValue: boolean;
    });

/** One guardrail validator definition as the backend returns it. */
export interface GuardrailDefinitionWire {
  validator: string;
  allowedScopes: GuardrailScope[];
  parameters: GuardrailParameterDefinitionWire[];
  status: GuardrailDefinitionStatus;
  displayName?: string;
  description?: string;
  byoConnectorName?: string;
  byoConnectorKey?: string;
  /** Present only for bring-your-own guardrails; its presence is what makes one BYO. */
  byoValidatorName?: string;
  byoGuardrailConnectionId?: string;
  byoConfigurationId?: string;
  /**
   * Not returned by the definitions endpoint. Both products resolve it from their
   * connections API and stamp it on afterwards; `withGuardrailFolderMetadata` is the shared
   * helper for that step.
   */
  folderPath?: string;
  folderKey?: string;
}

import type { GuardrailDefinitionStatus, GuardrailScope } from './builder-types';

/**
 * Hand-written mirrors of the `GET /api/execution/guardrails/definitions` payload, so hosts
 * keeping their own transport can assign their equivalents straight across. Hand-written
 * because zod stays private to `definitions-parse.ts`, which pins the two with a
 * compile-time assignability check.
 *
 * Where the products' schemas differ in strictness the mirror admits both: Agents marks the
 * numeric constraints and `text`/`enum` defaults `nullish`, Flow marks them `nullable` and
 * omits `folderPath`. Scope and status come from `builder-types`, so wire and display
 * cannot drift.
 */

/** The fields every parameter kind carries. */
export interface GuardrailParameterWireBase {
  id: string;
  required: boolean;
  /** Manifest-supplied copy. BYO carries its own; UiPath validators resolve from the table. */
  displayName?: string;
  description?: string;
}

/** One parameter as the backend describes it; the seven kinds match `$parameterType`. */
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

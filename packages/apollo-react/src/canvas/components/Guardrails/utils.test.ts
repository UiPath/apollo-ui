import { describe, expect, it } from 'vitest';
import type { GuardrailParameterDefinition, GuardrailValidatorParameter } from './types';
import {
  normalizeGuardrailParameters,
  dropEmptyOptionalParameters,
  getOutOfRangeParameterIds,
  getRequiredEmptyParameterIds,
  seedGuardrailParameters,
  syncMapEnumParameters,
} from './utils';

describe('seedGuardrailParameters', () => {
  const definitions: GuardrailParameterDefinition[] = [
    { id: 'prompt', type: 'text', label: 'Prompt', required: true, defaultValue: null },
    { id: 'model', type: 'enum', label: 'Model', required: true, defaultValue: null },
    { id: 'examples', type: 'text-list', label: 'Examples', required: false, defaultValue: null },
    { id: 'strict', type: 'boolean', label: 'Strict', required: false, defaultValue: null },
    { id: 'threshold', type: 'number', label: 'Threshold', required: true, defaultValue: 0.7 },
    {
      id: 'entities',
      type: 'enum-list',
      label: 'Entities',
      required: true,
      defaultValue: ['Email'],
      options: ['Email', 'Person'],
    },
  ];

  it('returns existing parameters verbatim when editing', () => {
    const existing: GuardrailValidatorParameter[] = [
      { $parameterType: 'text', id: 'prompt', value: 'hello' },
    ];
    expect(seedGuardrailParameters(definitions, existing)).toBe(existing);
  });

  it('seeds one entry per definition from its defaultValue', () => {
    const seeded = seedGuardrailParameters(definitions);
    expect(seeded).toHaveLength(definitions.length);
    expect(seeded.find((p) => p.id === 'threshold')).toEqual({
      $parameterType: 'number',
      id: 'threshold',
      value: 0.7,
    });
    expect(seeded.find((p) => p.id === 'entities')).toEqual({
      $parameterType: 'enum-list',
      id: 'entities',
      value: ['Email'],
    });
  });

  it('coerces null defaults: text and enum to empty string', () => {
    const seeded = seedGuardrailParameters(definitions);
    expect(seeded.find((p) => p.id === 'prompt')).toEqual({
      $parameterType: 'text',
      id: 'prompt',
      value: '',
    });
    expect(seeded.find((p) => p.id === 'model')).toEqual({
      $parameterType: 'enum',
      id: 'model',
      value: '',
    });
  });

  it('coerces null defaults: text-list to empty array', () => {
    expect(seedGuardrailParameters(definitions).find((p) => p.id === 'examples')).toEqual({
      $parameterType: 'text-list',
      id: 'examples',
      value: [],
    });
  });

  it('coerces null defaults: boolean to false', () => {
    expect(seedGuardrailParameters(definitions).find((p) => p.id === 'strict')).toEqual({
      $parameterType: 'boolean',
      id: 'strict',
      value: false,
    });
  });
});

describe('syncMapEnumParameters', () => {
  // Mirrors the PII detection validator: an `entities` enum-list and an `entityThresholds`
  // map-enum whose default map covers every possible entity.
  const ALL_ENTITIES = ['Person', 'Address', 'Email', 'CreditCardNumber'];
  const entitiesDef: GuardrailParameterDefinition = {
    id: 'entities',
    type: 'enum-list',
    label: 'Entities to detect',
    required: true,
    defaultValue: ['Email', 'Address'],
    options: ALL_ENTITIES,
  };
  const thresholdsDef: GuardrailParameterDefinition = {
    id: 'entityThresholds',
    type: 'map-enum',
    label: 'Detection thresholds',
    required: false,
    keySource: 'entities',
    min: 0,
    max: 1,
    step: 0.1,
    defaultValue: Object.fromEntries(ALL_ENTITIES.map((e) => [e, 0.5])),
  };
  const paramDefs = [entitiesDef, thresholdsDef];

  function getMap(params: GuardrailValidatorParameter[]): Record<string, number> {
    const p = params.find((x) => x.id === 'entityThresholds');
    if (p?.$parameterType !== 'map-enum') throw new Error('expected map-enum param');
    return p.value;
  }

  it('prunes the threshold map down to the selected entities (the default-config bug)', () => {
    const params: GuardrailValidatorParameter[] = [
      { $parameterType: 'enum-list', id: 'entities', value: ['Email', 'Address'] },
      {
        $parameterType: 'map-enum',
        id: 'entityThresholds',
        value: thresholdsDef.defaultValue as Record<string, number>,
      },
    ];

    const synced = syncMapEnumParameters(params, paramDefs);

    expect(Object.keys(getMap(synced)).sort()).toEqual(['Address', 'Email']);
    expect(getMap(synced)).toEqual({ Email: 0.5, Address: 0.5 });
  });

  it('preserves user-edited threshold values', () => {
    const params: GuardrailValidatorParameter[] = [
      { $parameterType: 'enum-list', id: 'entities', value: ['Email', 'Address'] },
      {
        $parameterType: 'map-enum',
        id: 'entityThresholds',
        value: { ...(thresholdsDef.defaultValue as Record<string, number>), Email: 0.9 },
      },
    ];

    expect(getMap(syncMapEnumParameters(params, paramDefs))).toEqual({ Email: 0.9, Address: 0.5 });
  });

  it('rebuilds the map from defaults when the persisted value is array-shaped', () => {
    const params: GuardrailValidatorParameter[] = [
      { $parameterType: 'enum-list', id: 'entities', value: ['Email', 'Address'] },
      {
        $parameterType: 'map-enum',
        id: 'entityThresholds',
        value: [0.7, 0.3] as unknown as Record<string, number>,
      },
    ];

    // A malformed array must not be indexed into as a map; every key falls to its default.
    expect(getMap(syncMapEnumParameters(params, paramDefs))).toEqual({ Email: 0.5, Address: 0.5 });
  });

  it('drops thresholds for entities removed from the selection', () => {
    const params: GuardrailValidatorParameter[] = [
      { $parameterType: 'enum-list', id: 'entities', value: ['Email'] },
      { $parameterType: 'map-enum', id: 'entityThresholds', value: { Email: 0.7, Address: 0.3 } },
    ];

    expect(getMap(syncMapEnumParameters(params, paramDefs))).toEqual({ Email: 0.7 });
  });

  it('fills a newly selected entity using the per-entity default, then min', () => {
    const params: GuardrailValidatorParameter[] = [
      { $parameterType: 'enum-list', id: 'entities', value: ['Email', 'Person'] },
      { $parameterType: 'map-enum', id: 'entityThresholds', value: { Email: 0.7 } },
    ];

    // Person comes from the default map (0.5); Email keeps its edited value.
    expect(getMap(syncMapEnumParameters(params, paramDefs))).toEqual({ Email: 0.7, Person: 0.5 });
  });

  it('falls back to min when an entity is in neither the current map nor the defaults', () => {
    const sparseThresholdsDef: GuardrailParameterDefinition = {
      ...thresholdsDef,
      defaultValue: {},
      min: 0.2,
    };
    const params: GuardrailValidatorParameter[] = [
      { $parameterType: 'enum-list', id: 'entities', value: ['Email'] },
      { $parameterType: 'map-enum', id: 'entityThresholds', value: {} },
    ];

    expect(getMap(syncMapEnumParameters(params, [entitiesDef, sparseThresholdsDef]))).toEqual({
      Email: 0.2,
    });
  });

  it('falls back to the source definition default selection when no selection is stored', () => {
    const params: GuardrailValidatorParameter[] = [
      {
        $parameterType: 'map-enum',
        id: 'entityThresholds',
        value: thresholdsDef.defaultValue as Record<string, number>,
      },
    ];

    expect(Object.keys(getMap(syncMapEnumParameters(params, paramDefs))).sort()).toEqual([
      'Address',
      'Email',
    ]);
  });

  it('leaves non map-enum parameters untouched', () => {
    const params: GuardrailValidatorParameter[] = [
      { $parameterType: 'enum-list', id: 'entities', value: ['Email'] },
      { $parameterType: 'text', id: 'note', value: 'hello' },
    ];

    expect(syncMapEnumParameters(params, paramDefs)).toEqual(params);
  });

  it('leaves a map-enum without a keySource untouched', () => {
    const noSourceDef: GuardrailParameterDefinition = {
      id: 'entityThresholds',
      type: 'map-enum',
      label: 'Thresholds',
      required: false,
      defaultValue: {},
    };
    const params: GuardrailValidatorParameter[] = [
      { $parameterType: 'map-enum', id: 'entityThresholds', value: { Email: 0.7 } },
    ];

    expect(syncMapEnumParameters(params, [noSourceDef])).toEqual(params);
  });

  // The logic is generic over any enum-list + map-enum pair, not just PII. This mirrors the
  // harmful_content shape (different param ids, integer 0-6 thresholds).
  it('prunes harmful-content thresholds to the selected content categories', () => {
    const hcEntitiesDef: GuardrailParameterDefinition = {
      id: 'harmfulContentEntities',
      type: 'enum-list',
      label: 'Content categories',
      required: true,
      defaultValue: ['Hate', 'SelfHarm'],
      options: ['Hate', 'SelfHarm', 'Sexual', 'Violence'],
    };
    const hcThresholdsDef: GuardrailParameterDefinition = {
      id: 'harmfulContentEntityThresholds',
      type: 'map-enum',
      label: 'Severity thresholds',
      required: true,
      keySource: 'harmfulContentEntities',
      min: 0,
      max: 6,
      step: 2,
      defaultValue: { Hate: 2, SelfHarm: 2, Sexual: 2, Violence: 2 },
    };
    const params: GuardrailValidatorParameter[] = [
      { $parameterType: 'enum-list', id: 'harmfulContentEntities', value: ['Hate', 'SelfHarm'] },
      {
        $parameterType: 'map-enum',
        id: 'harmfulContentEntityThresholds',
        value: hcThresholdsDef.defaultValue as Record<string, number>,
      },
    ];

    const synced = syncMapEnumParameters(params, [hcEntitiesDef, hcThresholdsDef]);
    const map = synced.find((p) => p.id === 'harmfulContentEntityThresholds');
    if (map?.$parameterType !== 'map-enum') throw new Error('expected map-enum param');
    expect(map.value).toEqual({ Hate: 2, SelfHarm: 2 });
  });
});

describe('dropEmptyOptionalParameters', () => {
  const definitions: GuardrailParameterDefinition[] = [
    { id: 'prompt', type: 'text', label: 'Prompt', required: true, defaultValue: null },
    { id: 'note', type: 'text', label: 'Note', required: false, defaultValue: null },
    { id: 'examples', type: 'text-list', label: 'Examples', required: false, defaultValue: null },
    { id: 'strict', type: 'boolean', label: 'Strict', required: false, defaultValue: false },
  ];

  it('drops optional parameters with empty string or empty array values', () => {
    const params: GuardrailValidatorParameter[] = [
      { $parameterType: 'text', id: 'prompt', value: '' },
      { $parameterType: 'text', id: 'note', value: '' },
      { $parameterType: 'text-list', id: 'examples', value: [] },
      { $parameterType: 'boolean', id: 'strict', value: false },
    ];

    const result = dropEmptyOptionalParameters(params, definitions);
    expect(result.map((p) => p.id)).toEqual(['prompt', 'strict']);
  });

  it('keeps optional parameters with values, and unknown parameters', () => {
    const params: GuardrailValidatorParameter[] = [
      { $parameterType: 'text', id: 'note', value: 'keep me' },
      { $parameterType: 'text', id: 'unknownParam', value: '' },
    ];

    const result = dropEmptyOptionalParameters(params, definitions);
    expect(result.map((p) => p.id)).toEqual(['note', 'unknownParam']);
  });
});

describe('getOutOfRangeParameterIds', () => {
  const defs = [
    { id: 'threshold', type: 'number', label: 'Threshold', required: true, min: 10, max: 90 },
    { id: 'unbounded', type: 'number', label: 'Unbounded', required: false },
  ] as const;

  it('flags values outside the declared range', () => {
    // min/max only bind on native form submission, which this form never does — so without
    // this check an out-of-range guardrail saves silently.
    expect(
      getOutOfRangeParameterIds(defs as never, [
        { $parameterType: 'number', id: 'threshold', value: 5 },
      ])
    ).toEqual(['threshold']);
    expect(
      getOutOfRangeParameterIds(defs as never, [
        { $parameterType: 'number', id: 'threshold', value: 95 },
      ])
    ).toEqual(['threshold']);
  });

  it('accepts in-range values, the bounds themselves, and unbounded parameters', () => {
    for (const value of [10, 50, 90]) {
      expect(
        getOutOfRangeParameterIds(defs as never, [
          { $parameterType: 'number', id: 'threshold', value },
        ])
      ).toEqual([]);
    }
    expect(
      getOutOfRangeParameterIds(defs as never, [
        { $parameterType: 'number', id: 'unbounded', value: -1000 },
      ])
    ).toEqual([]);
  });

  it('ignores missing and non-numeric values, which the required check owns', () => {
    expect(getOutOfRangeParameterIds(defs as never, [])).toEqual([]);
    expect(
      getOutOfRangeParameterIds(defs as never, [
        { $parameterType: 'number', id: 'threshold', value: Number.NaN },
      ])
    ).toEqual([]);
  });

  describe('map-enum bounds', () => {
    // `min`/`max` are documented for map-enum too ("For number / map-enum") and every row is
    // edited as a number, so checking only the scalar type let an out-of-range map threshold
    // through the host-side Save gate.
    const mapDefs = [
      { id: 'perEntity', type: 'map-enum', label: 'Per entity', required: false, min: 0, max: 1 },
    ] as const;

    it('flags a map whose row falls outside the range', () => {
      expect(
        getOutOfRangeParameterIds(mapDefs as never, [
          { $parameterType: 'map-enum', id: 'perEntity', value: { Email: 0.5, Phone: 1.5 } },
        ])
      ).toEqual(['perEntity']);
    });

    it('reports the parameter once however many rows are out of range', () => {
      expect(
        getOutOfRangeParameterIds(mapDefs as never, [
          { $parameterType: 'map-enum', id: 'perEntity', value: { Email: -1, Phone: 2 } },
        ])
      ).toEqual(['perEntity']);
    });

    it('accepts in-range rows, the bounds themselves, and an empty map', () => {
      expect(
        getOutOfRangeParameterIds(mapDefs as never, [
          { $parameterType: 'map-enum', id: 'perEntity', value: { Email: 0, Phone: 1 } },
        ])
      ).toEqual([]);
      expect(
        getOutOfRangeParameterIds(mapDefs as never, [
          { $parameterType: 'map-enum', id: 'perEntity', value: {} },
        ])
      ).toEqual([]);
    });
  });
});

describe('malformed values from the wire', () => {
  // `defaultValue` is a required key typed `unknown`, so `undefined` type-checks; and persisted
  // values are not guaranteed to match the union either. Both used to reach the predicates,
  // which discriminate on runtime shape and silently reported nothing — so a required parameter
  // sailed through the Save gate.
  const defs: GuardrailParameterDefinition[] = [
    {
      id: 'threshold',
      type: 'number',
      label: 'T',
      required: true,
      defaultValue: undefined,
      min: 0.2,
    },
    { id: 'entities', type: 'enum-list', label: 'E', required: true, defaultValue: undefined },
    { id: 'thresholds', type: 'map-enum', label: 'M', required: true, defaultValue: undefined },
  ];

  it('seeds a usable value for number, enum-list and map-enum with no default', () => {
    const seeded = seedGuardrailParameters(defs);
    expect(seeded).toEqual([
      // Number falls back to the definition's min, matching syncMapEnumParameters.
      { $parameterType: 'number', id: 'threshold', value: 0.2 },
      { $parameterType: 'enum-list', id: 'entities', value: [] },
      { $parameterType: 'map-enum', id: 'thresholds', value: {} },
    ]);
  });

  it('gates Save on those required parameters instead of reporting nothing', () => {
    const seeded = seedGuardrailParameters(defs);
    expect(getRequiredEmptyParameterIds(defs, seeded).sort()).toEqual(['entities', 'thresholds']);
  });

  it('normalises persisted values that do not match the union', () => {
    const listDef: GuardrailParameterDefinition[] = [
      { id: 'phrases', type: 'text-list', label: 'P', required: true, defaultValue: [] },
    ];
    const normalised = normalizeGuardrailParameters(
      [{ $parameterType: 'text-list', id: 'phrases', value: null } as never],
      listDef
    );
    expect(normalised).toEqual([{ $parameterType: 'text-list', id: 'phrases', value: [] }]);
    // And the required check now sees it as empty rather than as a filled list.
    expect(getRequiredEmptyParameterIds(listDef, normalised)).toEqual(['phrases']);
  });

  it('normalises a discriminator that disagrees with its definition', () => {
    const numDef: GuardrailParameterDefinition[] = [
      { id: 'threshold', type: 'number', label: 'T', required: true, defaultValue: 0.5, min: 0.2 },
    ];
    // Coercing only the value would emit {$parameterType:'text', value:0.2} — a pair that
    // satisfies no member of the union. The definition is the authority.
    const out = normalizeGuardrailParameters(
      [{ $parameterType: 'text', id: 'threshold', value: 'nonsense' } as never],
      numDef
    );
    expect(out).toEqual([{ $parameterType: 'number', id: 'threshold', value: 0.2 }]);
  });

  it('drops a non-finite persisted map threshold rather than carrying it to save', () => {
    const defs: GuardrailParameterDefinition[] = [
      { id: 'entities', type: 'enum-list', label: 'E', required: false, defaultValue: ['Email'] },
      {
        id: 'thresholds',
        type: 'map-enum',
        label: 'M',
        required: false,
        defaultValue: { Email: 0.7 },
        keySource: 'entities',
        min: 0.1,
      },
    ];
    const synced = syncMapEnumParameters(
      [
        { $parameterType: 'enum-list', id: 'entities', value: ['Email'] },
        { $parameterType: 'map-enum', id: 'thresholds', value: { Email: Number.NaN } as never },
      ],
      defs
    );
    // Falls back to the per-key default, exactly as a missing key would.
    expect(synced[1]).toEqual({
      $parameterType: 'map-enum',
      id: 'thresholds',
      value: { Email: 0.7 },
    });
  });

  it('leaves host sidecar parameters with no matching definition untouched', () => {
    const sidecar = { $parameterType: 'text', id: 'connectionId', value: null } as never;
    expect(normalizeGuardrailParameters([sidecar], [])).toEqual([sidecar]);
  });
});

describe('getRequiredEmptyParameterIds', () => {
  const definitions: GuardrailParameterDefinition[] = [
    { id: 'prompt', type: 'text', label: 'Prompt', required: true, defaultValue: null },
    { id: 'model', type: 'enum', label: 'Model', required: true, defaultValue: null },
    {
      id: 'entities',
      type: 'enum-list',
      label: 'Entities',
      required: true,
      defaultValue: [],
      options: ['Email'],
    },
    { id: 'examples', type: 'text-list', label: 'Examples', required: true, defaultValue: null },
    {
      id: 'thresholds',
      type: 'map-enum',
      label: 'Thresholds',
      required: true,
      keySource: 'entities',
      defaultValue: {},
    },
    { id: 'threshold', type: 'number', label: 'Threshold', required: true, defaultValue: 0.5 },
    { id: 'strict', type: 'boolean', label: 'Strict', required: true, defaultValue: false },
    { id: 'note', type: 'text', label: 'Note', required: false, defaultValue: null },
  ];

  it('reports every required parameter whose value is empty', () => {
    const params: GuardrailValidatorParameter[] = [
      { $parameterType: 'text', id: 'prompt', value: '   ' },
      { $parameterType: 'enum', id: 'model', value: '' },
      { $parameterType: 'enum-list', id: 'entities', value: [] },
      { $parameterType: 'text-list', id: 'examples', value: ['', '  '] },
      { $parameterType: 'map-enum', id: 'thresholds', value: {} },
      { $parameterType: 'number', id: 'threshold', value: 0 },
      { $parameterType: 'boolean', id: 'strict', value: false },
      { $parameterType: 'text', id: 'note', value: '' },
    ];

    expect(getRequiredEmptyParameterIds(definitions, params)).toEqual([
      'prompt',
      'model',
      'entities',
      'examples',
      'thresholds',
    ]);
  });

  it('treats a missing required parameter as empty', () => {
    expect(getRequiredEmptyParameterIds(definitions, [])).toEqual([
      'prompt',
      'model',
      'entities',
      'examples',
      'thresholds',
      'threshold',
      'strict',
    ]);
  });

  it('returns no ids when every required parameter is filled', () => {
    const params: GuardrailValidatorParameter[] = [
      { $parameterType: 'text', id: 'prompt', value: 'check tone' },
      { $parameterType: 'enum', id: 'model', value: 'model-a' },
      { $parameterType: 'enum-list', id: 'entities', value: ['Email'] },
      { $parameterType: 'text-list', id: 'examples', value: ['one filled', ''] },
      { $parameterType: 'map-enum', id: 'thresholds', value: { Email: 0.5 } },
      { $parameterType: 'number', id: 'threshold', value: 0 },
      { $parameterType: 'boolean', id: 'strict', value: false },
    ];

    expect(getRequiredEmptyParameterIds(definitions, params)).toEqual([]);
  });

  it('never reports numbers or booleans once present, even falsy ones', () => {
    const defs: GuardrailParameterDefinition[] = [
      { id: 'threshold', type: 'number', label: 'Threshold', required: true, defaultValue: 1 },
      { id: 'strict', type: 'boolean', label: 'Strict', required: true, defaultValue: true },
    ];
    const params: GuardrailValidatorParameter[] = [
      { $parameterType: 'number', id: 'threshold', value: 0 },
      { $parameterType: 'boolean', id: 'strict', value: false },
    ];
    expect(getRequiredEmptyParameterIds(defs, params)).toEqual([]);
  });
});

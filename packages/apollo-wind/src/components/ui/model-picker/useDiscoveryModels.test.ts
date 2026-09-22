import { describe, expect, it } from 'vitest';

import { normalizeDiscoveryModels } from './useDiscoveryModels';

/*
 * The gateway may serialize the DTO in PascalCase or camelCase depending on
 * the product instance, so the response is normalized recursively. The catch
 * is that not every key in that payload is a DTO property name.
 */
describe('normalizeDiscoveryModels', () => {
  it('camelizes DTO properties, including nested ones', () => {
    const [model] = normalizeDiscoveryModels([
      {
        ModelId: 'gpt-4o',
        ModelName: 'gpt-4o',
        ModelDetails: { ContextWindowTokens: 128_000 },
        RoutingDetails: { Geography: 'US' },
      },
    ]);

    expect(model.modelId).toBe('gpt-4o');
    expect(model.modelDetails?.contextWindowTokens).toBe(128_000);
    expect(model.routingDetails?.geography).toBe('US');
  });

  it('leaves customFieldMappings keys exactly as authored', () => {
    // These are field names a user typed when configuring a BYO connection,
    // not DTO properties. Lowercasing `Api-Key` to `api-Key` would make the
    // connection send a field the provider does not recognize.
    const [model] = normalizeDiscoveryModels([
      {
        ModelName: 'byo',
        ByomDetails: {
          CustomFieldMappings: {
            'Api-Key': 'x-api-key',
            Authorization: 'bearer',
            deployment_id: 'd1',
          },
        },
      },
    ]);

    expect(model.byomDetails?.customFieldMappings).toEqual({
      'Api-Key': 'x-api-key',
      Authorization: 'bearer',
      deployment_id: 'd1',
    });
  });

  it('keeps prototype-polluting keys as plain data', () => {
    const [model] = normalizeDiscoveryModels([
      { ModelName: 'evil', ByomDetails: { CustomFieldMappings: { __proto__: 'nope' } } },
    ]);

    expect(({} as Record<string, unknown>).nope).toBeUndefined();
    expect(Object.getPrototypeOf(model)).toBeNull();
  });
});

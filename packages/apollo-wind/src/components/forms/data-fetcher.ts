import type { DataSource, FieldOption } from './form-schema';
import { get } from '@/lib';

// ============================================================================
// Data Adapter Interface
// ============================================================================

/**
 * Request configuration for the adapter
 */
export interface AdapterRequest {
  url: string;
  method: 'GET' | 'POST';
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  body?: unknown;
}

/**
 * Response from the adapter
 */
export interface AdapterResponse {
  data: unknown;
  status: number;
  ok: boolean;
}

/**
 * Data Adapter interface - implement this to customize how data is fetched
 *
 * @example
 * // Custom adapter with authentication
 * class AuthenticatedAdapter implements DataAdapter {
 *   constructor(private token: string) {}
 *   async fetch(request: AdapterRequest): Promise<AdapterResponse> {
 *     const response = await fetch(request.url, {
 *       headers: { Authorization: `Bearer ${this.token}` }
 *     });
 *     return { data: await response.json(), status: response.status, ok: response.ok };
 *   }
 * }
 */
export interface DataAdapter {
  fetch(request: AdapterRequest): Promise<AdapterResponse>;
}

/**
 * Default adapter using the Fetch API
 */
export class FetchAdapter implements DataAdapter {
  async fetch(request: AdapterRequest): Promise<AdapterResponse> {
    const { url, method, params, body } = request;

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...request.headers,
      },
    };

    // Add body for POST requests
    if (method === 'POST' && body) {
      requestOptions.body = JSON.stringify(body);
    }

    // Add query params for GET requests
    let fullUrl = url;
    if (method === 'GET' && params) {
      const queryParams = new URLSearchParams(params as Record<string, string>);
      fullUrl = `${url}?${queryParams}`;
    }

    const response = await fetch(fullUrl, requestOptions);

    return {
      data: await response.json(),
      status: response.status,
      ok: response.ok,
    };
  }
}

// ============================================================================
// Data Fetcher
// ============================================================================

/**
 * Data Fetcher - Handles various data sources for form fields
 * Supports static, remote, computed, and reactive data sources
 *
 * Uses an adapter pattern for customizable data fetching
 */
export class DataFetcher {
  private static cache = new Map<string, { data: unknown; timestamp: number }>();
  private static cacheTTL = 5 * 60 * 1000; // 5 minutes default
  private static adapter: DataAdapter = new FetchAdapter();

  /**
   * Set the data adapter for fetching remote data
   * Use this to customize how HTTP requests are made (e.g., add auth, use mocks)
   */
  static setAdapter(adapter: DataAdapter): void {
    DataFetcher.adapter = adapter;
  }

  /**
   * Get the current adapter
   */
  static getAdapter(): DataAdapter {
    return DataFetcher.adapter;
  }

  /**
   * Reset to the default FetchAdapter
   */
  static resetAdapter(): void {
    DataFetcher.adapter = new FetchAdapter();
  }

  /**
   * Main fetch method - routes to appropriate handler
   */
  static async fetch(source: DataSource, formValues: Record<string, unknown>): Promise<unknown> {
    switch (source.type) {
      case 'static':
        return DataFetcher.fetchStatic(source);

      case 'fetch':
        return DataFetcher.fetchRemote(source, formValues);

      case 'computed':
        return DataFetcher.fetchComputed(source, formValues);

      case 'remote':
        return DataFetcher.fetchRemote(source, formValues);

      default:
        throw new Error(`Unknown data source type: ${(source as { type: string }).type}`);
    }
  }

  /**
   * Static data source - returns options directly
   */
  private static fetchStatic(source: Extract<DataSource, { type: 'static' }>): unknown[] {
    return source.options;
  }

  /**
   * Remote data fetching with caching
   */
  private static async fetchRemote(
    source: Extract<DataSource, { type: 'fetch' | 'remote' }>,
    formValues: Record<string, unknown>
  ): Promise<unknown> {
    const url = 'url' in source ? source.url : source.endpoint;
    const method = 'method' in source ? source.method || 'GET' : 'GET';
    const params =
      'params' in source ? DataFetcher.resolveParams(source.params || {}, formValues) : {};

    // Build cache key
    const cacheKey = DataFetcher.buildCacheKey(url, method, source, formValues);

    // Check cache
    const cached = DataFetcher.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Use adapter to fetch data
      const response = await DataFetcher.adapter.fetch({
        url,
        method,
        params,
        body: method === 'POST' ? params : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data = response.data;

      // Apply transform if provided
      if ('transform' in source && source.transform) {
        data = DataFetcher.applyTransform(source.transform, data, formValues);
      }

      // Cache the result
      DataFetcher.setCache(cacheKey, data);

      return data;
    } catch (error) {
      console.error('Data fetch error:', error);
      throw error;
    }
  }

  /**
   * Computed data source - derives data from other fields
   *
   * SECURITY NOTE: Uses new Function() for developer-defined computed expressions.
   * This is intentional library design - expressions should only come from trusted
   * configuration files, never from user input. The expressions are defined by
   * developers at build time, not by end users at runtime.
   */
  private static fetchComputed(
    source: Extract<DataSource, { type: 'computed' }>,
    formValues: Record<string, unknown>
  ): unknown {
    // Get values from dependencies
    const dependencyValues = source.dependency.map((dep) => get(formValues, dep));

    // Execute compute function
    try {
      // lgtm[js/unsafe-code-construction]
      const computeFn = new Function(...source.dependency, `return ${source.compute}`);
      return computeFn(...dependencyValues);
    } catch (error) {
      console.error('Computed value error:', error);
      return undefined;
    }
  }

  /**
   * Resolve parameter values from form values
   */
  private static resolveParams(
    params: Record<string, unknown>,
    formValues: Record<string, unknown>
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('$')) {
        // Reference to form field
        const fieldPath = value.slice(1);
        resolved[key] = get(formValues, fieldPath);
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * Apply transformation to fetched data
   *
   * SECURITY NOTE: Uses new Function() for developer-defined transform expressions.
   * This is intentional library design - transforms should only come from trusted
   * configuration files, never from user input. The transforms are defined by
   * developers at build time, not by end users at runtime.
   */
  private static applyTransform(
    transform: string,
    data: unknown,
    formValues: Record<string, unknown>
  ): unknown {
    try {
      // lgtm[js/unsafe-code-construction]
      const transformFn = new Function('data', 'formValues', `return ${transform}`);
      return transformFn(data, formValues);
    } catch (error) {
      console.error('Transform error:', error);
      return data;
    }
  }

  /**
   * Build cache key
   */
  private static buildCacheKey(
    url: string,
    method: string,
    source: DataSource,
    formValues: Record<string, unknown>
  ): string {
    const params = 'params' in source ? source.params || {} : {};
    const resolvedParams = DataFetcher.resolveParams(params as Record<string, unknown>, formValues);
    return `${method}:${url}:${JSON.stringify(resolvedParams)}`;
  }

  /**
   * Get from cache
   */
  private static getFromCache(key: string): unknown | null {
    const cached = DataFetcher.cache.get(key);

    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > DataFetcher.cacheTTL) {
      DataFetcher.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cache
   */
  private static setCache(key: string, data: unknown): void {
    DataFetcher.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache
   */
  static clearCache(pattern?: string): void {
    if (!pattern) {
      DataFetcher.cache.clear();
      return;
    }

    // Clear cache entries matching pattern
    for (const key of DataFetcher.cache.keys()) {
      if (key.includes(pattern)) {
        DataFetcher.cache.delete(key);
      }
    }
  }

  /**
   * Set cache TTL
   */
  static setCacheTTL(ttl: number): void {
    DataFetcher.cacheTTL = ttl;
  }
}

// ============================================================================
// Data Source Builder - Fluent API for creating data sources
// ============================================================================

export class DataSourceBuilder {
  /**
   * Create a static data source
   */
  static static(options: FieldOption[]): DataSource {
    return {
      type: 'static',
      options,
    };
  }

  /**
   * Create a remote data source with GET
   */
  static get(url: string, params?: Record<string, unknown>): DataSource {
    return {
      type: 'remote',
      endpoint: url,
      params,
    };
  }

  /**
   * Create a remote data source with POST
   */
  static post(url: string, _params?: Record<string, unknown>): DataSource {
    return {
      type: 'fetch',
      url,
      method: 'POST',
      transform: 'data',
    };
  }

  /**
   * Create a computed data source
   */
  static computed(dependencies: string[], computeExpression: string): DataSource {
    return {
      type: 'computed',
      dependency: dependencies,
      compute: computeExpression,
    };
  }

  /**
   * Create a data source that depends on another field
   */
  static dependent(url: string, dependencyField: string, paramName: string = 'id'): DataSource {
    return {
      type: 'remote',
      endpoint: url,
      params: {
        [paramName]: `$${dependencyField}`,
      },
    };
  }

  /**
   * Create a searchable data source
   */
  static searchable(url: string, searchParam: string = 'q'): DataSource {
    return {
      type: 'remote',
      endpoint: url,
      params: {
        [searchParam]: '$search',
      },
    };
  }
}

// ============================================================================
// Common Transformations
// ============================================================================

export class DataTransformers {
  /**
   * Transform array to label/value options
   */
  static toOptions(labelKey: string = 'name', valueKey: string = 'id'): string {
    return `data.map(item => ({ label: item.${labelKey}, value: item.${valueKey} }))`;
  }

  /**
   * Filter data
   */
  static filter(predicate: string): string {
    return `data.filter(item => ${predicate})`;
  }

  /**
   * Sort data
   */
  static sort(key: string, order: 'asc' | 'desc' = 'asc'): string {
    const comparator =
      order === 'asc'
        ? `(a, b) => a.${key} > b.${key} ? 1 : -1`
        : `(a, b) => a.${key} < b.${key} ? 1 : -1`;
    return `data.sort(${comparator})`;
  }

  /**
   * Map data
   */
  static map(expression: string): string {
    return `data.map(item => ${expression})`;
  }

  /**
   * Extract nested property
   */
  static extract(path: string): string {
    return `data.${path}`;
  }

  /**
   * Combine transformations
   */
  static pipe(...transforms: string[]): string {
    return transforms.reduce((acc, transform, index) => {
      if (index === 0) return transform;
      return transform.replace('data', `(${acc})`);
    });
  }
}

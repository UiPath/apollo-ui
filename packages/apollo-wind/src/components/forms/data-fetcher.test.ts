import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  DataFetcher,
  DataSourceBuilder,
  DataTransformers,
  FetchAdapter,
  type DataAdapter,
  type AdapterRequest,
  type AdapterResponse,
} from "./data-fetcher";
import type { DataSource } from "./form-schema";

// Mock adapter for testing
class MockAdapter implements DataAdapter {
  public lastRequest: AdapterRequest | null = null;
  public mockResponse: AdapterResponse = { data: [], status: 200, ok: true };

  async fetch(request: AdapterRequest): Promise<AdapterResponse> {
    this.lastRequest = request;
    return this.mockResponse;
  }
}

describe("DataFetcher", () => {
  let mockAdapter: MockAdapter;

  beforeEach(() => {
    mockAdapter = new MockAdapter();
    DataFetcher.setAdapter(mockAdapter);
    DataFetcher.clearCache();
  });

  afterEach(() => {
    DataFetcher.resetAdapter();
    DataFetcher.clearCache();
  });

  describe("adapter management", () => {
    it("sets custom adapter", () => {
      const customAdapter = new MockAdapter();
      DataFetcher.setAdapter(customAdapter);
      expect(DataFetcher.getAdapter()).toBe(customAdapter);
    });

    it("resets to default FetchAdapter", () => {
      DataFetcher.resetAdapter();
      expect(DataFetcher.getAdapter()).toBeInstanceOf(FetchAdapter);
    });
  });

  describe("fetchStatic", () => {
    it("returns static options directly", async () => {
      const source: DataSource = {
        type: "static",
        options: [
          { label: "Option 1", value: "1" },
          { label: "Option 2", value: "2" },
        ],
      };

      const result = await DataFetcher.fetch(source, {});
      expect(result).toEqual([
        { label: "Option 1", value: "1" },
        { label: "Option 2", value: "2" },
      ]);
    });
  });

  describe("fetchRemote", () => {
    it("fetches data using adapter for fetch type", async () => {
      mockAdapter.mockResponse = {
        data: [{ id: 1, name: "Item 1" }],
        status: 200,
        ok: true,
      };

      const source: DataSource = {
        type: "fetch",
        url: "https://api.example.com/items",
        method: "GET",
      };

      const result = await DataFetcher.fetch(source, {});
      expect(result).toEqual([{ id: 1, name: "Item 1" }]);
      expect(mockAdapter.lastRequest?.url).toBe("https://api.example.com/items");
      expect(mockAdapter.lastRequest?.method).toBe("GET");
    });

    it("fetches data using adapter for remote type", async () => {
      mockAdapter.mockResponse = {
        data: [{ id: 1, name: "Item 1" }],
        status: 200,
        ok: true,
      };

      const source: DataSource = {
        type: "remote",
        endpoint: "https://api.example.com/data",
      };

      const result = await DataFetcher.fetch(source, {});
      expect(result).toEqual([{ id: 1, name: "Item 1" }]);
      expect(mockAdapter.lastRequest?.url).toBe("https://api.example.com/data");
    });

    it("throws error on failed response", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

      mockAdapter.mockResponse = {
        data: null,
        status: 500,
        ok: false,
      };

      const source: DataSource = {
        type: "fetch",
        url: "https://api.example.com/items",
        method: "GET",
      };

      await expect(DataFetcher.fetch(source, {})).rejects.toThrow("HTTP error! status: 500");
      expect(consoleSpy).toHaveBeenCalledWith("Data fetch error:", expect.any(Error));
      consoleSpy.mockRestore();
    });

    it("applies transform to fetched data", async () => {
      mockAdapter.mockResponse = {
        data: [
          { id: 1, name: "Item 1" },
          { id: 2, name: "Item 2" },
        ],
        status: 200,
        ok: true,
      };

      const source: DataSource = {
        type: "fetch",
        url: "https://api.example.com/items",
        method: "GET",
        transform: "data.map(item => ({ label: item.name, value: item.id }))",
      };

      const result = await DataFetcher.fetch(source, {});
      expect(result).toEqual([
        { label: "Item 1", value: 1 },
        { label: "Item 2", value: 2 },
      ]);
    });

    it("resolves $field references in params", async () => {
      mockAdapter.mockResponse = { data: [], status: 200, ok: true };

      const source: DataSource = {
        type: "remote",
        endpoint: "https://api.example.com/items",
        params: {
          categoryId: "$category",
          search: "$searchTerm",
        },
      };

      await DataFetcher.fetch(source, { category: "electronics", searchTerm: "phone" });
      expect(mockAdapter.lastRequest?.params).toEqual({
        categoryId: "electronics",
        search: "phone",
      });
    });
  });

  describe("cache behavior", () => {
    it("returns cached data on second request", async () => {
      mockAdapter.mockResponse = {
        data: [{ id: 1 }],
        status: 200,
        ok: true,
      };

      const source: DataSource = {
        type: "fetch",
        url: "https://api.example.com/items",
        method: "GET",
      };

      // First request
      await DataFetcher.fetch(source, {});
      expect(mockAdapter.lastRequest).not.toBeNull();

      // Reset to track second call
      mockAdapter.lastRequest = null;
      mockAdapter.mockResponse = { data: [{ id: 2 }], status: 200, ok: true };

      // Second request - should use cache
      const result = await DataFetcher.fetch(source, {});
      expect(mockAdapter.lastRequest).toBeNull(); // adapter not called
      expect(result).toEqual([{ id: 1 }]); // still first result
    });

    it("clears all cache", async () => {
      mockAdapter.mockResponse = { data: [{ id: 1 }], status: 200, ok: true };

      const source: DataSource = {
        type: "fetch",
        url: "https://api.example.com/items",
        method: "GET",
      };

      await DataFetcher.fetch(source, {});
      DataFetcher.clearCache();

      // Update mock response
      mockAdapter.mockResponse = { data: [{ id: 2 }], status: 200, ok: true };

      // Should fetch fresh data
      const result = await DataFetcher.fetch(source, {});
      expect(result).toEqual([{ id: 2 }]);
    });

    it("clears cache by pattern", async () => {
      mockAdapter.mockResponse = { data: [], status: 200, ok: true };

      const source1: DataSource = {
        type: "fetch",
        url: "https://api.example.com/users",
        method: "GET",
      };
      const source2: DataSource = {
        type: "fetch",
        url: "https://api.example.com/items",
        method: "GET",
      };

      await DataFetcher.fetch(source1, {});
      await DataFetcher.fetch(source2, {});

      // Clear only users cache
      DataFetcher.clearCache("users");

      mockAdapter.mockResponse = { data: [{ new: true }], status: 200, ok: true };
      mockAdapter.lastRequest = null;

      // Users should refetch
      await DataFetcher.fetch(source1, {});
      expect(mockAdapter.lastRequest?.url).toContain("users");

      mockAdapter.lastRequest = null;

      // Items should still use cache
      await DataFetcher.fetch(source2, {});
      expect(mockAdapter.lastRequest).toBeNull();
    });
  });

  describe("fetchComputed", () => {
    it("computes value from dependencies", async () => {
      const source: DataSource = {
        type: "computed",
        dependency: ["price", "quantity"],
        compute: "price * quantity",
      };

      const result = await DataFetcher.fetch(source, { price: 10, quantity: 5 });
      expect(result).toBe(50);
    });

    it("handles undefined dependencies", async () => {
      const source: DataSource = {
        type: "computed",
        dependency: ["missing"],
        compute: "missing || 'default'",
      };

      const result = await DataFetcher.fetch(source, {});
      expect(result).toBe("default");
    });

    it("returns undefined on compute error", async () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

      const source: DataSource = {
        type: "computed",
        dependency: ["value"],
        compute: "value.invalid.path()",
      };

      const result = await DataFetcher.fetch(source, { value: null });
      expect(result).toBeUndefined();

      consoleSpy.mockRestore();
    });
  });
});

describe("DataSourceBuilder", () => {
  it("creates static data source", () => {
    const options = [
      { label: "A", value: "a" },
      { label: "B", value: "b" },
    ];
    const source = DataSourceBuilder.static(options);

    expect(source).toEqual({
      type: "static",
      options,
    });
  });

  it("creates GET remote data source", () => {
    const source = DataSourceBuilder.get("https://api.example.com/items", { limit: 10 });

    expect(source).toEqual({
      type: "remote",
      endpoint: "https://api.example.com/items",
      params: { limit: 10 },
    });
  });

  it("creates POST fetch data source", () => {
    const source = DataSourceBuilder.post("https://api.example.com/items");

    expect(source).toEqual({
      type: "fetch",
      url: "https://api.example.com/items",
      method: "POST",
      transform: "data",
    });
  });

  it("creates computed data source", () => {
    const source = DataSourceBuilder.computed(["a", "b"], "a + b");

    expect(source).toEqual({
      type: "computed",
      dependency: ["a", "b"],
      compute: "a + b",
    });
  });

  it("creates dependent data source", () => {
    const source = DataSourceBuilder.dependent(
      "https://api.example.com/cities",
      "countryId",
      "country",
    );

    expect(source).toEqual({
      type: "remote",
      endpoint: "https://api.example.com/cities",
      params: { country: "$countryId" },
    });
  });

  it("creates searchable data source", () => {
    const source = DataSourceBuilder.searchable("https://api.example.com/search", "query");

    expect(source).toEqual({
      type: "remote",
      endpoint: "https://api.example.com/search",
      params: { query: "$search" },
    });
  });
});

describe("DataTransformers", () => {
  it("creates toOptions transform", () => {
    const transform = DataTransformers.toOptions("title", "code");
    expect(transform).toBe("data.map(item => ({ label: item.title, value: item.code }))");
  });

  it("creates filter transform", () => {
    const transform = DataTransformers.filter("item.active === true");
    expect(transform).toBe("data.filter(item => item.active === true)");
  });

  it("creates sort transform ascending", () => {
    const transform = DataTransformers.sort("name", "asc");
    expect(transform).toContain("sort");
    expect(transform).toContain("name");
  });

  it("creates sort transform descending", () => {
    const transform = DataTransformers.sort("name", "desc");
    expect(transform).toContain("sort");
  });

  it("creates map transform", () => {
    const transform = DataTransformers.map("{ ...item, processed: true }");
    expect(transform).toBe("data.map(item => { ...item, processed: true })");
  });

  it("creates extract transform", () => {
    const transform = DataTransformers.extract("results.items");
    expect(transform).toBe("data.results.items");
  });

  it("pipes multiple transforms", () => {
    const transform = DataTransformers.pipe(
      DataTransformers.extract("items"),
      DataTransformers.filter("item.active"),
    );
    expect(transform).toContain("data.items");
    expect(transform).toContain("filter");
  });
});

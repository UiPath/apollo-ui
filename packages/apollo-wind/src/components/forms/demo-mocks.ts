/**
 * Internal mock data for demos and Storybook
 * NOT exported to library consumers
 */

import {
  DataFetcher,
  type DataAdapter,
  type AdapterRequest,
  type AdapterResponse,
} from "./data-fetcher";

// ============================================================================
// Mock Adapter (internal only)
// ============================================================================

type MockHandler = (params: Record<string, unknown>) => unknown;

/**
 * Mock adapter for demos - NOT exported to library consumers
 */
class MockAdapter implements DataAdapter {
  private handlers = new Map<string, MockHandler>();

  register(urlPattern: string, handler: MockHandler): this {
    this.handlers.set(urlPattern, handler);
    return this;
  }

  clear(): void {
    this.handlers.clear();
  }

  private findHandler(url: string): MockHandler | undefined {
    if (this.handlers.has(url)) {
      return this.handlers.get(url);
    }

    for (const [pattern, handler] of this.handlers) {
      if (pattern.includes("*")) {
        const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
        if (regex.test(url)) {
          return handler;
        }
      }
    }

    return undefined;
  }

  async fetch(request: AdapterRequest): Promise<AdapterResponse> {
    const handler = this.findHandler(request.url);

    if (!handler) {
      console.warn(`MockAdapter: No handler registered for ${request.url}`);
      return { data: null, status: 404, ok: false };
    }

    const params =
      request.method === "POST" ? (request.body as Record<string, unknown>) : request.params;
    const data = handler(params || {});

    return { data, status: 200, ok: true };
  }
}

// ============================================================================
// Mock Data for Demos and Testing
// ============================================================================

const mockCountries = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "UK", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
];

const mockStates: Record<string, { code: string; name: string }[]> = {
  US: [
    { code: "CA", name: "California" },
    { code: "NY", name: "New York" },
    { code: "TX", name: "Texas" },
    { code: "FL", name: "Florida" },
    { code: "WA", name: "Washington" },
  ],
  CA: [
    { code: "ON", name: "Ontario" },
    { code: "QC", name: "Quebec" },
    { code: "BC", name: "British Columbia" },
    { code: "AB", name: "Alberta" },
  ],
  UK: [
    { code: "ENG", name: "England" },
    { code: "SCO", name: "Scotland" },
    { code: "WAL", name: "Wales" },
    { code: "NIR", name: "Northern Ireland" },
  ],
  AU: [
    { code: "NSW", name: "New South Wales" },
    { code: "VIC", name: "Victoria" },
    { code: "QLD", name: "Queensland" },
  ],
  DE: [
    { code: "BY", name: "Bavaria" },
    { code: "BE", name: "Berlin" },
    { code: "HH", name: "Hamburg" },
  ],
  FR: [
    { code: "IDF", name: "Île-de-France" },
    { code: "PACA", name: "Provence-Alpes-Côte d'Azur" },
    { code: "ARA", name: "Auvergne-Rhône-Alpes" },
  ],
  JP: [
    { code: "TK", name: "Tokyo" },
    { code: "OS", name: "Osaka" },
    { code: "KY", name: "Kyoto" },
  ],
};

const mockCities: Record<string, Record<string, { code: string; name: string }[]>> = {
  US: {
    CA: [
      { code: "LA", name: "Los Angeles" },
      { code: "SF", name: "San Francisco" },
      { code: "SD", name: "San Diego" },
    ],
    NY: [
      { code: "NYC", name: "New York City" },
      { code: "BUF", name: "Buffalo" },
      { code: "ALB", name: "Albany" },
    ],
    TX: [
      { code: "HOU", name: "Houston" },
      { code: "DAL", name: "Dallas" },
      { code: "AUS", name: "Austin" },
    ],
    FL: [
      { code: "MIA", name: "Miami" },
      { code: "ORL", name: "Orlando" },
      { code: "TAM", name: "Tampa" },
    ],
    WA: [
      { code: "SEA", name: "Seattle" },
      { code: "TAC", name: "Tacoma" },
      { code: "SPO", name: "Spokane" },
    ],
  },
  CA: {
    ON: [
      { code: "TOR", name: "Toronto" },
      { code: "OTT", name: "Ottawa" },
      { code: "MIS", name: "Mississauga" },
    ],
    QC: [
      { code: "MTL", name: "Montreal" },
      { code: "QBC", name: "Quebec City" },
    ],
    BC: [
      { code: "VAN", name: "Vancouver" },
      { code: "VIC", name: "Victoria" },
    ],
    AB: [
      { code: "CAL", name: "Calgary" },
      { code: "EDM", name: "Edmonton" },
    ],
  },
  UK: {
    ENG: [
      { code: "LON", name: "London" },
      { code: "MAN", name: "Manchester" },
      { code: "BIR", name: "Birmingham" },
    ],
    SCO: [
      { code: "EDI", name: "Edinburgh" },
      { code: "GLA", name: "Glasgow" },
    ],
    WAL: [{ code: "CAR", name: "Cardiff" }],
    NIR: [{ code: "BEL", name: "Belfast" }],
  },
};

const mockProductCategories = {
  categories: [
    { id: "electronics", name: "Electronics" },
    { id: "clothing", name: "Clothing" },
    { id: "furniture", name: "Furniture" },
    { id: "software", name: "Software" },
  ],
};

const mockProducts: Record<string, { id: string; name: string }[]> = {
  electronics: [
    { id: "laptop", name: "Laptop" },
    { id: "phone", name: "Smartphone" },
    { id: "tablet", name: "Tablet" },
    { id: "headphones", name: "Headphones" },
  ],
  clothing: [
    { id: "shirt", name: "T-Shirt" },
    { id: "pants", name: "Pants" },
    { id: "jacket", name: "Jacket" },
  ],
  furniture: [
    { id: "desk", name: "Office Desk" },
    { id: "chair", name: "Office Chair" },
    { id: "bookshelf", name: "Bookshelf" },
  ],
  software: [
    { id: "studio", name: "UiPath Studio" },
    { id: "orchestrator", name: "UiPath Orchestrator" },
    { id: "assistant", name: "UiPath Assistant" },
  ],
};

const mockProductVariants: Record<string, { id: string; name: string; price: number }[]> = {
  laptop: [
    { id: "laptop-basic", name: "Basic - 8GB RAM", price: 799 },
    { id: "laptop-pro", name: "Pro - 16GB RAM", price: 1299 },
    { id: "laptop-ultra", name: "Ultra - 32GB RAM", price: 1999 },
  ],
  phone: [
    { id: "phone-128", name: "128GB Storage", price: 699 },
    { id: "phone-256", name: "256GB Storage", price: 799 },
    { id: "phone-512", name: "512GB Storage", price: 999 },
  ],
  tablet: [
    { id: "tablet-wifi", name: "WiFi Only", price: 449 },
    { id: "tablet-cellular", name: "WiFi + Cellular", price: 599 },
  ],
  headphones: [
    { id: "hp-wired", name: "Wired", price: 99 },
    { id: "hp-wireless", name: "Wireless", price: 199 },
    { id: "hp-pro", name: "Pro Wireless ANC", price: 349 },
  ],
  shirt: [
    { id: "shirt-s", name: "Small", price: 29 },
    { id: "shirt-m", name: "Medium", price: 29 },
    { id: "shirt-l", name: "Large", price: 29 },
    { id: "shirt-xl", name: "X-Large", price: 32 },
  ],
  desk: [
    { id: "desk-std", name: "Standard", price: 299 },
    { id: "desk-adj", name: "Adjustable Height", price: 599 },
    { id: "desk-exec", name: "Executive", price: 899 },
  ],
  chair: [
    { id: "chair-basic", name: "Basic", price: 149 },
    { id: "chair-ergo", name: "Ergonomic", price: 399 },
    { id: "chair-exec", name: "Executive", price: 699 },
  ],
  studio: [
    { id: "studio-community", name: "Community (Free)", price: 0 },
    { id: "studio-pro", name: "Pro", price: 420 },
    { id: "studio-enterprise", name: "Enterprise", price: 0 },
  ],
};

const mockDepartments = [
  { id: "engineering", name: "Engineering" },
  { id: "product", name: "Product" },
  { id: "design", name: "Design" },
  { id: "marketing", name: "Marketing" },
  { id: "sales", name: "Sales" },
  { id: "hr", name: "Human Resources" },
  { id: "finance", name: "Finance" },
];

const mockPositions: Record<string, { id: string; name: string }[]> = {
  engineering: [
    { id: "swe", name: "Software Engineer" },
    { id: "swe-sr", name: "Senior Software Engineer" },
    { id: "staff", name: "Staff Engineer" },
    { id: "em", name: "Engineering Manager" },
    { id: "devops", name: "DevOps Engineer" },
  ],
  product: [
    { id: "pm", name: "Product Manager" },
    { id: "pm-sr", name: "Senior Product Manager" },
    { id: "po", name: "Product Owner" },
  ],
  design: [
    { id: "ux", name: "UX Designer" },
    { id: "ui", name: "UI Designer" },
    { id: "ux-sr", name: "Senior UX Designer" },
  ],
  marketing: [
    { id: "mm", name: "Marketing Manager" },
    { id: "content", name: "Content Specialist" },
    { id: "growth", name: "Growth Marketing" },
  ],
  sales: [
    { id: "ae", name: "Account Executive" },
    { id: "sdr", name: "Sales Development Rep" },
    { id: "sm", name: "Sales Manager" },
  ],
  hr: [
    { id: "recruiter", name: "Recruiter" },
    { id: "hrbp", name: "HR Business Partner" },
  ],
  finance: [
    { id: "accountant", name: "Accountant" },
    { id: "analyst", name: "Financial Analyst" },
    { id: "controller", name: "Controller" },
  ],
};

const mockOrchestratorFolders = {
  value: [
    { Id: 1, DisplayName: "Production" },
    { Id: 2, DisplayName: "Development" },
    { Id: 3, DisplayName: "Testing" },
    { Id: 4, DisplayName: "Shared" },
  ],
};

const mockOrchestratorProcesses: Record<string, { id: string; name: string }[]> = {
  "1": [
    { id: "invoice-proc", name: "Invoice Processing" },
    { id: "email-auto", name: "Email Automation" },
    { id: "data-extract", name: "Data Extraction" },
  ],
  "2": [
    { id: "test-proc", name: "Test Process" },
    { id: "demo-workflow", name: "Demo Workflow" },
  ],
  "3": [
    { id: "qa-test", name: "QA Testing" },
    { id: "regression", name: "Regression Suite" },
  ],
  "4": [
    { id: "utility", name: "Utility Functions" },
    { id: "shared-lib", name: "Shared Library" },
  ],
};

const mockPackageVersions: Record<string, { id: string; name: string }[]> = {
  "invoice-proc": [
    { id: "v1.0.0", name: "1.0.0" },
    { id: "v1.1.0", name: "1.1.0" },
    { id: "v2.0.0", name: "2.0.0 (latest)" },
  ],
  "email-auto": [
    { id: "v1.0.0", name: "1.0.0" },
    { id: "v1.0.1", name: "1.0.1 (latest)" },
  ],
  "data-extract": [{ id: "v1.0.0", name: "1.0.0 (latest)" }],
  "test-proc": [{ id: "v0.1.0", name: "0.1.0 (dev)" }],
  "demo-workflow": [
    { id: "v1.0.0", name: "1.0.0" },
    { id: "v1.1.0", name: "1.1.0 (latest)" },
  ],
};

const mockRobots: Record<string, { id: string; name: string }[]> = {
  "1": [
    { id: "robot-1", name: "PROD-ROBOT-01" },
    { id: "robot-2", name: "PROD-ROBOT-02" },
    { id: "robot-3", name: "PROD-ROBOT-03" },
  ],
  "2": [
    { id: "dev-robot-1", name: "DEV-ROBOT-01" },
    { id: "dev-robot-2", name: "DEV-ROBOT-02" },
  ],
  "3": [{ id: "test-robot-1", name: "TEST-ROBOT-01" }],
  "4": [{ id: "shared-robot", name: "SHARED-ROBOT-01" }],
};

const mockTimezones = [
  { label: "Pacific Time (US)", value: "America/Los_Angeles" },
  { label: "Mountain Time (US)", value: "America/Denver" },
  { label: "Central Time (US)", value: "America/Chicago" },
  { label: "Eastern Time (US)", value: "America/New_York" },
  { label: "UTC", value: "UTC" },
  { label: "Central European Time", value: "Europe/Berlin" },
  { label: "British Time", value: "Europe/London" },
  { label: "Japan Standard Time", value: "Asia/Tokyo" },
  { label: "Australian Eastern Time", value: "Australia/Sydney" },
];

const mockSurveyProducts = [
  { id: "studio", name: "UiPath Studio" },
  { id: "orchestrator", name: "UiPath Orchestrator" },
  { id: "assistant", name: "UiPath Assistant" },
  { id: "automation-hub", name: "Automation Hub" },
  { id: "insights", name: "UiPath Insights" },
  { id: "document-understanding", name: "Document Understanding" },
  { id: "test-suite", name: "Test Suite" },
];

/**
 * Create a MockAdapter configured with all demo handlers
 */
function createDemoMockAdapter(): MockAdapter {
  const adapter = new MockAdapter();

  // Countries
  adapter.register("/api/countries", () => mockCountries);

  // States (dependent on country)
  adapter.register("/api/states", (params) => {
    const countryCode = params.countryCode as string;
    const states = mockStates[countryCode] || [];
    return states.map((s) => ({ label: s.name, value: s.code }));
  });

  // Cities (dependent on country and state)
  adapter.register("/api/cities", (params) => {
    const countryCode = params.countryCode as string;
    const stateCode = params.stateCode as string;
    const cities = mockCities[countryCode]?.[stateCode] || [];
    return cities.map((c) => ({ label: c.name, value: c.code }));
  });

  // Product categories
  adapter.register("/api/product-categories", () => mockProductCategories);

  // Products (dependent on category)
  adapter.register("/api/products", (params) => {
    const categoryId = params.categoryId as string;
    if (categoryId) {
      const products = mockProducts[categoryId] || [];
      return products.map((p) => ({ label: p.name, value: p.id }));
    }
    // For survey - return all products
    return mockSurveyProducts;
  });

  // Product variants (dependent on product)
  adapter.register("/api/product-variants", (params) => {
    const productId = params.productId as string;
    const variants = mockProductVariants[productId] || [];
    return variants.map((v) => ({ label: `${v.name} - $${v.price}`, value: v.id, price: v.price }));
  });

  // Departments
  adapter.register("/api/departments", () => mockDepartments);

  // Positions (dependent on department)
  adapter.register("/api/positions", (params) => {
    const departmentId = params.departmentId as string;
    const positions = mockPositions[departmentId] || [];
    return positions.map((p) => ({ label: p.name, value: p.id }));
  });

  // Orchestrator folders
  adapter.register("/api/orchestrator/folders", () => mockOrchestratorFolders);

  // Orchestrator processes (dependent on folder)
  adapter.register("/api/orchestrator/processes", (params) => {
    const folderId = String(params.folderId);
    const processes = mockOrchestratorProcesses[folderId] || [];
    return processes.map((p) => ({ label: p.name, value: p.id }));
  });

  // Package versions (dependent on process)
  adapter.register("/api/orchestrator/package-versions", (params) => {
    const processKey = params.processKey as string;
    const versions = mockPackageVersions[processKey] || [];
    return versions.map((v) => ({ label: v.name, value: v.id }));
  });

  // Robots (dependent on folder)
  adapter.register("/api/orchestrator/robots", (params) => {
    const folderId = String(params.folderId);
    const robots = mockRobots[folderId] || [];
    return robots.map((r) => ({ label: r.name, value: r.id }));
  });

  // Timezones
  adapter.register("/api/timezones", () => mockTimezones);

  return adapter;
}

/**
 * Setup demo mocks by configuring DataFetcher with a MockAdapter
 *
 * @internal - Not exported to library consumers
 */
export function setupDemoMocks(): void {
  DataFetcher.clearCache();
  DataFetcher.setAdapter(createDemoMockAdapter());
}

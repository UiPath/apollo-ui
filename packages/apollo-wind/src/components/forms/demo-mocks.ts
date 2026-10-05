/**
 * Internal mock data for demos and Storybook
 * NOT exported to library consumers
 */

import {
  type AdapterRequest,
  type AdapterResponse,
  type DataAdapter,
  DataFetcher,
} from './data-fetcher';

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
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
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
      request.method === 'POST' ? (request.body as Record<string, unknown>) : request.params;
    const data = handler(params || {});

    return { data, status: 200, ok: true };
  }
}

// ============================================================================
// Mock Data for Demos and Testing
// ============================================================================

const mockCountries = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
];

const mockStates: Record<string, { code: string; name: string }[]> = {
  US: [
    { code: 'CA', name: 'California' },
    { code: 'NY', name: 'New York' },
    { code: 'TX', name: 'Texas' },
    { code: 'FL', name: 'Florida' },
    { code: 'WA', name: 'Washington' },
  ],
  CA: [
    { code: 'ON', name: 'Ontario' },
    { code: 'QC', name: 'Quebec' },
    { code: 'BC', name: 'British Columbia' },
    { code: 'AB', name: 'Alberta' },
  ],
  UK: [
    { code: 'ENG', name: 'England' },
    { code: 'SCO', name: 'Scotland' },
    { code: 'WAL', name: 'Wales' },
    { code: 'NIR', name: 'Northern Ireland' },
  ],
  AU: [
    { code: 'NSW', name: 'New South Wales' },
    { code: 'VIC', name: 'Victoria' },
    { code: 'QLD', name: 'Queensland' },
  ],
  DE: [
    { code: 'BY', name: 'Bavaria' },
    { code: 'BE', name: 'Berlin' },
    { code: 'HH', name: 'Hamburg' },
  ],
  FR: [
    { code: 'IDF', name: 'Île-de-France' },
    { code: 'PACA', name: "Provence-Alpes-Côte d'Azur" },
    { code: 'ARA', name: 'Auvergne-Rhône-Alpes' },
  ],
  JP: [
    { code: 'TK', name: 'Tokyo' },
    { code: 'OS', name: 'Osaka' },
    { code: 'KY', name: 'Kyoto' },
  ],
};

const mockCities: Record<string, Record<string, { code: string; name: string }[]>> = {
  US: {
    CA: [
      { code: 'LA', name: 'Los Angeles' },
      { code: 'SF', name: 'San Francisco' },
      { code: 'SD', name: 'San Diego' },
    ],
    NY: [
      { code: 'NYC', name: 'New York City' },
      { code: 'BUF', name: 'Buffalo' },
      { code: 'ALB', name: 'Albany' },
    ],
    TX: [
      { code: 'HOU', name: 'Houston' },
      { code: 'DAL', name: 'Dallas' },
      { code: 'AUS', name: 'Austin' },
    ],
    FL: [
      { code: 'MIA', name: 'Miami' },
      { code: 'ORL', name: 'Orlando' },
      { code: 'TAM', name: 'Tampa' },
    ],
    WA: [
      { code: 'SEA', name: 'Seattle' },
      { code: 'TAC', name: 'Tacoma' },
      { code: 'SPO', name: 'Spokane' },
    ],
  },
  CA: {
    ON: [
      { code: 'TOR', name: 'Toronto' },
      { code: 'OTT', name: 'Ottawa' },
      { code: 'MIS', name: 'Mississauga' },
    ],
    QC: [
      { code: 'MTL', name: 'Montreal' },
      { code: 'QBC', name: 'Quebec City' },
    ],
    BC: [
      { code: 'VAN', name: 'Vancouver' },
      { code: 'VIC', name: 'Victoria' },
    ],
    AB: [
      { code: 'CAL', name: 'Calgary' },
      { code: 'EDM', name: 'Edmonton' },
    ],
  },
  UK: {
    ENG: [
      { code: 'LON', name: 'London' },
      { code: 'MAN', name: 'Manchester' },
      { code: 'BIR', name: 'Birmingham' },
    ],
    SCO: [
      { code: 'EDI', name: 'Edinburgh' },
      { code: 'GLA', name: 'Glasgow' },
    ],
    WAL: [{ code: 'CAR', name: 'Cardiff' }],
    NIR: [{ code: 'BEL', name: 'Belfast' }],
  },
};

const mockDepartments = [
  { id: 'engineering', name: 'Engineering' },
  { id: 'product', name: 'Product' },
  { id: 'design', name: 'Design' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'sales', name: 'Sales' },
  { id: 'hr', name: 'Human Resources' },
  { id: 'finance', name: 'Finance' },
];

const mockPositions: Record<string, { id: string; name: string }[]> = {
  engineering: [
    { id: 'swe', name: 'Software Engineer' },
    { id: 'swe-sr', name: 'Senior Software Engineer' },
    { id: 'staff', name: 'Staff Engineer' },
    { id: 'em', name: 'Engineering Manager' },
    { id: 'devops', name: 'DevOps Engineer' },
  ],
  product: [
    { id: 'pm', name: 'Product Manager' },
    { id: 'pm-sr', name: 'Senior Product Manager' },
    { id: 'po', name: 'Product Owner' },
  ],
  design: [
    { id: 'ux', name: 'UX Designer' },
    { id: 'ui', name: 'UI Designer' },
    { id: 'ux-sr', name: 'Senior UX Designer' },
  ],
  marketing: [
    { id: 'mm', name: 'Marketing Manager' },
    { id: 'content', name: 'Content Specialist' },
    { id: 'growth', name: 'Growth Marketing' },
  ],
  sales: [
    { id: 'ae', name: 'Account Executive' },
    { id: 'sdr', name: 'Sales Development Rep' },
    { id: 'sm', name: 'Sales Manager' },
  ],
  hr: [
    { id: 'recruiter', name: 'Recruiter' },
    { id: 'hrbp', name: 'HR Business Partner' },
  ],
  finance: [
    { id: 'accountant', name: 'Accountant' },
    { id: 'analyst', name: 'Financial Analyst' },
    { id: 'controller', name: 'Controller' },
  ],
};

const mockTimezones = [
  { label: 'Pacific Time (US)', value: 'America/Los_Angeles' },
  { label: 'Mountain Time (US)', value: 'America/Denver' },
  { label: 'Central Time (US)', value: 'America/Chicago' },
  { label: 'Eastern Time (US)', value: 'America/New_York' },
  { label: 'UTC', value: 'UTC' },
  { label: 'Central European Time', value: 'Europe/Berlin' },
  { label: 'British Time', value: 'Europe/London' },
  { label: 'Japan Standard Time', value: 'Asia/Tokyo' },
  { label: 'Australian Eastern Time', value: 'Australia/Sydney' },
];

/**
 * Create a MockAdapter configured with all demo handlers
 */
function createDemoMockAdapter(): MockAdapter {
  const adapter = new MockAdapter();

  // Countries
  adapter.register('/api/countries', () => mockCountries);

  // States (dependent on country)
  adapter.register('/api/states', (params) => {
    const countryCode = params.countryCode as string;
    const states = mockStates[countryCode] || [];
    return states.map((s) => ({ label: s.name, value: s.code }));
  });

  // Cities (dependent on country and state)
  adapter.register('/api/cities', (params) => {
    const countryCode = params.countryCode as string;
    const stateCode = params.stateCode as string;
    const cities = mockCities[countryCode]?.[stateCode] || [];
    return cities.map((c) => ({ label: c.name, value: c.code }));
  });

  // Departments
  adapter.register('/api/departments', () => mockDepartments);

  // Positions (dependent on department)
  adapter.register('/api/positions', (params) => {
    const departmentId = params.departmentId as string;
    const positions = mockPositions[departmentId] || [];
    return positions.map((p) => ({ label: p.name, value: p.id }));
  });

  // Timezones
  adapter.register('/api/timezones', () => mockTimezones);

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

import type { Meta } from '@storybook/react-vite';
import { UserRound } from 'lucide-react';
import * as React from 'react';
import { Label } from './label';
import { MultiSelect, type MultiSelectOption } from './multi-select';

const meta = {
  title: 'Components/Core/Multi Select',
  component: MultiSelect,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MultiSelect>;

export default meta;

const frameworkOptions = [
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
  { label: 'Angular', value: 'angular' },
  { label: 'Svelte', value: 'svelte' },
  { label: 'Next.js', value: 'nextjs' },
  { label: 'Nuxt', value: 'nuxt' },
  { label: 'Remix', value: 'remix' },
  { label: 'Astro', value: 'astro' },
];

export const Default = {
  args: {},
  render: () => {
    const [selected, setSelected] = React.useState<string[]>([]);
    return (
      <div className="w-[400px]">
        <MultiSelect
          options={frameworkOptions}
          selected={selected}
          onChange={setSelected}
          placeholder="Select frameworks..."
        />
      </div>
    );
  },
};

export const WithPreselected = {
  args: {},
  render: () => {
    const [selected, setSelected] = React.useState<string[]>(['react', 'vue', 'svelte']);
    return (
      <div className="w-[400px]">
        <MultiSelect
          options={frameworkOptions}
          selected={selected}
          onChange={setSelected}
          placeholder="Select frameworks..."
        />
      </div>
    );
  },
};

export const WithMaxSelected = {
  args: {},
  render: () => {
    const [selected, setSelected] = React.useState<string[]>(['react']);
    return (
      <div className="w-[400px] space-y-2">
        <MultiSelect
          options={frameworkOptions}
          selected={selected}
          onChange={setSelected}
          placeholder="Select up to 3 frameworks..."
          maxSelected={3}
        />
        <p className="text-xs text-muted-foreground">Selected: {selected.length} / 3</p>
      </div>
    );
  },
};

export const Disabled = {
  args: {},
  render: () => {
    const [selected, setSelected] = React.useState<string[]>(['react', 'vue']);
    return (
      <div className="w-[400px]">
        <MultiSelect
          options={frameworkOptions}
          selected={selected}
          onChange={setSelected}
          placeholder="Select frameworks..."
          disabled
        />
      </div>
    );
  },
};

export const CustomMessages = {
  args: {},
  render: () => {
    const [selected, setSelected] = React.useState<string[]>([]);
    return (
      <div className="w-[400px]">
        <MultiSelect
          options={frameworkOptions}
          selected={selected}
          onChange={setSelected}
          placeholder="Choose your frameworks..."
          emptyMessage="No frameworks match your search."
          searchPlaceholder="Search frameworks..."
        />
      </div>
    );
  },
};

// Synthetic people on the reserved example.com domain.
const users = [
  { id: 'U7K2M9QX1', name: 'Avery Stone', email: 'avery.stone@example.com' },
  { id: 'U3H8T4LW6', name: 'Blake Rivera', email: 'blake.rivera@example.com' },
  { id: 'U9P1D6RZ2', name: 'Casey Nguyen', email: 'casey.nguyen@example.com' },
  { id: 'U4N7F2JS8', name: 'Dana Okafor', email: 'dana.okafor@example.com' },
  { id: 'U6B3X8KM5', name: 'Elliot Park', email: 'elliot.park@example.com' },
  { id: 'U2Q9V5HT3', name: 'Farah Haddad', email: 'farah.haddad@example.com' },
  { id: 'U8C4L1YN7', name: 'Gabriel Moreau', email: 'gabriel.moreau@example.com' },
  { id: 'U5R6W3DP9', name: 'Hana Sato', email: 'hana.sato@example.com' },
  { id: 'U1M8J7GC4', name: 'Ivan Petrov', email: 'ivan.petrov@example.com' },
  { id: 'U7T2S9BF6', name: 'Jordan Ellis', email: 'jordan.ellis@example.com' },
  { id: 'U3Z5K4NA1', name: 'Kiran Shah', email: 'kiran.shah@example.com' },
  { id: 'U9E1H6VX8', name: 'Lena Fischer', email: 'lena.fischer@example.com' },
];

// Typed as the public option, so the shorter entries `onCreate` appends fit the same state.
const userOptions: MultiSelectOption[] = users.map((user) => ({
  label: user.name,
  value: user.id,
  description: user.email,
  icon: <UserRound />,
  // The workspace ID is not printed on the row, but a pasted ID should still find the person.
  keywords: [user.id],
}));

export const SelectUsers = {
  args: {},
  render: () => {
    const [options, setOptions] = React.useState(userOptions);
    const [selected, setSelected] = React.useState<string[]>([
      'U7K2M9QX1',
      'U3H8T4LW6',
      'U9P1D6RZ2',
      'U6B3X8KM5',
      'U8C4L1YN7',
    ]);

    return (
      <div className="w-[400px]">
        <MultiSelect
          options={options}
          selected={selected}
          onChange={setSelected}
          overflow="collapse"
          // A typed email or ID that is not in the list is added as its own entry and selected.
          onCreate={(query) => {
            setOptions((prev) => [...prev, { label: query, value: query, icon: <UserRound /> }]);
            setSelected((prev) => [...prev, query]);
          }}
          placeholder="Select recipients..."
          searchPlaceholder="Search by name, email or ID..."
          emptyMessage="No users found."
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Users as badges on a single line. `overflow="collapse"` keeps the field one line tall and counts the badges that do not fit as "+N more", measured against the field width. ' +
          'Each row shows the user icon, name and email. The search matches the name and email, and the workspace ID passed as a keyword. ' +
          'A search that is not an exact match offers `Add "<query>"` after the matches, so an email or ID outside the list can still be used. `onCreate` receives the text, and the story adds it as an option and selects it.',
      },
    },
  },
};

export const SelectCategories = {
  args: {},
  render: () => {
    const [selected, setSelected] = React.useState<string[]>([]);
    const categories = [
      { label: 'Technology', value: 'tech' },
      { label: 'Business', value: 'business' },
      { label: 'Science', value: 'science' },
      { label: 'Sports', value: 'sports' },
      { label: 'Entertainment', value: 'entertainment' },
      { label: 'Politics', value: 'politics' },
      { label: 'Health', value: 'health' },
      { label: 'Education', value: 'education' },
      { label: 'Travel', value: 'travel' },
      { label: 'Food', value: 'food' },
    ];

    return (
      <div className="w-[400px]">
        <MultiSelect
          options={categories}
          selected={selected}
          onChange={setSelected}
          placeholder="Select categories..."
        />
      </div>
    );
  },
};

export const Interactive = {
  args: {},
  render: () => {
    const [selected, setSelected] = React.useState<string[]>([]);
    const [searchResults, setSearchResults] = React.useState<string[]>([]);

    const skills = [
      { label: 'JavaScript', value: 'javascript' },
      { label: 'TypeScript', value: 'typescript' },
      { label: 'React', value: 'react' },
      { label: 'Vue', value: 'vue' },
      { label: 'Angular', value: 'angular' },
      { label: 'Node.js', value: 'nodejs' },
      { label: 'Python', value: 'python' },
      { label: 'Java', value: 'java' },
      { label: 'C++', value: 'cpp' },
      { label: 'Go', value: 'go' },
      { label: 'Rust', value: 'rust' },
      { label: 'SQL', value: 'sql' },
    ];

    React.useEffect(() => {
      const selectedSkills = skills
        .filter((skill) => selected.includes(skill.value))
        .map((skill) => skill.label);
      setSearchResults(selectedSkills);
    }, [selected]);

    return (
      <div className="w-[400px] space-y-4">
        <div>
          <span className="text-sm font-medium mb-2 block">Select your skills</span>
          <MultiSelect
            options={skills}
            selected={selected}
            onChange={setSelected}
            placeholder="Choose skills..."
            searchPlaceholder="Search skills..."
          />
        </div>
        {selected.length > 0 && (
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm font-medium">Your Profile</p>
            <p className="text-sm text-muted-foreground">Skills: {searchResults.join(', ')}</p>
            <p className="text-xs text-muted-foreground">
              {selected.length} skill{selected.length === 1 ? '' : 's'} selected
            </p>
          </div>
        )}
      </div>
    );
  },
};

export const WithInlineValidation = {
  render: () => {
    const [selected, setSelected] = React.useState<string[]>([]);
    return (
      <div className="grid w-[400px] gap-1.5">
        <Label htmlFor="multi-select-stages">Stages</Label>
        <MultiSelect
          id="multi-select-stages"
          options={[
            { label: 'Intake', value: 'intake' },
            { label: 'Review', value: 'review' },
            { label: 'Approval', value: 'approval' },
            { label: 'Closed', value: 'closed' },
          ]}
          selected={selected}
          onChange={setSelected}
          placeholder="Select stages"
          error={selected.length === 0 ? 'Select at least one stage.' : undefined}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Clear the error as soon as the selection satisfies the rule. ' +
          'The trigger exposes `aria-invalid` and associates the visible message with `aria-describedby` and `aria-errormessage` automatically.',
      },
    },
  },
};

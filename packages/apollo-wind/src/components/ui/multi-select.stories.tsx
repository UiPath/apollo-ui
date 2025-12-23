import type { Meta } from "@storybook/react-vite";
import * as React from "react";
import { MultiSelect } from "./multi-select";

const meta = {
  title: "Design System/Core/Multi Select",
  component: MultiSelect,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MultiSelect>;

export default meta;

const frameworkOptions = [
  { label: "React", value: "react" },
  { label: "Vue", value: "vue" },
  { label: "Angular", value: "angular" },
  { label: "Svelte", value: "svelte" },
  { label: "Next.js", value: "nextjs" },
  { label: "Nuxt", value: "nuxt" },
  { label: "Remix", value: "remix" },
  { label: "Astro", value: "astro" },
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
    const [selected, setSelected] = React.useState<string[]>(["react", "vue", "svelte"]);
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
    const [selected, setSelected] = React.useState<string[]>(["react"]);
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
    const [selected, setSelected] = React.useState<string[]>(["react", "vue"]);
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

export const SelectUsers = {
  args: {},
  render: () => {
    const [selected, setSelected] = React.useState<string[]>([]);
    const users = [
      { label: "John Doe", value: "john" },
      { label: "Jane Smith", value: "jane" },
      { label: "Bob Johnson", value: "bob" },
      { label: "Alice Williams", value: "alice" },
      { label: "Charlie Brown", value: "charlie" },
      { label: "Diana Prince", value: "diana" },
      { label: "Eve Anderson", value: "eve" },
      { label: "Frank Miller", value: "frank" },
    ];

    return (
      <div className="w-[400px] space-y-4">
        <MultiSelect
          options={users}
          selected={selected}
          onChange={setSelected}
          placeholder="Select team members..."
          emptyMessage="No users found."
        />
        {selected.length > 0 && (
          <div className="rounded-lg border p-4">
            <p className="mb-2 text-sm font-medium">
              Selected {selected.length} team member
              {selected.length === 1 ? "" : "s"}
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {selected.map((value) => {
                const user = users.find((u) => u.value === value);
                return <li key={value}>• {user?.label}</li>;
              })}
            </ul>
          </div>
        )}
      </div>
    );
  },
};

export const SelectCategories = {
  args: {},
  render: () => {
    const [selected, setSelected] = React.useState<string[]>([]);
    const categories = [
      { label: "Technology", value: "tech" },
      { label: "Business", value: "business" },
      { label: "Science", value: "science" },
      { label: "Sports", value: "sports" },
      { label: "Entertainment", value: "entertainment" },
      { label: "Politics", value: "politics" },
      { label: "Health", value: "health" },
      { label: "Education", value: "education" },
      { label: "Travel", value: "travel" },
      { label: "Food", value: "food" },
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
      { label: "JavaScript", value: "javascript" },
      { label: "TypeScript", value: "typescript" },
      { label: "React", value: "react" },
      { label: "Vue", value: "vue" },
      { label: "Angular", value: "angular" },
      { label: "Node.js", value: "nodejs" },
      { label: "Python", value: "python" },
      { label: "Java", value: "java" },
      { label: "C++", value: "cpp" },
      { label: "Go", value: "go" },
      { label: "Rust", value: "rust" },
      { label: "SQL", value: "sql" },
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
          <label className="text-sm font-medium mb-2 block">Select your skills</label>
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
            <p className="text-sm text-muted-foreground">Skills: {searchResults.join(", ")}</p>
            <p className="text-xs text-muted-foreground">
              {selected.length} skill{selected.length === 1 ? "" : "s"} selected
            </p>
          </div>
        )}
      </div>
    );
  },
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Search, SearchWithSuggestions } from "./search";

const meta = {
  title: "Design System/Core/Search",
  component: Search,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Search>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState("");
    return (
      <div className="w-[400px]">
        <Search placeholder="Search..." value={value} onChange={setValue} />
      </div>
    );
  },
};

export const WithValue: Story = {
  render: () => {
    const [value, setValue] = React.useState("React components");
    return (
      <div className="w-[400px]">
        <Search placeholder="Search..." value={value} onChange={setValue} />
      </div>
    );
  },
};

export const NoClearButton: Story = {
  render: () => {
    const [value, setValue] = React.useState("");
    return (
      <div className="w-[400px]">
        <Search placeholder="Search..." value={value} onChange={setValue} showClearButton={false} />
      </div>
    );
  },
};

export const WithSuggestions: Story = {
  render: () => {
    const [value, setValue] = React.useState("");
    const suggestions = [
      "React",
      "React Native",
      "React Router",
      "Redux",
      "TypeScript",
      "JavaScript",
      "Next.js",
      "Node.js",
      "Tailwind CSS",
      "Vue.js",
      "Angular",
      "Svelte",
    ];

    return (
      <div className="w-[400px]">
        <SearchWithSuggestions
          placeholder="Search frameworks..."
          value={value}
          onChange={setValue}
          suggestions={suggestions}
          onSelect={(selected) => console.log("Selected:", selected)}
        />
      </div>
    );
  },
};

export const WithCustomEmptyMessage: Story = {
  render: () => {
    const [value, setValue] = React.useState("");
    const suggestions = ["Apple", "Banana", "Cherry"];

    return (
      <div className="w-[400px]">
        <SearchWithSuggestions
          placeholder="Search fruits..."
          value={value}
          onChange={setValue}
          suggestions={suggestions}
          emptyMessage="No fruits match your search."
        />
      </div>
    );
  },
};

export const SearchUsers: Story = {
  render: () => {
    const [value, setValue] = React.useState("");
    const users = [
      "John Doe",
      "Jane Smith",
      "Bob Johnson",
      "Alice Williams",
      "Charlie Brown",
      "Diana Prince",
      "Eve Anderson",
      "Frank Miller",
    ];

    return (
      <div className="w-[400px]">
        <SearchWithSuggestions
          placeholder="Search users..."
          value={value}
          onChange={setValue}
          suggestions={users}
          emptyMessage="No users found."
        />
        {value && <p className="mt-2 text-sm text-muted-foreground">Searching for: {value}</p>}
      </div>
    );
  },
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = React.useState("");
    const [results, setResults] = React.useState<string[]>([]);

    const allItems = [
      "Dashboard",
      "Analytics",
      "Reports",
      "Settings",
      "Profile",
      "Team Members",
      "Projects",
      "Tasks",
      "Calendar",
      "Messages",
      "Notifications",
      "Documents",
    ];

    React.useEffect(() => {
      if (value) {
        const filtered = allItems.filter((item) =>
          item.toLowerCase().includes(value.toLowerCase()),
        );
        setResults(filtered);
      } else {
        setResults([]);
      }
    }, [value]);

    return (
      <div className="w-[400px] space-y-4">
        <SearchWithSuggestions
          placeholder="Search pages..."
          value={value}
          onChange={setValue}
          suggestions={allItems}
          onSelect={(selected) => {
            alert(`Navigating to ${selected}`);
          }}
        />
        {value && results.length > 0 && (
          <div className="rounded-lg border p-4">
            <p className="mb-2 text-sm font-medium">
              Found {results.length} result{results.length === 1 ? "" : "s"}
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {results.slice(0, 3).map((result) => (
                <li key={result}>• {result}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  },
};

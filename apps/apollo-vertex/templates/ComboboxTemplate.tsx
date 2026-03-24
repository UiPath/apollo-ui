"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import {
  Combobox,
  ComboboxBadge,
  ComboboxBadgeList,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "svelte", label: "SvelteKit" },
  { value: "nuxt", label: "Nuxt" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
];

function SingleSelectContent() {
  const [value, setValue] = useState<string[]>([]);
  const selectedLabel = frameworks.find((f) => f.value === value[0])?.label;

  return (
    <div className="p-4">
      <Combobox value={value} onValueChange={setValue}>
        <ComboboxTrigger
          className="w-[240px]"
          placeholder={"Select a framework"}
        >
          {selectedLabel}
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput placeholder="Search frameworks..." />
          <ComboboxList>
            <ComboboxEmpty>{"No frameworks found."}</ComboboxEmpty>
            <ComboboxGroup>
              {frameworks.map((f) => (
                <ComboboxItem key={f.value} value={f.value}>
                  {f.label}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

function MultiSelectContent() {
  const [values, setValues] = useState<string[]>([]);

  return (
    <div className="p-4">
      <Combobox multiple value={values} onValueChange={setValues}>
        <ComboboxTrigger
          className="w-[360px] h-auto min-h-9"
          placeholder={"Select frameworks"}
        >
          {values.length > 0 ? (
            <ComboboxBadgeList>
              {values.map((v) => (
                <ComboboxBadge key={v} value={v}>
                  {frameworks.find((f) => f.value === v)?.label}
                </ComboboxBadge>
              ))}
            </ComboboxBadgeList>
          ) : null}
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput placeholder="Search frameworks..." />
          <ComboboxList>
            <ComboboxEmpty>{"No frameworks found."}</ComboboxEmpty>
            <ComboboxGroup>
              {frameworks.map((f) => (
                <ComboboxItem key={f.value} value={f.value}>
                  {f.label}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

export const ComboboxSingleSelectTemplate = dynamic(
  () => Promise.resolve(SingleSelectContent),
  { ssr: false },
);

export const ComboboxMultiSelectTemplate = dynamic(
  () => Promise.resolve(MultiSelectContent),
  { ssr: false },
);

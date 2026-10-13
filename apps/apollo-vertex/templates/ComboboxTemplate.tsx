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

const products = [
  { value: "studio", label: "Studio" },
  { value: "orchestrator", label: "Orchestrator" },
  { value: "robot", label: "Robot" },
  { value: "maestro", label: "Maestro" },
  { value: "action-center", label: "Action Center" },
];

function SingleSelectContent() {
  const [value, setValue] = useState<string[]>([]);
  const selectedLabel = products.find((f) => f.value === value[0])?.label;

  return (
    <Combobox value={value} onValueChange={setValue}>
      <ComboboxTrigger className="w-[240px]" placeholder={"Select a product"}>
        {selectedLabel}
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput placeholder="Search products..." />
        <ComboboxList>
          <ComboboxEmpty>{"No products found."}</ComboboxEmpty>
          <ComboboxGroup>
            {products.map((f) => (
              <ComboboxItem key={f.value} value={f.value}>
                {f.label}
              </ComboboxItem>
            ))}
          </ComboboxGroup>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function MultiSelectContent() {
  const [values, setValues] = useState<string[]>([]);

  return (
    <Combobox multiple value={values} onValueChange={setValues}>
      <ComboboxTrigger
        className="w-[360px] h-auto min-h-9"
        placeholder={"Select products"}
      >
        {values.length > 0 ? (
          <ComboboxBadgeList>
            {values.map((v) => (
              <ComboboxBadge key={v} value={v}>
                {products.find((f) => f.value === v)?.label}
              </ComboboxBadge>
            ))}
          </ComboboxBadgeList>
        ) : null}
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput placeholder="Search products..." />
        <ComboboxList>
          <ComboboxEmpty>{"No products found."}</ComboboxEmpty>
          <ComboboxGroup>
            {products.map((f) => (
              <ComboboxItem key={f.value} value={f.value}>
                {f.label}
              </ComboboxItem>
            ))}
          </ComboboxGroup>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function InvalidContent() {
  const [value, setValue] = useState<string[]>([]);
  const selectedLabel = products.find((f) => f.value === value[0])?.label;

  return (
    <Combobox value={value} onValueChange={setValue}>
      <ComboboxTrigger
        className="w-[240px]"
        placeholder={"Select a product"}
        aria-invalid="true"
      >
        {selectedLabel}
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput placeholder="Search products..." />
        <ComboboxList>
          <ComboboxEmpty>{"No products found."}</ComboboxEmpty>
          <ComboboxGroup>
            {products.map((f) => (
              <ComboboxItem key={f.value} value={f.value}>
                {f.label}
              </ComboboxItem>
            ))}
          </ComboboxGroup>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
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

export const ComboboxInvalidTemplate = dynamic(
  () => Promise.resolve(InvalidContent),
  { ssr: false },
);

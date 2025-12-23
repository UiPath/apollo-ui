import { describe, it, expect } from "vitest";
import { serializeSchema, schemaToJson } from "./schema-serializer";
import type { FormSchema, FieldMetadata, FormSection } from "./form-schema";

describe("serializeSchema", () => {
  describe("single-page form", () => {
    it("serializes basic form with sections", () => {
      const schema: FormSchema = {
        id: "test-form",
        title: "Test Form",
        sections: [
          {
            id: "section-1",
            fields: [
              { name: "name", type: "text", label: "Name" },
              { name: "email", type: "email", label: "Email" },
            ],
          },
        ],
      };

      const result = serializeSchema(schema);

      expect(result.id).toBe("test-form");
      expect(result.title).toBe("Test Form");
      expect(result.sections).toHaveLength(1);
      expect((result.sections as Array<{ fields: unknown[] }>)[0].fields).toHaveLength(2);
    });

    it("serializes optional schema properties", () => {
      const schema: FormSchema = {
        id: "test-form",
        title: "Test Form",
        description: "A test form",
        version: "1.0.0",
        mode: "onChange",
        reValidateMode: "onBlur",
        layout: { columns: 2, gap: 4 },
        metadata: { author: "Test" },
        sections: [{ id: "s1", fields: [] }],
      };

      const result = serializeSchema(schema);

      expect(result.description).toBe("A test form");
      expect(result.version).toBe("1.0.0");
      expect(result.mode).toBe("onChange");
      expect(result.reValidateMode).toBe("onBlur");
      expect(result.layout).toEqual({ columns: 2, gap: 4 });
      expect(result.metadata).toEqual({ author: "Test" });
    });
  });

  describe("multi-step form", () => {
    it("serializes form with steps", () => {
      const schema: FormSchema = {
        id: "wizard-form",
        title: "Wizard Form",
        steps: [
          {
            id: "step-1",
            title: "Step 1",
            sections: [{ id: "s1", fields: [{ name: "field1", type: "text", label: "Field 1" }] }],
          },
          {
            id: "step-2",
            title: "Step 2",
            sections: [{ id: "s2", fields: [{ name: "field2", type: "text", label: "Field 2" }] }],
          },
        ],
      };

      const result = serializeSchema(schema);

      expect(result.steps).toHaveLength(2);
      expect((result.steps as Array<{ id: string }>)[0].id).toBe("step-1");
      expect((result.steps as Array<{ id: string }>)[1].id).toBe("step-2");
    });

    it("serializes step with conditions", () => {
      const schema: FormSchema = {
        id: "conditional-wizard",
        title: "Conditional Wizard",
        steps: [
          {
            id: "step-1",
            title: "Step 1",
            canSkip: true,
            conditions: [{ when: "type", is: "advanced" }],
            sections: [{ id: "s1", fields: [] }],
          },
        ],
      };

      const result = serializeSchema(schema);
      const step = (result.steps as Array<{ canSkip: boolean; conditions: unknown[] }>)[0];

      expect(step.canSkip).toBe(true);
      expect(step.conditions).toHaveLength(1);
    });
  });

  describe("field serialization", () => {
    it("serializes field with validation config", () => {
      const schema: FormSchema = {
        id: "form",
        title: "Form",
        sections: [
          {
            id: "s1",
            fields: [
              {
                name: "email",
                type: "email",
                label: "Email",
                validation: {
                  required: true,
                  email: true,
                  messages: { required: "Email required" },
                },
              },
            ],
          },
        ],
      };

      const result = serializeSchema(schema);
      const field = (result.sections as Array<{ fields: Array<{ validation: unknown }> }>)[0]
        .fields[0];

      expect(field.validation).toEqual({
        required: true,
        email: true,
        messages: { required: "Email required" },
      });
    });

    it("serializes field with options", () => {
      const schema: FormSchema = {
        id: "form",
        title: "Form",
        sections: [
          {
            id: "s1",
            fields: [
              {
                name: "status",
                type: "select",
                label: "Status",
                options: [
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive", disabled: true },
                ],
              },
            ],
          },
        ],
      };

      const result = serializeSchema(schema);
      const field = (result.sections as Array<{ fields: Array<{ options: unknown[] }> }>)[0]
        .fields[0];

      expect(field.options).toEqual([
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive", disabled: true },
      ]);
    });

    it("serializes field with rules", () => {
      const schema: FormSchema = {
        id: "form",
        title: "Form",
        sections: [
          {
            id: "s1",
            fields: [
              {
                name: "details",
                type: "text",
                label: "Details",
                rules: [
                  {
                    id: "show-when-advanced",
                    conditions: [{ when: "mode", is: "advanced" }],
                    effects: { visible: true },
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = serializeSchema(schema);
      const field = (result.sections as Array<{ fields: Array<{ rules: unknown[] }> }>)[0]
        .fields[0];

      expect(field.rules).toHaveLength(1);
      expect(field.rules[0]).toEqual({
        id: "show-when-advanced",
        conditions: [{ when: "mode", is: "advanced" }],
        effects: { visible: true },
      });
    });

    it("serializes field with dataSource", () => {
      const schema: FormSchema = {
        id: "form",
        title: "Form",
        sections: [
          {
            id: "s1",
            fields: [
              {
                name: "country",
                type: "select",
                label: "Country",
                dataSource: {
                  type: "remote",
                  endpoint: "https://api.example.com/countries",
                  params: { limit: 100 },
                },
              },
            ],
          },
        ],
      };

      const result = serializeSchema(schema);
      const field = (
        result.sections as Array<{
          fields: Array<{ dataSource: { type: string; endpoint: string } }>;
        }>
      )[0].fields[0];

      expect(field.dataSource.type).toBe("remote");
      expect(field.dataSource.endpoint).toBe("https://api.example.com/countries");
    });

    it("serializes type-specific field properties", () => {
      const schema: FormSchema = {
        id: "form",
        title: "Form",
        sections: [
          {
            id: "s1",
            fields: [
              { name: "bio", type: "textarea", label: "Bio", rows: 5 } as FieldMetadata,
              {
                name: "age",
                type: "number",
                label: "Age",
                min: 0,
                max: 120,
                step: 1,
              } as FieldMetadata,
              {
                name: "photo",
                type: "file",
                label: "Photo",
                accept: "image/*",
                multiple: false,
                maxSize: 5000000,
              } as FieldMetadata,
            ],
          },
        ],
      };

      const result = serializeSchema(schema);
      const fields = (result.sections as Array<{ fields: Array<Record<string, unknown>> }>)[0]
        .fields;

      expect(fields[0].rows).toBe(5);
      expect(fields[1].min).toBe(0);
      expect(fields[1].max).toBe(120);
      expect(fields[1].step).toBe(1);
      expect(fields[2].accept).toBe("image/*");
      expect(fields[2].maxSize).toBe(5000000);
    });
  });

  describe("section serialization", () => {
    it("serializes section with optional properties", () => {
      const schema: FormSchema = {
        id: "form",
        title: "Form",
        sections: [
          {
            id: "s1",
            title: "Section 1",
            description: "First section",
            collapsible: true,
            defaultExpanded: false,
            fields: [],
          },
        ],
      };

      const result = serializeSchema(schema);
      const section = (result.sections as Array<Record<string, unknown>>)[0];

      expect(section.title).toBe("Section 1");
      expect(section.description).toBe("First section");
      expect(section.collapsible).toBe(true);
      expect(section.defaultExpanded).toBe(false);
    });
  });

  describe("actions serialization", () => {
    it("serializes form actions", () => {
      const schema: FormSchema = {
        id: "form",
        title: "Form",
        actions: [
          { id: "submit", type: "submit", label: "Submit", variant: "default" },
          { id: "reset", type: "reset", label: "Reset", variant: "secondary" },
        ],
        sections: [{ id: "s1", fields: [] }],
      };

      const result = serializeSchema(schema);

      expect(result.actions).toHaveLength(2);
      expect((result.actions as Array<{ id: string }>)[0].id).toBe("submit");
      expect((result.actions as Array<{ id: string }>)[1].id).toBe("reset");
    });
  });
});

describe("schemaToJson", () => {
  it("converts schema to formatted JSON string", () => {
    const schema: FormSchema = {
      id: "test",
      title: "Test",
      sections: [{ id: "s1", fields: [] }],
    };

    const json = schemaToJson(schema);

    expect(typeof json).toBe("string");
    expect(json).toContain('"id": "test"');
    expect(json).toContain('"title": "Test"');
  });

  it("parses back to equivalent object", () => {
    const schema: FormSchema = {
      id: "test",
      title: "Test Form",
      sections: [
        {
          id: "s1",
          fields: [{ name: "name", type: "text", label: "Name", validation: { required: true } }],
        },
      ],
    };

    const json = schemaToJson(schema);
    const parsed = JSON.parse(json);

    expect(parsed.id).toBe(schema.id);
    expect(parsed.title).toBe(schema.title);
    expect(parsed.sections[0].fields[0].name).toBe("name");
  });
});

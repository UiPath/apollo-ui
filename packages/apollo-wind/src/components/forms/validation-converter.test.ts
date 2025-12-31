import { describe, it, expect } from "vitest";
import {
  validationConfigToZod,
  buildZodSchemaFromFields,
  mergeValidationConfigs,
} from "./validation-converter";
import type { ValidationConfig } from "./form-schema";

describe("validationConfigToZod", () => {
  describe("base schema by field type", () => {
    it("creates string schema for text field", () => {
      const schema = validationConfigToZod(undefined, "text");
      expect(schema.safeParse("hello").success).toBe(true);
      expect(schema.safeParse(undefined).success).toBe(true); // optional
    });

    it("creates string schema for textarea field", () => {
      const schema = validationConfigToZod(undefined, "textarea");
      expect(schema.safeParse("multiline\ntext").success).toBe(true);
    });

    it("creates email schema for email field", () => {
      const schema = validationConfigToZod(undefined, "email");
      expect(schema.safeParse("test@example.com").success).toBe(true);
      expect(schema.safeParse("invalid-email").success).toBe(false);
    });

    it("creates number schema for number field", () => {
      const schema = validationConfigToZod(undefined, "number");
      expect(schema.safeParse(42).success).toBe(true);
      expect(schema.safeParse("42").success).toBe(true); // coerce
    });

    it("creates number schema for slider field", () => {
      const schema = validationConfigToZod(undefined, "slider");
      expect(schema.safeParse(50).success).toBe(true);
    });

    it("creates boolean schema for checkbox field", () => {
      const schema = validationConfigToZod(undefined, "checkbox");
      expect(schema.safeParse(true).success).toBe(true);
      expect(schema.safeParse(false).success).toBe(true);
    });

    it("creates boolean schema for switch field", () => {
      const schema = validationConfigToZod(undefined, "switch");
      expect(schema.safeParse(true).success).toBe(true);
    });

    it("creates string schema for select field", () => {
      const schema = validationConfigToZod(undefined, "select");
      expect(schema.safeParse("option1").success).toBe(true);
    });

    it("creates string schema for radio field", () => {
      const schema = validationConfigToZod(undefined, "radio");
      expect(schema.safeParse("option1").success).toBe(true);
    });

    it("creates array schema for multiselect field", () => {
      const schema = validationConfigToZod(undefined, "multiselect");
      expect(schema.safeParse(["a", "b"]).success).toBe(true);
      expect(schema.safeParse([]).success).toBe(true);
    });

    it("creates date schema for date field", () => {
      const schema = validationConfigToZod(undefined, "date");
      expect(schema.safeParse(new Date()).success).toBe(true);
      expect(schema.safeParse("2024-01-01").success).toBe(true); // coerce
    });

    it("creates date schema for datetime field", () => {
      const schema = validationConfigToZod(undefined, "datetime");
      expect(schema.safeParse(new Date()).success).toBe(true);
    });

    it("creates any schema for file field", () => {
      const schema = validationConfigToZod(undefined, "file");
      expect(schema.safeParse({}).success).toBe(true);
      expect(schema.safeParse(null).success).toBe(true);
    });

    it("creates any schema for custom field", () => {
      const schema = validationConfigToZod(undefined, "custom");
      expect(schema.safeParse({ anything: true }).success).toBe(true);
    });
  });

  describe("required validation", () => {
    it("makes field required when config.required is true", () => {
      const schema = validationConfigToZod({ required: true }, "text");
      expect(schema.safeParse("value").success).toBe(true);
      expect(schema.safeParse("").success).toBe(false); // enforces min(1) for strings
      expect(schema.safeParse(undefined).success).toBe(false);
    });

    it("uses custom required message", () => {
      const schema = validationConfigToZod(
        { required: true, messages: { required: "Please fill this" } },
        "text",
      );
      const result = schema.safeParse("");
      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod v4 uses issues array
        expect(result.error.issues[0].message).toBe("Please fill this");
      }
    });

    it("makes field optional when config.required is false", () => {
      const schema = validationConfigToZod({ required: false }, "text");
      expect(schema.safeParse(undefined).success).toBe(true);
    });
  });

  describe("string constraints", () => {
    it("applies minLength constraint", () => {
      const schema = validationConfigToZod({ minLength: 3 }, "text");
      expect(schema.safeParse("ab").success).toBe(false);
      expect(schema.safeParse("abc").success).toBe(true);
    });

    it("applies maxLength constraint", () => {
      const schema = validationConfigToZod({ maxLength: 5 }, "text");
      expect(schema.safeParse("12345").success).toBe(true);
      expect(schema.safeParse("123456").success).toBe(false);
    });

    it("applies pattern constraint", () => {
      const schema = validationConfigToZod({ pattern: "^[A-Z]+$" }, "text");
      expect(schema.safeParse("ABC").success).toBe(true);
      expect(schema.safeParse("abc").success).toBe(false);
    });

    it("applies email constraint to text field", () => {
      const schema = validationConfigToZod({ email: true }, "text");
      expect(schema.safeParse("test@example.com").success).toBe(true);
      expect(schema.safeParse("invalid").success).toBe(false);
    });

    it("applies url constraint", () => {
      const schema = validationConfigToZod({ url: true }, "text");
      expect(schema.safeParse("https://example.com").success).toBe(true);
      expect(schema.safeParse("not-a-url").success).toBe(false);
    });

    it("uses custom error messages for string constraints", () => {
      const schema = validationConfigToZod(
        {
          minLength: 5,
          messages: { minLength: "Too short!" },
        },
        "text",
      );
      const result = schema.safeParse("ab");
      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod v4 uses issues array
        expect(result.error.issues[0].message).toBe("Too short!");
      }
    });
  });

  describe("number constraints", () => {
    it("applies min constraint", () => {
      const schema = validationConfigToZod({ min: 10 }, "number");
      expect(schema.safeParse(10).success).toBe(true);
      expect(schema.safeParse(9).success).toBe(false);
    });

    it("applies max constraint", () => {
      const schema = validationConfigToZod({ max: 100 }, "number");
      expect(schema.safeParse(100).success).toBe(true);
      expect(schema.safeParse(101).success).toBe(false);
    });

    it("applies integer constraint", () => {
      const schema = validationConfigToZod({ integer: true }, "number");
      expect(schema.safeParse(42).success).toBe(true);
      expect(schema.safeParse(42.5).success).toBe(false);
    });

    it("applies positive constraint", () => {
      const schema = validationConfigToZod({ positive: true }, "number");
      expect(schema.safeParse(1).success).toBe(true);
      expect(schema.safeParse(0).success).toBe(false);
      expect(schema.safeParse(-1).success).toBe(false);
    });

    it("applies negative constraint", () => {
      const schema = validationConfigToZod({ negative: true }, "number");
      expect(schema.safeParse(-1).success).toBe(true);
      expect(schema.safeParse(0).success).toBe(false);
      expect(schema.safeParse(1).success).toBe(false);
    });

    it("applies number constraints to slider field", () => {
      const schema = validationConfigToZod({ min: 0, max: 100 }, "slider");
      expect(schema.safeParse(50).success).toBe(true);
      expect(schema.safeParse(-1).success).toBe(false);
      expect(schema.safeParse(101).success).toBe(false);
    });
  });

  describe("array constraints", () => {
    it("applies minItems constraint", () => {
      const schema = validationConfigToZod({ minItems: 2 }, "multiselect");
      expect(schema.safeParse(["a", "b"]).success).toBe(true);
      expect(schema.safeParse(["a"]).success).toBe(false);
    });

    it("applies maxItems constraint", () => {
      const schema = validationConfigToZod({ maxItems: 3 }, "multiselect");
      expect(schema.safeParse(["a", "b", "c"]).success).toBe(true);
      expect(schema.safeParse(["a", "b", "c", "d"]).success).toBe(false);
    });

    it("uses custom error messages for array constraints", () => {
      const schema = validationConfigToZod(
        {
          minItems: 2,
          messages: { minItems: "Pick at least 2" },
        },
        "multiselect",
      );
      const result = schema.safeParse(["a"]);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod v4 uses issues array
        expect(result.error.issues[0].message).toBe("Pick at least 2");
      }
    });
  });

  describe("combined constraints", () => {
    it("applies multiple string constraints together", () => {
      const schema = validationConfigToZod(
        { required: true, minLength: 3, maxLength: 10, pattern: "^[a-z]+$" },
        "text",
      );
      expect(schema.safeParse("hello").success).toBe(true);
      expect(schema.safeParse("ab").success).toBe(false); // too short
      expect(schema.safeParse("verylongvalue").success).toBe(false); // too long
      expect(schema.safeParse("HELLO").success).toBe(false); // wrong pattern
    });

    it("applies multiple number constraints together", () => {
      const schema = validationConfigToZod(
        { required: true, min: 1, max: 100, integer: true },
        "number",
      );
      expect(schema.safeParse(50).success).toBe(true);
      expect(schema.safeParse(0).success).toBe(false); // below min
      expect(schema.safeParse(101).success).toBe(false); // above max
      expect(schema.safeParse(50.5).success).toBe(false); // not integer
    });
  });
});

describe("buildZodSchemaFromFields", () => {
  it("builds object schema from field definitions", () => {
    const schema = buildZodSchemaFromFields([
      { name: "name", type: "text", validation: { required: true } },
      { name: "email", type: "email", validation: { required: true } },
      { name: "age", type: "number" },
    ]);

    expect(
      schema.safeParse({
        name: "John",
        email: "john@example.com",
        age: 30,
      }).success,
    ).toBe(true);
  });

  it("validates required fields", () => {
    const schema = buildZodSchemaFromFields([
      { name: "name", type: "text", validation: { required: true } },
    ]);

    expect(schema.safeParse({ name: "" }).success).toBe(false);
    expect(schema.safeParse({ name: "John" }).success).toBe(true);
  });

  it("handles optional fields", () => {
    const schema = buildZodSchemaFromFields([{ name: "nickname", type: "text" }]);

    expect(schema.safeParse({}).success).toBe(true);
    expect(schema.safeParse({ nickname: "Johnny" }).success).toBe(true);
  });

  it("returns empty schema for empty fields", () => {
    const schema = buildZodSchemaFromFields([]);
    expect(schema.safeParse({}).success).toBe(true);
  });
});

describe("mergeValidationConfigs", () => {
  it("returns undefined when both are undefined", () => {
    expect(mergeValidationConfigs(undefined, undefined)).toBeUndefined();
  });

  it("returns override when base is undefined", () => {
    const override: ValidationConfig = { required: true };
    expect(mergeValidationConfigs(undefined, override)).toEqual({ required: true });
  });

  it("returns base when override is undefined", () => {
    const base: ValidationConfig = { minLength: 5 };
    expect(mergeValidationConfigs(base, undefined)).toEqual({ minLength: 5 });
  });

  it("merges base and override configs", () => {
    const base: ValidationConfig = { minLength: 5, maxLength: 100 };
    const override: ValidationConfig = { required: true, minLength: 10 };

    const result = mergeValidationConfigs(base, override);
    expect(result).toEqual({
      minLength: 10, // override wins
      maxLength: 100, // from base
      required: true, // from override
      messages: {},
    });
  });

  it("merges messages from both configs", () => {
    const base: ValidationConfig = {
      messages: { required: "Base required", minLength: "Base min" },
    };
    const override: ValidationConfig = {
      messages: { required: "Override required" },
    };

    const result = mergeValidationConfigs(base, override);
    expect(result?.messages).toEqual({
      required: "Override required", // override wins
      minLength: "Base min", // from base
    });
  });
});

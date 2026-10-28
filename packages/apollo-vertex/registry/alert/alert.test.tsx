import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Alert, AlertDescription } from "./alert";

afterEach(cleanup);

describe("Alert status", () => {
  it("applies tinted success classes without changing other statuses", () => {
    const { getByRole, rerender } = render(
      <Alert status="success" visual="tinted">
        <AlertDescription>{"Passed"}</AlertDescription>
      </Alert>,
    );

    expect(getByRole("alert").className).toContain("bg-success/15");
    expect(getByRole("alert").className).toContain("dark:bg-success/25");
    expect(getByRole("alert").className).toContain("[&>svg]:text-success");

    rerender(
      <Alert status="warning" visual="tinted">
        <AlertDescription>{"Warn"}</AlertDescription>
      </Alert>,
    );
    expect(getByRole("alert").className).toContain("bg-warning/15");
    expect(getByRole("alert").className).not.toContain("bg-success/15");

    rerender(
      <Alert status="error" visual="tinted">
        <AlertDescription>{"Fail"}</AlertDescription>
      </Alert>,
    );
    expect(getByRole("alert").className).toContain("bg-destructive/10");
    expect(getByRole("alert").className).not.toContain("bg-success/15");
  });

  it("applies outline success border and icon color", () => {
    const { getByRole } = render(
      <Alert status="success" visual="outline">
        <AlertDescription>{"Passed"}</AlertDescription>
      </Alert>,
    );

    expect(getByRole("alert").className).toContain("border-success");
    expect(getByRole("alert").className).toContain("[&>svg]:text-success");
  });
});

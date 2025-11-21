import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { AlertCircle } from "lucide-react";
import { describe, expect, it } from "vitest";
import { Alert, AlertDescription, AlertTitle } from "./alert";

describe("Alert", () => {
  it("renders without crashing", () => {
    render(
      <Alert>
        <AlertTitle>Alert Title</AlertTitle>
        <AlertDescription>Alert description</AlertDescription>
      </Alert>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Alert>
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>This is an important message</AlertDescription>
      </Alert>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("displays alert title", () => {
    render(
      <Alert>
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>Operation completed</AlertDescription>
      </Alert>,
    );
    expect(screen.getByText("Success")).toBeInTheDocument();
  });

  it("displays alert description", () => {
    render(
      <Alert>
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>Your changes have been saved</AlertDescription>
      </Alert>,
    );
    expect(screen.getByText("Your changes have been saved")).toBeInTheDocument();
  });

  it("applies default variant classes", () => {
    render(
      <Alert>
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>Description</AlertDescription>
      </Alert>,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("bg-background");
  });

  it("applies destructive variant classes", () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong</AlertDescription>
      </Alert>,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("border-destructive/50");
  });

  it("renders with icon", () => {
    const { container } = render(
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Alert</AlertTitle>
        <AlertDescription>Message</AlertDescription>
      </Alert>,
    );
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <Alert className="custom-alert">
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>Description</AlertDescription>
      </Alert>,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("custom-alert");
  });

  it("applies custom className to AlertTitle", () => {
    render(
      <Alert>
        <AlertTitle className="custom-title">Title</AlertTitle>
        <AlertDescription>Description</AlertDescription>
      </Alert>,
    );
    const title = screen.getByText("Title");
    expect(title).toHaveClass("custom-title");
  });

  it("applies custom className to AlertDescription", () => {
    render(
      <Alert>
        <AlertTitle>Title</AlertTitle>
        <AlertDescription className="custom-desc">Description</AlertDescription>
      </Alert>,
    );
    const description = screen.getByText("Description");
    expect(description).toHaveClass("custom-desc");
  });

  it("forwards ref correctly", () => {
    const ref = { current: null };
    render(
      <Alert ref={ref}>
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>Description</AlertDescription>
      </Alert>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has proper role attribute", () => {
    render(
      <Alert>
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>Description</AlertDescription>
      </Alert>,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("role", "alert");
  });

  it("renders without title", () => {
    render(
      <Alert>
        <AlertDescription>Just a description</AlertDescription>
      </Alert>,
    );
    expect(screen.getByText("Just a description")).toBeInTheDocument();
  });

  it("renders without description", () => {
    render(
      <Alert>
        <AlertTitle>Just a title</AlertTitle>
      </Alert>,
    );
    expect(screen.getByText("Just a title")).toBeInTheDocument();
  });

  it("supports additional HTML attributes", () => {
    render(
      <Alert data-testid="custom-alert">
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>Description</AlertDescription>
      </Alert>,
    );
    expect(screen.getByTestId("custom-alert")).toBeInTheDocument();
  });
});

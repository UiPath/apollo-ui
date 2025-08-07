import { describe, expect, it } from "vitest";
import { render, screen } from "@test-utils";
import { Row } from "./Row";

describe("Row", () => {
  it("renders children correctly", () => {
    render(
      <Row>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </Row>
    );

    expect(screen.getByTestId("child-1")).toBeInTheDocument();
    expect(screen.getByTestId("child-2")).toBeInTheDocument();
  });

  it("applies flex properties correctly", () => {
    render(
      <Row align="center" justify="space-between" gap={16} wrap="wrap">
        <div>Child</div>
      </Row>
    );

    const row = screen.getByText("Child").parentElement;
    expect(row).toHaveStyle({
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
      flexWrap: "wrap",
    });
  });

  it("applies spacing properties correctly", () => {
    render(
      <Row p={16} m={8} px={4} py={2} mt={1} mb={2}>
        <div>Child</div>
      </Row>
    );

    const row = screen.getByText("Child").parentElement;
    expect(row).toHaveStyle({
      margin: "1px 8px 2px 8px",
      padding: "2px 4px 2px 4px",
    });
  });

  it("applies size properties correctly", () => {
    render(
      <Row w="100%" h={200} maxW={500} minW={200} maxH={300} minH={100}>
        <div>Child</div>
      </Row>
    );

    const row = screen.getByText("Child").parentElement;
    expect(row).toHaveStyle({
      width: "100%",
      height: "200px",
      maxWidth: "500px",
      minWidth: "200px",
      maxHeight: "300px",
      minHeight: "100px",
    });
  });

  it("applies overflow properties correctly", () => {
    render(
      <Row overflow="auto" overflowX="hidden" overflowY="scroll">
        <div>Child</div>
      </Row>
    );

    const row = screen.getByText("Child").parentElement;
    expect(row).toHaveStyle({
      overflow: "auto",
      overflowX: "hidden",
      overflowY: "scroll",
    });
  });

  it("applies position property correctly", () => {
    render(
      <Row position="relative">
        <div>Child</div>
      </Row>
    );

    const row = screen.getByText("Child").parentElement;
    expect(row).toHaveStyle({
      position: "relative",
    });
  });

  it("merges custom style with default styles", () => {
    const customStyle = { backgroundColor: "rgb(255, 0, 0)" };
    render(
      <Row style={customStyle}>
        <div>Child</div>
      </Row>
    );

    const row = screen.getByText("Child").parentElement;
    expect(row).not.toBeNull();

    if (row) {
      const computedStyle = window.getComputedStyle(row);
      expect(computedStyle.display).toBe("flex");
      expect(computedStyle.flexDirection).toBe("row");
      expect(computedStyle.backgroundColor).toBe("rgb(255, 0, 0)");
    }
  });

  it("applies className correctly", () => {
    render(
      <Row className="test-class">
        <div>Child</div>
      </Row>
    );

    const row = screen.getByText("Child").parentElement;
    expect(row).toHaveClass("test-class");
  });

  it("handles string and number values for spacing props", () => {
    render(
      <Row p="20px" m={16} gap="1rem">
        <div>Child</div>
      </Row>
    );

    const row = screen.getByText("Child").parentElement;
    expect(row).toHaveStyle({
      padding: "20px",
      margin: "16px",
      gap: "1rem",
    });
  });
});

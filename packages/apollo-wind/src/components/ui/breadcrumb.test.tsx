import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";

describe("Breadcrumb", () => {
  const BreadcrumbExample = () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/products">Products</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Current Page</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  it("renders without crashing", () => {
    render(<BreadcrumbExample />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<BreadcrumbExample />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has proper ARIA label", () => {
    render(<BreadcrumbExample />);
    const nav = screen.getByRole("navigation");
    expect(nav).toHaveAttribute("aria-label", "breadcrumb");
  });

  it("renders all breadcrumb links", () => {
    render(<BreadcrumbExample />);
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Products" })).toBeInTheDocument();
  });

  it("renders current page", () => {
    render(<BreadcrumbExample />);
    const currentPage = screen.getByText("Current Page");
    expect(currentPage).toHaveAttribute("aria-current", "page");
  });

  it("renders separators", () => {
    const { container } = render(<BreadcrumbExample />);
    const separators = container.querySelectorAll('[role="presentation"]');
    expect(separators.length).toBeGreaterThan(0);
  });

  it("renders ellipsis", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    expect(screen.getByText("More")).toBeInTheDocument();
  });

  it("links have correct href attributes", () => {
    render(<BreadcrumbExample />);
    const homeLink = screen.getByRole("link", { name: "Home" });
    const productsLink = screen.getByRole("link", { name: "Products" });
    expect(homeLink).toHaveAttribute("href", "/");
    expect(productsLink).toHaveAttribute("href", "/products");
  });

  it("current page is disabled", () => {
    render(<BreadcrumbExample />);
    const currentPage = screen.getByText("Current Page");
    expect(currentPage).toHaveAttribute("aria-disabled", "true");
  });

  it("applies custom className to Breadcrumb", () => {
    render(
      <Breadcrumb className="custom-breadcrumb">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("custom-breadcrumb");
  });

  it("applies custom className to BreadcrumbList", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList className="custom-list">
          <BreadcrumbItem>
            <BreadcrumbPage>Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const list = screen.getByRole("list");
    expect(list).toHaveClass("custom-list");
  });

  it("applies custom className to BreadcrumbItem", () => {
    const { container } = render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="custom-item">
            <BreadcrumbPage>Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const item = container.querySelector(".custom-item");
    expect(item).toBeInTheDocument();
  });

  it("applies custom className to BreadcrumbLink", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="custom-link">
              Link
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveClass("custom-link");
  });

  it("supports asChild on BreadcrumbLink", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button>Custom Link</button>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    expect(screen.getByRole("button", { name: "Custom Link" })).toBeInTheDocument();
  });

  it("renders custom separator", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    expect(screen.getByText("/")).toBeInTheDocument();
  });

  it("forwards ref correctly to Breadcrumb", () => {
    const ref = { current: null };
    render(
      <Breadcrumb ref={ref}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it("forwards ref correctly to BreadcrumbList", () => {
    const ref = { current: null };
    render(
      <Breadcrumb>
        <BreadcrumbList ref={ref}>
          <BreadcrumbItem>
            <BreadcrumbPage>Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    expect(ref.current).toBeInstanceOf(HTMLOListElement);
  });

  it("forwards ref correctly to BreadcrumbItem", () => {
    const ref = { current: null };
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem ref={ref}>
            <BreadcrumbPage>Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    expect(ref.current).toBeInstanceOf(HTMLLIElement);
  });

  it("forwards ref correctly to BreadcrumbLink", () => {
    const ref = { current: null };
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink ref={ref} href="/">
              Link
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("forwards ref correctly to BreadcrumbPage", () => {
    const ref = { current: null };
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage ref={ref}>Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});

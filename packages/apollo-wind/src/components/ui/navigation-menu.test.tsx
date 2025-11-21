import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { createRef } from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./navigation-menu";

describe("NavigationMenu", () => {
  describe("rendering", () => {
    it("renders navigation menu", () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#">Home</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>,
      );
      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("renders menu items", () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#">Home</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#">About</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>,
      );
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("About")).toBeInTheDocument();
    });

    it("renders trigger with dropdown content", async () => {
      const user = userEvent.setup();
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Product List</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>,
      );

      expect(screen.getByText("Products")).toBeInTheDocument();
      await user.click(screen.getByText("Products"));
      expect(screen.getByText("Product List")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has no accessibility violations", async () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#">Home</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has no violations with trigger and content", async () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuLink href="#">Product 1</NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("ref forwarding", () => {
    it("NavigationMenu forwards ref", () => {
      const ref = createRef<HTMLElement>();
      render(
        <NavigationMenu ref={ref}>
          <NavigationMenuList />
        </NavigationMenu>,
      );
      expect(ref.current).toBeInstanceOf(HTMLElement);
    });

    it("NavigationMenuList forwards ref", () => {
      const ref = createRef<HTMLUListElement>();
      render(
        <NavigationMenu>
          <NavigationMenuList ref={ref} />
        </NavigationMenu>,
      );
      expect(ref.current).toBeInstanceOf(HTMLUListElement);
    });
  });

  describe("custom className", () => {
    it("NavigationMenu accepts custom className", () => {
      render(
        <NavigationMenu className="custom-nav">
          <NavigationMenuList />
        </NavigationMenu>,
      );
      expect(screen.getByRole("navigation")).toHaveClass("custom-nav");
    });

    it("NavigationMenuList accepts custom className", () => {
      render(
        <NavigationMenu>
          <NavigationMenuList className="custom-list" />
        </NavigationMenu>,
      );
      expect(screen.getByRole("list")).toHaveClass("custom-list");
    });
  });

  describe("navigationMenuTriggerStyle", () => {
    it("returns className string", () => {
      const style = navigationMenuTriggerStyle();
      expect(typeof style).toBe("string");
      expect(style).toContain("inline-flex");
    });
  });
});

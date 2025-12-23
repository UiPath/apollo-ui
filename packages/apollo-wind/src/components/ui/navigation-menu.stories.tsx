import type { Meta } from "@storybook/react-vite";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./navigation-menu";
import { Column } from "./layout";

const meta: Meta<typeof NavigationMenu> = {
  title: "Design System/Navigation/Navigation Menu",
  component: NavigationMenu,
  tags: ["autodocs"],
};

export default meta;

export const Default = {
  args: {},
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <Column className="select-none rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                  >
                    <a href="/">
                      <div className="mb-2 mt-4 text-lg font-medium">Apollo Wind</div>
                      <p className="text-sm leading-tight text-muted-foreground">
                        A comprehensive design system for React
                      </p>
                    </a>
                  </Column>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <a
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    href="/docs"
                  >
                    <div className="text-sm font-medium leading-none">Introduction</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Learn about Apollo Wind and its features
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              <li>
                <NavigationMenuLink asChild>
                  <a
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    href="/docs/components/alert"
                  >
                    <div className="text-sm font-medium leading-none">Alert</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Display important messages
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

import { Link, useLocation } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { CompanyLogo, ShellNavItem } from "./shell";
import { Company } from "./shell-company";
import { MinimalCompany } from "./shell-minimal-company";
import { MinimalNavItem } from "./shell-minimal-nav-item";
import { Text } from "./shell-text";
import { UserProfile } from "./shell-user-profile";

interface ShellSidebarProps {
  companyName: string;
  productName: string;
  variant?: "minimal";
  companyLogo?: CompanyLogo;
  navItems: ShellNavItem[];
}

export const ShellSidebar = ({
  companyName,
  productName,
  variant,
  companyLogo,
  navItems,
}: ShellSidebarProps) => {
  if (variant === "minimal") {
    return (
      <header className="relative flex items-center justify-between px-8 py-6">
        <MinimalCompany
          companyName={companyName}
          productName={productName}
          companyLogo={companyLogo}
        />

        {navItems.length > 0 && (
          <nav className="absolute left-1/2 -translate-x-1/2 flex items-center bg-muted dark:bg-[oklch(0.24_0.033_254)] rounded-full p-1.5 overflow-x-auto">
            {navItems.map((item) => (
              <MinimalNavItem
                key={item.path}
                to={item.path}
                label={item.label}
              />
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <UserProfile isMinimal />
        </div>
      </header>
    );
  }

  return (
    <SidebarNav
      companyName={companyName}
      productName={productName}
      companyLogo={companyLogo}
      navItems={navItems}
    />
  );
};

interface SidebarNavProps {
  companyName: string;
  productName: string;
  companyLogo?: CompanyLogo;
  navItems: ShellNavItem[];
}

function SidebarNav({
  companyName,
  productName,
  companyLogo,
  navItems,
}: SidebarNavProps) {
  const { t } = useTranslation();
  const { state, toggleSidebar } = useSidebar();
  const { pathname } = useLocation();
  const isCollapsed = state === "collapsed";

  const getInitialExpandedItems = () => {
    const expanded = new Set<string>();
    for (const item of navItems) {
      if (item.subItems?.some((sub) => pathname.startsWith(sub.path))) {
        expanded.add(item.path);
      }
    }
    return expanded;
  };

  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    getInitialExpandedItems,
  );

  useEffect(() => {
    const expanded = new Set<string>();
    for (const item of navItems) {
      if (item.subItems?.some((sub) => pathname.startsWith(sub.path))) {
        expanded.add(item.path);
      }
    }
    setExpandedItems(expanded);
  }, [pathname, navItems]);

  const handleMenuClick = (path: string) => {
    if (isCollapsed) {
      toggleSidebar();
      setExpandedItems((prev) => new Set(prev).add(path));
    } else {
      setExpandedItems((prev) => {
        const next = new Set(prev);
        if (next.has(path)) {
          next.delete(path);
        } else {
          next.add(path);
        }
        return next;
      });
    }
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const isParentActive = (item: ShellNavItem) => {
    return item.subItems?.some((sub) => isActive(sub.path)) ?? false;
  };

  const getTooltipText = (label: ShellNavItem["label"]): string => {
    if (typeof label === "string") return t(label);
    return t(label.i18nKey, label.values);
  };

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="border-0 bg-transparent [&_[data-slot=sidebar-inner]]:border-0 [&_[data-slot=sidebar-inner]]:shadow-none [&_[data-slot=sidebar-inner]]:bg-transparent"
    >
      <SidebarHeader className="pt-6 px-4 pb-0">
        <Company
          companyName={companyName}
          productName={productName}
          companyLogo={companyLogo}
        />
      </SidebarHeader>

      <SidebarContent className="px-4 mt-8">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                const parentActive = isParentActive(item);
                const isExpanded = expandedItems.has(item.path);

                if (item.subItems && item.subItems.length > 0) {
                  const showParentActive = isCollapsed && parentActive;

                  return (
                    <Collapsible
                      key={item.path}
                      open={isExpanded && !isCollapsed}
                      onOpenChange={() => handleMenuClick(item.path)}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={getTooltipText(item.label)}
                            isActive={showParentActive}
                          >
                            <Icon />
                            <span>
                              <Text value={item.label} />
                            </span>
                            <ChevronDown
                              className={cn(
                                "ml-auto size-5 transition-transform duration-200",
                                isExpanded && !isCollapsed && "rotate-180",
                              )}
                            />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems.map((subItem) => {
                              const subActive = isActive(subItem.path);
                              return (
                                <SidebarMenuSubItem key={subItem.path}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={subActive}
                                    className="cursor-pointer whitespace-nowrap"
                                  >
                                    <Link to={subItem.path}>
                                      <Text value={subItem.label} />
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      tooltip={getTooltipText(item.label)}
                      isActive={active}
                      asChild
                    >
                      <Link to={item.path}>
                        <Icon />
                        <span>
                          <Text value={item.label} />
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 pt-0">
        <UserProfile isCollapsed={isCollapsed} />
      </SidebarFooter>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow:
            "inset -1px 0 0 0 color-mix(in srgb, var(--color-border) 50%, transparent)",
        }}
      />
    </Sidebar>
  );
}

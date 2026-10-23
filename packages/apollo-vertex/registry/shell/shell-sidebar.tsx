"use client";

import { Link, useLocation } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
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
import { useVertexTranslation } from "@/lib/vertex-translation";
import type { CompanyLogo, ShellNavItem } from "./shell";
import {
  fastFadeTransition,
  iconHoverScale,
  textFadeVariants,
} from "./shell-animations";
import { Company } from "./shell-company";
import { MinimalCompany } from "./shell-minimal-company";
import { MinimalNavItem } from "./shell-minimal-nav-item";
import {
  activeNavItemPath,
  mostSpecificActivePath,
  navItemState,
} from "./shell-nav-active";
import { navCatalogFromHook, readNavLabel } from "./shell-nav-label";
import { Text } from "./shell-text";
import type { ShellNavLabel } from "./shell-translation-key";
import { UserProfile } from "./shell-user-profile";

const activeNavClass =
  "text-sidebar-foreground/85 hover:text-sidebar-foreground data-[active=true]:text-primary-700 dark:data-[active=true]:text-primary-400 data-[active=true]:font-semibold data-[active=true]:bg-primary-100/40 dark:data-[active=true]:bg-primary-900/30";
const navButtonClass = `font-medium ${activeNavClass}`;
const subButtonClass = activeNavClass;
const prefixActiveClass = [
  "font-semibold text-primary-700 dark:text-primary-400",
  "hover:text-primary-700 dark:hover:text-primary-400",
  "active:text-primary-700 dark:active:text-primary-400",
].join(" ");
const currentPillClass = "bg-primary-100/40 dark:bg-primary-900/30";

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
  const { pathname } = useLocation();

  if (variant === "minimal") {
    const activePath = mostSpecificActivePath(
      pathname,
      navItems.map((item) => item.path),
    );

    return (
      <header className="relative flex items-center justify-between px-4 sm:px-6 lg:px-8 py-6 transition-[padding] duration-300 ease-in-out">
        <MinimalCompany
          companyName={companyName}
          productName={productName}
          companyLogo={companyLogo}
        />

        {navItems.length > 0 && (
          <nav className="absolute left-1/2 -translate-x-1/2 flex items-center bg-muted dark:bg-[oklch(0.24_0.033_254)] rounded-full p-1.5 overflow-x-auto scrollbar-thin">
            {navItems.map((item) => (
              <MinimalNavItem
                key={item.path}
                to={item.to ?? item.path}
                active={item.path === activePath}
                label={item.label}
              />
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <UserProfile
            isCollapsed
            collapsedMenuSide="bottom"
            collapsedMenuAlign="end"
          />
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
  const { t, i18n } = useVertexTranslation();
  const catalog = navCatalogFromHook(i18n);
  const { state } = useSidebar();
  const { pathname } = useLocation();
  const isCollapsed = state === "collapsed";
  const [sidebarHovered, setSidebarHovered] = useState(false);

  const handleMouseEnter = () => {
    if (isCollapsed) setSidebarHovered(true);
  };

  const handleMouseLeave = () => {
    setSidebarHovered(false);
  };

  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    const expanded = new Set<string>();
    for (const item of navItems) {
      if (item.subItems?.some((sub) => pathname.startsWith(sub.path))) {
        expanded.add(item.path);
      }
    }
    return expanded;
  });

  useEffect(() => {
    const expanded = new Set<string>();
    for (const item of navItems) {
      if (item.subItems?.some((sub) => pathname.startsWith(sub.path))) {
        expanded.add(item.path);
      }
    }
    setExpandedItems(expanded);
  }, [pathname, navItems]);

  const toggleGroup = (path: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const activePath = activeNavItemPath(
    pathname,
    navItems.map((item) => ({
      path: item.path,
      childPaths: item.subItems?.map((sub) => sub.path),
    })),
  );

  const getTooltipText = (label: ShellNavLabel): string => {
    if (typeof label === "string") return readNavLabel(catalog, label);
    return t(label.i18nKey, label.values);
  };

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="border-0 bg-transparent [&_[data-slot=sidebar-container]]:border-0 [&_[data-slot=sidebar-inner]]:bg-[oklch(0.99_0_0)]/70 [&_[data-slot=sidebar-inner]]:backdrop-blur-xl dark:[&_[data-slot=sidebar-inner]]:bg-sidebar/75 [&_[data-slot=sidebar-inner]]:overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SidebarHeader className="pt-6 px-4 pb-0">
        <Company
          companyName={companyName}
          productName={productName}
          companyLogo={companyLogo}
          sidebarHovered={sidebarHovered}
        />
      </SidebarHeader>

      <SidebarContent className="px-4 pt-0 pb-3 mt-10">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isExpanded = expandedItems.has(item.path);
                const childPaths = item.subItems?.map((sub) => sub.path) ?? [];
                const isActiveItem = item.path === activePath;
                const itemState = navItemState(pathname, {
                  path: item.path,
                  to: item.to,
                  childPaths,
                });
                const row = isActiveItem
                  ? itemState
                  : { ...itemState, prefixActive: false, current: false };

                if (item.subItems && item.subItems.length > 0) {
                  return (
                    <Collapsible
                      key={item.path}
                      open={isExpanded && !isCollapsed}
                      onOpenChange={() => toggleGroup(item.path)}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <div
                          className={cn(
                            "flex w-full min-w-0 items-center rounded-md",
                            !isCollapsed && row.current && currentPillClass,
                            !isCollapsed &&
                              !row.current &&
                              "hover:bg-sidebar-accent/50",
                          )}
                        >
                          <SidebarMenuButton
                            asChild
                            tooltip={getTooltipText(item.label)}
                            isActive={isCollapsed && row.current}
                            className={cn(
                              navButtonClass,
                              row.prefixActive && prefixActiveClass,
                              !isCollapsed &&
                                "w-auto min-w-0 flex-1 bg-transparent hover:bg-transparent",
                            )}
                          >
                            <Link to={row.href}>
                              <motion.span
                                className="inline-flex items-center justify-center shrink-0"
                                {...(isCollapsed
                                  ? { whileHover: iconHoverScale }
                                  : {})}
                              >
                                <Icon className="size-4 shrink-0" />
                              </motion.span>
                              <AnimatePresence initial={false}>
                                {!isCollapsed && (
                                  <motion.span
                                    key="text"
                                    variants={textFadeVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={fastFadeTransition}
                                    className="whitespace-nowrap truncate"
                                  >
                                    <Text value={item.label} />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </Link>
                          </SidebarMenuButton>
                          {!isCollapsed && (
                            <CollapsibleTrigger asChild>
                              <button
                                type="button"
                                aria-expanded={isExpanded}
                                aria-label={t(
                                  isExpanded ? "nav_collapse" : "nav_expand",
                                  { label: getTooltipText(item.label) },
                                )}
                                className="flex size-8 shrink-0 items-center justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground"
                              >
                                <ChevronDown
                                  className={cn(
                                    "size-4 transition-transform duration-200",
                                    isExpanded && "rotate-180",
                                  )}
                                />
                              </button>
                            </CollapsibleTrigger>
                          )}
                        </div>
                        <CollapsibleContent>
                          <SidebarMenuSub className="ml-4 mr-0 mt-1 gap-0.5 pl-3 pr-0">
                            {item.subItems.map((subItem) => {
                              const sub = navItemState(pathname, {
                                path: subItem.path,
                                to: subItem.to,
                              });
                              return (
                                <SidebarMenuSubItem key={subItem.path}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={sub.current}
                                    className={cn(
                                      "cursor-pointer whitespace-nowrap",
                                      subButtonClass,
                                    )}
                                  >
                                    <Link to={sub.href}>
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
                      isActive={row.current}
                      asChild
                      className={navButtonClass}
                    >
                      <Link to={row.href}>
                        <motion.span
                          className="inline-flex items-center justify-center shrink-0"
                          {...(isCollapsed
                            ? { whileHover: iconHoverScale }
                            : {})}
                        >
                          <Icon className="size-4 shrink-0" />
                        </motion.span>
                        <AnimatePresence initial={false}>
                          {!isCollapsed && (
                            <motion.span
                              key="text"
                              variants={textFadeVariants}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              transition={fastFadeTransition}
                              className="whitespace-nowrap truncate"
                            >
                              <Text value={item.label} />
                            </motion.span>
                          )}
                        </AnimatePresence>
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
            "inset -1px 0 0 0 color-mix(in srgb, var(--border) 50%, transparent)",
        }}
      />
    </Sidebar>
  );
}

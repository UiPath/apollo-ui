import { Link, useLocation } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
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
import { fastFadeTransition, textFadeVariants } from "./shell-animations";
import { Company } from "./shell-company";
import { MinimalCompany } from "./shell-minimal-company";
import { MinimalNavItem } from "./shell-minimal-nav-item";
import { Text } from "./shell-text";
import { UserProfile } from "./shell-user-profile";

const activeNavClass =
  "text-sidebar-foreground/85 hover:text-sidebar-foreground data-[active=true]:text-primary-700 dark:data-[active=true]:text-primary-400 data-[active=true]:font-semibold data-[active=true]:bg-primary-100/40 dark:data-[active=true]:bg-primary-900/30";
const navButtonClass = `font-medium ${activeNavClass}`;
const subButtonClass = activeNavClass;

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
                to={item.path}
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
  const { t } = useTranslation();
  const { state, toggleSidebar } = useSidebar();
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
                            className={navButtonClass}
                          >
                            <Icon />
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
                            <AnimatePresence initial={false}>
                              {!isCollapsed && (
                                <motion.div
                                  key="chevron"
                                  variants={textFadeVariants}
                                  initial="initial"
                                  animate="animate"
                                  exit="exit"
                                  transition={fastFadeTransition}
                                  className="ml-auto"
                                >
                                  <ChevronDown
                                    className={cn(
                                      "size-4 transition-transform duration-200",
                                      isExpanded && "rotate-180",
                                    )}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub className="ml-4 mr-0 mt-1 gap-0.5 pl-3 pr-0">
                            {item.subItems.map((subItem) => {
                              const subActive = isActive(subItem.path);
                              return (
                                <SidebarMenuSubItem key={subItem.path}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={subActive}
                                    className={cn(
                                      "cursor-pointer whitespace-nowrap",
                                      subButtonClass,
                                    )}
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
                      className={navButtonClass}
                    >
                      <Link to={item.path}>
                        <Icon />
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
            "inset -1px 0 0 0 color-mix(in srgb, var(--color-border) 50%, transparent)",
        }}
      />
    </Sidebar>
  );
}

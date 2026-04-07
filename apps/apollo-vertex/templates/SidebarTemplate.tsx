"use client";

import {
  ChevronDown,
  Home,
  Inbox,
  LayoutDashboard,
  PanelLeft,
  Search,
  Settings,
  User2,
} from "lucide-react";
import { useState } from "react";
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
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { label: "Home", icon: Home },
  { label: "Inbox", icon: Inbox },
  { label: "Search", icon: Search },
];

const settingsSubItems = [
  { label: "General" },
  { label: "Appearance" },
  { label: "Notifications" },
];

function SidebarHeaderContent() {
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className="flex items-center justify-between gap-2">
      {!isCollapsed && (
        <>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-[4px] bg-primary flex items-center justify-center shrink-0">
              <LayoutDashboard className="size-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">Acme Inc</span>
          </div>
          <button
            type="button"
            onClick={toggleSidebar}
            className="h-8 w-8 shrink-0 flex items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors cursor-pointer"
          >
            <PanelLeft className="size-5" />
            <span className="sr-only">Collapse sidebar</span>
          </button>
        </>
      )}
      {isCollapsed && (
        <button
          type="button"
          onClick={toggleSidebar}
          className="size-8 rounded-[4px] bg-primary flex items-center justify-center shrink-0 cursor-pointer hover:bg-primary/80 transition-colors"
        >
          <LayoutDashboard className="size-5 text-primary-foreground" />
          <span className="sr-only">Expand sidebar</span>
        </button>
      )}
    </div>
  );
}

export function SidebarExample() {
  const [active, setActive] = useState("Home");
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <SidebarProvider
      defaultOpen
      className="h-screen min-h-0 overflow-hidden"
      /* oxlint-disable typescript-eslint(no-unsafe-type-assertion) -- CSS custom properties */
      style={
        {
          "--sidebar-width": "240px",
          "--sidebar-width-icon": "64px",
        } as React.CSSProperties
      }
      /* oxlint-enable typescript-eslint(no-unsafe-type-assertion) */
    >
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader className="p-4">
          <SidebarHeaderContent />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      isActive={active === item.label}
                      tooltip={item.label}
                      onClick={() => {
                        setActive(item.label);
                        setSettingsOpen(false);
                      }}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                <Collapsible
                  open={settingsOpen}
                  onOpenChange={setSettingsOpen}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip="Settings"
                        isActive={active.startsWith("Settings")}
                      >
                        <Settings />
                        <span>Settings</span>
                        <ChevronDown
                          className={cn(
                            "ml-auto size-4 transition-transform duration-200",
                            settingsOpen && "rotate-180",
                          )}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {settingsSubItems.map((sub) => {
                          const subKey = `Settings: ${sub.label}`;
                          return (
                            <SidebarMenuSubItem key={sub.label}>
                              <SidebarMenuSubButton
                                isActive={active === subKey}
                                className="cursor-pointer"
                                onClick={() => setActive(subKey)}
                              >
                                {sub.label}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="User">
                <User2 />
                <span>John Doe</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-1">
          <p className="text-lg font-medium">{active}</p>
          <p className="text-sm text-muted-foreground">
            Click a nav item or collapse the sidebar
          </p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

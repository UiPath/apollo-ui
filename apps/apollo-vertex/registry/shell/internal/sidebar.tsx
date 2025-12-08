"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Company } from './company';
import { UserProfile } from './user-profile';

interface SidebarProps {
  companyName: string;
  productName: string;
}

export const Sidebar = ({ companyName, productName }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  const sidebarWidth = isCollapsed ? 'w-[32px]' : 'w-[264px]';

  return (
    <aside className={cn(sidebarWidth, "rounded-[10px] flex flex-col transition-all duration-300")}>
      <Company isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} companyName={companyName} productName={productName} />
      <div className="flex-1" />
      <UserProfile isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
    </aside>
  );
};

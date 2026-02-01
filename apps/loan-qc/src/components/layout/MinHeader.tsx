"use client";

import { Box, Bell } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function MinHeader() {
  return (
    <header className="bg-background">
      <div className="flex h-16 items-center justify-between px-8">
        {/* Left section - App branding */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-8 bg-foreground rounded-md">
            <Box className="size-4 text-background" />
          </div>
          <span className="text-sm font-medium text-foreground">
            Loan processing - QC
          </span>
        </div>

        {/* Right section - User controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center justify-center size-8 hover:bg-muted rounded-md transition-colors"
            aria-label="Notifications"
          >
            <Bell className="size-4 text-foreground" />
          </button>
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/40 text-foreground text-xs">
              JD
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

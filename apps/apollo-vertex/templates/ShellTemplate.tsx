"use client";

import { ShellLayout } from "@/registry/shell/internal/shell-layout";

export function ShellTemplate() {
    return (
        <ShellLayout companyName="UiPath" productName="Apollo Vertex">
            <div className="p-8 h-[500px] flex items-center justify-center">
                <p className="text-xl font-bold">Your content here</p>
            </div>
        </ShellLayout>
    );
}

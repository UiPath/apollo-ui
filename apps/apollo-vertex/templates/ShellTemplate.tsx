"use client";

import { ShellLayout } from "@/registry/shell/internal/shell-layout";

export function ShellTemplate() {
    return (
        <ShellLayout companyName="UiPath" productName="Apollo Vertex">
            <div className="p-8">
                <div className="max-w-2xl space-y-4">
                    <h2 className="text-2xl font-bold">
                        Welcome to Apollo Vertex
                    </h2>
                    <p className="text-muted-foreground">
                        This is an example of the Shell Template with
                        authentication, collapsible sidebar, and smooth
                        animations.
                    </p>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="p-4 border rounded-lg">
                            <h3 className="font-semibold mb-2">Feature 1</h3>
                            <p className="text-sm text-muted-foreground">
                                UiPath Authentication
                            </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <h3 className="font-semibold mb-2">Feature 2</h3>
                            <p className="text-sm text-muted-foreground">
                                Collapsible Sidebar
                            </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <h3 className="font-semibold mb-2">Feature 3</h3>
                            <p className="text-sm text-muted-foreground">
                                Smooth Animations
                            </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <h3 className="font-semibold mb-2">Feature 4</h3>
                            <p className="text-sm text-muted-foreground">
                                Theme Support
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ShellLayout>
    );
}

"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { AuthConfiguration } from "@uipath/auth-react";
import { onCallback } from "@uipath/auth-react";

const ApolloShell = dynamic(
    () =>
        import("@/registry/shell/shell").then((mod) => ({
            default: mod.ApolloShell,
        })),
    {
        ssr: false,
    },
);

export function ShellTemplate() {
    const router = useRouter();
    const configuration: AuthConfiguration = {
        authority: "https://alpha.uipath.com/identity_",
        redirect_uri: "http://localhost:3000/templates/shell-template",
        post_logout_redirect_uri: "http://localhost:3000",
    };

    return (
        <ApolloShell
            configuration={configuration}
            onSigninCallback={(user) => {
                onCallback(user, (to) => {
                    router.push(to);
                });
            }}
            companyName="UiPath"
            productName="Apollo Vertex"
        >
            <div className="p-8 h-[500px] flex items-center justify-center">
                <p className="text-xl font-bold">Your content here</p>
            </div>
        </ApolloShell>
    );
}

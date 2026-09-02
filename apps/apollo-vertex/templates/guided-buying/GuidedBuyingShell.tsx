"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { useState } from "react";
import { AutopilotChatProvider } from "./AutopilotChatProvider";
import { AssistantThreadProvider } from "./catalog/v1/assistant-thread-context";
import { CartProvider } from "./catalog/v1/CartProvider";
import { ConversationProvider } from "./catalog/v1/ConversationProvider";
import { IntakeStateProvider } from "./intake/IntakeStateProvider";
import { RequestsProvider } from "./requests/RequestsProvider";
import { routeTree } from "./route-tree";
import { TierProvider } from "./tier-context";

const queryClient = new QueryClient();

// A Coded App build serves from a sub-path (see next.config.mjs's basePath),
// the router's basepath has to include that prefix too, or browser-history
// navigation would resolve against the wrong root. Plain deployments (this
// app's own Vercel preview) leave it unset, so basepath is just the mount path.
const codedAppPath = process.env.NEXT_PUBLIC_APOLLO_CODED_APP_PATH;
const routerBasepath = codedAppPath
  ? `/${codedAppPath}/guided-buying`
  : "/guided-buying";

export function GuidedBuyingShell() {
  const [router] = useState(() =>
    createRouter({
      routeTree,
      basepath: routerBasepath,
      // Real URLs: reloading or sharing a link to any route below resolves
      // through the Next catch-all (app/guided-buying/[[...slug]]) and this
      // router picks up wherever window.location already points.
      history: createBrowserHistory(),
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TierProvider>
        <CartProvider>
          <ConversationProvider>
            <AssistantThreadProvider>
              <RequestsProvider>
                <IntakeStateProvider>
                  <AutopilotChatProvider>
                    {/* Global gradient def, all AiMark icons reference "gb-ai-mark" */}
                    <svg width={0} height={0} aria-hidden className="absolute">
                      <defs>
                        <linearGradient
                          id="gb-ai-mark"
                          x1="2"
                          y1="4"
                          x2="22"
                          y2="20"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop
                            offset="0"
                            stopColor="var(--ai-gradient-start)"
                          />
                          <stop offset="1" stopColor="var(--ai-gradient-end)" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <RouterProvider router={router} />
                  </AutopilotChatProvider>
                </IntakeStateProvider>
              </RequestsProvider>
            </AssistantThreadProvider>
          </ConversationProvider>
        </CartProvider>
      </TierProvider>
    </QueryClientProvider>
  );
}

"use client";

import { useState } from "react";

import { Card, CardDescription, CardTitle } from "@/registry/card/card";

export function SelectableCardDemo() {
  const [standardSelected, setStandardSelected] = useState(false);
  const [aiSelected, setAiSelected] = useState(false);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-8 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Card
        selectable="standard"
        selected={standardSelected}
        onClick={() => setStandardSelected(!standardSelected)}
      >
        <CardTitle>Standard</CardTitle>
        <CardDescription>
          Click to select this card. Uses a primary color glow.
        </CardDescription>
      </Card>
      <Card
        selectable="ai"
        selected={aiSelected}
        onClick={() => setAiSelected(!aiSelected)}
      >
        <CardTitle>AI Mode</CardTitle>
        <CardDescription>
          Click to select this card. Uses an AI gradient glow.
        </CardDescription>
      </Card>
    </div>
  );
}

"use client";

import { DashboardTemplate } from "@/templates/dashboard/DashboardTemplateDynamic";
import { productDemoDataset } from "@/templates/dashboard/product-demo-data";

export default function ProductDemoPage() {
  return (
    <div className="fixed inset-0 z-50 bg-background not-prose">
      <DashboardTemplate dataset={productDemoDataset} demoMode />
    </div>
  );
}

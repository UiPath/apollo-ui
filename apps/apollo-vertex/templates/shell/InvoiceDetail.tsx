"use client";

import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderBackButton,
  PageHeaderDescription,
  PageHeaderNav,
  PageHeaderTitle,
  PageHeaderTitleGroup,
} from "@/components/ui/page-header";

export function InvoiceDetail() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full relative z-10">
      <PageHeader bordered>
        <PageHeaderNav>
          <PageHeaderBackButton
            onClick={() => void navigate({ to: "/preview/shell/dashboard" })}
          />
          <PageHeaderTitleGroup>
            <PageHeaderTitle>INV-4021</PageHeaderTitle>
            <PageHeaderDescription>Acme Corp</PageHeaderDescription>
          </PageHeaderTitleGroup>
        </PageHeaderNav>
        <PageHeaderActions>
          <Button variant="outline" size="sm">
            Reject
          </Button>
          <Button size="sm">Approve</Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        <Card variant="glass" className="gap-6 py-6">
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Amount</dt>
                <dd className="font-medium">$12,450.00</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant="default" className="text-xs">
                    Processed
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Vendor</dt>
                <dd className="font-medium">Acme Corp</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">PO Number</dt>
                <dd className="font-medium">PO-2026-0142</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Payment Terms</dt>
                <dd className="font-medium">Net 30</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Due Date</dt>
                <dd className="font-medium">Mar 27, 2026</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card variant="glass" className="gap-6 py-6">
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {[
                {
                  desc: "Cloud Infrastructure Services",
                  qty: 1,
                  price: "$8,500.00",
                },
                {
                  desc: "Professional Services - Setup",
                  qty: 10,
                  price: "$2,500.00",
                },
                {
                  desc: "Support & Maintenance (Annual)",
                  qty: 1,
                  price: "$1,450.00",
                },
              ].map((item) => (
                <div
                  key={item.desc}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="font-medium">{item.desc}</p>
                    <p className="text-muted-foreground">Qty: {item.qty}</p>
                  </div>
                  <span className="font-medium">{item.price}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 font-semibold">
                <span>Total</span>
                <span>$12,450.00</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

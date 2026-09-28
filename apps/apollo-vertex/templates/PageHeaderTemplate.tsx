"use client";

import { Share2 } from "lucide-react";

import { Badge } from "@/registry/badge/badge";
import { Button } from "@/registry/button/button";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderBackButton,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderField,
  PageHeaderFieldLabel,
  PageHeaderFieldValue,
  PageHeaderNav,
  PageHeaderTitle,
  PageHeaderTitleGroup,
} from "@/registry/page-header/page-header";

/** Full demo showing metadata fields — fits within narrow docs containers */
export function PageHeaderFullDemo() {
  return (
    <PageHeader bordered>
      <PageHeaderNav>
        <PageHeaderBackButton />
        <PageHeaderTitleGroup>
          <PageHeaderTitle>Record Summary</PageHeaderTitle>
          <PageHeaderDescription>
            Last updated 2 hours ago
          </PageHeaderDescription>
        </PageHeaderTitleGroup>
      </PageHeaderNav>

      <PageHeaderContent>
        <PageHeaderField>
          <PageHeaderFieldLabel>Status</PageHeaderFieldLabel>
          <PageHeaderFieldValue>
            <Badge variant="outline" className="text-xs">
              In Progress
            </Badge>
          </PageHeaderFieldValue>
        </PageHeaderField>
        <PageHeaderField>
          <PageHeaderFieldLabel>Template</PageHeaderFieldLabel>
          <PageHeaderFieldValue>Clinical Review</PageHeaderFieldValue>
        </PageHeaderField>
      </PageHeaderContent>

      <PageHeaderActions>
        <Button variant="outline" size="sm">
          <Share2 className="size-4" />
          Share
        </Button>
        <Button size="sm">Save</Button>
      </PageHeaderActions>
    </PageHeader>
  );
}

/** Simple list header demo */
export function PageHeaderListDemo() {
  return (
    <PageHeader>
      <PageHeaderNav>
        <PageHeaderTitle>Invoice Processing</PageHeaderTitle>
      </PageHeaderNav>
      <PageHeaderActions>
        <Button variant="outline" size="sm">
          Export
        </Button>
        <Button size="sm">New Invoice</Button>
      </PageHeaderActions>
    </PageHeader>
  );
}

/** Detail header with back button demo */
export function PageHeaderDetailDemo() {
  return (
    <PageHeader>
      <PageHeaderNav>
        <PageHeaderBackButton />
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
  );
}

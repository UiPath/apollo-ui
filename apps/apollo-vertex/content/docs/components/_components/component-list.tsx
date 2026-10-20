import type * as PageTree from "fumadocs-core/page-tree";
import Link from "next/link";
import type { ReactNode } from "react";
import { source } from "../../../../lib/source";

interface ComponentGroup {
  name?: ReactNode;
  pages: PageTree.Item[];
}

// Lists every component page in sidebar order, grouped like the sidebar.
export function ComponentList() {
  const folder = source
    .getPageTree()
    .children.find(
      (node) => node.type === "folder" && node.index?.url === "/components",
    );
  const ungrouped: ComponentGroup = { pages: [] };
  const groups = [ungrouped];

  if (folder?.type === "folder") {
    for (const node of folder.children) {
      if (node.type === "folder") {
        groups.push({
          name: node.name,
          pages: node.children.filter((child) => child.type === "page"),
        });
      } else if (node.type === "page") {
        ungrouped.pages.push(node);
      }
    }
  }

  return (
    <div className="not-prose mt-6 flex flex-col gap-10">
      {groups
        .filter((group) => group.pages.length > 0)
        .map((group) => (
          <section key={group.pages[0].url}>
            {group.name ? (
              <h2 className="text-2xl font-semibold tracking-[-0.015em]">
                {group.name}
              </h2>
            ) : null}
            <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.pages.map((page) => (
                <Link
                  key={page.url}
                  href={page.url}
                  className="text-fd-foreground hover:underline"
                >
                  {page.name}
                </Link>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}

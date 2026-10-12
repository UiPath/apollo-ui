import Link from "next/link";
import { source } from "../../../../lib/source";

// Lists every component page in sidebar order, so the index stays in sync
// with content/docs/components/meta.json.
export function ComponentList() {
  const folder = source
    .getPageTree()
    .children.find(
      (node) => node.type === "folder" && node.index?.url === "/components",
    );
  const pages =
    folder?.type === "folder"
      ? folder.children.filter((node) => node.type === "page")
      : [];

  return (
    <div className="not-prose mt-6 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {pages.map((page) => (
        <Link
          key={page.url}
          href={page.url}
          className="text-fd-foreground hover:underline"
        >
          {page.name}
        </Link>
      ))}
    </div>
  );
}

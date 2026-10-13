import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";
import Link from "next/link";
import type { DocsPageData } from "../../lib/page-schema";
import { source } from "../../lib/source";

function findComponentPage(slug: string) {
  return (
    source.getPage(["components", slug]) ?? source.getPage(["patterns", slug])
  );
}

/**
 * Renders the whenToUse, avoidWhen and example frontmatter of a component
 * page. The same fields generate the vertex-component-catalog agent skill.
 */
export function ComponentGuidance({
  whenToUse = [],
  avoidWhen = [],
  example,
}: Pick<DocsPageData, "whenToUse" | "avoidWhen" | "example">) {
  const hasGuidance = whenToUse.length > 0 || avoidWhen.length > 0;
  if (!hasGuidance && !example) return null;

  return (
    <>
      {hasGuidance && (
        <div className="not-prose grid gap-4 sm:grid-cols-2">
          {whenToUse.length > 0 && (
            <section className="rounded-lg border p-4">
              <h2 className="mb-2 font-medium text-sm">Use when</h2>
              <ul className="list-disc space-y-1 pl-5 text-fd-muted-foreground text-sm">
                {whenToUse.map((item) => (
                  <li key={item} className="first-letter:uppercase">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {avoidWhen.length > 0 && (
            <section className="rounded-lg border p-4">
              <h2 className="mb-2 font-medium text-sm">Avoid when</h2>
              <ul className="list-disc space-y-1 pl-5 text-fd-muted-foreground text-sm">
                {avoidWhen.map((item) => {
                  const alternative = item.use && findComponentPage(item.use);
                  return (
                    <li key={item.when} className="first-letter:uppercase">
                      {item.when}
                      {alternative && (
                        <>
                          {" Use "}
                          <Link
                            href={alternative.url}
                            className="font-medium text-fd-foreground underline underline-offset-4"
                          >
                            {alternative.data.title}
                          </Link>
                          {" instead."}
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}
      {example && (
        <>
          <h2>Usage with the npm package</h2>
          <ServerCodeBlock lang="tsx" code={example.trimEnd()} />
        </>
      )}
    </>
  );
}

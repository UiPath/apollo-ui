import { Button, ChatComposerFooter } from '@uipath/apollo-wind';

import { useComposerFooter } from '../../headless/hooks/use-composer-footer';

/**
 * The line under the field. Without info links it is the centered disclaimer; with them the links
 * lead and the disclaimer ends the row, wrapping under the links when the panel is narrow.
 */
export function WindComposerFooter() {
  const { disclaimer, links } = useComposerFooter();

  if (links.length === 0) {
    // Material's footer size.
    return <ChatComposerFooter className="text-[10px]">{disclaimer}</ChatComposerFooter>;
  }

  return (
    <div
      data-slot="chat-composer-footer-row"
      className="flex flex-wrap items-baseline justify-between gap-2 px-1 text-[10px] text-muted-foreground"
    >
      <ul data-slot="chat-composer-info-links" className="flex flex-wrap gap-x-3">
        {links.map(({ label, href }, index) => (
          // A host may repeat a label or a URL, so the position is the key.
          <li key={index}>
            {href ? (
              // The standard link: a link-variant button on an anchor, sized to the footer line.
              <Button asChild variant="link" size="4xs" className="h-auto px-0 text-[10px]">
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {label}
                </a>
              </Button>
            ) : (
              label
            )}
          </li>
        ))}
      </ul>
      {disclaimer && (
        <ChatComposerFooter className="px-0 text-end text-[10px]">{disclaimer}</ChatComposerFooter>
      )}
    </div>
  );
}

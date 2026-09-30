import { LinkArrowIcon } from "nextra/icons";

const meta = {
  index: "Overview",
  "creating-occupants": "Creating occupants",
  // Opens outside the docs layout, so it carries the site's outside-link arrow.
  "occupant-workbench": {
    title: (
      <span className="inline-flex items-center gap-1">
        Occupant workbench
        <LinkArrowIcon height="1em" className="shrink-0" aria-hidden="true" />
      </span>
    ),
    href: "/preview/occupants",
  },
};

export default meta;

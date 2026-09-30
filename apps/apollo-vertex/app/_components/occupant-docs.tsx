import Link from "next/link";
import { Table } from "nextra/components";
import { LinkArrowIcon } from "nextra/icons";
import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fitsSurface,
  occupantOrientations,
  occupantPadding,
} from "@/lib/composition";
import { specFor } from "@/lib/occupant-lookup";
import { OCCUPANT_SPECS, SURFACE_SPECS } from "@/lib/occupants.generated";
import { surfaceLabel } from "@/lib/surface-labels";
import { workbenchHref } from "./workbench-href";

/** Docs links look like the page's other links. */
const LINK = "text-primary underline underline-offset-2";

/*
 * Docs for occupants, generated from the specs. Nothing here is typed by
 * hand: a page shows what the spec says.
 */

/** A registered occupant's spec; a docs page naming any other is a mistake. */
const registeredSpec = (name: string) => {
  const spec = specFor(name);
  if (!spec) throw new Error(`No registered occupant named ${name}`);
  return spec;
};

/** The docs' own page title, so an occupant's title looks like every other page's. */
const { h1: PageTitle = "h1" } = getThemeComponents();

interface OccupantTitleProps {
  /** A registered occupant's name. */
  name: string;
}

/**
 * An occupant page's title: its name as the heading, with the "Occupant"
 * badge beside it and outside it, wrapping under a title too long for one line.
 */
export function OccupantTitle({ name }: OccupantTitleProps) {
  const spec = registeredSpec(name);
  return (
    <div
      data-slot="occupant-title"
      className="flex flex-wrap items-center gap-x-3 gap-y-1"
    >
      <PageTitle>{spec.label}</PageTitle>
      <Badge variant="secondary" className="mt-2 shrink-0">
        Occupant
      </Badge>
    </div>
  );
}

interface OpenInWorkbenchProps {
  /** Opens the workbench with this occupant. Leave out for the workbench alone. */
  name?: string;
}

/** A button that opens the occupant workbench, which runs outside the docs layout. */
export function OpenInWorkbench({ name }: OpenInWorkbenchProps) {
  return (
    <p className="not-prose my-4">
      <Button asChild variant="outline" size="sm">
        <Link href={workbenchHref(name)} data-slot="workbench-entry">
          {name ? "Open in workbench" : "Open the workbench"}
          <LinkArrowIcon height="1em" aria-hidden="true" />
        </Link>
      </Button>
    </p>
  );
}

interface WhereItFitsProps {
  /** A registered occupant's name. */
  name: string;
}

/** Where an occupant fits, from its spec: surfaces, orientation, and requirements. */
export function WhereItFits({ name }: WhereItFitsProps) {
  const spec = registeredSpec(name);
  const surfaces = SURFACE_SPECS.filter(
    (surface) => fitsSurface(surface, spec).fits,
  );
  const rows: [string, React.ReactNode][] = [
    [
      "Surfaces",
      surfaces.map((surface, index) => (
        <span key={surface.name}>
          {index > 0 && ", "}
          <Link className={LINK} href={`/surfaces/${surface.name}`}>
            {surfaceLabel(surface.name)}
          </Link>
        </span>
      )),
    ],
    ["Orientations", occupantOrientations(spec).join(", ")],
    ["Minimum width", `${spec.requires.minWidth}px`],
    ["Padding", occupantPadding(spec)],
    ["Scroll", spec.requires.scroll],
  ];
  return (
    <>
      <Table>
        <thead>
          <Table.Tr>
            <Table.Th>Spec</Table.Th>
            <Table.Th>Value</Table.Th>
          </Table.Tr>
        </thead>
        <tbody>
          {rows.map(([label, value]) => (
            <Table.Tr key={label}>
              <Table.Td>{label}</Table.Td>
              <Table.Td>{value}</Table.Td>
            </Table.Tr>
          ))}
        </tbody>
      </Table>
      <p className="mt-4">
        Try it in every surface, with each sample, state, and theme, in the{" "}
        <Link className={LINK} href={workbenchHref(name)}>
          occupant workbench
        </Link>
        .
      </p>
    </>
  );
}

interface OccupantsThatFitProps {
  /** A registered surface's name. */
  surface: string;
}

/** Every registered occupant that fits a surface, from all the specs. */
export function OccupantsThatFit({ surface: name }: OccupantsThatFitProps) {
  const surface = SURFACE_SPECS.find((s) => s.name === name);
  if (!surface) throw new Error(`No registered surface named ${name}`);
  const fitting = OCCUPANT_SPECS.map((o) => o.spec).filter(
    (spec) => fitsSurface(surface, spec).fits,
  );
  if (fitting.length === 0) return <p>No registered occupant fits here yet.</p>;
  return (
    <Table>
      <thead>
        <Table.Tr>
          <Table.Th>Occupant</Table.Th>
          <Table.Th>Minimum width</Table.Th>
          <Table.Th>Padding</Table.Th>
          <Table.Th>Workbench</Table.Th>
        </Table.Tr>
      </thead>
      <tbody>
        {fitting.map((spec) => (
          <Table.Tr key={spec.name}>
            <Table.Td>
              <Link className={LINK} href={`/patterns/${spec.name}`}>
                {spec.label}
              </Link>
            </Table.Td>
            <Table.Td>{`${spec.requires.minWidth}px`}</Table.Td>
            <Table.Td>{occupantPadding(spec)}</Table.Td>
            <Table.Td>
              <Link
                className={LINK}
                href={workbenchHref(spec.name, surface.name)}
              >
                Open in workbench
                <span className="sr-only"> for {spec.label}</span>
              </Link>
            </Table.Td>
          </Table.Tr>
        ))}
      </tbody>
    </Table>
  );
}

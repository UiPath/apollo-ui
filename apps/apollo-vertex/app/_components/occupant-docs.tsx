import Link from "next/link";
import { Table } from "nextra/components";
import { Badge } from "@/components/ui/badge";
import {
  fitsSurface,
  occupantOrientations,
  occupantPadding,
} from "@/lib/composition";
import { OCCUPANT_SPECS, SURFACE_SPECS } from "@/lib/occupants.generated";
import { surfaceLabel } from "@/lib/surface-labels";

/*
 * Docs for occupants, generated from the specs. Nothing here is typed by
 * hand: a page shows what the spec says.
 */

const specFor = (name: string) => {
  const entry = OCCUPANT_SPECS.find((o) => o.spec.name === name);
  if (!entry) throw new Error(`No registered occupant named ${name}`);
  return entry.spec;
};

/** The label at the top of a pattern page that takes the occupant role. */
export function OccupantLabel() {
  return (
    <p>
      <Badge variant="secondary">Occupant</Badge>
    </p>
  );
}

interface WhereItFitsProps {
  /** A registered occupant's name. */
  name: string;
}

/** Where an occupant fits, from its spec: surfaces, orientation, and requirements. */
export function WhereItFits({ name }: WhereItFitsProps) {
  const spec = specFor(name);
  const surfaces = SURFACE_SPECS.filter(
    (surface) => fitsSurface(surface, spec).fits,
  );
  const rows: [string, React.ReactNode][] = [
    [
      "Surfaces",
      surfaces.map((surface, index) => (
        <span key={surface.name}>
          {index > 0 && ", "}
          <Link href={`/surfaces/${surface.name}`}>
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
      <p>
        Try it in every surface, with each sample, state, and theme, in the{" "}
        <Link href={`/preview/occupants?occupant=${name}`}>
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
        </Table.Tr>
      </thead>
      <tbody>
        {fitting.map((spec) => (
          <Table.Tr key={spec.name}>
            <Table.Td>
              <Link href={`/patterns/${spec.name}`}>{spec.label}</Link>
            </Table.Td>
            <Table.Td>{`${spec.requires.minWidth}px`}</Table.Td>
            <Table.Td>{occupantPadding(spec)}</Table.Td>
          </Table.Tr>
        ))}
      </tbody>
    </Table>
  );
}

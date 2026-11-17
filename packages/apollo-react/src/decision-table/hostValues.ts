import type { OperatorOffer, ValueCommit, ValueFieldData } from './valueTypes';

/** What the view knows of a refused edit: its column's name, and the values it refused, joined. */
export interface RefusalContext {
  column: string;
  values: string;
}

/** The values a refused commit carried, as its refusal names them. */
export const refusedValuesOf = <Op>(commit: ValueCommit<Op>): string => {
  switch (commit.kind) {
    case 'outcome':
    case 'single':
      return commit.value;
    case 'range':
      return [commit.low, commit.high].join(', ');
    case 'list':
      return commit.values.join(', ');
    case 'valueless':
      return '';
    case 'expression':
      return commit.text;
  }
};

const offeredOf = <Op>(operators: readonly OperatorOffer<Op>[]): readonly OperatorOffer<Op>[] =>
  operators.filter(
    (offer, place) => operators.findIndex((first) => first.operator === offer.operator) === place
  );

/** The host's field with each operator by its place among the offers, repeats dropped, a held operator it does not offer opened as its expression. */
export const viewFieldOf = <Op>(field: ValueFieldData<Op>): ValueFieldData<number> => {
  if (field.kind !== 'condition') return field;
  const { held } = field;
  const operators = offeredOf(field.operators);
  const index = operators.findIndex((offer) => offer.operator === held.operator);
  if (index < 0) {
    return { kind: 'expression', allowedValues: field.allowedValues, expression: field.expression };
  }
  return {
    ...field,
    operators: operators.map((offer, place) => ({ ...offer, operator: place })),
    held: { ...held, operator: index },
  };
};

/** A commit with its operator's place among the offers, repeats dropped, turned back into the host's operator, or undefined when no offer is there. */
export const hostCommitOf = <Op>(
  commit: ValueCommit<number>,
  operators: readonly OperatorOffer<Op>[]
): ValueCommit<Op> | undefined => {
  if (commit.kind === 'outcome' || commit.kind === 'expression') return commit;
  const offer = offeredOf(operators).find((_offer, place) => place === commit.operator);
  return offer && { ...commit, operator: offer.operator };
};

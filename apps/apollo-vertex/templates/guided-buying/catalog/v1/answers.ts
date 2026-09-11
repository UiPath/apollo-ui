import type {
  StructuredTableColumn,
  StructuredTableRow,
} from "../../StructuredTable";
import type { MessageBlock } from "./assistant-thread-context";
import {
  ANSWER_COPY,
  CATALOG_ITEMS,
  effectivePrice,
  eppSavings,
  formatPrice,
  INFERRED_REQUEST_QUANTITY,
  ramGb,
} from "./data";
import type { CatalogItem } from "./types";

/**
 * Builds the assistant's structured answers.
 *
 * Every number rendered here is read or derived from the same catalog the
 * results cards read: unit prices via `effectivePrice`, discounts via
 * `eppSavings`, extended totals from `INFERRED_REQUEST_QUANTITY`. Nothing is
 * transcribed, so an answer cannot drift from the cards it describes.
 *
 * Copy that is not derived from data is a bracketed placeholder. Final
 * wording is not settled.
 */

/** A metric one row of the comparison reports, and how to read it. */
interface ComparisonMetric {
  key: string;
  label: string;
  value: (item: CatalogItem) => number | null;
  format: (item: CatalogItem, value: number) => string;
}

const METRICS: ComparisonMetric[] = [
  {
    key: "unit",
    label: ANSWER_COPY.unitPrice,
    value: (item) => effectivePrice(item),
    format: (item, value) => formatPrice(value, item.currency),
  },
  {
    key: "discount",
    label: ANSWER_COPY.eppDiscount,
    value: (item) => eppSavings(item),
    format: (item, value) => formatPrice(value, item.currency),
  },
  {
    key: "extended",
    label: ANSWER_COPY.extendedTotal(INFERRED_REQUEST_QUANTITY),
    value: (item) => effectivePrice(item) * INFERRED_REQUEST_QUANTITY,
    format: (item, value) => formatPrice(value, item.currency),
  },
  {
    key: "memory",
    label: ANSWER_COPY.memory,
    value: (item) => ramGb(item),
    format: (_item, value) => `${value}GB`,
  },
];

function findItem(itemId: string): CatalogItem | undefined {
  return CATALOG_ITEMS.find((item) => item.id === itemId);
}

/**
 * A labelled row set with one column per product. The metric column leads,
 * then one column per item in the order given, so the current pick reads
 * first and the alternative beside it.
 *
 * A row whose values differ across the products is `emphasized`, which is
 * what carries the weight onto the values that actually disagree; a row
 * where the products match stays quiet.
 */
function comparisonTable(items: CatalogItem[]): MessageBlock {
  const columns: StructuredTableColumn[] = [
    {
      key: "metric",
      label: ANSWER_COPY.metricColumn,
      align: "left",
      width: "w-32",
    },
    ...items.map((item) => ({
      key: item.id,
      label: item.name,
      align: "right" as const,
    })),
  ];

  const rows: StructuredTableRow[] = METRICS.flatMap((metric) => {
    const values = items.map((item) => metric.value(item));
    // A metric no item can report is dropped rather than rendered blank.
    if (values.every((value) => value === null)) return [];

    const present = values.filter((value): value is number => value !== null);
    const differs = new Set(present).size > 1;

    const cells: Record<string, string> = { metric: metric.label };
    for (const [index, item] of items.entries()) {
      const value = values[index];
      cells[item.id] = value === null ? "" : metric.format(item, value);
    }

    return [{ key: metric.key, cells, emphasized: differs }];
  });

  return { type: "table", caption: ANSWER_COPY.caption, rows, columns };
}

/**
 * The answer to a comparison question: a short framing line, the labelled
 * row set, a summary line carrying the derived difference, and the actions
 * that operate on the results list.
 */
export function buildComparisonAnswer(
  pickId: string,
  alternativeId: string,
): MessageBlock[] | null {
  const pick = findItem(pickId);
  const alternative = findItem(alternativeId);
  if (!pick || !alternative) return null;

  const unitGap = effectivePrice(alternative) - effectivePrice(pick);
  const extendedGap = unitGap * INFERRED_REQUEST_QUANTITY;
  // Stated in absolute terms, from whichever side is actually cheaper, so
  // the sentence does not have to change shape with the sign.
  const cheaper = unitGap < 0 ? alternative : pick;
  const gapText = formatPrice(Math.abs(extendedGap), pick.currency);

  return [
    { type: "prose", text: ANSWER_COPY.framing },
    comparisonTable([pick, alternative]),
    {
      type: "prose",
      text: ANSWER_COPY.summary(
        cheaper.name,
        gapText,
        INFERRED_REQUEST_QUANTITY,
      ),
    },
    {
      type: "actions",
      actions: [
        {
          id: `switch-${alternative.id}`,
          label: ANSWER_COPY.switchTo(alternative.name),
          itemId: alternative.id,
          intent: "switch",
        },
        {
          id: `keep-${pick.id}`,
          label: ANSWER_COPY.keep(pick.name),
          itemId: pick.id,
          intent: "keep",
        },
      ],
    },
  ];
}

/** Shortest run of characters worth treating as a distinguishing name. */
const MIN_TOKEN = 3;

function escapeForRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Which alternative a question is asking about, resolved against the catalog
 * rather than against a list of expected phrasings.
 *
 * Matching is on whole words of a product's name, and only on words long
 * enough to identify anything: a question says "the XPS", not "Dell XPS 14",
 * so the full name rarely appears, but a bare substring search over short
 * words is worse than useless. "Logitech MX Keys S" ends in a one-character
 * word, and matching that as a substring makes the keyboard answer to any
 * question containing an "s", including "how does the XPS compare".
 *
 * The best-scoring candidate wins, so a question naming two words of one
 * product beats one that glances off a single word of another.
 */
export function alternativeFor(
  question: string,
  pickId: string,
): CatalogItem | null {
  const haystack = question.toLowerCase();
  const candidates = CATALOG_ITEMS.filter((item) => item.id !== pickId);

  let best: CatalogItem | null = null;
  let bestScore = 0;
  for (const item of candidates) {
    // A question carrying the whole catalog name is unambiguous.
    if (haystack.includes(item.name.toLowerCase())) return item;

    const tokens = item.name
      .toLowerCase()
      .split(/\s+/)
      .filter((token) => token.length >= MIN_TOKEN);
    const score = tokens.filter((token) =>
      new RegExp(`\\b${escapeForRegExp(token)}\\b`).test(haystack),
    ).length;
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best;
}

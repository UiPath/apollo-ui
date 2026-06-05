import type { ElementTransformer, TextMatchTransformer } from '@lexical/markdown';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table';
import { $isParagraphNode, $isTextNode, type LexicalNode, TextNode } from 'lexical';

const UNDERLINE_EXPORTER_AND_TRANSFORMER: TextMatchTransformer = {
  dependencies: [TextNode],
  export: (node, _, exportFormat) => {
    if ($isTextNode(node) && node.hasFormat('underline')) {
      return '<u>' + exportFormat(node, node.getTextContent()) + '</u>';
    }
    return null;
  },
  importRegExp: /<u>(.*?)<\/u>/,
  regExp: /<u>(.*?)<\/u>$/,
  replace: (textNode, match) => {
    textNode.setFormat('underline');
    textNode.setTextContent(match[1] ?? '');
    return textNode;
  },
  trigger: '>',
  type: 'text-match',
};

const UNDERLINE_IMPORTER: ElementTransformer = {
  dependencies: [TextNode],
  export: () => null,
  regExp: /<u>(.*?)<\/u>/,
  replace: (_, children, match) => {
    for (const child of children) {
      if ($isTextNode(child)) {
        child.setFormat('underline');
        child.setTextContent(match[1] ?? '');
      }
    }
  },
  type: 'element',
};

// Very primitive table setup
const TABLE_ROW_REG_EXP = /^(?:\|)(.+)(?:\|)\s?$/;
const TABLE_ROW_DIVIDER_REG_EXP = /^(\| ?:?-*:? ?)+\|\s?$/;

const TABLE: ElementTransformer = {
  dependencies: [TableNode, TableRowNode, TableCellNode],
  export: (node: LexicalNode) => {
    if (!$isTableNode(node)) {
      return null;
    }

    const output: string[] = [];

    for (const row of node.getChildren()) {
      const rowOutput: string[] = [];
      if (!$isTableRowNode(row)) {
        continue;
      }

      let isHeaderRow = false;
      for (const cell of row.getChildren()) {
        // It's TableCellNode so it's just to make flow happy
        if ($isTableCellNode(cell)) {
          rowOutput.push($convertToMarkdownString(RTE_TRANSFORMERS, cell).replace(/\n/g, '\\n'));
          if (cell.__headerState === TableCellHeaderStates.ROW) {
            isHeaderRow = true;
          }
        }
      }

      output.push(`| ${rowOutput.join(' | ')} |`);
      if (isHeaderRow) {
        output.push(`| ${rowOutput.map(() => '---').join(' | ')} |`);
      }
    }

    return output.join('\n');
  },
  regExp: TABLE_ROW_REG_EXP,
  replace: (parentNode, _1, match) => {
    const matchText = match[0] ?? '';
    // Header row parsing and styling
    if (TABLE_ROW_DIVIDER_REG_EXP.test(matchText)) {
      // Check if the previous node is a table
      const table = parentNode.getPreviousSibling();
      if (!table || !$isTableNode(table)) {
        return;
      }

      // The previous node is a table, but we need to check if the last row exists and is a table row
      const rows = table.getChildren();
      const lastRow = rows[rows.length - 1];
      if (!lastRow || !$isTableRowNode(lastRow)) {
        return;
      }

      // Add header state to row cells if they are table cells
      convertToHeaderCells(lastRow.getChildren());

      // Remove line of text that matches the header regexp
      parentNode.remove();
      return;
    }

    // Table row parsing

    // First, get the last row as an array of TableCellNodes based on regexp or null if no match
    // We start at the last row of table cells
    const matchCells = mapToTableCells(matchText);
    if (matchCells == null) {
      return;
    }

    // Initialize the tracking variables for rows and last rows
    const rows = [matchCells];
    let sibling = parentNode.getPreviousSibling();
    let maxCells = matchCells.length;
    let isHeaderRow = false;

    // Loop until we finish the first row of lines that match the TABLE_ROW_REG_EXP
    while (sibling) {
      // Check if we run out of paragraph nodes to process into table cells
      if (!$isParagraphNode(sibling)) {
        break;
      }

      if (sibling.getChildrenSize() !== 1) {
        break;
      }

      const firstChild = sibling.getFirstChild();
      if (!$isTextNode(firstChild)) {
        break;
      }

      // At this point, we have a text node to process into table cells
      if (TABLE_ROW_DIVIDER_REG_EXP.test(firstChild.getTextContent())) {
        // This is a header row so the next row will be header cells
        isHeaderRow = true;
      } else {
        // Convert to table cells
        const cells = mapToTableCells(firstChild.getTextContent());

        if (cells == null) {
          break;
        }

        // Check if the previous row was a header row and convert this row to header cells if needed
        if (isHeaderRow) {
          convertToHeaderCells(cells);
          isHeaderRow = false;
        }

        maxCells = Math.max(maxCells, cells.length);
        rows.unshift(cells);
      }

      // Set it to the line above
      const previousSibling = sibling.getPreviousSibling();
      sibling.remove();
      sibling = previousSibling;
    }

    // Create the table and add the rows
    const table = $createTableNode();
    for (const cells of rows) {
      const tableRow = $createTableRowNode();
      table.append(tableRow);

      tableRow.append(...cells);
      const lenDiff = maxCells - cells.length;

      // Convert to header row if first cell is header node
      const isInHeaderRow = cells[0]?.__headerState === TableCellHeaderStates.ROW;
      for (let i = 0; i < lenDiff; i++) {
        const newCell = $createTableCell('');
        if (isInHeaderRow) {
          newCell.toggleHeaderStyle(TableCellHeaderStates.ROW);
        }
        tableRow.append(newCell);
      }
    }

    // Check if the previous node is a table and has the same number of columns
    const previousSibling = parentNode.getPreviousSibling();
    if ($isTableNode(previousSibling) && getTableColumnsSize(previousSibling) === maxCells) {
      // Append the new table to the previous table
      previousSibling.append(...table.getChildren());
      parentNode.remove();
      previousSibling.selectEnd();
    } else {
      // Replace the paragraph nodes with the new table
      parentNode.replace(table);
      table.selectEnd();
    }
  },
  type: 'element',
};

function getTableColumnsSize(table: TableNode) {
  const row = table.getFirstChild();
  return $isTableRowNode(row) ? row.getChildrenSize() : 0;
}

const $createTableCell = (textContent: string): TableCellNode => {
  textContent = textContent.replace(/\\r?\\n/g, '\n');
  const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);
  $convertFromMarkdownString(textContent, RTE_TRANSFORMERS, cell);
  return cell;
};

const mapToTableCells = (textContent: string): TableCellNode[] | null => {
  const match = textContent.match(TABLE_ROW_REG_EXP);
  if (!match?.[1]) {
    return null;
  }
  return match[1].split('|').map((text) => $createTableCell(text));
};

const convertToHeaderCells = (row: LexicalNode[]) => {
  row.forEach((cell) => {
    if (!$isTableCellNode(cell)) {
      return;
    }
    cell.toggleHeaderStyle(TableCellHeaderStates.ROW);
  });
};

export const RTE_TRANSFORMERS = [
  ...TRANSFORMERS,
  UNDERLINE_EXPORTER_AND_TRANSFORMER,
  UNDERLINE_IMPORTER,
  TABLE,
];

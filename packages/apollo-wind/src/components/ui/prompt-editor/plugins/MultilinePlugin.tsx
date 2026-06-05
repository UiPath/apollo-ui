import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isLineBreakNode,
  $isParagraphNode,
  COMMAND_PRIORITY_NORMAL,
  KEY_ENTER_COMMAND,
  type LexicalNode,
  type ParagraphNode,
  TextNode,
} from 'lexical';

const collapseParagraphs = () => {
  const root = $getRoot();
  const paragraphs = root.getChildren().filter($isParagraphNode) as ParagraphNode[];
  if (paragraphs.length <= 1) return;
  const allNodes: LexicalNode[] = [];

  for (const [i, paragraph] of paragraphs.entries()) {
    const children = paragraph.getChildren();
    if (i > 0 && children.length > 0) {
      allNodes.push($createTextNode(' '));
    }
    for (const child of children) {
      allNodes.push(child);
    }
  }

  const newParagraph = $createParagraphNode();
  for (const node of allNodes) {
    newParagraph.append(node);
  }

  root.clear();
  root.append(newParagraph);
};

const stripNewlinesFromText = (text: string): string => text.replace(/\n+/g, ' ');

export const MultilinePlugin = ({ multiline }: { multiline: boolean }) => {
  const [editor] = useLexicalComposerContext();
  const prevMultilineRef = useRef<boolean | null>(null);

  useEffect(() => {
    const wasMultiline = prevMultilineRef.current;
    prevMultilineRef.current = multiline;

    const isInitialMount = wasMultiline === null;
    const switchedToSingleLine = wasMultiline === true && !multiline;

    if (!multiline && (isInitialMount || switchedToSingleLine)) {
      const timeoutId = setTimeout(() => {
        editor.update(() => {
          collapseParagraphs();
          const root = $getRoot();
          const paragraphs = root.getChildren().filter($isParagraphNode) as ParagraphNode[];
          for (const paragraph of paragraphs) {
            const children = paragraph.getChildren();
            for (const child of children) {
              if ($isLineBreakNode(child)) {
                const prev = child.getPreviousSibling();
                const next = child.getNextSibling();
                if (prev && next) {
                  child.replace($createTextNode(' '));
                } else {
                  child.remove();
                }
              } else if (child instanceof TextNode) {
                const text = child.getTextContent();
                if (text.includes('\n')) {
                  const newText = stripNewlinesFromText(text);
                  if (newText.trim() === '') {
                    child.remove();
                  } else {
                    child.setTextContent(newText);
                  }
                }
              }
            }
          }
        });
      }, 0);
      // Clear the pending timeout if the plugin unmounts or `multiline` flips before it fires,
      // so we never call editor.update() after teardown.
      return () => clearTimeout(timeoutId);
    }
  }, [editor, multiline]);

  useEffect(() => {
    if (multiline) return;

    return mergeRegister(
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          event?.preventDefault();
          return true;
        },
        COMMAND_PRIORITY_NORMAL
      ),
      editor.registerNodeTransform(TextNode, (node) => {
        const text = node.getTextContent();
        if (text.includes('\n')) node.setTextContent(stripNewlinesFromText(text));
      })
    );
  }, [editor, multiline]);

  return null;
};

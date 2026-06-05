import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isHeadingNode } from '@lexical/rich-text';
import { $isAtNodeEnd } from '@lexical/selection';
import { $getNearestNodeOfType, mergeRegister } from '@lexical/utils';
import { msg } from '@lingui/core/macro';
import {
  Code,
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  FormatStrikethrough,
  FormatUnderlined,
  Link,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  type RangeSelection,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useSafeLingui } from '../../../../i18n/useSafeLingui';

const LowPriority = 1;

function Divider() {
  return <div className="divider" />;
}

function getSelectedNode(selection: RangeSelection) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  }
  return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
}

export default function ToolbarPlugin({ disabled = false }: { disabled?: boolean }) {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  const { _ } = useSafeLingui();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');
  const [isLink, setIsLink] = useState(false);
  const [isCode, setIsCode] = useState(false);

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);
      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const type = parentList ? parentList.getTag() : element.getTag();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element) ? element.getTag() : element.getType();
          setBlockType(type);
        }
      }

      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));

      // Update links
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateToolbar();
          return false;
        },
        LowPriority
      )
    );
  }, [editor, $updateToolbar]);

  return (
    <div
      className={`toolbar${disabled ? ' disabled' : ''}`}
      ref={toolbarRef}
      role="toolbar"
      aria-orientation="horizontal"
      aria-disabled={disabled}
    >
      <Tooltip title={_(msg({ id: 'rich-text-editor.bold', message: 'Bold' }))}>
        <button
          type="button"
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
          }}
          disabled={disabled}
          className={'toolbar-item spaced ' + (isBold ? 'active' : '')}
          aria-pressed={isBold}
          aria-label={_(msg({ id: 'rich-text-editor.format-bold', message: 'Format bold' }))}
        >
          <FormatBold sx={{ fontSize: '24px' }} />
        </button>
      </Tooltip>
      <Tooltip title={_(msg({ id: 'rich-text-editor.italic', message: 'Italic' }))}>
        <button
          type="button"
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
          }}
          className={'toolbar-item spaced ' + (isItalic ? 'active' : '')}
          aria-pressed={isItalic}
          disabled={disabled}
          aria-label={_(msg({ id: 'rich-text-editor.format-italic', message: 'Format italic' }))}
        >
          <FormatItalic sx={{ fontSize: '24px' }} />
        </button>
      </Tooltip>
      <Tooltip title={_(msg({ id: 'rich-text-editor.underline', message: 'Underline' }))}>
        <button
          type="button"
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
          }}
          className={'toolbar-item spaced ' + (isUnderline ? 'active' : '')}
          aria-pressed={isUnderline}
          disabled={disabled}
          aria-label={_(
            msg({ id: 'rich-text-editor.format-underline', message: 'Format underline' })
          )}
        >
          <FormatUnderlined sx={{ fontSize: '24px' }} />
        </button>
      </Tooltip>
      <Tooltip title={_(msg({ id: 'rich-text-editor.strikethrough', message: 'Strikethrough' }))}>
        <button
          type="button"
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
          }}
          className={'toolbar-item spaced ' + (isStrikethrough ? 'active' : '')}
          aria-pressed={isStrikethrough}
          disabled={disabled}
          aria-label={_(
            msg({ id: 'rich-text-editor.format-strikethrough', message: 'Format strikethrough' })
          )}
        >
          <FormatStrikethrough sx={{ fontSize: '24px' }} />
        </button>
      </Tooltip>
      <Divider />
      <Tooltip title={_(msg({ id: 'rich-text-editor.unordered-list', message: 'Unordered list' }))}>
        <button
          type="button"
          onClick={() => {
            if (blockType !== 'ul') {
              editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
            } else {
              editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
            }
          }}
          className={'toolbar-item spaced ' + (blockType === 'ul' ? 'active' : '')}
          disabled={disabled}
          aria-pressed={blockType === 'ul'}
          aria-label={_(
            msg({ id: 'rich-text-editor.format-unordered-list', message: 'Format unordered list' })
          )}
        >
          <FormatListBulleted sx={{ fontSize: '24px' }} />
        </button>
      </Tooltip>
      <Tooltip title={_(msg({ id: 'rich-text-editor.ordered-list', message: 'Ordered list' }))}>
        <button
          type="button"
          onClick={() => {
            if (blockType !== 'ol') {
              editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
            } else {
              editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
            }
          }}
          className={'toolbar-item spaced ' + (blockType === 'ol' ? 'active' : '')}
          disabled={disabled}
          aria-pressed={blockType === 'ol'}
          aria-label={_(
            msg({ id: 'rich-text-editor.format-ordered-list', message: 'Format ordered list' })
          )}
        >
          <FormatListNumbered sx={{ fontSize: '24px' }} />
        </button>
      </Tooltip>
      <Divider />
      <Tooltip title={_(msg({ id: 'rich-text-editor.link', message: 'Link' }))}>
        <button
          type="button"
          onClick={() => {
            if (!isLink) {
              // TODO: revisit in the future to add a popup for editing links.
              // Currently, couldn't get it working
              editor.update(() => {
                const selection = $getSelection();
                if (selection) {
                  selection.insertText(`[${selection.getTextContent() ?? 'text'}](link)`);
                }
              });
            } else {
              editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
            }
          }}
          className={'toolbar-item spaced ' + (isLink ? 'active' : '')}
          disabled={disabled}
          aria-pressed={isLink}
          aria-label={_(msg({ id: 'rich-text-editor.insert-link', message: 'Insert link' }))}
        >
          <Link sx={{ fontSize: '24px' }} />
        </button>
      </Tooltip>
      <Tooltip title={_(msg({ id: 'rich-text-editor.code', message: 'Code' }))}>
        <button
          type="button"
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
          }}
          className={'toolbar-item spaced ' + (isCode ? 'active' : '')}
          aria-pressed={isCode}
          disabled={disabled}
          aria-label={_(msg({ id: 'rich-text-editor.format-code', message: 'Format code' }))}
        >
          <Code sx={{ fontSize: '24px' }} />
        </button>
      </Tooltip>
    </div>
  );
}

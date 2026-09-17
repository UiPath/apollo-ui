import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { LexicalEditor } from 'lexical';
import { useEffect, useRef } from 'react';

export const EditorRefPlugin = ({ onRef }: { onRef: (editor: LexicalEditor) => void }) => {
  const [editor] = useLexicalComposerContext();
  const onRefRef = useRef(onRef);

  useEffect(() => {
    onRefRef.current = onRef;
  });

  useEffect(() => {
    onRefRef.current(editor);
  }, [editor]);

  return null;
};

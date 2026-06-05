export type RichTextEditorInputFormat = 'markdown' | 'html';

export interface ApRichTextEditorProps {
  /** Label rendered above the editor */
  label?: string;
  /** Fired whenever the markdown representation of the content changes */
  onMarkdownChange?: (markdownContent: string) => void;
  /** Fired whenever the HTML representation of the content changes */
  onHtmlChange?: (htmlContent: string) => void;
  /** Marks the field as required (adds an asterisk to the label) */
  required?: boolean;
  /** Initial content of the editor, interpreted according to `inputFormat` */
  initialContent?: string;
  /** Placeholder shown when the editor is empty */
  placeholder?: string;
  /** Disables editing */
  disabled?: boolean;
  /** Helper text rendered below the editor */
  helperText?: string;
  /** Puts the editor in an error state */
  error?: boolean;
  /** Error message rendered below the editor (takes precedence over helperText) */
  errorMessage?: string;
  /** Shows a loading spinner instead of the editable area */
  loading?: boolean;
  /** Max height of the editor container (any CSS length) */
  maxHeight?: string;
  /** Format used to parse `initialContent` and to seed the editor (default: markdown) */
  inputFormat?: RichTextEditorInputFormat;
  /** Data test id applied to the editable area */
  dataTestid?: string;
}

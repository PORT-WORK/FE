export type EditorBlockType =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'p'
  | 'code'
  | 'quote'
  | 'bullet'
  | 'numbered'
  | 'todo'
  | 'toggle'
  | 'divider'
  | 'callout'
  | 'image'
  | 'table'
  | 'database'
  | 'embed'
  | 'bookmark'
  | 'file'
  | 'equation';

export interface EditorDbItem {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
}

export interface EditorBlockModel {
  id: string;
  type: EditorBlockType;
  content: string;
  checked?: boolean;
  dbItems?: EditorDbItem[];
}

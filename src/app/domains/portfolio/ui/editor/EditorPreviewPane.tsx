import type { EditorBlockModel, EditorDbItem } from './types';
import EditorBlock from './EditorBlock';

export default function EditorPreviewPane({
  title,
  catEmoji,
  catName,
  blocks,
  onDBUpdate,
}: {
  title: string;
  catEmoji: string;
  catName: string;
  blocks: EditorBlockModel[];
  onDBUpdate?: (id: string, items: EditorDbItem[]) => void;
}) {
  return (
    <div className="max-w-3xl mx-auto px-12 py-12 pb-32">
      <div className="flex items-center gap-2 mb-4 text-sm text-zinc-600">
        <span>{catEmoji}</span>
        <span>{catName}</span>
      </div>
      <h1 className="text-5xl font-black text-white mb-8" style={{ lineHeight: '1.15' }}>
        {title || '?쒕ぉ ?놁쓬'}
      </h1>
      <div className="space-y-1.5">
        {blocks.map(block => (
          <EditorBlock key={block.id} block={block} readOnly onDBUpdate={onDBUpdate} />
        ))}
      </div>
    </div>
  );
}


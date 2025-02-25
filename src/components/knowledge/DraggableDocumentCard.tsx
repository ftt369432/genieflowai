import { useDrag } from 'react-dnd';
import { DocumentCard } from './DocumentCard';
import type { AIDocument } from '../../types/ai';
import { useSelection } from './SelectionContext';

interface DraggableDocumentCardProps {
  document: AIDocument;
}

export function DraggableDocumentCard({ document }: DraggableDocumentCardProps) {
  const { isSelected, toggleSelection } = useSelection();
  const selected = isSelected(document.id);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'DOCUMENT',
    item: { id: document.id, type: 'DOCUMENT', selected },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={`cursor-move ${selected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={(e) => {
        toggleSelection(document.id, e.ctrlKey || e.metaKey);
        e.stopPropagation();
      }}
    >
      <DocumentCard document={document} />
    </div>
  );
} 
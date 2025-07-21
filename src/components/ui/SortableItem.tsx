// src/components/SortableItem.tsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface Props {
    id: number;
    text: string;
}

export function SortableItem({ id, text }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({id: id});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none',
  };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center p-4 bg-white border rounded-lg shadow-sm">
        <GripVertical className="h-5 w-5 text-muted-foreground mr-3 cursor-grab" />
        <span className="text-base text-gray-800">{text}</span>
    </div>
  );
}
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ArrowRightLeft, Loader2 } from "lucide-react";
import { Item } from "../types";

interface SortableItemRowProps {
  item: Item;
  idPrefix: string;
  onAction: (id: number) => void | Promise<void>;
  actionLoadingId: number | null;
  key?: React.Key;
}

export function SortableItemRow({
  item,
  idPrefix,
  onAction,
  actionLoadingId,
}: SortableItemRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    boxShadow: isDragging ? "0 8px 16px -2px rgba(0,0,0,0.1)" : "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={`${idPrefix}-sortable-row-${item.id}`}
      className={`flex items-center justify-between p-3.5 transition bg-white border rounded-lg ${
        isDragging 
          ? "border-slate-300 scale-[1.02] bg-slate-50/80 shadow-md" 
          : "border-transparent hover:bg-slate-50/80"
      }`}
    >
      <div className="flex items-center gap-2.5">
        {/* Isolated Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-slate-100 rounded cursor-grab active:cursor-grabbing text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300"
          title="Drag handle to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <span className="text-xs font-semibold text-slate-300">#</span>
        <span className="text-sm font-mono font-medium text-slate-800">
          {item.id.toLocaleString()}
        </span>
      </div>

      <button
        id={`${idPrefix}-item-action-${item.id}`}
        onClick={() => onAction(item.id)}
        disabled={actionLoadingId === item.id}
        className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition bg-red-50 hover:bg-red-500 hover:text-white text-red-600 disabled:opacity-50"
      >
        {actionLoadingId === item.id ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <ArrowRightLeft className="w-3 h-3" />
        )}
        Unselect
      </button>
    </div>
  );
}

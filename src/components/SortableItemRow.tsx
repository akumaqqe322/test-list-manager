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
  isPending?: boolean;
  key?: React.Key;
}

export function SortableItemRow({
  item,
  idPrefix,
  onAction,
  actionLoadingId,
  isPending,
}: SortableItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : isPending ? 0.5 : 1,
    boxShadow: isDragging
      ? "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
      : "none",
    zIndex: isDragging ? 50 : undefined,
    position: "relative" as const,
  };

  const isLoading = actionLoadingId === item.id || isPending;

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={`${idPrefix}-sortable-row-${item.id}`}
      data-testid={`selected-row-${item.id}`}
      className={`flex items-center justify-between p-3.5 transition bg-white border rounded-lg ${
        isDragging
          ? "border-slate-300 scale-[1.02] bg-slate-50/80 shadow-md"
          : "border-transparent hover:bg-slate-50/80"
      }`}
    >
      <div className="flex items-center gap-2.5">
        {/* Isolated Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          type="button"
          aria-label={`Drag item ${item.id}`}
          data-testid={`drag-handle-${item.id}`}
          className="p-1.5 px-2.5 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 rounded cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 flex items-center gap-1.5 transition-all"
          title="Drag handle to reorder"
        >
          <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-[10px] text-slate-500 font-medium select-none pointer-events-none hidden sm:inline">
            Drag to reorder
          </span>
        </button>
        <span className="text-xs font-semibold text-slate-300">#</span>
        <span className="text-sm font-mono font-medium text-slate-800">
          {item.id.toLocaleString()}
        </span>
      </div>

      <button
        id={`${idPrefix}-item-action-${item.id}`}
        data-testid={`unselect-button-${item.id}`}
        onClick={() => onAction(item.id)}
        disabled={isLoading}
        className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition bg-red-50 hover:bg-red-500 hover:text-white text-red-600 disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <ArrowRightLeft className="w-3 h-3" />
        )}
        {isPending ? "Pending..." : "Unselect"}
      </button>
    </div>
  );
}

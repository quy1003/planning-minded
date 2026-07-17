"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import type { DaySlot } from "@tripmind/shared";
import type { ItineraryItem } from "../types";

type Props = {
  dayNumber: number;
  slot: DaySlot;
  items: ItineraryItem[];
  disabled?: boolean;
  onReorder: (nextGroup: ItineraryItem[]) => void;
  onEdit: (item: ItineraryItem) => void;
  onDelete: (item: ItineraryItem) => void;
};

export function SortableSlotList({
  dayNumber,
  slot,
  items,
  disabled,
  onReorder,
  onEdit,
  onDelete,
}: Props) {
  const t = useTranslations("Itinerary");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const moved = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
      ...item,
      dayNumber,
      slot,
      visitOrder: index + 1,
    }));
    onReorder(moved);
  }

  if (items.length === 0) {
    return (
      <p className="px-3 py-2 text-xs text-zinc-500">{t("emptySlot")}</p>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul className="divide-y divide-zinc-100">
          {items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              disabled={disabled}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({
  item,
  disabled,
  onEdit,
  onDelete,
}: {
  item: ItineraryItem;
  disabled?: boolean;
  onEdit: (item: ItineraryItem) => void;
  onDelete: (item: ItineraryItem) => void;
}) {
  const t = useTranslations("Itinerary");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 bg-white px-3 py-2 ${isDragging ? "z-10 opacity-80 shadow" : ""}`}
    >
      <button
        type="button"
        className="mt-0.5 cursor-grab touch-none rounded px-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 active:cursor-grabbing disabled:cursor-not-allowed"
        aria-label={t("dragHandle")}
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onEdit(item)}>
        <p className="truncate text-sm font-medium text-zinc-900">
          {item.visitOrder}. {item.title}
        </p>
        <p className="truncate text-xs text-zinc-500">
          {item.place?.name ?? item.placeId}
          {item.startTime ? ` · ${item.startTime.slice(0, 5)}` : ""}
        </p>
      </button>
      <button
        type="button"
        className="shrink-0 text-xs text-red-700 hover:underline"
        onClick={() => onDelete(item)}
      >
        {t("delete")}
      </button>
    </li>
  );
}

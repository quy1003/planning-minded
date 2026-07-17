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
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { DaySlot } from "@tripmind/shared";
import { ButtonPending } from "@/components/ui/button-pending";
import type { ItineraryItem } from "../types";

/** Thời gian trượt khi bấm ↑↓ — đủ chậm để user thấy rõ. */
const FLIP_MS = 450;

type Props = {
  dayNumber: number;
  slot: DaySlot;
  items: ItineraryItem[];
  disabled?: boolean;
  deletingId?: string;
  onReorder: (nextGroup: ItineraryItem[]) => void;
  onEdit: (item: ItineraryItem) => void;
  onDelete: (item: ItineraryItem) => void;
};

export function SortableSlotList({
  dayNumber,
  slot,
  items,
  disabled,
  deletingId,
  onReorder,
  onEdit,
  onDelete,
}: Props) {
  const t = useTranslations("Itinerary");
  const listRef = useRef<HTMLUListElement>(null);
  const pendingFlipRef = useRef<Map<string, DOMRect> | null>(null);
  const animatingRef = useRef(false);
  const [ordered, setOrdered] = useState(items);
  const [isFlipping, setIsFlipping] = useState(false);

  const orderKey = items.map((item) => item.id).join(",");

  // Đồng bộ từ server khi không đang animate (tránh nhảy giữa chừng).
  useEffect(() => {
    if (animatingRef.current) return;
    setOrdered(items);
  }, [orderKey, items]);

  useLayoutEffect(() => {
    const prev = pendingFlipRef.current;
    if (!prev) return;
    pendingFlipRef.current = null;
    playFlip(listRef.current, prev, FLIP_MS);
    const timer = window.setTimeout(() => {
      animatingRef.current = false;
      setIsFlipping(false);
    }, FLIP_MS + 40);
    return () => window.clearTimeout(timer);
  }, [ordered]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function withVisitOrder(next: ItineraryItem[]) {
    return next.map((item, index) => ({
      ...item,
      dayNumber,
      slot,
      visitOrder: index + 1,
    }));
  }

  function applyOrder(next: ItineraryItem[]) {
    onReorder(withVisitOrder(next));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ordered.findIndex((item) => item.id === active.id);
    const newIndex = ordered.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(ordered, oldIndex, newIndex);
    setOrdered(withVisitOrder(next));
    applyOrder(next);
  }

  function moveItem(itemId: string, direction: -1 | 1) {
    if (disabled || animatingRef.current || isFlipping) return;

    const index = ordered.findIndex((item) => item.id === itemId);
    if (index < 0) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= ordered.length) return;

    // FLIP: đo vị trí trước khi đổi DOM order.
    pendingFlipRef.current = captureRects(listRef.current);
    animatingRef.current = true;
    setIsFlipping(true);

    const next = withVisitOrder(arrayMove(ordered, index, nextIndex));
    setOrdered(next);
    applyOrder(next);
  }

  if (ordered.length === 0) {
    return <p className="py-2 text-xs text-muted">{t("emptySlot")}</p>;
  }

  const actionsLocked = Boolean(disabled) || isFlipping;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ordered.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul ref={listRef} className="space-y-3">
          {ordered.map((item, index) => (
            <SortableItem
              key={item.id}
              item={item}
              disabled={actionsLocked}
              isDeleting={deletingId === item.id}
              canMoveUp={index > 0}
              canMoveDown={index < ordered.length - 1}
              onMoveUp={() => moveItem(item.id, -1)}
              onMoveDown={() => moveItem(item.id, 1)}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function captureRects(list: HTMLUListElement | null): Map<string, DOMRect> {
  const map = new Map<string, DOMRect>();
  if (!list) return map;
  list.querySelectorAll<HTMLElement>("[data-flip-id]").forEach((el) => {
    const id = el.dataset.flipId;
    if (id) map.set(id, el.getBoundingClientRect());
  });
  return map;
}

/** Invert + Play: item giữ chỗ cũ rồi trượt tới vị trí mới. */
function playFlip(
  list: HTMLUListElement | null,
  prev: Map<string, DOMRect>,
  durationMs: number,
) {
  if (!list) return;
  list.querySelectorAll<HTMLElement>("[data-flip-id]").forEach((el) => {
    const id = el.dataset.flipId;
    if (!id) return;
    const first = prev.get(id);
    if (!first) return;
    const last = el.getBoundingClientRect();
    const dy = first.top - last.top;
    if (Math.abs(dy) < 1) return;

    el.style.transition = "none";
    el.style.transform = `translateY(${dy}px)`;
    void el.offsetHeight; // force reflow trước khi bật transition
    el.style.transition = `transform ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    el.style.transform = "translateY(0)";

    const cleanup = (event: TransitionEvent) => {
      if (event.propertyName !== "transform") return;
      el.style.transition = "";
      el.style.transform = "";
      el.removeEventListener("transitionend", cleanup);
    };
    el.addEventListener("transitionend", cleanup);
  });
}

function SortableItem({
  item,
  disabled,
  isDeleting,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: {
  item: ItineraryItem;
  disabled?: boolean;
  isDeleting?: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: (item: ItineraryItem) => void;
  onDelete: (item: ItineraryItem) => void;
}) {
  const t = useTranslations("Itinerary");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  });

  // Outer: dnd-kit. Inner [data-flip-id]: FLIP khi bấm mũi tên (không đụng transform DnD).
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const placeName = item.place?.name ?? item.placeId;
  const cost =
    item.estCost && item.estCost !== "0" ? item.estCost : t("itemEmpty");
  const duration =
    item.durationMin != null
      ? t("itemDurationValue", { minutes: item.durationMin })
      : t("itemEmpty");

  const iconBtn =
    "inline-flex size-8 items-center justify-center rounded-lg transition disabled:opacity-40";

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`relative list-none ${isDragging ? "z-10" : ""}`}
    >
      <div
        data-flip-id={item.id}
        className={`rounded-xl border border-border bg-card p-3 shadow-sm will-change-transform ${
          isDragging ? "opacity-90 shadow-md ring-2 ring-accent/40" : ""
        } ${isDeleting ? "opacity-50" : ""}`}
      >
        <div className="flex items-start gap-2">
          <button
            type="button"
            className="mt-1 cursor-grab touch-none rounded px-1 text-muted hover:bg-accent-soft hover:text-foreground active:cursor-grabbing disabled:cursor-not-allowed"
            aria-label={t("dragHandle")}
            disabled={disabled}
            {...attributes}
            {...listeners}
          >
            ⋮⋮
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-semibold tracking-wide text-accent uppercase">
                {t(`slots.${item.slot}`)}
              </span>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  disabled={disabled || !canMoveUp}
                  aria-label={t("moveUp")}
                  className={`${iconBtn} text-muted hover:bg-accent-soft hover:text-foreground`}
                  onClick={onMoveUp}
                >
                  <ChevronUpIcon />
                </button>
                <button
                  type="button"
                  disabled={disabled || !canMoveDown}
                  aria-label={t("moveDown")}
                  className={`${iconBtn} text-muted hover:bg-accent-soft hover:text-foreground`}
                  onClick={onMoveDown}
                >
                  <ChevronDownIcon />
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={t("edit")}
                  className={`${iconBtn} text-muted hover:bg-accent-soft hover:text-accent`}
                  onClick={() => onEdit(item)}
                >
                  <PencilIcon />
                </button>
                <button
                  type="button"
                  disabled={disabled || isDeleting}
                  aria-busy={isDeleting}
                  aria-label={t("delete")}
                  className={`${iconBtn} text-danger hover:bg-danger-soft`}
                  onClick={() => onDelete(item)}
                >
                  <ButtonPending pending={Boolean(isDeleting)}>
                    <TrashIcon />
                  </ButtonPending>
                </button>
              </div>
            </div>
            <dl className="mt-2 space-y-1 text-sm">
              <MetaRow label={t("itemLabelTitle")} value={item.title} emphasize />
              <MetaRow label={t("itemLabelCost")} value={cost} />
              <MetaRow label={t("itemLabelDuration")} value={duration} />
              <MetaRow label={t("itemLabelPlace")} value={placeName} />
              <MetaRow
                label={t("fields.startTime")}
                value={item.startTime ? item.startTime.slice(0, 5) : t("itemEmpty")}
              />
              <MetaRow
                label={t("fields.endTime")}
                value={item.endTime ? item.endTime.slice(0, 5) : t("itemEmpty")}
              />
              <MetaRow
                label={t("fields.description")}
                value={item.description?.trim() ? item.description : t("itemEmpty")}
              />
            </dl>
          </div>
        </div>
      </div>
    </li>
  );
}

function MetaRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
      <dt className="shrink-0 text-muted">{label}:</dt>
      <dd className={emphasize ? "font-semibold text-foreground" : "text-foreground"}>{value}</dd>
    </div>
  );
}

function ChevronUpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 14l6-6 6 6" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 10l6 6 6-6" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 7h16M9 7V5h6v2M8 7l1 12h6l1-12" />
    </svg>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateItineraryItemInput,
  ReorderItineraryInput,
  UpdateItineraryItemInput,
} from "@tripmind/shared";
import { queryKeys } from "@/lib/query-keys";
import * as itineraryApi from "./api";
import type { ItineraryItem } from "./types";

export function useItinerary(tripId: string) {
  return useQuery({
    queryKey: queryKeys.itinerary(tripId),
    queryFn: () => itineraryApi.listItinerary(tripId),
    enabled: Boolean(tripId),
  });
}

function invalidateItinerary(queryClient: ReturnType<typeof useQueryClient>, tripId: string) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.itinerary(tripId) });
}

export function useCreateItineraryItem(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateItineraryItemInput) => itineraryApi.createItineraryItem(tripId, body),
    onSuccess: () => invalidateItinerary(queryClient, tripId),
  });
}

export function useUpdateItineraryItem(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, body }: { itemId: string; body: UpdateItineraryItemInput }) =>
      itineraryApi.updateItineraryItem(tripId, itemId, body),
    onSuccess: () => invalidateItinerary(queryClient, tripId),
  });
}

export function useDeleteItineraryItem(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => itineraryApi.deleteItineraryItem(tripId, itemId),
    onSuccess: () => invalidateItinerary(queryClient, tripId),
  });
}

export function useReorderItinerary(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ReorderItineraryInput) => itineraryApi.reorderItinerary(tripId, body),
    onMutate: async (body) => {
      const key = queryKeys.itinerary(tripId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ItineraryItem[]>(key);

      // Optimistic: cập nhật cache ngay — UI đã FLIP, không cần spinner header.
      if (previous) {
        const patch = new Map(body.map((row) => [row.itemId, row]));
        const slotRank: Record<string, number> = {
          MORNING: 0,
          AFTERNOON: 1,
          EVENING: 2,
        };
        const next = previous
          .map((item) => {
            const row = patch.get(item.id);
            if (!row) return item;
            return {
              ...item,
              dayNumber: row.dayNumber,
              slot: row.slot,
              visitOrder: row.visitOrder,
            };
          })
          .sort(
            (a, b) =>
              a.dayNumber - b.dayNumber ||
              (slotRank[a.slot] ?? 0) - (slotRank[b.slot] ?? 0) ||
              a.visitOrder - b.visitOrder,
          );
        queryClient.setQueryData(key, next);
      }

      return { previous };
    },
    onError: (_err, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.itinerary(tripId), context.previous);
      }
    },
    onSuccess: (items) => {
      queryClient.setQueryData(queryKeys.itinerary(tripId), items);
    },
  });
}

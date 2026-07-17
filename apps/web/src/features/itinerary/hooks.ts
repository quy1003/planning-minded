"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateItineraryItemInput,
  ReorderItineraryInput,
  UpdateItineraryItemInput,
} from "@tripmind/shared";
import { queryKeys } from "@/lib/query-keys";
import * as itineraryApi from "./api";

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
    onSuccess: (items) => {
      queryClient.setQueryData(queryKeys.itinerary(tripId), items);
    },
  });
}

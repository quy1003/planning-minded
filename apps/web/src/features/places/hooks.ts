"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreatePlaceInput, UpdatePlaceInput } from "@tripmind/shared";
import { queryKeys } from "@/lib/query-keys";
import * as placesApi from "./api";

export function usePlaces(tripId: string) {
  return useQuery({
    queryKey: queryKeys.places(tripId),
    queryFn: () => placesApi.listPlaces(tripId),
    enabled: Boolean(tripId),
  });
}

function invalidatePlaces(queryClient: ReturnType<typeof useQueryClient>, tripId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.places(tripId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.trip(tripId) }),
  ]);
}

export function useCreatePlace(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePlaceInput) => placesApi.createPlace(tripId, body),
    onSuccess: () => invalidatePlaces(queryClient, tripId),
  });
}

export function useUpdatePlace(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ placeId, body }: { placeId: string; body: UpdatePlaceInput }) =>
      placesApi.updatePlace(tripId, placeId, body),
    onSuccess: () => invalidatePlaces(queryClient, tripId),
  });
}

export function useDeletePlace(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (placeId: string) => placesApi.deletePlace(tripId, placeId),
    onSuccess: () => invalidatePlaces(queryClient, tripId),
  });
}

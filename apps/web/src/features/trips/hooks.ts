"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateTripInput, UpdateTripInput } from "@tripmind/shared";
import { useRouter } from "@/i18n/navigation";
import { queryKeys } from "@/lib/query-keys";
import * as tripsApi from "./api";

export function useTrips() {
  return useQuery({
    queryKey: queryKeys.trips,
    queryFn: () => tripsApi.listTrips(),
  });
}

export function useTrip(tripId: string) {
  return useQuery({
    queryKey: queryKeys.trip(tripId),
    queryFn: () => tripsApi.getTrip(tripId),
    enabled: Boolean(tripId),
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (body: CreateTripInput) => tripsApi.createTrip(body),
    onSuccess: async (trip) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.trips });
      router.replace(`/trips/${trip.id}`);
      router.refresh();
    },
  });
}

export function useUpdateTrip(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateTripInput) => tripsApi.updateTrip(tripId, body),
    onSuccess: async (trip) => {
      queryClient.setQueryData(queryKeys.trip(tripId), trip);
      await queryClient.invalidateQueries({ queryKey: queryKeys.trips });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (tripId: string) => tripsApi.deleteTrip(tripId),
    onSuccess: async (_void, tripId) => {
      queryClient.removeQueries({ queryKey: queryKeys.trip(tripId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.trips });
      router.replace("/trips");
      router.refresh();
    },
  });
}

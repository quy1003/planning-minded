"use client";

import { useCreateTrip } from "../hooks";
import { toCreateTripInput } from "../trip-form-schema";
import { TripForm } from "./trip-form";

export function CreateTripForm() {
  const create = useCreateTrip();

  return (
    <TripForm
      mode="create"
      isPending={create.isPending}
      error={create.error}
      onSubmit={(values) => create.mutate(toCreateTripInput(values))}
    />
  );
}

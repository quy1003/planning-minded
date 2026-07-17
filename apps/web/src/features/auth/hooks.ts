"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { LoginInput, RegisterInput } from "@tripmind/shared";
import { ApiError } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import * as authApi from "./api";

/** null = chưa login (401); undefined đang load. */
export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      try {
        return await authApi.getMe();
      } catch (error: unknown) {
        if (error instanceof ApiError && error.status === 401) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (body: LoginInput) => authApi.login(body),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.me, user);
      router.replace("/trips");
      router.refresh();
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (body: RegisterInput) => authApi.register(body),
    onSuccess: async (_user, variables) => {
      // Register chưa tạo session — login ngay để có cookie.
      const user = await authApi.login({
        email: variables.email,
        password: variables.password,
      });
      queryClient.setQueryData(queryKeys.me, user);
      router.replace("/trips");
      router.refresh();
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: async () => {
      queryClient.setQueryData(queryKeys.me, null);
      await queryClient.invalidateQueries();
      router.replace("/login");
      router.refresh();
    },
  });
}

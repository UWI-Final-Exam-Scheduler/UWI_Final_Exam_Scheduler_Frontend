"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchUserPreferences,
  putUserPreferences,
  UserPreferences,
} from "../lib/preferencesFetch";

const USER_PREFERENCES_QUERY_KEY = ["user-preferences"];

export function useUserPreferences() {
  return useQuery({
    queryKey: USER_PREFERENCES_QUERY_KEY,
    queryFn: fetchUserPreferences,
  });
}

export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();

  // optimistically update the user preferences in the cache after a successful mutation
  return useMutation({
    mutationFn: (data: Partial<UserPreferences>) => putUserPreferences(data),
    onSuccess: (updatedPreferences) => {
      queryClient.setQueryData(USER_PREFERENCES_QUERY_KEY, updatedPreferences);
    },
  });
}

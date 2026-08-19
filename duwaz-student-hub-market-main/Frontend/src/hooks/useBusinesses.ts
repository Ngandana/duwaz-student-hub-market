import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessesApi } from '@/services/api';
import type { Business } from '@/types';
import { useAuth } from '@/context/AuthContext';

export function useBusinesses() {
  return useQuery({
    queryKey: ['businesses'],
    queryFn: businessesApi.getAll,
  });
}

export function useBusiness(id: number) {
  return useQuery({
    queryKey: ['businesses', id],
    queryFn: () => businessesApi.getById(id),
    enabled: !!id,
  });
}

export function useMyShop() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['businesses', 'my-shop'],
    queryFn: async () => {
      try {
        return await businessesApi.getMyShop();
      } catch {
        return null; // 404 means no shop — return null instead of throwing
      }
    },
    enabled: isAuthenticated,
    staleTime: 0,           // always re-fetch when invalidated
    retry: false,
  });
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Business> }) =>
      businessesApi.update(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['businesses', 'my-shop'] });
      queryClient.invalidateQueries({ queryKey: ['businesses', updated.id] });
    },
  });
}

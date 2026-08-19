import { useMutation, useQueryClient } from '@tanstack/react-query';
import { businessesApi } from '@/services/api';
import type { Business } from '@/types';

export function useCreateBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Business, 'id'>) => businessesApi.create(data),
    onSuccess: () => {
      // Invalidate both the businesses list AND the my-shop cache
      // so the Navbar immediately switches "Create Shop" → "My Shop"
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['businesses', 'my-shop'] });
    },
  });
}

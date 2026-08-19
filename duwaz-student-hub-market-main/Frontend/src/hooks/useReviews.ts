import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '@/services/api';
import type { Review } from '@/types';

export function useProductReviews(productId: number) {
  return useQuery({
    queryKey: ['reviews', 'product', productId],
    queryFn: () => reviewsApi.getByProduct(productId),
    enabled: !!productId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Review, 'id'>) => reviewsApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'product', variables.productId] });
    },
  });
}

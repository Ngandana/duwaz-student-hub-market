import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsApi } from '@/services/api';
import type { Student } from '@/types';

export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: studentsApi.getAll,
  });
}

export function useStudent(id: number) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: () => studentsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Student, 'id'>) => studentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Student) => studentsApi.update(data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['students', updated.id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

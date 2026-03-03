import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateSaleInput } from '@/lib/validations/sale'
import type { SaleQueryInput } from '@/lib/validations/sale'
import {
  getSales,
  getSaleById,
  createSale as createSaleApi,
  cancelSale as cancelSaleApi,
  refundSale as refundSaleApi,
} from '@/lib/services/saleService'

export function useSales(params?: {
  page?: number
  limit?: number
  customerId?: string
  status?: SaleQueryInput['status']
}) {
  return useQuery({
    queryKey: ['sales', params],
    queryFn: () =>
      getSales({
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        customerId: params?.customerId,
        status: params?.status,
      }),
  })
}

export function useSale(id: string) {
  return useQuery({
    queryKey: ['sale', id],
    queryFn: () => getSaleById(id),
    enabled: !!id,
  })
}

export function useCreateSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: CreateSaleInput }) =>
      createSaleApi(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useCancelSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelSaleApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useRefundSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: refundSaleApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['sale'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}


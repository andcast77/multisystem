'use client'

import { useCallback, useEffect, useState } from 'react'
import { baroApi } from '@/lib/api/client'
import type { ApiResponse } from '@multisystem/contracts'
import type {
  ApiProfessionalListItem,
  ApiProfile,
} from '@/components/app/professional-profile-form'

export function useProfessionalsList() {
  const [professionals, setProfessionals] = useState<ApiProfessionalListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [titularId, setTitularId] = useState<string | null>(null)

  const loadProfessionals = useCallback(async () => {
    setError(null)
    setLoading(true)

    try {
      const listRes = await baroApi.get<ApiResponse<ApiProfessionalListItem[]>>('/professionals/list')
      const all = listRes.success ? (listRes.data ?? []) : []
      const titular = all.find((p) => p.isTitular)
      setTitularId(titular?.id ?? null)
      setProfessionals(all)
    } catch (err) {
      setError('No se pudo cargar la lista de profesionales')
      console.error('Error loading professionals list:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfessionals()
  }, [loadProfessionals])

  const refetch = useCallback(() => {
    void loadProfessionals()
  }, [loadProfessionals])

  return { professionals, loading, error, refetch, titularId }
}

export type { ApiProfile }

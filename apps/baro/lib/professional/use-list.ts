'use client'

import { useCallback, useEffect, useState } from 'react'
import { baroApi } from '@/lib/api/client'
import type {
  ApiProfessionalListItem,
  ApiProfile,
} from '@/components/app/professional-profile-form'

/**
 * Combina el profesional titular (/v1/baro/profile) con colaboradores (/v1/baro/professionals/collaborators).
 */
export function useProfessionalsList() {
  const [professionals, setProfessionals] = useState<ApiProfessionalListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [titularId, setTitularId] = useState<string | null>(null)

  const loadProfessionals = useCallback(async () => {
    setError(null)
    setLoading(true)

    try {
      const profileRes = await baroApi.get<{
        success: boolean
        data?: { profile?: ApiProfile | null }
        message?: string
      }>('/profile')

      let professionalIdFromProfile: string | null = null
      const profile = profileRes.success ? profileRes.data?.profile : null
      if (profile) {
        professionalIdFromProfile = profile.id
        setTitularId(professionalIdFromProfile)
      }

      const associatesRes = await baroApi.get<{
        success: boolean
        data?: { professionals?: ApiProfessionalListItem[] }
        message?: string
      }>('/professionals/collaborators')

      const associates =
        associatesRes.success && associatesRes.data?.professionals
          ? associatesRes.data.professionals
          : []

      const allProfessionals: ApiProfessionalListItem[] = []

      if (professionalIdFromProfile && profile) {
        allProfessionals.push({
          id: profile.id,
          displayName: profile.displayName,
          professionalTitle: profile.professionalTitle,
          titleGrammarGender: profile.titleGrammarGender ?? 'MASCULINO',
          locality: profile.locality ?? '',
          addressLine1: profile.addressLine1 ?? '',
          createdAt: profile.createdAt ?? '',
          updatedAt: profile.updatedAt ?? '',
          active: true,
        })
      }

      allProfessionals.push(...associates)

      setProfessionals(allProfessionals)
    } catch (err) {
      setError('No se pudo cargar la lista de profesionales')
      console.error('Error loading professionals list:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfessionals()
  }, [loadProfessionals])

  const refetch = useCallback(() => {
    void loadProfessionals()
  }, [loadProfessionals])

  return { professionals, loading, error, refetch, titularId }
}

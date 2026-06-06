'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { baroApi } from '@/lib/api/client'
import type { ApiResponse } from '@multisystem/contracts'
import type { ApiProfessionalListItem } from '@/components/app/professional-profile-form'
import { ProfessionalsList, ProfessionalsListSearch } from '@/components/app/professionals-list'

export default function Client({
  data,
}: {
  data: { professionals: ApiProfessionalListItem[]; titularId: string | null }
}) {
  const router = useRouter()
  const [professionals, setProfessionals] = useState(data.professionals)
  const [titularId, setTitularId] = useState<string | null>(data.titularId)
  const [currentPrincipalId, setCurrentPrincipalId] = useState<string | null>(data.titularId)
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    if (!q.trim()) return professionals
    const query = q.toLowerCase()
    return professionals.filter(
      (p) =>
        p.displayName.toLowerCase().includes(query) ||
        p.addressLine1.toLowerCase().includes(query) ||
        p.locality.toLowerCase().includes(query)
    )
  }, [professionals, q])

  function handleProfessionalRemoved(id: string) {
    setProfessionals((prev) => prev.filter((p) => p.id !== id))
    setTitularId((t) => (t === id ? null : t))
    setCurrentPrincipalId((c) => (c === id ? null : c))
    router.refresh()
  }

  async function handleSetPrincipal(professionalId: string) {
    const res = await baroApi.patch<ApiResponse<unknown>>('/profile', {
      profesionalPrincipalId: professionalId,
    })
    if (res.success) {
      setCurrentPrincipalId(professionalId)
      router.refresh()
    } else {
      alert(res.message ?? 'No se pudo establecer el profesional principal')
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden">
      <header className="flex shrink-0 items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-heading)] sm:text-3xl">
          Profesionales
        </h1>
      </header>

      <div className="shrink-0">
        <ProfessionalsListSearch q={q} onQChange={setQ} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--background)]/90 shadow-[var(--shadow-soft)] ring-1 ring-[var(--app-panel-ring)]">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <ProfessionalsList
              professionals={filtered}
              titularId={titularId}
              currentPrincipalId={currentPrincipalId}
              onSetPrincipal={handleSetPrincipal}
              onProfessionalRemoved={handleProfessionalRemoved}
              q={q}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

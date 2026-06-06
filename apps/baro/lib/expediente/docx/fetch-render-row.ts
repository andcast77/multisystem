import 'server-only'

import { serverBaroGetData } from '@/lib/api/server'

export async function fetchExpedienteDocxRow<T>(
  expedienteId: string,
  docType: string
): Promise<T | null> {
  return serverBaroGetData<T>(
    `/expedientes/${expedienteId}/docx-data?tipo=${encodeURIComponent(docType)}`
  )
}

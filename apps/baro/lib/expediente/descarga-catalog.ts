import { listExpedienteDocxDocumentDefinitions } from '@/lib/expediente/docx/definitions'
import type { ExpedienteDocxDocumentId } from '@/lib/expediente/docx/types'

/**
 * Catálogo de documentos descargables (derivado del registry DOCX).
 * Sin `node:*` ni `manifest`: seguro para importar desde componentes `"use client"`.
 */

export const EXPEDIENTE_DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document' as const

export type ExpedienteDownloadDocType = ExpedienteDocxDocumentId

export type ExpedienteDownloadDocMeta = {
  id: ExpedienteDownloadDocType
  label: string
  /** Plantilla estática bajo `context/`; viene del registry DOCX (no entrada de usuario). */
  templateFileName: string
  attachmentBasePrefix: string
}

export const expedienteDownloadDocCatalog: readonly ExpedienteDownloadDocMeta[] =
  listExpedienteDocxDocumentDefinitions().map((d) => ({
    id: d.id,
    label: d.label,
    templateFileName: d.staticTemplateFileName ?? '',
    attachmentBasePrefix: d.attachmentBasePrefix,
  }))

const DOC_TYPE_SET = new Set<string>(expedienteDownloadDocCatalog.map((m) => m.id))

const META_BY_ID = Object.fromEntries(
  expedienteDownloadDocCatalog.map((m) => [m.id, m])
) as Readonly<Record<ExpedienteDownloadDocType, ExpedienteDownloadDocMeta>>

export function parseExpedienteDownloadDocType(raw: string): ExpedienteDownloadDocType | null {
  if (DOC_TYPE_SET.has(raw)) {
    return raw as ExpedienteDownloadDocType
  }
  return null
}

export function getExpedienteDownloadDocMeta(
  id: ExpedienteDownloadDocType
): ExpedienteDownloadDocMeta {
  return META_BY_ID[id]
}

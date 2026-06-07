import 'server-only'

import { baroContextPath } from '@/lib/expediente/context-path'

import {
  expedienteDownloadDocCatalog,
  type ExpedienteDownloadDocMeta,
  type ExpedienteDownloadDocType,
} from '@/lib/expediente/descarga-catalog'

import { EXPEDIENTE_DOCX_DOCUMENT_IDS } from '@/lib/expediente/docx/types'

/**
 * Descarga / generación de .docx del expediente (`context/` plantillas estáticas, MVP).
 * Usa filesystem, manifest y rutas HTTP: este módulo es **solo servidor**.
 *
 * Para listas/tags en cliente: importá `@/lib/expediente/descarga-catalog`.
 */

export {
  EXPEDIENTE_DOCX_MIME,
  expedienteDownloadDocCatalog,
  getExpedienteDownloadDocMeta,
  parseExpedienteDownloadDocType,
} from '@/lib/expediente/descarga-catalog'
export type { ExpedienteDownloadDocMeta, ExpedienteDownloadDocType }

export { EXPEDIENTE_DOCX_DOCUMENT_IDS }
export type { ExpedienteDocxDocumentId } from '@/lib/expediente/docx/types'
export {
  getExpedienteDocxDocumentDefinition,
  listExpedienteDocxDocumentDefinitions,
  parseExpedienteDocxDocumentDefinition,
  requireExpedienteDocxDocumentDefinition,
} from '@/lib/expediente/docx/definitions'
export { ExpedienteDocxError, mapExpedienteDocxErrorToHttp } from '@/lib/expediente/docx/errors'
export {
  loadTemplateGovernanceManifest,
  parseTemplateGovernanceManifestJson,
  sha256Hex,
} from '@/lib/expediente/docx/manifest'
export type {
  ExpedienteDocxCanonicalData,
  ExpedienteDocxRenderResult,
} from '@/lib/expediente/docx/types'

export const EXPEDIENTE_DOWNLOAD_DOC_TYPES = EXPEDIENTE_DOCX_DOCUMENT_IDS

/** Caracteres problemáticos en nombres de archivo (Windows / sane defaults). */
export function sanitizeExpedienteNomenclaturaForFilename(nomenclatura: string): string {
  const trimmed = nomenclatura.trim()
  const replaced = trimmed
    .replace(/\//g, '_')
    .replace(/[<>:"\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return replaced.length > 0 ? replaced : 'sin-nomenclatura'
}

export function buildExpedienteDocxAttachmentFilename(
  meta: ExpedienteDownloadDocMeta,
  nomenclaturaCatastral: string
): string {
  return buildExpedienteAttachmentFilename(meta, nomenclaturaCatastral)
}

/**
 * When `preview=1` is used, serve the same bytes with `Content-Disposition: inline` so tab/open
 * semantics match “view”; `fetch()` in the preview dialog works either way.
 */
export {
  withExpedienteDocxPreviewDisposition,
  withExpedienteDocxPreviewCacheHeaders,
} from '@/lib/expediente/descarga-preview'

/**
 * Construye el nombre de archivo `.docx` (`${prefix}_${nomenclaturaSegura}.docx`).
 */
export function buildExpedienteAttachmentFilename(
  meta: ExpedienteDownloadDocMeta,
  nomenclaturaCatastral: string
): string {
  const safe = sanitizeExpedienteNomenclaturaForFilename(nomenclaturaCatastral)
  return `${meta.attachmentBasePrefix}_${safe}.docx`
}

/**
 * Variante para flujos sin nomenclatura (formularios en blanco).
 */
export function buildExpedienteFormularioAttachmentBase(meta: ExpedienteDownloadDocMeta): string {
  return sanitizeExpedienteNomenclaturaForFilename(`${meta.attachmentBasePrefix}_Formulario`)
}

export function resolveExpedienteDocTemplateAbsolutePath(templateFileName: string): string {
  return baroContextPath(templateFileName)
}


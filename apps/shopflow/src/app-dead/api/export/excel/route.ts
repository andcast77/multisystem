import ExcelJS from 'exceljs'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type ExcelExportOptions = {
  title?: string
  storeName?: string
  fileName?: string
  sheetName?: string
}

type SalesExportPayload = {
  type: 'sales'
  sales: Array<{
    id: string
    invoiceNumber: string | null
    customer: { name: string } | null
    createdAt: string
    total: number
    paymentMethod: string
    subtotal: number
    tax: number
    discount: number
  }>
  options?: ExcelExportOptions
}

type ReportExportPayload = {
  type: 'report'
  data: {
    title: string
    headers: string[]
    rows: Array<Array<string | number>>
    summary?: Array<{ label: string; value: string | number }>
  }
  options?: ExcelExportOptions
}

type ExportPayload = SalesExportPayload | ReportExportPayload

function getDateStamp() {
  return new Date().toISOString().split('T')[0]
}

async function buildSalesWorkbook(payload: SalesExportPayload) {
  const options = payload.options ?? {}
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(options.sheetName || 'Ventas')

  worksheet.columns = [
    { width: 12 },
    { width: 15 },
    { width: 25 },
    { width: 15 },
    { width: 12 },
    { width: 12 },
    { width: 15 },
    { width: 15 },
  ]

  if (options.storeName) {
    const titleRow = worksheet.addRow([options.storeName])
    titleRow.font = { size: 16, bold: true }
    titleRow.alignment = { horizontal: 'center' }
    worksheet.mergeCells(1, 1, 1, 8)
    worksheet.addRow([])
  }

  if (options.title) {
    const subtitleRow = worksheet.addRow([options.title])
    subtitleRow.font = { size: 14, bold: true }
    subtitleRow.alignment = { horizontal: 'center' }
    worksheet.mergeCells(worksheet.rowCount, 1, worksheet.rowCount, 8)
    worksheet.addRow([])
  }

  const headerRow = worksheet.addRow([
    'Fecha',
    'Factura',
    'Cliente',
    'Subtotal',
    'Descuento',
    'Impuesto',
    'Total',
    'Método de Pago',
  ])

  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  }
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' }

  payload.sales.forEach((sale) => {
    const row = worksheet.addRow([
      new Date(sale.createdAt).toLocaleDateString(),
      sale.invoiceNumber || '-',
      sale.customer?.name || 'Sin cliente',
      sale.subtotal,
      sale.discount,
      sale.tax,
      sale.total,
      sale.paymentMethod,
    ])

    row.getCell(4).numFmt = '#,##0.00'
    row.getCell(5).numFmt = '#,##0.00'
    row.getCell(6).numFmt = '#,##0.00'
    row.getCell(7).numFmt = '#,##0.00'
  })

  const totalRow = worksheet.addRow([
    '',
    '',
    'TOTAL',
    payload.sales.reduce((sum, s) => sum + s.subtotal, 0),
    payload.sales.reduce((sum, s) => sum + s.discount, 0),
    payload.sales.reduce((sum, s) => sum + s.tax, 0),
    payload.sales.reduce((sum, s) => sum + s.total, 0),
    '',
  ])

  totalRow.font = { bold: true }
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFE0E0' },
  }

  totalRow.getCell(4).numFmt = '#,##0.00'
  totalRow.getCell(5).numFmt = '#,##0.00'
  totalRow.getCell(6).numFmt = '#,##0.00'
  totalRow.getCell(7).numFmt = '#,##0.00'

  return {
    workbook,
    fileName: options.fileName || `sales-report-${getDateStamp()}.xlsx`,
  }
}

async function buildReportWorkbook(payload: ReportExportPayload) {
  const options = payload.options ?? {}
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(options.sheetName || 'Reporte')

  const colWidths = payload.data.headers.map(() => 15)
  worksheet.columns = colWidths.map((width) => ({ width }))

  if (options.storeName) {
    const titleRow = worksheet.addRow([options.storeName])
    titleRow.font = { size: 16, bold: true }
    titleRow.alignment = { horizontal: 'center' }
    worksheet.mergeCells(1, 1, 1, payload.data.headers.length)
    worksheet.addRow([])
  }

  const subtitleRow = worksheet.addRow([payload.data.title])
  subtitleRow.font = { size: 14, bold: true }
  subtitleRow.alignment = { horizontal: 'center' }
  worksheet.mergeCells(worksheet.rowCount, 1, worksheet.rowCount, payload.data.headers.length)

  const dateRow = worksheet.addRow([`Generado: ${new Date().toLocaleString()}`])
  dateRow.font = { size: 10 }
  dateRow.alignment = { horizontal: 'center' }
  worksheet.mergeCells(worksheet.rowCount, 1, worksheet.rowCount, payload.data.headers.length)
  worksheet.addRow([])

  const headerRow = worksheet.addRow(payload.data.headers)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  }
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' }

  payload.data.rows.forEach((row) => {
    const worksheetRow = worksheet.addRow(row)
    row.forEach((cell, index) => {
      if (typeof cell === 'number') {
        worksheetRow.getCell(index + 1).numFmt = '#,##0.00'
      }
    })
  })

  if (payload.data.summary && payload.data.summary.length > 0) {
    worksheet.addRow([])
    payload.data.summary.forEach((item) => {
      const summaryRow = worksheet.addRow([item.label, item.value])
      summaryRow.font = { bold: true }
      if (typeof item.value === 'number') {
        summaryRow.getCell(2).numFmt = '#,##0.00'
      }
    })
  }

  return {
    workbook,
    fileName: options.fileName || `report-${getDateStamp()}.xlsx`,
  }
}

export async function POST(request: Request) {
  let payload: ExportPayload

  try {
    payload = (await request.json()) as ExportPayload
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  let workbook: ExcelJS.Workbook
  let fileName: string

  if (payload?.type === 'sales') {
    ;({ workbook, fileName } = await buildSalesWorkbook(payload))
  } else if (payload?.type === 'report') {
    ;({ workbook, fileName } = await buildReportWorkbook(payload))
  } else {
    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const fileBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  })
}

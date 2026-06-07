import { describe, expect, it } from 'vitest'
import { baroContextPath, baroContextRoot } from '@/lib/expediente/context-path'
import path from 'node:path'

describe('baroContextPath', () => {
  it('resolves templates under apps/baro/context', () => {
    const root = baroContextRoot()
    expect(root.endsWith(`${path.sep}context`)).toBe(true)
    expect(baroContextPath('expedientes-docx', 'acta', 'template.docx')).toBe(
      path.join(root, 'expedientes-docx', 'acta', 'template.docx')
    )
  })
})

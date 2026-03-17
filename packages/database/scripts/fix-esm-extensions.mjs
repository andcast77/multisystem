import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'

async function fixFile(filePath) {
  let content = await readFile(filePath, 'utf-8')
  const fixed = content.replace(
    /(from\s+['"])(\.\.?\/[^'"]*?)(['"])/g,
    (match, prefix, specifier, suffix) => {
      if (extname(specifier)) return match
      return `${prefix}${specifier}.js${suffix}`
    }
  )
  if (fixed !== content) {
    await writeFile(filePath, fixed, 'utf-8')
  }
}

async function walkDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      await walkDir(fullPath)
    } else if (entry.name.endsWith('.js')) {
      await fixFile(fullPath)
    }
  }
}

await walkDir('dist')

import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, mkdir, access } from 'fs/promises'
import { join } from 'path'
import { shopflowApi } from '@/lib/api/client'
import { format } from 'date-fns'

const execAsync = promisify(exec)

const BACKUP_DIR = process.env.BACKUP_DIR || join(process.cwd(), 'backups')

export interface BackupMetadata {
  id: string
  filename: string
  createdAt: Date
  size: number
  type: 'database' | 'data_export'
  format: 'sql' | 'json' | 'csv'
}

/**
 * Ensure backup directory exists
 */
async function ensureBackupDir(): Promise<void> {
  try {
    await access(BACKUP_DIR)
  } catch {
    await mkdir(BACKUP_DIR, { recursive: true })
  }
}

/**
 * Create a PostgreSQL database backup using pg_dump
 */
export async function createDatabaseBackup(): Promise<BackupMetadata> {
  await ensureBackupDir()

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL not configured')
  }

  // Parse connection string
  const url = new URL(connectionString)
  const dbName = url.pathname.slice(1) // Remove leading /
  const dbUser = url.username
  const dbHost = url.hostname
  const dbPort = url.port || '5432'
  const dbPassword = url.password

  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
  const filename = `backup_${timestamp}.sql`
  const filepath = join(BACKUP_DIR, filename)

  // Set PGPASSWORD environment variable for pg_dump
  const env = { ...process.env, PGPASSWORD: dbPassword }

  try {
    // Use pg_dump to create backup
    const { stderr } = await execAsync(
      `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F c -f "${filepath}"`,
      { env }
    )

    if (stderr && !stderr.includes('WARNING')) {
      throw new Error(`pg_dump error: ${stderr}`)
    }

    // Get file size
    const stats = await import('fs/promises').then((fs) => fs.stat(filepath))
    const size = stats.size

    return {
      id: timestamp,
      filename,
      createdAt: new Date(),
      size,
      type: 'database',
      format: 'sql',
    }
  } catch (error) {
    throw new Error(`Failed to create database backup: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Restore database from backup file
 */
export async function restoreDatabaseBackup(filename: string): Promise<void> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL not configured')
  }

  const filepath = join(BACKUP_DIR, filename)

  // Verify file exists
  try {
    await access(filepath)
  } catch {
    throw new Error(`Backup file not found: ${filename}`)
  }

  // Parse connection string
  const url = new URL(connectionString)
  const dbName = url.pathname.slice(1)
  const dbUser = url.username
  const dbHost = url.hostname
  const dbPort = url.port || '5432'
  const dbPassword = url.password

  const env = { ...process.env, PGPASSWORD: dbPassword }

  try {
    // Drop and recreate database (destructive operation!)
    // In production, you might want to restore to a temporary database first
    await execAsync(
      `pg_restore -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --clean --if-exists "${filepath}"`,
      { env }
    )
  } catch (error) {
    throw new Error(`Failed to restore database: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Export all data to JSON format (via API)
 */
export async function exportDataToJson(): Promise<BackupMetadata> {
  await ensureBackupDir()

  const response = await shopflowApi.get<{ success: boolean; data?: unknown }>('/export/json')
  if (!response.success || !response.data) {
    throw new Error('Data export is only available via the API. Use the backend export endpoint.')
  }

  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
  const filename = `data_export_${timestamp}.json`
  const filepath = join(BACKUP_DIR, filename)
  const jsonData = JSON.stringify(response.data, null, 2)
  await writeFile(filepath, jsonData, 'utf-8')

  const stats = await import('fs/promises').then((fs) => fs.stat(filepath))
  const size = stats.size

  return {
    id: timestamp,
    filename,
    createdAt: new Date(),
    size,
    type: 'data_export',
    format: 'json',
  }
}

/**
 * Export specific table to CSV (via API)
 */
export async function exportTableToCsv(tableName: string): Promise<BackupMetadata> {
  await ensureBackupDir()

  const response = await shopflowApi.get<{ success: boolean; data?: { rows: unknown[]; headers: string[] } }>(
    `/export/csv?table=${encodeURIComponent(tableName)}`
  )
  if (!response.success || !response.data) {
    throw new Error(`Export for table "${tableName}" is only available via the API.`)
  }

  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
  const filename = `export_${tableName}_${timestamp}.csv`
  const filepath = join(BACKUP_DIR, filename)

  const data = response.data.rows
  const headers = response.data.headers

  // Convert to CSV
  const csvRows: string[] = []
  
  // Add headers
  csvRows.push(headers.join(','))

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = (row as Record<string, unknown>)[header]
      if (value === null || value === undefined) return ''
      if (typeof value === 'object') {
        return JSON.stringify(value).replace(/"/g, '""')
      }
      return String(value).replace(/"/g, '""').replace(/,/g, ';')
    })
    csvRows.push(`"${values.join('","')}"`)
  }

  const csvContent = csvRows.join('\n')
  await writeFile(filepath, csvContent, 'utf-8')

  const stats = await import('fs/promises').then((fs) => fs.stat(filepath))
  const size = stats.size

  return {
    id: timestamp,
    filename,
    createdAt: new Date(),
    size,
    type: 'data_export',
    format: 'csv',
  }
}

/**
 * List all backup files
 */
export async function listBackups(): Promise<BackupMetadata[]> {
  await ensureBackupDir()

  const { readdir, stat } = await import('fs/promises')
  const files = await readdir(BACKUP_DIR)

  const backups: BackupMetadata[] = []

  for (const file of files) {
    if (file.endsWith('.sql') || file.endsWith('.json') || file.endsWith('.csv')) {
      const filepath = join(BACKUP_DIR, file)
      const stats = await stat(filepath)
      
      const type = file.startsWith('backup_') ? 'database' : 'data_export'
      const format = file.endsWith('.sql') ? 'sql' : file.endsWith('.json') ? 'json' : 'csv'
      const id = file.replace(/\.(sql|json|csv)$/, '').split('_').pop() || ''

      backups.push({
        id,
        filename: file,
        createdAt: stats.birthtime,
        size: stats.size,
        type,
        format,
      })
    }
  }

  return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

/**
 * Delete a backup file
 */
export async function deleteBackup(filename: string): Promise<void> {
  const filepath = join(BACKUP_DIR, filename)
  const { unlink } = await import('fs/promises')
  
  try {
    await unlink(filepath)
  } catch (error) {
    throw new Error(`Failed to delete backup: ${error instanceof Error ? error.message : String(error)}`)
  }
}


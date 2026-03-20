'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useCategories, useDeleteCategory } from '@/hooks/useCategories'
import { Button } from '@multisystem/ui'
import { Input } from '@multisystem/ui'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@multisystem/ui'
import { Skeleton } from '@multisystem/ui'
import { Plus, Search, Tags, Edit, Trash2, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@multisystem/ui'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@multisystem/ui'

type SortCol = 'name' | 'description'
type SortOrder = 'asc' | 'desc'

export default function CategoriesPage() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortCol>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const { data: categories, isLoading, error } = useCategories()
  const deleteCategory = useDeleteCategory()

  const filteredCategories = useMemo(() => {
    const list = categories?.filter((c) =>
      search ? c.name.toLowerCase().includes(search.toLowerCase()) : true
    ) ?? []
    return [...list].sort((a, b) => {
      const aVal = sortBy === 'name' ? (a.name ?? '').toLowerCase() : (a.description ?? '')
      const bVal = sortBy === 'name' ? (b.name ?? '').toLowerCase() : (b.description ?? '')
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortOrder === 'asc' ? cmp : -cmp
    })
  }, [categories, search, sortBy, sortOrder])

  const toggleSort = (column: SortCol) => {
    if (sortBy === column) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const SortIcon = ({ column }: { column: SortCol }) => {
    if (sortBy !== column) return <ChevronsUpDown className="ml-1 h-4 w-4 text-muted-foreground" />
    return sortOrder === 'asc' ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    )
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${name}"?`)) return
    try {
      await deleteCategory.mutateAsync(id)
    } catch (err) {
      alert('Error al eliminar: ' + String(err))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Categorías</h1>
        <p className="text-muted-foreground">Gestiona las categorías de productos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorías</CardTitle>
          <CardDescription>Busca y gestiona todas las categorías</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar categorías..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Link href="/categories/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Categoría
              </Button>
            </Link>
          </div>

          {error && (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-red-200 bg-red-50/50 p-8">
              <p className="text-sm text-red-600">Error al cargar categorías: {String(error)}</p>
            </div>
          )}

          {!error && isLoading && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!error && !isLoading && filteredCategories && filteredCategories.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" className="-ml-3 h-8 font-semibold" onClick={() => toggleSort('name')}>
                        Nombre
                        <SortIcon column="name" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" className="-ml-3 h-8 font-semibold" onClick={() => toggleSort('description')}>
                        Descripción
                        <SortIcon column="description" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Tags className="h-4 w-4 text-gray-400" />
                          {category.name}
                        </div>
                      </TableCell>
                      <TableCell>{category.description || <span className="text-gray-400">—</span>}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/categories/${category.id}`}>
                            <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará la categoría "{category.name}". Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(category.id, category.name)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : !error && !isLoading ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
              <Tags className="h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">No hay categorías</h3>
              <p className="mt-2 text-sm text-gray-500">
                {search ? 'No se encontraron categorías.' : 'Comienza agregando tu primera categoría.'}
              </p>
              {!search && (
                <Link href="/categories/new" className="mt-4">
                  <Button><Plus className="mr-2 h-4 w-4" />Nueva Categoría</Button>
                </Link>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

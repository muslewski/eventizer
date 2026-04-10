'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, Check, Search, RotateCcw, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategoryItem {
  id: string | number
  name: string
  slug: string
  description?: string | null
  subcategory_level_1?: CategoryItem[]
  subcategory_level_2?: CategoryItem[]
}

interface CategoryPickerProps {
  categories: CategoryItem[]
  value: string
  onChange: (value: string) => void
}

export function CategoryPicker({ categories, value, onChange }: CategoryPickerProps) {
  const [selectedPath, setSelectedPath] = React.useState<CategoryItem[]>([])
  const [searchQuery, setSearchQuery] = React.useState('')

  // Initialize from value if provided
  React.useEffect(() => {
    if (value && selectedPath.length === 0) {
      // Try to reconstruct path from the stored category string (e.g., "Muzyka > DJ > DJ Weselny")
      const parts = value.split(' > ')
      if (parts.length > 0) {
        const path: CategoryItem[] = []
        let currentItems: CategoryItem[] = categories

        for (const part of parts) {
          const found = currentItems.find((c) => c.name === part)
          if (found) {
            path.push(found)
            // Navigate to next level
            if ((found as any).subcategory_level_1?.length) {
              currentItems = (found as any).subcategory_level_1
            } else if ((found as any).subcategory_level_2?.length) {
              currentItems = (found as any).subcategory_level_2
            } else {
              break
            }
          } else {
            break
          }
        }

        if (path.length > 0) {
          setSelectedPath(path)
        }
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const currentLevel = selectedPath.length

  const getCurrentCategories = (): CategoryItem[] => {
    switch (currentLevel) {
      case 0:
        return categories
      case 1: {
        const level1 = selectedPath[0] as any
        return level1?.subcategory_level_1 || []
      }
      case 2: {
        const level2 = selectedPath[1] as any
        return level2?.subcategory_level_2 || []
      }
      default:
        return []
    }
  }

  const isSelectionComplete = (): boolean => {
    if (selectedPath.length === 0) return false
    const lastCategory = selectedPath[selectedPath.length - 1] as any

    if (currentLevel === 1) {
      return !lastCategory.subcategory_level_1?.length
    }
    if (currentLevel === 2) {
      return !lastCategory.subcategory_level_2?.length
    }
    if (currentLevel === 3) {
      return true
    }
    return false
  }

  const handleCategorySelect = (category: CategoryItem) => {
    const newPath = [...selectedPath, category]
    setSelectedPath(newPath)
    setSearchQuery('')

    // Check if this is the final selection
    const catWithSubs = category as any
    const hasMore =
      currentLevel === 0
        ? catWithSubs.subcategory_level_1?.length > 0
        : currentLevel === 1
          ? catWithSubs.subcategory_level_2?.length > 0
          : false

    if (!hasMore) {
      // Build the category path string
      const categoryPath = newPath.map((c) => c.name).join(' > ')
      onChange(categoryPath)
    }
  }

  const handleBreadcrumbClick = (index: number) => {
    const newPath = selectedPath.slice(0, index)
    setSelectedPath(newPath)
    setSearchQuery('')
    onChange('')
  }

  const resetSelection = () => {
    setSelectedPath([])
    setSearchQuery('')
    onChange('')
  }

  const filteredCategories = getCurrentCategories().filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (isSelectionComplete()) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
          {selectedPath.map((category, index) => (
            <React.Fragment key={category.id}>
              <Badge
                variant="outline"
                className="border-primary/40 px-3 py-1.5 text-sm font-medium text-primary"
              >
                {category.name}
              </Badge>
              {index < selectedPath.length - 1 && (
                <ChevronRight className="size-4 text-primary/60" />
              )}
            </React.Fragment>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetSelection}
          className="w-fit"
        >
          <RotateCcw className="size-4" data-icon="inline-start" />
          Zmień kategorię
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Breadcrumb path */}
      {selectedPath.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
          {selectedPath.map((category, index) => (
            <React.Fragment key={category.id}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleBreadcrumbClick(index)}
                className="h-auto px-2 py-1 text-sm font-medium text-primary"
              >
                {category.name}
              </Button>
              {index < selectedPath.length - 1 && (
                <ChevronRight className="size-4 text-muted-foreground" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Szukaj kategorii..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category list */}
      <div className="grid max-h-[300px] gap-2 overflow-y-auto pr-1">
        {filteredCategories.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Briefcase className="mx-auto mb-2 size-8 opacity-50" />
            <p className="font-medium">Nie znaleziono kategorii</p>
          </div>
        ) : (
          filteredCategories.map((category) => {
            const catWithSubs = category as any
            const hasSubcategories =
              currentLevel === 0
                ? catWithSubs.subcategory_level_1?.length > 0
                : currentLevel === 1
                  ? catWithSubs.subcategory_level_2?.length > 0
                  : false

            return (
              <Card
                key={category.id}
                className={cn(
                  'cursor-pointer transition-colors hover:border-primary/40 hover:bg-primary/5',
                )}
                onClick={() => handleCategorySelect(category)}
              >
                <CardContent className="flex items-center justify-between p-3">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">{category.name}</span>
                    {category.description && (
                      <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-3 flex shrink-0 items-center gap-1 text-muted-foreground">
                    {hasSubcategories ? (
                      <ChevronRight className="size-5" />
                    ) : (
                      <Check className="size-5" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

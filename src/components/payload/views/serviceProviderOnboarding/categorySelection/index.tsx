'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ChevronRight, Check, Briefcase, Crown, Search, RotateCcw } from 'lucide-react'
import { ServiceCategory } from '@/payload-types'
import { cn } from '@/lib/utils'

interface CategorySelectionProps {
  categories: ServiceCategory[]
  onSelectionChange?: (categoryPath: ServiceCategory[]) => void
  value?: ServiceCategory[]
}

export function CategorySelection({
  categories,
  onSelectionChange,
  value = [],
}: CategorySelectionProps) {
  const [selectedPath, setSelectedPath] = React.useState<ServiceCategory[]>(value)
  const [searchQuery, setSearchQuery] = React.useState('')

  // Get subcategories for each level
  const level1Categories = categories
  const level2Categories = selectedPath[0]
    ? ((selectedPath[0] as any).subcategory_level_1 as ServiceCategory[]) || []
    : []
  const level3Categories = selectedPath[1]
    ? ((selectedPath[1] as any).subcategory_level_2 as ServiceCategory[]) || []
    : []

  // Determine which level we're currently selecting
  const currentLevel = selectedPath.length

  // Get categories to display based on current level
  const getCurrentCategories = (): ServiceCategory[] => {
    switch (currentLevel) {
      case 0:
        return level1Categories
      case 1:
        return level2Categories
      case 2:
        return level3Categories
      default:
        return []
    }
  }

  // Check if current selection is complete (no more subcategories)
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

  const handleCategorySelect = (category: ServiceCategory) => {
    const newPath = [...selectedPath, category]
    setSelectedPath(newPath)
    setSearchQuery('')
    onSelectionChange?.(newPath)
  }

  const handleBreadcrumbClick = (index: number) => {
    const newPath = selectedPath.slice(0, index)
    setSelectedPath(newPath)
    setSearchQuery('')
    onSelectionChange?.(newPath)
  }

  const resetSelection = () => {
    setSelectedPath([])
    setSearchQuery('')
    onSelectionChange?.([])
  }

  const filteredCategories = getCurrentCategories().filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStepTitle = () => {
    switch (currentLevel) {
      case 0:
        return 'Wybierz główną kategorię'
      case 1:
        return 'Wybierz podkategorię'
      case 2:
        return 'Wybierz specjalizację'
      default:
        return 'Wybór zakończony'
    }
  }

  const getStepDescription = () => {
    switch (currentLevel) {
      case 0:
        return 'Jaka kategoria najlepiej opisuje twoją działalność?'
      case 1:
        return 'Zawęź swój wybór do bardziej szczegółowej kategorii'
      case 2:
        return 'Wybierz swoją dokładną specjalizację'
      default:
        return 'Twoja kategoria została wybrana'
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Header Card */}
      <Card
        className={cn(
          'border-2',
          'border-amber-500/10 dark:border-amber-500/20',
          'bg-[var(--theme-elevation-50)]',
        )}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl',
                  'bg-amber-500/10 dark:bg-amber-500/20',
                  'border border-amber-500/20 dark:border-amber-500/30',
                )}
              >
                <Briefcase className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-[var(--theme-text)]">Kategoria usługi</CardTitle>
                <CardDescription className="text-[var(--theme-elevation-700)] mt-1">
                  Wybierz kategorię w 3 prostych krokach
                </CardDescription>
              </div>
            </div>

            {selectedPath.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetSelection}
                className="text-[var(--theme-elevation-500)] hover:text-[var(--theme-text)]"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Zacznij od nowa
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-6">
            {[0, 1, 2].map((step) => (
              <React.Fragment key={step}>
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all',
                    step < currentLevel
                      ? 'bg-amber-500 text-white'
                      : step === currentLevel
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-2 border-amber-500'
                        : 'bg-[var(--theme-elevation-100)] text-[var(--theme-elevation-500)]',
                  )}
                >
                  {step < currentLevel ? <Check className="h-4 w-4" /> : step + 1}
                </div>
                {step < 2 && (
                  <div
                    className={cn(
                      'flex-1 h-1 rounded-full transition-all',
                      step < currentLevel ? 'bg-amber-500' : 'bg-[var(--theme-elevation-150)]',
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Breadcrumb / Selected Path */}
          {selectedPath.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-lg bg-[var(--theme-elevation-50)] border border-[var(--theme-elevation-150)]">
              {/* <span className="text-sm text-[var(--theme-elevation-600)] mr-1">Ścieżka:</span> */}
              {selectedPath.map((category, index) => (
                <React.Fragment key={category.id}>
                  <Button
                    variant="outline"
                    onClick={() => handleBreadcrumbClick(index)}
                    className={cn(
                      'px-2 py-1 text-sm rounded-md transition-colors',
                      'hover:bg-amber-500/10 text-amber-700 dark:text-amber-400',
                      'font-medium',
                    )}
                  >
                    {category.name}
                  </Button>
                  {index < selectedPath.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-[var(--theme-elevation-400)]" />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selection Area */}
      {!isSelectionComplete() ? (
        <Card
          className={cn(
            'border-2',
            'border-[var(--theme-elevation-150)]',
            'bg-[var(--theme-elevation-50)]',
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-[var(--theme-text)]">{getStepTitle()}</CardTitle>
                <CardDescription className="text-[var(--theme-elevation-600)] mt-1">
                  {getStepDescription()}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[var(--theme-elevation-600)]">
                Krok {currentLevel + 1} z 3
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--theme-elevation-500)]" />
              <Input
                placeholder="Szukaj kategorii..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Grid */}
            <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-1">
              {filteredCategories.length === 0 ? (
                <div className="py-12 text-center text-[var(--theme-elevation-500)]">
                  <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Nie znaleziono kategorii</p>
                  <p className="text-sm">Spróbuj innej frazy wyszukiwania</p>
                </div>
              ) : (
                filteredCategories.map((category) => {
                  const categoryWithSubs = category as any
                  const hasSubcategories =
                    currentLevel === 0
                      ? categoryWithSubs.subcategory_level_1?.length > 0
                      : currentLevel === 1
                        ? categoryWithSubs.subcategory_level_2?.length > 0
                        : false

                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category)}
                      className={cn(
                        'w-full flex items-center justify-between p-4 rounded-xl',
                        'border-2 border-transparent',
                        'bg-[var(--theme-elevation-100)]',
                        'hover:border-amber-500/40 hover:bg-amber-500/5',
                        'transition-all duration-200 text-left',
                        'group',
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={cn(
                            'flex-shrink-0 p-2 rounded-lg',
                            'bg-[var(--theme-elevation-150)] group-hover:bg-amber-500/15',
                            'text-[var(--theme-elevation-600)] group-hover:text-amber-600 dark:group-hover:text-amber-400',
                            'transition-colors',
                          )}
                        >
                          <Briefcase className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[var(--theme-text)] truncate">
                              {category.name}
                            </span>
                            {category.requiredPlan && (
                              <Badge
                                variant="secondary"
                                className={cn(
                                  'flex-shrink-0 text-xs',
                                  'bg-amber-500/15 text-amber-700 dark:text-amber-300',
                                  'border border-amber-500/30',
                                )}
                              >
                                <Crown className="h-3 w-3 mr-1" />
                                {(category.requiredPlan as any).name}
                              </Badge>
                            )}
                          </div>
                          {category.description && (
                            <p className="text-sm text-[var(--theme-elevation-600)] mt-0.5 line-clamp-1">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div
                        className={cn(
                          'flex-shrink-0 ml-3 flex items-center gap-1',
                          'text-[var(--theme-elevation-400)] group-hover:text-amber-600 dark:group-hover:text-amber-400',
                          'transition-colors',
                        )}
                      >
                        {hasSubcategories ? (
                          <>
                            <span className="text-xs hidden sm:inline">Dalej</span>
                            <ChevronRight className="h-5 w-5" />
                          </>
                        ) : (
                          <>
                            <span className="text-xs hidden sm:inline">Wybierz</span>
                            <Check className="h-5 w-5" />
                          </>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Success State */
        <Card
          className={cn(
            'border-2',
            'border-amber-500/30 dark:border-amber-500/40',
            'bg-gradient-to-br from-amber-500/5 to-amber-500/10',
          )}
        >
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div
                className={cn(
                  'inline-flex items-center justify-center w-16 h-16 rounded-full',
                  'bg-amber-500/20 dark:bg-amber-500/30',
                )}
              >
                <Check className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-medium text-[var(--theme-text)]">Kategoria wybrana!</h3>
                <p className="text-[var(--theme-elevation-600)] mt-1">
                  Twoja ścieżka kategorii została ustalona
                </p>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-2 pt-2">
                {selectedPath.map((category, index) => (
                  <React.Fragment key={category.id}>
                    <Badge
                      variant="outline"
                      className={cn(
                        'px-3 py-1.5 text-sm font-medium',
                        'bg-[var(--theme-elevation-50)]',
                        'border-amber-500/40 text-amber-800 dark:text-amber-200',
                      )}
                    >
                      {category.name}
                    </Badge>
                    {index < selectedPath.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-amber-500/60" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {selectedPath[selectedPath.length - 1]?.requiredPlan && (
                <div className="flex items-center justify-center gap-2 pt-4 text-sm">
                  <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-[var(--theme-elevation-700)]">
                    Wymagany plan:
                    <span className="font-semibold text-amber-700 dark:text-amber-400 ml-1">
                      {(selectedPath[selectedPath.length - 1].requiredPlan as any)?.name}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

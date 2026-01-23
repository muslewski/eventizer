'use client'

import { TitleH3 } from '@/components/frontend/Content/TitleH3'
import { ServiceCategory } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, LayoutGrid } from 'lucide-react'
import { useState, useEffect, useTransition, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface SubcategoryLevel1 {
  id: string
  name: string
  slug: string
}

export default function CategorySelection({ categoryData }: { categoryData?: ServiceCategory[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentKategoria = searchParams.get('kategoria')

  const [openCategories, setOpenCategories] = useState<Set<number>>(new Set())

  // Auto-expand parent category when a subcategory is selected via URL
  useEffect(() => {
    if (currentKategoria && categoryData) {
      categoryData.forEach((category) => {
        const subcategories = category.subcategory_level_1 as SubcategoryLevel1[] | undefined
        const hasMatchingSubcategory = subcategories?.some(
          (sub) => `${category.slug}/${sub.slug}` === currentKategoria,
        )
        if (hasMatchingSubcategory || currentKategoria.startsWith(`${category.slug}/`)) {
          setOpenCategories((prev) => new Set(prev).add(category.id))
        }
      })
    }
  }, [currentKategoria, categoryData])

  const toggleCategory = useCallback((categoryId: number) => {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }, [])

  const updateCategoryParam = useCallback(
    (categorySlug: string | null) => {
      const params = new URLSearchParams(searchParams.toString())

      if (categorySlug) {
        params.set('kategoria', categorySlug)
      } else {
        params.delete('kategoria')
      }

      params.delete('strona')

      const queryString = params.toString()
      startTransition(() => {
        router.push(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false })
      })
    },
    [searchParams, pathname, router],
  )

  const handleCategoryClick = useCallback(
    (slug: string) => {
      updateCategoryParam(slug)
    },
    [updateCategoryParam],
  )

  const handleSubcategoryClick = useCallback(
    (categorySlug: string, subcategorySlug: string) => {
      updateCategoryParam(`${categorySlug}/${subcategorySlug}`)
    },
    [updateCategoryParam],
  )

  const handleAllCategoriesClick = useCallback(() => {
    updateCategoryParam(null)
  }, [updateCategoryParam])

  const isCategorySelected = useCallback(
    (categorySlug: string) => {
      return currentKategoria === categorySlug
    },
    [currentKategoria],
  )

  const isSubcategorySelected = useCallback(
    (categorySlug: string, subcategorySlug: string) => {
      return currentKategoria === `${categorySlug}/${subcategorySlug}`
    },
    [currentKategoria],
  )

  return (
    <div className="lg:max-w-72 w-full md:w-1/4 h-full border-r border-border/50 py-8 pr-4">
      {/* Category Header */}
      <div className="flex flex-col gap-5 mb-6">
        <TitleH3 title={'Kategorie'} />
        <div className="bg-gradient-to-r from-yellow-400/60 via-yellow-300/20 to-transparent h-px w-[calc(100%+4rem)] -ml-24" />
      </div>

      <ScrollArea className="h-[calc(100%-80px)] pr-4" type="hover">
        {/* All Categories Button */}
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start text-left font-medium mb-3 gap-2.5 px-3 py-2.5 h-auto rounded-lg transition-all duration-200',
            'hover:bg-accent/80 hover:translate-x-0.5',
            !currentKategoria &&
              'bg-gradient-to-r from-yellow-400/20 to-yellow-300/5 text-foreground border border-yellow-400/30 shadow-sm',
            isPending && 'opacity-50 pointer-events-none',
          )}
          onClick={handleAllCategoriesClick}
        >
          <LayoutGrid className="h-4 w-4 shrink-0" />
          Wszystkie kategorie
        </Button>

        {/* Divider */}
        <div className="h-px bg-border/50 mb-3" />

        {/* Category list */}
        <div className="flex flex-col gap-1.5">
          {categoryData?.map((category) => {
            const isOpen = openCategories.has(category.id)
            const hasSubcategories =
              category.subcategory_level_1 && category.subcategory_level_1.length > 0
            const subcategories = category.subcategory_level_1 as SubcategoryLevel1[] | undefined
            const isSelected = isCategorySelected(category.slug)
            const hasSelectedSubcategory = subcategories?.some((sub) =>
              isSubcategorySelected(category.slug, sub.slug),
            )

            return (
              <Collapsible
                key={category.id}
                open={isOpen}
                onOpenChange={() => toggleCategory(category.id)}
                className="group"
              >
                <div
                  className={cn(
                    'flex items-center gap-1 rounded-lg transition-colors duration-200',
                    (isSelected || hasSelectedSubcategory) && 'bg-accent/30',
                  )}
                >
                  {hasSubcategories && (
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-8 w-8 shrink-0 rounded-md transition-all duration-200',
                          'hover:bg-accent/80',
                          isOpen && 'text-yellow-500',
                        )}
                      >
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 transition-transform duration-200',
                            !isOpen && '-rotate-90',
                          )}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  )}
                  {!hasSubcategories && <div className="w-8" />}
                  <Button
                    variant="ghost"
                    className={cn(
                      'flex-1 justify-start text-left font-medium text-sm h-auto py-2 px-2 whitespace-normal rounded-md transition-all duration-200',
                      'hover:bg-accent/60 hover:translate-x-0.5',
                      isSelected &&
                        'bg-gradient-to-r from-yellow-400/20 to-transparent text-foreground font-semibold',
                      isPending && 'opacity-50 pointer-events-none',
                    )}
                    onClick={() => handleCategoryClick(category.slug)}
                  >
                    {category.name}
                  </Button>
                </div>

                {hasSubcategories && (
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-up-1 data-[state=open]:slide-down-1">
                    <div className="flex flex-col gap-0.5 py-1.5 pl-8 border-l-2 border-yellow-400/20 ml-4 mt-1">
                      {subcategories?.map((subcategory) => {
                        const isSubSelected = isSubcategorySelected(category.slug, subcategory.slug)
                        return (
                          <Button
                            key={subcategory.id}
                            variant="ghost"
                            className={cn(
                              'justify-start text-left text-xs h-auto py-1.5 px-2.5 w-full whitespace-normal rounded-md transition-all duration-200',
                              'text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:translate-x-0.5',
                              isPending && 'opacity-50 pointer-events-none',
                              isSubSelected &&
                                'bg-yellow-400/15 text-foreground font-medium border-l-2 border-yellow-400 -ml-[2px] pl-[calc(0.625rem+2px)]',
                            )}
                            onClick={() => handleSubcategoryClick(category.slug, subcategory.slug)}
                          >
                            {subcategory.name}
                          </Button>
                        )
                      })}
                    </div>
                  </CollapsibleContent>
                )}
              </Collapsible>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

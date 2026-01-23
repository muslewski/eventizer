'use client'

import { TitleH3 } from '@/components/frontend/Content/TitleH3'
import { ServiceCategory } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight } from 'lucide-react'
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

  // Memoize button class to avoid recalculating on every render
  const allCategoriesButtonClass = useMemo(
    () =>
      cn(
        'w-full justify-start text-left font-medium mb-2',
        !currentKategoria && 'bg-accent text-accent-foreground',
        isPending && 'opacity-50 pointer-events-none',
      ),
    [currentKategoria, isPending],
  )

  return (
    <div className="lg:max-w-64 w-full md:w-1/4 h-full border-r rounded-r-2xl py-8 pr-4">
      {/* Category Header */}
      <div className="flex flex-col gap-6 mb-6">
        <TitleH3 title={'Kategorie'} />
        <div className="bg-linear-to-r from-yellow-400/50 via-yellow-200/20 to-transparent h-px w-[calc(100%+4rem)] -ml-24" />
      </div>

      <ScrollArea className="h-[calc(100%-80px)] pr-7" type="hover">
        <Button
          variant="ghost"
          className={allCategoriesButtonClass}
          onClick={handleAllCategoriesClick}
        >
          Wszystkie kategorie
        </Button>

        {/* Category list */}
        <div className="flex flex-col gap-1">
          {categoryData?.map((category) => {
            const isOpen = openCategories.has(category.id)
            const hasSubcategories =
              category.subcategory_level_1 && category.subcategory_level_1.length > 0
            const subcategories = category.subcategory_level_1 as SubcategoryLevel1[] | undefined

            return (
              <Collapsible
                key={category.id}
                open={isOpen}
                onOpenChange={() => toggleCategory(category.id)}
              >
                <div className="flex items-center gap-1">
                  {hasSubcategories && (
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  )}
                  <Button
                    variant="ghost"
                    className={cn(
                      'flex-1 justify-start text-left font-medium text-sm h-fit whitespace-normal',
                      isCategorySelected(category.slug) && 'bg-accent text-accent-foreground',
                      isPending && 'opacity-50 pointer-events-none',
                    )}
                    onClick={() => handleCategoryClick(category.slug)}
                  >
                    {category.name}
                  </Button>
                </div>

                {hasSubcategories && (
                  <CollapsibleContent className="pl-0">
                    <div className="flex flex-col gap-0.5 py-1">
                      {subcategories?.map((subcategory) => (
                        <Button
                          key={subcategory.id}
                          variant="ghost"
                          className={cn(
                            'justify-start text-left text-xs h-fit w-full whitespace-normal text-muted-foreground hover:text-foreground',
                            isPending && 'opacity-50 pointer-events-none',
                            isSubcategorySelected(category.slug, subcategory.slug) &&
                              'bg-accent text-accent-foreground',
                          )}
                          onClick={() => handleSubcategoryClick(category.slug, subcategory.slug)}
                        >
                          {subcategory.name}
                        </Button>
                      ))}
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

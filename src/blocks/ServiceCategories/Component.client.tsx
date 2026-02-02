'use client'

import { ServiceCategory, Media } from '@/payload-types'
import { TitleH2 } from '@/components/frontend/Content/TitleH2'
import { CategoryCard } from './CategoryCard'
import { useState } from 'react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, X } from 'lucide-react'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'
import { ParagraphLikeH3 } from '@/components/frontend/Content/ParagraphLikeH3'

interface ServiceCategoriesClientProps {
  heading: string
  description: string
  categories: ServiceCategory[]
  className?: string
}

interface Subcategory {
  id?: string | null
  name: string
  slug: string
  icon?: (number | null) | Media
  description?: string | null
}

export const ServiceCategoriesClient: React.FC<ServiceCategoriesClientProps> = ({
  heading,
  description,
  categories,
  className,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  const handleCategoryClick = (category: ServiceCategory) => {
    setSelectedCategory(category)
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setSelectedCategory(null)
    setLoadedImages(new Set())
  }

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => new Set(prev).add(id))
  }

  const getIconUrl = (icon: (number | null) | Media | undefined): string | null => {
    if (!icon || typeof icon === 'number') return null
    return icon.url || null
  }

  const subcategories = (selectedCategory?.subcategory_level_1 as Subcategory[] | undefined) || []

  return (
    <>
      <div
        className={`flex flex-col gap-16 py-16 -px-4 sm:px-8 -ml-4 sm:-ml-8 w-[calc(100%+2rem)] sm:w-[calc(100%+4rem)] bg-background ${className || ''}`}
      >
        {/* Header Section */}
        <div className="flex flex-col gap-16 relative px-4 sm:px-8">
          {/* Header content */}
          <div className="text-center flex flex-col items-center gap-6">
            <div className="flex flex-col items-center">
              <TitleH2 align="center" title={heading} />
              <p className="text-muted-foreground max-w-2xl">{description}</p>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 px-4 sm:px-8 max-w-6xl mx-auto">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              onClick={() => handleCategoryClick(category)}
              index={index}
              total={categories.length}
            />
          ))}
        </div>
      </div>

      {/* Category Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <div className="mx-auto w-full max-w-3xl overflow-y-auto">
            <DrawerHeader className="relative">
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-4 rounded-full"
                  onClick={handleCloseDrawer}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>

              {/* Category icon and title */}
              <div className="flex flex-col items-center gap-4 pt-2">
                {selectedCategory && getIconUrl(selectedCategory.icon) && (
                  <div className="relative w-16 h-16 rounded-2xl bg-muted/50 p-3 border border-border/50">
                    {!loadedImages.has(`main-${selectedCategory.id}`) && (
                      <Skeleton className="absolute inset-0 rounded-2xl" />
                    )}
                    <Image
                      src={getIconUrl(selectedCategory.icon)!}
                      alt={selectedCategory.name}
                      fill
                      className={`object-contain p-2 dark:invert transition-opacity duration-200 ${!loadedImages.has(`main-${selectedCategory.id}`) ? 'opacity-0' : 'opacity-100'}`}
                      onLoad={() => handleImageLoad(`main-${selectedCategory.id}`)}
                    />
                  </div>
                )}
                <DrawerTitle className="font-normal">
                  <ParagraphLikeH3 align="center" title={selectedCategory?.name || ''} />
                </DrawerTitle>
                {selectedCategory?.description && (
                  <DrawerDescription className="text-center max-w-md">
                    {selectedCategory.description}
                  </DrawerDescription>
                )}
              </div>
            </DrawerHeader>

            {/* Main category button */}
            <div className="px-6 py-4">
              <Link href={`/ogloszenia?kategoria=${selectedCategory?.slug}#oferty`} passHref>
                <Button className="w-full gap-2" size="lg" onClick={handleCloseDrawer}>
                  Przeglądaj wszystkie w {selectedCategory?.name}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Subcategories section */}
            {subcategories.length > 0 && (
              <div className="px-6 pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-sm text-muted-foreground font-medium">Podkategorie</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {subcategories.map((subcategory) => {
                    const subcategoryIconUrl = getIconUrl(subcategory.icon)
                    return (
                      <Link
                        key={subcategory.id}
                        href={`/ogloszenia?kategoria=${selectedCategory?.slug}/${subcategory.slug}#oferty`}
                        onClick={handleCloseDrawer}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 hover:border-yellow-400/30 transition-all duration-200 group"
                      >
                        {subcategoryIconUrl && (
                          <div className="relative w-10 h-10 rounded-lg bg-background/50 p-2">
                            {!loadedImages.has(`sub-${subcategory.id}`) && (
                              <Skeleton className="absolute inset-0 rounded-lg" />
                            )}
                            <Image
                              src={subcategoryIconUrl}
                              alt={subcategory.name}
                              fill
                              className={`object-contain p-1 dark:invert group-hover:scale-110 transition-transform duration-200 ${!loadedImages.has(`sub-${subcategory.id}`) ? 'opacity-0' : 'opacity-100'}`}
                              onLoad={() => handleImageLoad(`sub-${subcategory.id}`)}
                            />
                          </div>
                        )}
                        <span className="text-sm font-medium text-center line-clamp-2">
                          {subcategory.name}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            <DrawerFooter className="pt-0">
              <DrawerClose asChild>
                <Button variant="outline" onClick={handleCloseDrawer}>
                  Zamknij
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

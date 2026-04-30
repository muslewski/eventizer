'use client'

import * as React from 'react'
import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'motion/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, ChevronLeft, Check, Search, RotateCcw, Briefcase, FolderIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategoryItem {
  id: string | number
  name: string
  slug: string
  description?: string | null
  icon?: { url?: string } | number | null
  subcategory_level_1?: CategoryItem[]
  subcategory_level_2?: CategoryItem[]
}

interface CategoryPickerProps {
  categories: CategoryItem[]
  value: string
  onChange: (value: string) => void
}

function CategoryIcon({ icon }: { icon?: { url?: string } | number | null }) {
  const [failed, setFailed] = useState(false)

  if (!failed && typeof icon === 'object' && icon?.url) {
    return (
      <Image
        src={icon.url}
        alt=""
        width={32}
        height={32}
        className="size-8 shrink-0 rounded-sm object-contain dark:invert"
        onError={() => setFailed(true)}
      />
    )
  }

  return <FolderIcon className="size-8 shrink-0 text-accent/60" />
}

// Card-sized spring used by AnimatedCard pattern.
const cardSpring = { type: 'spring' as const, stiffness: 300, damping: 24, mass: 0.8 }
// Snappier spring for small UI affordances.
const snappySpring = { type: 'spring' as const, stiffness: 400, damping: 28, mass: 0.6 }

export function CategoryPicker({ categories, value, onChange }: CategoryPickerProps) {
  const [selectedPath, setSelectedPath] = React.useState<CategoryItem[]>([])
  const [searchQuery, setSearchQuery] = React.useState('')
  // Direction the user is moving through the hierarchy. Determines whether the
  // outgoing list slides left (forward / drilling in) or right (back / reset).
  const [navDirection, setNavDirection] = React.useState<'forward' | 'backward'>('forward')
  const shouldReduceMotion = useReducedMotion()

  // Initialize from value if provided. Accepts either the modern slug path
  // ("muzyka/dj/dj-weselny") or legacy name path ("Muzyka > DJ > DJ Weselny")
  // so offers created before the format change still round-trip.
  React.useEffect(() => {
    if (value && selectedPath.length === 0) {
      const usesSlugPath = value.includes('/')
      const parts = usesSlugPath ? value.split('/') : value.split(' > ')
      if (parts.length > 0) {
        const path: CategoryItem[] = []
        let currentItems: CategoryItem[] = categories

        for (const part of parts) {
          const found =
            currentItems.find((c) => c.slug === part) ??
            currentItems.find((c) => c.name === part)
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
    setNavDirection('forward')
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
      // Emit the slug path so it matches getOfferCategories().fullPath, which
      // the offers beforeChange hook uses to look up categoryName/categorySlug.
      const categoryPath = newPath.map((c) => c.slug).join('/')
      onChange(categoryPath)
    }
  }

  const handleBreadcrumbClick = (index: number) => {
    setNavDirection('backward')
    const newPath = selectedPath.slice(0, index)
    setSelectedPath(newPath)
    setSearchQuery('')
    onChange('')
  }

  const resetSelection = () => {
    setNavDirection('backward')
    setSelectedPath([])
    setSearchQuery('')
    onChange('')
  }

  const filteredCategories = getCurrentCategories().filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // ===== Motion variants (no-op when reduced-motion is requested) =====

  const listContainerVariants: Variants = shouldReduceMotion
    ? {}
    : {
        enter: (dir: 'forward' | 'backward') => ({
          opacity: 0,
          x: dir === 'forward' ? 24 : -24,
        }),
        center: {
          opacity: 1,
          x: 0,
          transition: { ...snappySpring, staggerChildren: 0.03, delayChildren: 0.04 },
        },
        exit: (dir: 'forward' | 'backward') => ({
          opacity: 0,
          x: dir === 'forward' ? -24 : 24,
          transition: { duration: 0.18, ease: [0.25, 0.4, 0.25, 1] },
        }),
      }

  const itemVariants: Variants = shouldReduceMotion
    ? {}
    : {
        enter: { opacity: 0, y: 6, scale: 0.98 },
        center: { opacity: 1, y: 0, scale: 1, transition: snappySpring },
      }

  // ===== Single AnimatePresence wraps both views so transitions between
  // "selection complete" and "browsing" (and vice versa) animate. =====

  const viewKey = isSelectionComplete() ? 'complete' : 'browsing'

  return (
    <AnimatePresence mode="wait" initial={false} custom={navDirection}>
      {viewKey === 'complete' ? (
        <motion.div
          key="complete"
          custom={navDirection}
          className="flex flex-col gap-3"
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={
            shouldReduceMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.96, y: -8, transition: { duration: 0.18, ease: [0.25, 0.4, 0.25, 1] } }
          }
          transition={cardSpring}
        >
          <motion.div
            className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3"
            initial="enter"
            animate="center"
            variants={
              shouldReduceMotion
                ? {}
                : {
                    enter: { transition: { staggerChildren: 0 } },
                    center: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
                  }
            }
          >
            {selectedPath.map((category, index) => (
              <React.Fragment key={category.id}>
                <motion.div
                  variants={
                    shouldReduceMotion
                      ? {}
                      : {
                          enter: { opacity: 0, y: -6, scale: 0.9 },
                          center: { opacity: 1, y: 0, scale: 1, transition: snappySpring },
                        }
                  }
                >
                  <Badge
                    variant="outline"
                    className="border-primary/40 px-3 py-1.5 text-sm font-medium text-primary"
                  >
                    {category.name}
                  </Badge>
                </motion.div>
                {index < selectedPath.length - 1 && (
                  <motion.span
                    variants={
                      shouldReduceMotion
                        ? {}
                        : {
                            enter: { opacity: 0, x: -4 },
                            center: { opacity: 1, x: 0, transition: snappySpring },
                          }
                    }
                    className="inline-flex"
                  >
                    <ChevronRight className="size-4 text-primary/60" />
                  </motion.span>
                )}
              </React.Fragment>
            ))}
          </motion.div>
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
        </motion.div>
      ) : (
        <BrowsingView
          key="browsing"
          shouldReduceMotion={shouldReduceMotion}
          navDirection={navDirection}
          selectedPath={selectedPath}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentLevel={currentLevel}
          filteredCategories={filteredCategories}
          listContainerVariants={listContainerVariants}
          itemVariants={itemVariants}
          handleCategorySelect={handleCategorySelect}
          handleBreadcrumbClick={handleBreadcrumbClick}
        />
      )}
    </AnimatePresence>
  )
}

// ===== Browsing view extracted as a child component so we can mount/unmount
// it cleanly inside AnimatePresence (the parent decides which variant key to
// render — both branches now animate when toggled). =====

interface BrowsingViewProps {
  shouldReduceMotion: boolean | null
  navDirection: 'forward' | 'backward'
  selectedPath: CategoryItem[]
  searchQuery: string
  setSearchQuery: (q: string) => void
  currentLevel: number
  filteredCategories: CategoryItem[]
  listContainerVariants: Variants
  itemVariants: Variants
  handleCategorySelect: (c: CategoryItem) => void
  handleBreadcrumbClick: (i: number) => void
}

function BrowsingView({
  shouldReduceMotion,
  navDirection,
  selectedPath,
  searchQuery,
  setSearchQuery,
  currentLevel,
  filteredCategories,
  listContainerVariants,
  itemVariants,
  handleCategorySelect,
  handleBreadcrumbClick,
}: BrowsingViewProps) {
  return (
    <motion.div
      className="flex flex-col gap-3"
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={
        shouldReduceMotion
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.98, y: -8, transition: { duration: 0.18, ease: [0.25, 0.4, 0.25, 1] } }
      }
      transition={snappySpring}
    >
      {/* Breadcrumb path */}
      <AnimatePresence initial={false}>
        {selectedPath.length > 0 && (
          <motion.div
            key="breadcrumb"
            layout
            className="flex flex-wrap items-center gap-2 rounded-lg border p-3"
            initial={shouldReduceMotion ? false : { opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, height: 0 }}
            transition={snappySpring}
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back button + Search */}
      <motion.div layout className="flex items-center gap-2">
        <AnimatePresence initial={false}>
          {selectedPath.length > 0 && (
            <motion.div
              key="back-button"
              initial={shouldReduceMotion ? false : { opacity: 0, x: -8, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 'auto' }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -8, width: 0 }}
              transition={snappySpring}
              className="overflow-hidden"
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleBreadcrumbClick(selectedPath.length - 1)}
                className="shrink-0"
              >
                <ChevronLeft data-icon="inline-start" />
                Wstecz
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Szukaj kategorii..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Category list — slides between levels and stagger-fades items in */}
      <AnimatePresence mode="wait" initial={false} custom={navDirection}>
        <motion.div
          key={`level-${currentLevel}-${searchQuery}`}
          custom={navDirection}
          variants={listContainerVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
        >
          {filteredCategories.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="col-span-full py-8 text-center text-muted-foreground"
            >
              <Briefcase className="mx-auto mb-2 size-6 opacity-50" />
              <p className="text-sm font-medium">Nie znaleziono kategorii</p>
            </motion.div>
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
                <motion.button
                  type="button"
                  key={category.id}
                  variants={itemVariants}
                  whileHover={
                    shouldReduceMotion ? undefined : { y: -2, transition: snappySpring }
                  }
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm transition-colors',
                    'bg-background border border-border/20 hover:border-accent/30 hover:bg-accent/5 hover:shadow-sm',
                  )}
                  onClick={() => handleCategorySelect(category)}
                >
                  <CategoryIcon icon={category.icon} />
                  <div className="min-w-0 flex-1">
                    <span className="truncate font-medium block">{category.name}</span>
                    {category.description && (
                      <span className="text-xs text-muted-foreground line-clamp-2 mt-0.5 block">{category.description}</span>
                    )}
                  </div>
                  {hasSubcategories ? (
                    <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <Check className="size-3.5 shrink-0 text-accent" />
                  )}
                </motion.button>
              )
            })
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

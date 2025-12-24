'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useField } from '@payloadcms/ui'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Crown,
  Folder,
  FolderOpen,
  Lock,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

import type { CategoryOption, UserPlanInfo } from '@/actions/getOfferCategories'
import type { TextFieldClientProps } from 'payload'

interface OfferCategorySelectClientProps extends TextFieldClientProps {
  categories: CategoryOption[]
  userPlanInfo: UserPlanInfo | null
  error?: string
}

export const OfferCategorySelectClient: React.FC<OfferCategorySelectClientProps> = (props) => {
  const { path, field, categories, userPlanInfo, error } = props
  const { value, setValue } = useField<string>({ path })
  const [open, setOpen] = useState(false)
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())

  // Set default value on mount if not already set
  useEffect(() => {
    if (!value && userPlanInfo?.userDefaultCategory) {
      const defaultCat = categories.find(
        (cat) => cat.fullPath === userPlanInfo.userDefaultCategory && cat.isAvailable,
      )
      if (defaultCat) {
        setValue(defaultCat.fullPath)
      }
    }
  }, [value, setValue, userPlanInfo, categories])

  // Auto-expand parent paths of the selected category
  useEffect(() => {
    if (value) {
      const parts = value.split('/')
      const paths = new Set<string>()
      let currentPath = ''
      for (let i = 0; i < parts.length - 1; i++) {
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i]
        paths.add(currentPath)
      }
      setExpandedPaths(paths)
    }
  }, [value])

  // Organize categories into a tree structure for rendering
  const { rootCategories, categoryMap, availableCount, lockedCount } = useMemo(() => {
    const roots: CategoryOption[] = []
    const map = new Map<string, CategoryOption>()
    let available = 0
    let locked = 0

    categories.forEach((cat) => {
      map.set(cat.fullPath, cat)
      if (cat.depth === 0) {
        roots.push(cat)
      }
      if (cat.isAvailable) {
        available++
      } else {
        locked++
      }
    })

    return {
      rootCategories: roots,
      categoryMap: map,
      availableCount: available,
      lockedCount: locked,
    }
  }, [categories])

  const handleSelect = (category: CategoryOption) => {
    if (!category.isAvailable) {
      return
    }
    setValue(category.fullPath)
    setOpen(false)
  }

  const toggleExpand = (e: React.MouseEvent, path: string) => {
    e.stopPropagation()
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const selectedCategory = categories.find((cat) => cat.fullPath === value)

  // Validate that the current value is still available
  useEffect(() => {
    if (value && selectedCategory && !selectedCategory.isAvailable) {
      const defaultCat = categories.find(
        (cat) => cat.fullPath === userPlanInfo?.userDefaultCategory && cat.isAvailable,
      )
      if (defaultCat) {
        setValue(defaultCat.fullPath)
      } else {
        const firstAvailable = categories.find((cat) => cat.isAvailable)
        if (firstAvailable) {
          setValue(firstAvailable.fullPath)
        } else {
          setValue('')
        }
      }
    }
  }, [value, selectedCategory, userPlanInfo, categories, setValue])

  // Check if a category or any of its descendants has available options
  const hasAvailableDescendants = useMemo(() => {
    const cache = new Map<string, boolean>()

    const checkDescendants = (category: CategoryOption): boolean => {
      if (cache.has(category.fullPath)) {
        return cache.get(category.fullPath)!
      }

      // If this category itself is available, return true
      if (category.isAvailable) {
        cache.set(category.fullPath, true)
        return true
      }

      // Check if any child has available descendants
      const hasAvailable = category.children.some((child) => checkDescendants(child))
      cache.set(category.fullPath, hasAvailable)
      return hasAvailable
    }

    // Build the cache for all categories
    categories.forEach((cat) => {
      if (cat.depth === 0) {
        checkDescendants(cat)
      }
    })

    return cache
  }, [categories])

  const label = typeof field.label === 'object' ? field.label.pl : field.label
  const description =
    typeof field.admin?.description === 'object'
      ? field.admin.description.pl
      : field.admin?.description

  if (error) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">{label}</label>
        <Alert variant="destructive">
          <AlertDescription>Nie udało się załadować kategorii. Odśwież stronę.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const getPlanIcon = (level: number) => {
    if (level >= 3) return <Crown className="h-3 w-3" />
    if (level >= 2) return <Zap className="h-3 w-3" />
    if (level >= 1) return <Sparkles className="h-3 w-3" />
    return null
  }

  const getPlanColor = (level: number) => {
    if (level >= 3)
      return 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800'
    if (level >= 2)
      return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800'
    if (level >= 1)
      return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800'
    return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-950/50 dark:text-gray-400 dark:border-gray-800'
  }

  // Render a category item with its children
  const renderCategory = (category: CategoryOption) => {
    const hasChildren = category.children.length > 0
    const isExpanded = expandedPaths.has(category.fullPath)
    const isSelected = category.fullPath === value
    const hasAvailableChildren = hasAvailableDescendants.get(category.fullPath) || false

    // Determine if we should show expand/collapse functionality
    // Show if has children AND (category is available OR has available descendants)
    const showExpandCollapse = hasChildren && (category.isAvailable || hasAvailableChildren)

    // Only truly disable if not available AND no available children
    const isFullyLocked = !category.isAvailable && !hasAvailableChildren

    return (
      <div key={category.fullPath}>
        <CommandItem
          value={category.fullName}
          onSelect={() => handleSelect(category)}
          disabled={isFullyLocked}
          className={cn(
            'flex items-center gap-2 py-2 cursor-pointer',
            isFullyLocked && 'opacity-50 cursor-not-allowed',
            !category.isAvailable && hasAvailableChildren && 'opacity-75',
            isSelected && 'bg-primary/10',
            category.isUserDefault && 'border-l-2 border-l-amber-500',
          )}
          style={{ paddingLeft: `${category.depth * 16 + 8}px` }}
        >
          {/* Expand/Collapse button for categories with children that have available options */}
          {showExpandCollapse ? (
            <Button
              variant="outline"
              type="button"
              size="icon-sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleExpand(e, category.fullPath)
              }}
              className="p-0.5 rounded hover:bg-accent"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </Button>
          ) : hasChildren ? (
            // Has children but none are available - show disabled indicator
            <span className="w-4 flex items-center justify-center">
              <Lock className="h-3 w-3 text-muted-foreground/50" />
            </span>
          ) : (
            <span className="w-4" /> // Spacer for alignment
          )}

          {/* Folder icon */}
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
          )}

          {/* Category name and info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'font-medium truncate',
                  isSelected && 'text-primary',
                  !category.isAvailable && 'text-muted-foreground',
                )}
              >
                {category.name}
              </span>
              {category.isUserDefault && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800"
                >
                  <Star className="h-2.5 w-2.5 mr-0.5 fill-amber-500" />
                  Domyślna
                </Badge>
              )}
              {/* Show indicator if locked but has available children */}
              {!category.isAvailable && hasAvailableChildren && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800"
                >
                  <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                  Dostępne opcje
                </Badge>
              )}
            </div>
          </div>

          {/* Plan requirement badge */}
          {category.requiredPlanLevel > 0 && (
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] font-medium shrink-0 gap-1',
                getPlanColor(category.requiredPlanLevel),
              )}
            >
              {!category.isAvailable && <Lock className="h-2.5 w-2.5" />}
              {getPlanIcon(category.requiredPlanLevel)}
              {category.requiredPlanName}
            </Badge>
          )}

          {/* Selection indicator */}
          {isSelected && category.isAvailable && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-3 w-3" />
            </div>
          )}
        </CommandItem>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="border-l border-border/50 ml-4">
            {category.children.map((child) => renderCategory(child))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">
            {label}
            {field.required && <span className="ml-1 text-red-500">*</span>}
          </label>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>

        {userPlanInfo && userPlanInfo.currentPlanLevel > 0 && (
          <div
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
              getPlanColor(userPlanInfo.currentPlanLevel),
            )}
          >
            {getPlanIcon(userPlanInfo.currentPlanLevel)}
            <span>{userPlanInfo.currentPlanName}</span>
          </div>
        )}
      </div>

      {/* Category Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between h-auto min-h-[48px] px-4 py-3',
              'bg-background hover:bg-accent/50 transition-colors',
              !selectedCategory && 'text-muted-foreground',
            )}
          >
            {selectedCategory ? (
              <div className="flex items-center gap-3 text-left">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg',
                    selectedCategory.isAvailable
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {selectedCategory.children.length > 0 ? (
                    <Folder className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedCategory.name}</span>
                  </div>
                  {selectedCategory.depth > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {selectedCategory.fullName.split(' → ').slice(0, -1).join(' → ')}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <span>Wybierz kategorię dla swojej oferty...</span>
            )}
            <ChevronDown
              className={cn(
                'ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200',
                open && 'rotate-180',
              )}
            />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          sideOffset={4}
        >
          <Command className="rounded-lg border-0">
            <CommandInput placeholder="Szukaj kategorii..." className="border-b" />
            <CommandList className="max-h-[400px]">
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                Nie znaleziono kategorii.
              </CommandEmpty>

              {/* Stats header */}
              <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                <span className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{availableCount}</span> dostępnych
                </span>
                {lockedCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    <span className="font-medium">{lockedCount}</span> zablokowanych
                  </span>
                )}
              </div>

              {/* Category Tree */}
              <CommandGroup>
                {rootCategories.map((category) => renderCategory(category))}
              </CommandGroup>

              {/* Upgrade Banner */}
              {userPlanInfo && lockedCount > 0 && (
                <>
                  <CommandSeparator />
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                          Odblokuj więcej kategorii
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Ulepsz swój plan, aby uzyskać dostęp do {lockedCount} dodatkowych
                          kategorii
                        </p>
                      </div>
                      <Link href="/app/onboarding/service-provider?edit=true">
                        <Button size="sm" className="shrink-0">
                          <Crown className="mr-1.5 h-3.5 w-3.5" />
                          Ulepsz
                        </Button>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Warning if no categories available */}
      {availableCount === 0 && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50">
          <Crown className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Brak dostępnych kategorii w Twoim obecnym planie.{' '}
            <Link
              href="/app/onboarding/service-provider?edit=true"
              className="font-medium underline underline-offset-2 hover:text-amber-900"
            >
              Ulepsz swoją subskrypcję
            </Link>
            , aby uzyskać dostęp do kategorii.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default OfferCategorySelectClient

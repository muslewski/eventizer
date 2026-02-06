'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
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
  Tag,
  ArrowUpRight,
  CircleDot,
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import type { CategoryOption, UserPlanInfo } from '@/actions/getOfferCategories'
import type { TextFieldClientProps } from 'payload'

interface OfferCategorySelectClientProps extends TextFieldClientProps {
  categories: CategoryOption[]
  userPlanInfo: UserPlanInfo | null
  error?: string
}

export const OfferCategorySelectClient: React.FC<OfferCategorySelectClientProps> = (props) => {
  const { path, field, categories, userPlanInfo, error } = props
  const { value, setValue, initialValue } = useField<string>({ path })
  const [open, setOpen] = useState(false)
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const hasSetInitialValue = useRef(false)

  // Set default value on mount if not already set (only once)
  useEffect(() => {
    // Only set default once
    if (hasSetInitialValue.current) return

    // Wait until categories are loaded
    if (categories.length === 0) return

    // If there's an existing value from the database (editing), don't override
    if (initialValue) {
      hasSetInitialValue.current = true
      return
    }

    // If value is already set (somehow), don't override
    if (value) {
      hasSetInitialValue.current = true
      return
    }

    // Use a microtask to ensure form is ready
    const setDefaultValue = () => {
      // Set the user's default category if available
      if (userPlanInfo?.userDefaultCategory) {
        const defaultCat = categories.find(
          (cat) => cat.fullPath === userPlanInfo.userDefaultCategory && cat.isAvailable,
        )
        if (defaultCat) {
          setValue(defaultCat.fullPath)
          hasSetInitialValue.current = true
          return
        }
      }

      // Fallback: set first available category if no default
      const firstAvailable = categories.find((cat) => cat.isAvailable)
      if (firstAvailable) {
        setValue(firstAvailable.fullPath)
      }
      hasSetInitialValue.current = true
    }

    // Small timeout to ensure form is initialized
    const timeoutId = setTimeout(setDefaultValue, 0)
    return () => clearTimeout(timeoutId)
  }, [value, setValue, userPlanInfo, categories, initialValue])

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
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <Tag className="h-5 w-5 text-destructive" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-destructive">{label}</p>
              <p className="text-sm text-muted-foreground">
                Nie udało się załadować kategorii. Odśwież stronę, aby spróbować ponownie.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getPlanIcon = (level: number) => {
    if (level >= 3) return <Crown className="h-3.5 w-3.5" />
    if (level >= 2) return <Zap className="h-3.5 w-3.5" />
    if (level >= 1) return <Sparkles className="h-3.5 w-3.5" />
    return null
  }

  const getPlanColor = (level: number) => {
    if (level >= 3)
      return 'text-purple-600 bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200/80 dark:from-purple-950/60 dark:to-violet-950/60 dark:text-purple-300 dark:border-purple-700/50'
    if (level >= 2)
      return 'text-blue-600 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200/80 dark:from-blue-950/60 dark:to-cyan-950/60 dark:text-blue-300 dark:border-blue-700/50'
    if (level >= 1)
      return 'text-emerald-600 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200/80 dark:from-emerald-950/60 dark:to-teal-950/60 dark:text-emerald-300 dark:border-emerald-700/50'
    return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-950/50 dark:text-gray-400 dark:border-gray-800'
  }

  const getPlanBadgeStyle = (level: number) => {
    if (level >= 3)
      return 'bg-gradient-to-r from-purple-500 to-violet-500 text-white border-0 shadow-sm shadow-purple-500/25'
    if (level >= 2)
      return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-sm shadow-blue-500/25'
    if (level >= 1)
      return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-sm shadow-emerald-500/25'
    return ''
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
      <div key={category.fullPath} className="animate-in fade-in-50 duration-150">
        <CommandItem
          value={category.fullName}
          onSelect={() => handleSelect(category)}
          disabled={isFullyLocked}
          className={cn(
            'group flex items-center gap-3 py-2.5 px-3 cursor-pointer rounded-lg mx-1 my-0.5 transition-all duration-200',
            isFullyLocked && 'opacity-40 cursor-not-allowed',
            !category.isAvailable && hasAvailableChildren && 'opacity-70',
            isSelected &&
              'bg-primary/10 ring-1 ring-primary/20 shadow-sm dark:bg-primary/20 dark:ring-primary/30',
            !isSelected && 'hover:bg-accent/60',
            category.isUserDefault && 'border-l-3 border-l-accent rounded-l-none',
          )}
          style={{ paddingLeft: `${category.depth * 20 + 12}px` }}
        >
          {/* Expand/Collapse button for categories with children that have available options */}
          {showExpandCollapse ? (
            <Button
              variant="outline"
              type="button"
              size="icon"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleExpand(e, category.fullPath)
              }}
              className="h-6 w-6 p-0 rounded-md hover:bg-accent transition-transform duration-200"
            >
              <ChevronRight
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform duration-200',
                  isExpanded && 'rotate-90',
                )}
              />
            </Button>
          ) : hasChildren ? (
            // Has children but none are available - show disabled indicator
            <span className="flex h-6 w-6 items-center justify-center">
              <Lock className="h-3.5 w-3.5 text-muted-foreground/40" />
            </span>
          ) : (
            <span className="w-6" /> // Spacer for alignment
          )}

          {/* Folder/Item icon */}
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
              hasChildren
                ? isExpanded
                  ? 'bg-accent/10 text-accent-foreground dark:bg-accent/20 dark:text-accent'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                : isSelected
                  ? 'bg-primary/15 text-primary dark:bg-primary/25'
                  : 'bg-muted text-muted-foreground group-hover:bg-accent',
            )}
          >
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4" />
              ) : (
                <Folder className="h-4 w-4" />
              )
            ) : (
              <CircleDot className="h-4 w-4" />
            )}
          </div>

          {/* Category name and info */}
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'font-medium truncate transition-colors',
                  isSelected && 'text-primary dark:text-primary',
                  !category.isAvailable && !isSelected && 'text-muted-foreground',
                )}
              >
                {category.name}
              </span>
              {category.isUserDefault && (
                <Badge className="text-[10px] px-1.5 py-0 h-5 bg-gradient-to-r from-accent to-accent-foreground text-white border-0 shadow-sm">
                  <Star className="h-2.5 w-2.5 mr-1 fill-white" />
                  Domyślna
                </Badge>
              )}
              {/* Show indicator if locked but has available children */}
              {!category.isAvailable && hasAvailableChildren && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-5 bg-emerald-50/80 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-700"
                >
                  <Sparkles className="h-2.5 w-2.5 mr-1" />
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
                'text-[10px] font-semibold shrink-0 gap-1.5 px-2 py-0.5 h-5',
                !category.isAvailable
                  ? 'bg-muted/80 text-muted-foreground border-muted-foreground/20'
                  : getPlanBadgeStyle(category.requiredPlanLevel),
              )}
            >
              {!category.isAvailable && <Lock className="h-2.5 w-2.5" />}
              {getPlanIcon(category.requiredPlanLevel)}
              {category.requiredPlanName}
            </Badge>
          )}

          {/* Selection indicator */}
          {isSelected && category.isAvailable && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </div>
          )}
        </CommandItem>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="relative ml-6 pl-2 border-l-2 border-border/40 dark:border-border/30">
            {category.children.map((child) => renderCategory(child))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3 mb-6">
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
            <CommandInput placeholder="Szukaj kategorii..." className="border-none" />
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
                  <div className="bg-gradient-to-r from-accent/5 to-accent/10 dark:from-accent/10 dark:to-accent/15 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-accent-foreground dark:text-accent">
                          Odblokuj więcej kategorii
                        </p>
                        <p className="text-xs text-accent-foreground/70 dark:text-accent/70">
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
        <Alert className="border-accent/40 bg-accent/5 dark:border-accent/30 dark:bg-accent/10">
          <Crown className="h-4 w-4 text-accent-foreground" />
          <AlertDescription className="text-accent-foreground dark:text-accent">
            Brak dostępnych kategorii w Twoim obecnym planie.{' '}
            <Link
              href="/app/onboarding/service-provider?edit=true"
              className="font-medium underline underline-offset-2 hover:text-accent-foreground/80"
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

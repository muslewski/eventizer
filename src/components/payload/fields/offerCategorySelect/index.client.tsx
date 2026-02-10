'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useField } from '@payloadcms/ui'
import { Check, ChevronDown, ChevronRight, Crown, Lock, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

import type { CategoryOption, UserPlanInfo } from '@/actions/getOfferCategories'
import type { TextFieldClientProps } from 'payload'

interface OfferCategorySelectClientProps extends TextFieldClientProps {
  categories: CategoryOption[]
  userPlanInfo: UserPlanInfo | null
  error?: string
}

/** Renders the category icon image with dark:invert, or nothing if no icon */
const CategoryIcon: React.FC<{
  iconUrl: string | null
  name: string
  className?: string
}> = ({ iconUrl, name, className }) => {
  if (!iconUrl) return null
  return (
    <Image
      src={iconUrl}
      alt={name}
      width={28}
      height={28}
      className={cn('shrink-0 dark:invert', className)}
    />
  )
}

export const OfferCategorySelectClient: React.FC<OfferCategorySelectClientProps> = (props) => {
  const { path, field, categories, userPlanInfo, error } = props
  const { value, setValue, initialValue } = useField<string>({ path })
  const [open, setOpen] = useState(false)
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const hasSetInitialValue = useRef(false)

  // Set default value on mount (once)
  useEffect(() => {
    if (hasSetInitialValue.current || categories.length === 0) return
    if (initialValue || value) {
      hasSetInitialValue.current = true
      return
    }

    const timeoutId = setTimeout(() => {
      const defaultCat =
        categories.find(
          (c) => c.fullPath === userPlanInfo?.userDefaultCategory && c.isAvailable,
        ) ?? categories.find((c) => c.isAvailable)

      if (defaultCat) setValue(defaultCat.fullPath)
      hasSetInitialValue.current = true
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [value, setValue, userPlanInfo, categories, initialValue])

  // Auto-expand ancestors of the selected value
  useEffect(() => {
    if (!value) return
    const parts = value.split('/')
    const paths = new Set<string>()
    let cur = ''
    for (let i = 0; i < parts.length - 1; i++) {
      cur = cur ? `${cur}/${parts[i]}` : parts[i]
      paths.add(cur)
    }
    setExpandedPaths(paths)
  }, [value])

  // Derived data
  const { rootCategories, availableCount, lockedCount } = useMemo(() => {
    const roots: CategoryOption[] = []
    let available = 0
    let locked = 0
    for (const cat of categories) {
      if (cat.depth === 0) roots.push(cat)
      cat.isAvailable ? available++ : locked++
    }
    return { rootCategories: roots, availableCount: available, lockedCount: locked }
  }, [categories])

  const hasAvailableDescendants = useMemo(() => {
    const cache = new Map<string, boolean>()
    const check = (cat: CategoryOption): boolean => {
      if (cache.has(cat.fullPath)) return cache.get(cat.fullPath)!
      const result = cat.isAvailable || cat.children.some(check)
      cache.set(cat.fullPath, result)
      return result
    }
    categories.filter((c) => c.depth === 0).forEach(check)
    return cache
  }, [categories])

  const selectedCategory = categories.find((c) => c.fullPath === value)

  // Reset value if current selection became unavailable
  useEffect(() => {
    if (!value || !selectedCategory || selectedCategory.isAvailable) return
    const fallback =
      categories.find(
        (c) => c.fullPath === userPlanInfo?.userDefaultCategory && c.isAvailable,
      ) ?? categories.find((c) => c.isAvailable)
    setValue(fallback?.fullPath ?? '')
  }, [value, selectedCategory, userPlanInfo, categories, setValue])

  // Handlers
  const handleSelect = (cat: CategoryOption) => {
    if (!cat.isAvailable) return
    setValue(cat.fullPath)
    setOpen(false)
  }

  const toggleExpand = (e: React.MouseEvent, catPath: string) => {
    e.preventDefault()
    e.stopPropagation()
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      next.has(catPath) ? next.delete(catPath) : next.add(catPath)
      return next
    })
  }

  // Labels
  const label = typeof field.label === 'object' ? field.label.pl : field.label
  const description =
    typeof field.admin?.description === 'object'
      ? field.admin.description.pl
      : field.admin?.description

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          <span className="font-medium">{label}</span> — Nie udało się załadować kategorii.
          Odśwież stronę, aby spróbować ponownie.
        </AlertDescription>
      </Alert>
    )
  }

  // Whether we're actively searching
  const isSearching = searchQuery.trim().length > 0

  // Render a single category row
  const renderCategory = (cat: CategoryOption) => {
    const hasChildren = cat.children.length > 0
    const isExpanded = expandedPaths.has(cat.fullPath)
    const showChildren = hasChildren && (isSearching || isExpanded)
    const isSelected = cat.fullPath === value
    const reachable = hasAvailableDescendants.get(cat.fullPath) ?? false
    const isFullyLocked = !cat.isAvailable && !reachable
    const availableChildCount = hasChildren
      ? cat.children.filter((c) => c.isAvailable || (hasAvailableDescendants.get(c.fullPath) ?? false)).length
      : 0

    return (
      <div key={cat.fullPath}>
        <CommandItem
          value={cat.fullName}
          onSelect={() => handleSelect(cat)}
          disabled={isFullyLocked}
          className={cn(
            'flex items-center gap-3 py-2.5 px-3 cursor-pointer rounded-md mx-1 my-0.5',
            isFullyLocked && 'opacity-40 cursor-not-allowed',
            !cat.isAvailable && reachable && 'opacity-60',
            isSelected && 'bg-primary/10 dark:bg-primary/20',
          )}
          style={{ paddingLeft: `${cat.depth * 20 + 12}px` }}
        >
          {/* Expand / collapse toggle */}
          {hasChildren && (cat.isAvailable || reachable) ? (
            <button
              type="button"
              onClick={(e) => toggleExpand(e, cat.fullPath)}
              className={cn(
                'flex items-center gap-1 h-6 rounded-full px-1.5 transition-colors',
                'border border-border/60 hover:border-primary/40 hover:bg-accent',
                isExpanded && 'bg-accent/60 border-primary/30',
              )}
            >
              <ChevronRight
                className={cn(
                  'h-3.5 w-3.5 transition-transform duration-200 text-muted-foreground',
                  isExpanded && 'rotate-90 text-primary',
                )}
              />
              <span className={cn(
                'text-[10px] font-medium tabular-nums pr-0.5',
                isExpanded ? 'text-primary' : 'text-muted-foreground',
              )}>
                {availableChildCount}
              </span>
            </button>
          ) : (
            <span className="w-6 flex items-center justify-center">
              {hasChildren && <Lock className="h-3 w-3 text-muted-foreground/40" />}
            </span>
          )}

          {/* Category icon */}
          <CategoryIcon iconUrl={cat.iconUrl} name={cat.name} className="h-7 w-7" />

          {/* Name + badges */}
          <span
            className={cn(
              'flex-1 truncate text-sm',
              isSelected && 'font-medium text-primary',
              !cat.isAvailable && !isSelected && 'text-muted-foreground',
            )}
          >
            {cat.name}
          </span>

          {cat.isUserDefault && (
            <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0 h-5">
              <Star className="h-2.5 w-2.5" />
              Domyślna
            </Badge>
          )}

          {cat.requiredPlanLevel > 0 && (
            <Badge
              variant={cat.isAvailable ? 'default' : 'outline'}
              className={cn(
                'text-[10px] gap-1 px-1.5 py-0 h-5',
                !cat.isAvailable && 'opacity-60',
              )}
            >
              {!cat.isAvailable && <Lock className="h-2.5 w-2.5" />}
              {cat.requiredPlanName}
            </Badge>
          )}

          {isSelected && cat.isAvailable && <Check className="h-4 w-4 text-primary shrink-0" />}
        </CommandItem>

        {/* Children — always visible when searching, otherwise only when expanded */}
        {showChildren && (
          <div className="ml-5 border-l border-border/40">
            {cat.children.map(renderCategory)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2 mb-6">
      {/* Label */}
      <div className="flex items-center justify-between gap-4">
        <label className="text-sm font-medium">
          {label}
          {field.required && <span className="ml-1 text-destructive">*</span>}
        </label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>

      {/* Dialog trigger */}
      <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (!isOpen) setSearchQuery('')
        }}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between h-auto min-h-[48px] px-4 py-2.5',
              !selectedCategory && 'text-muted-foreground',
            )}
          >
            {selectedCategory ? (
              <div className="flex items-center gap-3 text-left min-w-0">
                <CategoryIcon
                  iconUrl={selectedCategory.iconUrl}
                  name={selectedCategory.name}
                  className="h-7 w-7"
                />
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate">{selectedCategory.name}</span>
                  {selectedCategory.depth > 0 && (
                    <span className="text-xs text-muted-foreground truncate">
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
                'ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform',
                open && 'rotate-180',
              )}
            />
          </Button>
        </DialogTrigger>

        <DialogContent className="p-0 gap-0 max-h-[85vh] flex flex-col">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="text-base">{label}</DialogTitle>
            {/* Stats */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
              <span>
                <span className="font-medium text-foreground">{availableCount}</span> dostępnych
              </span>
              {lockedCount > 0 && (
                <span>
                  <span className="font-medium">{lockedCount}</span> zablokowanych
                </span>
              )}
            </div>
          </DialogHeader>

          <Command className="border-0 rounded-none flex-1 overflow-hidden">
            <CommandInput
              placeholder="Szukaj kategorii..."
              className="border-x-0 border-t-0"
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList className="flex-1 max-h-none overflow-y-auto">
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                Nie znaleziono kategorii.
              </CommandEmpty>

              <CommandGroup>{rootCategories.map(renderCategory)}</CommandGroup>

              {/* Upgrade prompt */}
              {userPlanInfo && lockedCount > 0 && (
                <>
                  <CommandSeparator />
                  <div className="flex items-center justify-between gap-3 p-3">
                    <p className="text-xs text-muted-foreground">
                      Odblokuj <span className="font-medium">{lockedCount}</span> kategorii
                    </p>
                    <Link href="/app/onboarding/service-provider?edit=true">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                        <Crown className="h-3 w-3" />
                        Ulepsz plan
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      {/* No categories alert */}
      {availableCount === 0 && (
        <Alert>
          <Crown className="h-4 w-4" />
          <AlertDescription>
            Brak dostępnych kategorii w Twoim obecnym planie.{' '}
            <Link
              href="/app/onboarding/service-provider?edit=true"
              className="font-medium underline underline-offset-2"
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

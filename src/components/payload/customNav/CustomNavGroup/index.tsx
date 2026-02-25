'use client'

import React, { FC, ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

type Props = {
  children: ReactNode
  isOpen: boolean
  label: string
  onToggle: (isOpen: boolean) => void
}

export const CustomNavGroup: FC<Props> = ({ children, isOpen = true, label, onToggle }) => {
  const [open, setOpen] = useState(isOpen)

  useEffect(() => {
    setOpen(isOpen)
  }, [isOpen])

  const handleToggle = () => {
    const newOpen = !open
    setOpen(newOpen)
    onToggle(newOpen)
  }

  return (
    <div className="nav-group mb-2 relative">
      <button
        type="button"
        onClick={handleToggle}
        className="group flex items-center gap-1 cursor-pointer px-1 py-1 rounded-lg transition-colors duration-200 bg-background border-0 hover:bg-accent/5 w-full"
      >
        <div className="h-7 w-7 shrink-0 flex items-center justify-center rounded-md transition-all duration-200">
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              !open && '-rotate-90',
              !open ? 'text-muted-foreground' : 'text-accent',
            )}
          />
        </div>
        <span
          className={cn(
            'text-sm font-medium truncate transition-colors duration-200',
            !open ? 'text-muted-foreground' : 'text-accent-foreground dark:text-accent',
            'group-hover:text-accent dark:group-hover:text-accent',
          )}
        >
          {label}
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-0.5 py-1.5 pl-2 border-l-2 border-accent/20 ml-4">
          {children}
        </div>
      )}
    </div>
  )
}

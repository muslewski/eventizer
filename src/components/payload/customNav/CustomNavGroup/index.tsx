'use client'

import { Collapsible } from '@payloadcms/ui'
import React, { FC, ReactNode, useEffect, useState } from 'react'

type Props = {
  children: ReactNode
  isOpen: boolean
  label: string
  onToggle: (isOpen: boolean) => void
}

export const CustomNavGroup: FC<Props> = ({ children, isOpen = true, label, onToggle }) => {
  const [collapsed, setCollapsed] = useState(!isOpen)

  // Update collapsed state when isOpen prop changes
  useEffect(() => {
    setCollapsed(!isOpen)
  }, [isOpen])

  const handleToggle = (newCollapsed: boolean) => {
    setCollapsed(newCollapsed)
    onToggle(!newCollapsed)
  }

  return (
    <Collapsible
      className="nav-group"
      isCollapsed={collapsed}
      collapsibleStyle="default"
      header={<span className="nav-group__label">{label}</span>}
      onToggle={handleToggle}
    >
      {children}
    </Collapsible>
  )
}

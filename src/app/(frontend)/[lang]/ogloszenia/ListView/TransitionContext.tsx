'use client'

import { createContext, useContext, useTransition, type TransitionStartFunction } from 'react'

interface ListViewTransitionContextValue {
  isPending: boolean
  startTransition: TransitionStartFunction
}

const ListViewTransitionContext = createContext<ListViewTransitionContextValue>({
  isPending: false,
  startTransition: (fn) => fn(),
})

export function ListViewTransitionProvider({ children }: { children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition()

  return (
    <ListViewTransitionContext.Provider value={{ isPending, startTransition }}>
      {children}
    </ListViewTransitionContext.Provider>
  )
}

export function useListViewTransition() {
  return useContext(ListViewTransitionContext)
}

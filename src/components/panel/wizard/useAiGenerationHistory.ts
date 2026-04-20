'use client'

import { useCallback, useEffect, useState } from 'react'

export interface AiGenEntry {
  text: string
  ts: number
}

const DAY_MS = 24 * 60 * 60 * 1000

function readStored(key: string, windowMs: number): AiGenEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as AiGenEntry[]
    if (!Array.isArray(parsed)) return []
    const now = Date.now()
    return parsed.filter((e) => e && typeof e.text === 'string' && typeof e.ts === 'number' && now - e.ts < windowMs)
  } catch {
    return []
  }
}

function writeStored(key: string, entries: AiGenEntry[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(entries))
  } catch {
    // Quota or privacy mode — ignore silently, rate-limit best-effort.
  }
}

export function useAiGenerationHistory(storageKey: string, maxGenerations = 3, windowMs: number = DAY_MS) {
  const [history, setHistory] = useState<AiGenEntry[]>([])
  const [cursor, setCursor] = useState<number>(-1)

  useEffect(() => {
    const fresh = readStored(storageKey, windowMs)
    setHistory(fresh)
    setCursor(fresh.length - 1)
  }, [storageKey, windowMs])

  const add = useCallback(
    (text: string) => {
      setHistory((prev) => {
        const fresh = prev.filter((e) => Date.now() - e.ts < windowMs)
        const next = [...fresh, { text, ts: Date.now() }].slice(-maxGenerations)
        writeStored(storageKey, next)
        setCursor(next.length - 1)
        return next
      })
    },
    [storageKey, maxGenerations, windowMs],
  )

  const goBack = useCallback((): AiGenEntry | null => {
    if (cursor <= 0) return null
    const nextCursor = cursor - 1
    setCursor(nextCursor)
    return history[nextCursor] ?? null
  }, [cursor, history])

  const goForward = useCallback((): AiGenEntry | null => {
    if (cursor >= history.length - 1) return null
    const nextCursor = cursor + 1
    setCursor(nextCursor)
    return history[nextCursor] ?? null
  }, [cursor, history])

  const current = cursor >= 0 ? history[cursor] ?? null : null
  const canGenerate = history.length < maxGenerations
  const remaining = Math.max(0, maxGenerations - history.length)
  const oldest = history[0]
  const resetInMs = !canGenerate && oldest ? Math.max(0, windowMs - (Date.now() - oldest.ts)) : null

  return {
    history,
    cursor,
    current,
    canGenerate,
    remaining,
    resetInMs,
    add,
    goBack,
    goForward,
    maxGenerations,
  }
}

export function formatCooldown(ms: number): string {
  if (ms <= 0) return 'już teraz'
  const totalMinutes = Math.ceil(ms / 60_000)
  if (totalMinutes < 60) return `za ${totalMinutes} min`
  const hours = Math.ceil(totalMinutes / 60)
  return `za ${hours} h`
}

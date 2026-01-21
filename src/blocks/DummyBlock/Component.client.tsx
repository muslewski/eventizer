'use client'

// import type { DummyBlock as DummyProps } from '@/payload-types'

interface DummyClientProps {
  //  extends DummyProps
  className?: string
}

export const DummyClient = (props: DummyClientProps) => {
  const {} = props

  return <div>Dummy Block Client</div>
}

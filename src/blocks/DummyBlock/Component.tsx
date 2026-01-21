import React from 'react'
import { DummyClient } from '@/blocks/DummyBlock/Component.client'
// import type { DummyBlock as DummyProps } from '@/payload-types'

export const DummyBlock: React.FC<{
  // DummyProps &
  id?: string | number
  className?: string
}> = async (props) => {
  return <DummyClient {...props} />
}

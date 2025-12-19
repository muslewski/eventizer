'use client'

import Image from 'next/image'
import { useState } from 'react'
import { DefaultAccountIcon } from '@payloadcms/ui/graphics/Account/Default'

interface AvatarImageProps {
  imageUrl: string
  username: string
  baseClass: string
}

export const AvatarImage = ({ imageUrl, username, baseClass }: AvatarImageProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return <DefaultAccountIcon active={false} />
  }

  return (
    <>
      {isLoading && <div className={`${baseClass}__skeleton`} />}
      <Image
        src={imageUrl}
        alt={username}
        fill
        className={`${baseClass}__image`}
        style={{ opacity: isLoading ? 0 : 1 }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
      />
    </>
  )
}

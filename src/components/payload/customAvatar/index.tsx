import { ChevronIcon } from '@payloadcms/ui'
import { DefaultAccountIcon } from '@payloadcms/ui/graphics/Account/Default'
import { ServerProps } from 'payload'
import { FC } from 'react'
import Image from 'next/image'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import { ProfilePicture } from '@/payload-types'
import type { TFunction } from '@payloadcms/translations'
import type { CustomTranslationsKeys } from '@/translations/custom-translations'

import './index.scss'

const baseClass = 'avatar'

const Avatar: FC<ServerProps> = (props) => {
  const { user, i18n } = props

  const t = i18n.t as TFunction<CustomTranslationsKeys>

  const username = user?.name || 'User'

  let imageUrl: string | null = null

  if (user?.profilePicture && isExpandedDoc<ProfilePicture>(user.profilePicture)) {
    imageUrl = user.profilePicture.url || null
  }

  const greeting = t('avatar:greeting')

  return (
    <div className="avatar">
      {imageUrl ? (
        <div className="relative size-8">
          <Image
            src={imageUrl}
            alt={username}
            fill
            className={`${baseClass}__image object-cover rounded-full`}
          />
        </div>
      ) : (
        <DefaultAccountIcon active={false} />
      )}
      <span className={`${baseClass}__greeting`}>{greeting}</span>
      <span className={`${baseClass}__username`}>{username}</span>
      <ChevronIcon direction="right" size="small" className={`${baseClass}__chevron`} />
    </div>
  )
}

export default Avatar

import { ChevronIcon } from '@payloadcms/ui'
import { DefaultAccountIcon } from '@payloadcms/ui/graphics/Account/Default'
import { ServerProps } from 'payload'
import { FC } from 'react'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import { ProfilePicture } from '@/payload-types'
import type { TFunction } from '@payloadcms/translations'
import type { CustomTranslationsKeys } from '@/translations/custom-translations'
import { AvatarImage } from './AvatarImage'

import './index.scss'

const baseClass = 'avatar'

const Avatar: FC<ServerProps> = (props) => {
  const { user, i18n } = props

  const t = i18n.t as TFunction<CustomTranslationsKeys>

  const username = user?.name || 'User'

  let imageUrl: string | null = null

  if (user?.profilePicture && isExpandedDoc<ProfilePicture>(user.profilePicture)) {
    imageUrl = user.profilePicture.url || null
  } else if (user?.image) {
    imageUrl = user.image
  }

  const greeting = t('avatar:greeting')

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__image-container`}>
        {imageUrl ? (
          <AvatarImage imageUrl={imageUrl} username={username} baseClass={baseClass} />
        ) : (
          <DefaultAccountIcon active={false} />
        )}
        {/* Golden ring accent */}
        <div className={`${baseClass}__ring`} />
      </div>

      <div className={`${baseClass}__content`}>
        <span className={`${baseClass}__greeting`}>{greeting}</span>
        <span className={`${baseClass}__username`}>{username}</span>
      </div>

      <div className={`${baseClass}__chevron-wrap`}>
        <ChevronIcon direction="right" size="small" className={`${baseClass}__chevron`} />
      </div>
    </div>
  )
}

export default Avatar

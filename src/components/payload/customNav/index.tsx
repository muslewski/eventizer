import { EntityToGroup, EntityType, groupNavItems } from '@payloadcms/ui/shared'
import { ServerProps } from 'payload'
import { FC } from 'react'
import { NavWrapper } from './NavWrapper'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { NavClient } from './index.client'
import { NavHamburger } from './NavHamburger'
import { CustomLogoutButton } from './CustomLogoutButton'
import { HomeButton } from './HomeButton'

export const baseClass = 'nav'

const Nav: FC<ServerProps> = async (props) => {
  const {
    documentSubViewType,
    i18n,
    locale,
    params,
    payload,
    permissions,
    searchParams,
    user,
    viewType,
    visibleEntities,
  } = props

  if (!payload?.config || !permissions) {
    return null
  }

  const {
    admin: {
      components: { afterNavLinks, beforeNavLinks },
    },
    collections,
    globals,
  } = payload.config

  const groups = groupNavItems(
    [
      ...collections
        .filter(({ slug }) => visibleEntities?.collections.includes(slug))
        .map(
          (collection) =>
            ({
              type: EntityType.collection,
              entity: collection,
            }) satisfies EntityToGroup,
        ),
      ...globals
        .filter(({ slug }) => visibleEntities?.globals.includes(slug))
        .map(
          (global) =>
            ({
              type: EntityType.global,
              entity: global,
            }) satisfies EntityToGroup,
        ),
    ],
    permissions,
    i18n,
  )

  // Get nav preferences server-side
  // const navPreferences = user ? await getNavPrefs({ payload, user }) : null

  return (
    <NavWrapper baseClass={baseClass}>
      <nav className={`${baseClass}__wrap p-2 flex flex-col h-full`}>
        {RenderServerComponent({
          clientProps: {
            documentSubViewType,
            viewType,
          },
          Component: beforeNavLinks,
          importMap: payload.importMap,
          serverProps: {
            i18n,
            locale,
            params,
            payload,
            permissions,
            searchParams,
            user,
          },
        })}
        <NavClient groups={groups} />
        {RenderServerComponent({
          clientProps: {
            documentSubViewType,
            viewType,
          },
          Component: afterNavLinks,
          importMap: payload.importMap,
          serverProps: {
            i18n,
            locale,
            params,
            payload,
            permissions,
            searchParams,
            user,
          },
        })}
        <div className="shrink-0 mt-auto pt-2 flex flex-wrap gap-3 w-full">
          <HomeButton />
          <CustomLogoutButton />
        </div>
      </nav>
      <div className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-content`}>
          <NavHamburger baseClass={baseClass} />
        </div>
      </div>
    </NavWrapper>
  )
}

export default Nav

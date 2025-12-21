import { type groupNavItems } from '@payloadcms/ui/shared'
import { ServerProps } from 'payload'
import { FC, Fragment } from 'react'
import { DashboardBanner } from './DashboardBanner'
import { DashboardGroup } from './DashboardGroup'
import type { I18nClient } from '@payloadcms/translations'
import { adminGroups } from '@/lib/adminGroups'

type DashboardProps = {
  navGroups: ReturnType<typeof groupNavItems>
} & ServerProps

const Dashboard: FC<DashboardProps> = (props) => {
  const {
    navGroups,
    i18n,
    payload,
    payload: {
      config: {
        routes: { admin: adminRoute },
      },
    },
  } = props

  // Separate featured groups from regular groups
  const featuredGroups = navGroups.filter(
    ({ label }) => label === adminGroups.featured.en || label === adminGroups.featured.pl,
  )
  const regularGroups = navGroups.filter(
    ({ label }) => label !== adminGroups.featured.en && label !== adminGroups.featured.pl,
  )

  return (
    <Fragment>
      <DashboardBanner />
      <div className="dashboard mt-12">
        <div className="dashboard__wrap mx-6 md:mx-12 lg:mx-20 mb-20">
          {/* Featured Groups - Full Width */}
          {featuredGroups.length > 0 && (
            <div className="p-8">
              {featuredGroups.map(({ label, entities }, index) => (
                <DashboardGroup
                  key={`featured-${index}`}
                  label={label}
                  entities={entities}
                  adminRoute={adminRoute}
                  i18n={i18n as I18nClient}
                  payload={payload}
                  isFeatured
                />
              ))}
            </div>
          )}

          {/* Golden Separator */}
          {featuredGroups.length > 0 && regularGroups.length > 0 && (
            <div className="relative py-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
              </div>
            </div>
          )}

          {/* Regular Groups - Two Column Grid */}
          {regularGroups.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {regularGroups.map(({ label, entities }, entityIndex) => {
                const isFirstRow = entityIndex < 2
                const isLeftColumn = entityIndex % 2 === 0
                const isRightColumn = entityIndex % 2 === 1
                const rowIndex = Math.floor(entityIndex / 2)
                const totalRows = Math.ceil(regularGroups.length / 2)

                return (
                  <div key={entityIndex} className="relative p-8 lg:p-10">
                    {/* Horizontal divider - above each row except first */}
                    {!isFirstRow && isLeftColumn && (
                      <div className="absolute -top-px left-0 right-0 h-px hidden lg:block">
                        <div className="h-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                      </div>
                    )}

                    {/* Right column horizontal divider on desktop */}
                    {!isFirstRow && isRightColumn && (
                      <div className="absolute -top-px left-0 right-0 h-px hidden lg:block">
                        <div className="h-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                      </div>
                    )}

                    {/* Mobile horizontal divider */}
                    {entityIndex > 0 && (
                      <div className="absolute -top-px left-0 right-0 h-px lg:hidden">
                        <div className="h-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                      </div>
                    )}

                    {/* Vertical divider - between columns */}
                    {isLeftColumn && (
                      <div className="hidden lg:block absolute top-0 -right-px bottom-0 w-px">
                        <div className="h-full bg-gradient-to-b from-transparent via-amber-500/50 to-transparent" />
                      </div>
                    )}

                    <DashboardGroup
                      label={label}
                      entities={entities}
                      adminRoute={adminRoute}
                      i18n={i18n as I18nClient}
                      payload={payload}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Fragment>
  )
}

export default Dashboard

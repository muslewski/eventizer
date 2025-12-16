import { type groupNavItems } from '@payloadcms/ui/shared'
import { ServerProps } from 'payload'
import { FC, Fragment } from 'react'
import { DashboardBanner } from './DashboardBanner'
import { DashboardGroup } from './DashboardGroup'

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

  return (
    <Fragment>
      <DashboardBanner />
      <div className="dashboard mt-10">
        <div className="dashboard__wrap ml-20 mr-20">
          {navGroups.map(({ label, entities }, entityIndex) => (
            <DashboardGroup
              key={entityIndex}
              label={label}
              entities={entities}
              adminRoute={adminRoute}
              i18n={i18n}
              payload={payload}
            />
          ))}
        </div>
      </div>
    </Fragment>
  )
}

export default Dashboard

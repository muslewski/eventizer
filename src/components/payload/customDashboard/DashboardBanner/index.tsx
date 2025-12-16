import Image from 'next/image'

import './index.scss'

const baseClass = 'dashboard-banner'

import dashboardBanner from '@/assets/dashboard-banner.jpeg'

export const DashboardBanner = () => {
  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__image-wrap`}>
          <Image src={dashboardBanner} className="object-cover" alt="" fill />
        </div>
      </div>
    </div>
  )
}

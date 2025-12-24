import type { ListViewServerProps } from 'payload'
import { ListView } from '@payloadcms/ui'
import { Fragment } from 'react'
import { ListBanner } from './ListBanner'

const CustomListView = async (props: ListViewServerProps) => {
  return (
    <Fragment>
      <ListBanner />
      <ListView {...props} />
    </Fragment>
  )
}

export default CustomListView

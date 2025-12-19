import { CollectionSlug, GlobalSlug } from 'payload'
import {
  BookCopy,
  BookImageIcon,
  CircleUserRoundIcon,
  Footprints,
  Image,
  LayoutGrid,
  List,
  LucideProps,
  Menu,
  MessageCircleQuestionMarkIcon,
  Percent,
  SlidersHorizontalIcon,
  Smile,
  Star,
  StarsIcon,
  StickyNote,
  TabletSmartphone,
  User,
} from 'lucide-react'
import { ExoticComponent } from 'react'

export const navIconMap: Partial<
  Record<CollectionSlug | GlobalSlug, ExoticComponent<LucideProps>>
> = {
  //   categories: List,
  //   customers: User,
  //   devices: TabletSmartphone,
  //   discountCodes: Percent,
  media: Image,
  'profile-pictures': CircleUserRoundIcon,
  'offer-uploads': BookImageIcon,
  offers: StarsIcon,
  // orders: BookCopy,
  //   pages: StickyNote,
  //   posts: LayoutGrid,
  //   reviews: Star,
  users: User,
  'user-sessions': SlidersHorizontalIcon,
  'user-accounts': SlidersHorizontalIcon,
  'user-verifications': SlidersHorizontalIcon,
  'help-tickets': MessageCircleQuestionMarkIcon,
  //   header: Smile,
  //   mainMenu: Menu,
  //   footer: Footprints,
}

export const getNavIcon = (slug: string) =>
  Object.hasOwn(navIconMap, slug) ? navIconMap[slug as CollectionSlug | GlobalSlug] : undefined

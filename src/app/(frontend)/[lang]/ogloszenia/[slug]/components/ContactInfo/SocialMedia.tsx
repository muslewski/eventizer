import { Offer } from '@/payload-types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, GlobeIcon, LockKeyhole } from 'lucide-react'
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok } from 'react-icons/fa6'
import type { IconType } from 'react-icons'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { SpanLikeH3 } from '@/components/frontend/Content/SpanLikeH3'

const socialMediaConfig: {
  key: 'website' | 'facebook' | 'instagram' | 'tiktok' | 'linkedin'
  label: string
  icon: LucideIcon | IconType
  hoverClass: string
}[] = [
  {
    key: 'website',
    label: 'Strona internetowa',
    icon: GlobeIcon,
    hoverClass: 'hover:bg-foreground/10 hover:border-foreground/40',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: FaFacebook,
    hoverClass: 'hover:bg-[#1877F2]/10 hover:border-[#1877F2]/40 hover:text-[#1877F2]',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: FaInstagram,
    hoverClass: 'hover:bg-[#E4405F]/10 hover:border-[#E4405F]/40 hover:text-[#E4405F]',
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    icon: FaTiktok,
    hoverClass: 'hover:bg-foreground/10 hover:border-foreground/40',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: FaLinkedin,
    hoverClass: 'hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/40 hover:text-[#0A66C2]',
  },
]

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

interface SocialMediaProps {
  offer: Offer
  isAuthenticated: boolean
}

export const SocialMedia: React.FC<SocialMediaProps> = ({ offer, isAuthenticated }) => {
  return (
    <div className="w-full min-w-0 lg:w-1/2 lg:self-start lg:sticky lg:top-24">
      <Card className="bg-transparent border-border/50 relative overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center font-normal gap-4 sm:gap-6 text-xl font-montserrat">
            <ExternalLink className="size-6 sm:size-8 text-primary" />
            <SpanLikeH3 title="Media społecznościowe" />
          </CardTitle>
        </CardHeader>
        <div className="relative">
          <CardContent
            className={`pt-6 ${!isAuthenticated ? 'select-none blur-sm pointer-events-none' : ''}`}
            aria-hidden={!isAuthenticated}
          >
            <div className="flex flex-wrap justify-center gap-3">
              {socialMediaConfig.map(({ key, label, icon: Icon, hoverClass }) => {
                const url = offer.socialMedia?.[key]
                if (!url) return null

                return (
                  <Link
                    key={key}
                    href={normalizeUrl(url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-3 h-auto px-6 py-4 rounded-xl border border-border/50 bg-background/50 text-sm font-medium transition-all duration-300 ${hoverClass} hover:shadow-md hover:scale-[1.03] active:scale-[0.98]`}
                  >
                    <Icon className="size-5" />
                    <span>{label}</span>
                    <ExternalLink className="size-3 ml-1 opacity-40" />
                  </Link>
                )
              })}
            </div>

            <p className="text-xs text-muted-foreground text-center mt-6">
              Kliknij, aby odwiedzić profil w nowym oknie
            </p>
          </CardContent>

          {/* Sign-in overlay for unauthenticated users */}
          {!isAuthenticated && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/30 z-10">
              <LockKeyhole className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground font-medium text-center px-4">
                Zaloguj się, aby zobaczyć media społecznościowe
              </p>
              <Button size="sm" asChild>
                <Link href={`/auth/sign-in`}>Zaloguj się</Link>
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

import { Offer } from '@/payload-types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink, Facebook, Instagram, Linkedin } from 'lucide-react'
import Link from 'next/link'
import { SpanLikeH3 } from '@/components/frontend/Content/SpanLikeH3'

// TikTok icon (not available in lucide-react)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
)

const socialMediaConfig = [
  {
    key: 'facebook' as const,
    label: 'Facebook',
    icon: Facebook,
    hoverClass: 'hover:bg-[#1877F2]/10 hover:border-[#1877F2]/40 hover:text-[#1877F2]',
  },
  {
    key: 'instagram' as const,
    label: 'Instagram',
    icon: Instagram,
    hoverClass: 'hover:bg-[#E4405F]/10 hover:border-[#E4405F]/40 hover:text-[#E4405F]',
  },
  {
    key: 'tiktok' as const,
    label: 'TikTok',
    icon: TikTokIcon,
    hoverClass: 'hover:bg-foreground/10 hover:border-foreground/40',
  },
  {
    key: 'linkedin' as const,
    label: 'LinkedIn',
    icon: Linkedin,
    hoverClass: 'hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/40 hover:text-[#0A66C2]',
  },
]

interface SocialMediaProps {
  offer: Offer
}

export const SocialMedia: React.FC<SocialMediaProps> = ({ offer }) => {
  return (
    <div className="w-full min-w-0 lg:w-1/2 lg:self-start lg:sticky lg:top-24">
      <Card className="bg-transparent border-border/50">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center font-normal gap-4 sm:gap-6 text-xl font-montserrat">
            <ExternalLink className="size-6 sm:size-8 text-primary" />
            <SpanLikeH3 title="Media społecznościowe" />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-wrap justify-center gap-3">
            {socialMediaConfig.map(({ key, label, icon: Icon, hoverClass }) => {
              const url = offer.socialMedia?.[key]
              if (!url) return null

              return (
                <Link
                  key={key}
                  href={url}
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
      </Card>
    </div>
  )
}

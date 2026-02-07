import { Offer } from '@/payload-types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  { key: 'facebook' as const, label: 'Facebook', icon: Facebook },
  { key: 'instagram' as const, label: 'Instagram', icon: Instagram },
  { key: 'tiktok' as const, label: 'TikTok', icon: TikTokIcon },
  { key: 'linkedin' as const, label: 'LinkedIn', icon: Linkedin },
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
            {socialMediaConfig.map(({ key, label, icon: Icon }) => {
              const url = offer.socialMedia?.[key]
              if (!url) return null

              return (
                <Button
                  key={key}
                  variant="outline"
                  className="h-auto px-6 py-4 flex items-center gap-3 transition-all duration-300"
                  asChild
                >
                  <Link href={url} target="_blank" rel="noopener noreferrer">
                    <Icon className="size-5" />
                    <span className="text-sm font-medium">{label}</span>
                  </Link>
                </Button>
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

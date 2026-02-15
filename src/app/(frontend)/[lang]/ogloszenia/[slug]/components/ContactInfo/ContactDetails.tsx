'use client'

import { Offer } from '@/payload-types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Phone, Mail, MapPin, LockKeyhole } from 'lucide-react'
import Link from 'next/link'
import { SpanLikeH3 } from '@/components/frontend/Content/SpanLikeH3'

const PLACEHOLDER_PHONE = '+48 *** *** ***'
const PLACEHOLDER_EMAIL = '***@***.***'
const PLACEHOLDER_ADDRESS = '** ******** **, **-*** ********'

interface ContactDetailsProps {
  offer: Offer
  isAuthenticated: boolean
}

export const ContactDetails: React.FC<ContactDetailsProps> = ({ offer, isAuthenticated }) => {

  const displayPhone = isAuthenticated ? offer.phone : PLACEHOLDER_PHONE
  const displayEmail = isAuthenticated ? offer.email : PLACEHOLDER_EMAIL
  const displayAddress = isAuthenticated ? offer.location?.address : PLACEHOLDER_ADDRESS

  return (
    <div className="w-full min-w-0 lg:w-1/2">
      <Card className="bg-transparent border-border/50 relative overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center font-normal gap-4 sm:gap-6 text-xl font-montserrat">
            <Phone className="size-6 sm:size-8 text-primary" />
            <SpanLikeH3 title="Dane Kontaktowe" />
          </CardTitle>
        </CardHeader>
        <div className="relative">
          <CardContent
            className={`pt-6 space-y-6 ${!isAuthenticated ? 'select-none blur-sm pointer-events-none' : ''}`}
            aria-hidden={!isAuthenticated}
          >
            {/* Phone */}
            {offer.phone && (
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Phone className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Telefon</p>
                  <span className="text-lg font-medium">{displayPhone}</span>
                </div>
                {isAuthenticated && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${offer.phone}`}>Zadzwoń</a>
                  </Button>
                )}
              </div>
            )}

            {offer.phone && (offer.email || offer.location?.address) && <Separator />}

            {/* Email */}
            {offer.email && (
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Mail className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <span className="text-lg font-medium truncate block">{displayEmail}</span>
                </div>
                {isAuthenticated && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${offer.email}`}>Napisz</a>
                  </Button>
                )}
              </div>
            )}

            {offer.email && offer.location?.address && <Separator />}

            {/* Address */}
            {offer.location?.address && (
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <MapPin className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Adres</p>
                  <p className="text-lg font-medium">{displayAddress}</p>
                </div>
              </div>
            )}

            {/* Service Radius */}
            {offer.location?.serviceRadius && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Zasięg usługi</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="gap-1.5">
                      <MapPin className="size-3" />
                      {offer.location?.city || 'Lokalizacja'}
                    </Badge>
                    <Badge variant="outline" className="gap-1.5">
                      {offer.location.serviceRadius} km
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </CardContent>

          {/* Sign-in overlay for unauthenticated users */}
          {!isAuthenticated && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/30 z-10">
              <LockKeyhole className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground font-medium text-center px-4">
                Zaloguj się, aby zobaczyć dane kontaktowe
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

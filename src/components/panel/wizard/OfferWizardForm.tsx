'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { PanelPageHeader } from '@/components/panel/PanelPageHeader'
import { createOffer, updateOffer } from '@/actions/panel/offers'
import { offerSchema, type OfferFormData } from './offerSchema'
import { StepBasicInfo } from './steps/StepBasicInfo'
import { StepPricing } from './steps/StepPricing'
import { StepMedia } from './steps/StepMedia'
import { StepDescription } from './steps/StepDescription'
import { StepContent } from './steps/StepContent'
import { StepSummary } from './steps/StepSummary'

const STEP_COUNT = 6
const STEP_LABELS = [
  'Podstawowe',
  'Cena i lokalizacja',
  'Media',
  'Kontakt',
  'Treść oferty',
  'Podsumowanie',
]

interface OfferWizardFormProps {
  mode: 'create' | 'edit'
  initialData?: any
  offerId?: number
  categories: any[]
  lang: string
  backgroundImageUrl?: string | null
  breadcrumbs?: { label: string; href?: string }[]
  userServiceCategory?: string | null
}

export function OfferWizardForm({
  mode,
  initialData,
  offerId,
  categories,
  lang,
  backgroundImageUrl,
  breadcrumbs,
  userServiceCategory,
}: OfferWizardFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState(0)

  // Media state (managed separately from form as UploadedFile objects)
  interface UploadedFile { id: number; url: string; filename: string }

  const [mainImage, setMainImage] = useState<UploadedFile | null>(
    initialData?.mainImage && typeof initialData.mainImage === 'object'
      ? { id: initialData.mainImage.id, url: initialData.mainImage.url ?? '', filename: initialData.mainImage.filename ?? '' }
      : null,
  )
  const [galleryImages, setGalleryImages] = useState<UploadedFile[]>(
    initialData?.gallery?.map((g: any) => {
      const img = g.image
      return img && typeof img === 'object'
        ? { id: img.id, url: img.url ?? '', filename: img.filename ?? '' }
        : null
    }).filter(Boolean) ?? [],
  )
  const [video, setVideo] = useState<UploadedFile | null>(
    initialData?.video && typeof initialData.video === 'object'
      ? { id: initialData.video.id, url: initialData.video.url ?? '', filename: initialData.video.filename ?? '' }
      : null,
  )
  const [backgroundImage, setBackgroundImage] = useState<UploadedFile | null>(
    initialData?.backgroundImage && typeof initialData.backgroundImage === 'object'
      ? { id: initialData.backgroundImage.id, url: initialData.backgroundImage.url ?? '', filename: initialData.backgroundImage.filename ?? '' }
      : null,
  )
  const [content, setContent] = useState<any>(initialData?.content ?? '')

  const {
    control,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema) as any,
    defaultValues: {
      title: initialData?.title ?? '',
      category: initialData?.category ?? userServiceCategory ?? '',
      shortDescription: initialData?.shortDescription ?? '',
      hasPriceRange: initialData?.hasPriceRange ?? false,
      price: initialData?.price ?? undefined,
      priceFrom: initialData?.priceFrom ?? undefined,
      priceTo: initialData?.priceTo ?? undefined,
      serviceRadius: initialData?.location?.serviceRadius ?? 50,
      address: initialData?.location?.address ?? '',
      city: initialData?.location?.city ?? '',
      lat: initialData?.location?.lat ?? undefined,
      lng: initialData?.location?.lng ?? undefined,
      phone: initialData?.phone ?? '',
      email: initialData?.email ?? '',
      facebook: initialData?.socialMedia?.facebook ?? '',
      instagram: initialData?.socialMedia?.instagram ?? '',
      tiktok: initialData?.socialMedia?.tiktok ?? '',
      linkedin: initialData?.socialMedia?.linkedin ?? '',
      videoAspectRatio: initialData?.videoAspectRatio ?? '16:9',
    },
  })

  const validateCurrentStep = async (): Promise<boolean> => {
    const values = getValues()

    if (currentStep === 0) {
      const result = await trigger(['title', 'category', 'shortDescription'])
      return result
    }

    if (currentStep === 1) {
      const fieldsToValidate: (keyof OfferFormData)[] = ['address', 'serviceRadius']
      if (values.hasPriceRange) {
        fieldsToValidate.push('priceFrom', 'priceTo')
      } else {
        fieldsToValidate.push('price')
      }
      const result = await trigger(fieldsToValidate)
      return result
    }

    // Steps 3, 4, 5 don't need additional form validation
    return true
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (isValid && currentStep < STEP_COUNT - 1) {
      setCurrentStep((prev) => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleFormSubmit = (status: 'published' | 'draft') => {
    startTransition(async () => {
      const formData = getValues()

      const offerData = {
        title: formData.title,
        category: formData.category,
        shortDescription: formData.shortDescription,
        hasPriceRange: formData.hasPriceRange,
        price: formData.hasPriceRange ? undefined : formData.price,
        priceFrom: formData.hasPriceRange ? formData.priceFrom : undefined,
        priceTo: formData.hasPriceRange ? formData.priceTo : undefined,
        location: {
          address: formData.address,
          city: formData.city,
          lat: formData.lat,
          lng: formData.lng,
          serviceRadius: formData.serviceRadius,
        },
        mainImage: mainImage?.id || undefined,
        gallery: galleryImages.map((img) => ({ image: img.id })),
        video: video?.id || undefined,
        backgroundImage: backgroundImage?.id || undefined,
        videoAspectRatio: formData.videoAspectRatio,
        content: content
          ? content
          : undefined,
        phone: formData.phone,
        email: formData.email,
        socialMedia: {
          facebook: formData.facebook,
          instagram: formData.instagram,
          tiktok: formData.tiktok,
          linkedin: formData.linkedin,
        },
        _status: status,
      }

      if (mode === 'edit' && offerId) {
        const result = await updateOffer(offerId, offerData as any)
        if (result.success) {
          toast.success(
            status === 'published' ? 'Oferta opublikowana' : 'Oferta zapisana jako robocza',
          )
          router.push(`/${lang}/panel/oferty`)
          router.refresh()
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await createOffer(offerData as any)
        if (result.success) {
          toast.success(
            status === 'published' ? 'Oferta utworzona i opublikowana' : 'Oferta zapisana jako robocza',
          )
          router.push(`/${lang}/panel/oferty`)
          router.refresh()
        } else {
          toast.error(result.error)
        }
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header with progress */}
      <PanelPageHeader
        title={mode === 'create' ? 'Nowa oferta' : 'Edytuj ofertę'}
        description={`Krok ${currentStep + 1} z 5 — ${STEP_LABELS[currentStep]}`}
        breadcrumbs={breadcrumbs}
        lang={lang}
        backgroundImageUrl={backgroundImageUrl}
        progress={{
          value: ((currentStep + 1) / STEP_COUNT) * 100,
          label: STEP_LABELS.map((label, i) => i === currentStep ? `● ${label}` : label).join('  ·  '),
        }}
      />

      {/* Step content */}
      <h2 className="font-bebas text-2xl tracking-wide">
        {STEP_LABELS[currentStep]}
      </h2>

      {/* Step content */}
      <div className="min-h-[300px]">
        {currentStep === 0 && (
          <StepBasicInfo
            control={control}
            errors={errors}
            watch={watch}
            categories={categories}
          />
        )}
        {currentStep === 1 && (
          <StepPricing
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />
        )}
        {currentStep === 2 && (
          <StepMedia
            control={control}
            errors={errors}
            watch={watch}
            mainImage={mainImage}
            galleryImages={galleryImages}
            video={video}
            backgroundImage={backgroundImage}
            onMainImageChange={setMainImage}
            onGalleryChange={setGalleryImages}
            onVideoChange={setVideo}
            onBackgroundImageChange={setBackgroundImage}
          />
        )}
        {currentStep === 3 && (
          <StepDescription
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />
        )}
        {currentStep === 4 && (
          <StepContent
            content={content}
            onContentChange={setContent}
          />
        )}
        {currentStep === 5 && (
          <StepSummary
            getValues={getValues}
            content={content}
            mainImageId={mainImage?.id ?? null}
            galleryIds={galleryImages.map((g) => g.id)}
            videoId={video?.id ?? null}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-4">
        <div>
          {currentStep > 0 && (
            <Button type="button" variant="outline" onClick={handlePrev}>
              <ChevronLeft className="size-4" data-icon="inline-start" />
              Wstecz
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentStep < STEP_COUNT - 1 ? (
            <Button type="button" onClick={handleNext}>
              Dalej
              <ChevronRight className="size-4" data-icon="inline-end" />
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => handleFormSubmit('draft')}
              >
                {isPending && <Spinner data-icon="inline-start" />}
                Zapisz jako roboczą
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={() => handleFormSubmit('published')}
              >
                {isPending && <Spinner data-icon="inline-start" />}
                Opublikuj
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

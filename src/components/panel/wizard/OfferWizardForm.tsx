'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Progress } from '@/components/ui/progress'
import { createOffer, updateOffer } from '@/actions/panel/offers'
import { offerSchema, stepSchemas, type OfferFormData } from './offerSchema'
import { StepBasicInfo } from './steps/StepBasicInfo'
import { StepPricing } from './steps/StepPricing'
import { StepMedia } from './steps/StepMedia'
import { StepDescription } from './steps/StepDescription'
import { StepSummary } from './steps/StepSummary'

const STEP_LABELS = [
  'Podstawowe',
  'Cena i lokalizacja',
  'Media',
  'Opis i kontakt',
  'Podsumowanie',
]

interface OfferWizardFormProps {
  mode: 'create' | 'edit'
  initialData?: any
  offerId?: number
  categories: any[]
  lang: string
}

export function OfferWizardForm({
  mode,
  initialData,
  offerId,
  categories,
  lang,
}: OfferWizardFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState(0)

  // Media state (managed separately from form)
  const [mainImageId, setMainImageId] = useState<number | null>(
    initialData?.mainImage?.id ?? initialData?.mainImage ?? null,
  )
  const [galleryIds, setGalleryIds] = useState<number[]>(
    initialData?.gallery?.map((g: any) => g.image?.id ?? g.image) ?? [],
  )
  const [videoId, setVideoId] = useState<number | null>(
    initialData?.video?.id ?? initialData?.video ?? null,
  )
  const [content, setContent] = useState<any>(initialData?.content ?? '')

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      category: initialData?.category ?? '',
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
    const schema = stepSchemas[currentStep]

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
    if (isValid && currentStep < 4) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
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
        mainImage: mainImageId || undefined,
        gallery: galleryIds.map((id) => ({ image: id })),
        video: videoId || undefined,
        videoAspectRatio: formData.videoAspectRatio,
        content: content || undefined,
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
      {/* Progress indicator */}
      <div className="flex flex-col gap-3">
        <Progress value={((currentStep + 1) / 5) * 100} />
        <div className="flex items-center justify-between">
          {STEP_LABELS.map((label, index) => (
            <span
              key={label}
              className={`text-xs font-medium ${
                index === currentStep
                  ? 'text-primary'
                  : index < currentStep
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/50'
              }`}
            >
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{index + 1}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Step title */}
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
            setValue={setValue}
            mainImageId={mainImageId}
            galleryIds={galleryIds}
            videoId={videoId}
            onMainImageChange={setMainImageId}
            onGalleryChange={setGalleryIds}
            onVideoChange={setVideoId}
          />
        )}
        {currentStep === 3 && (
          <StepDescription
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
            content={content}
            onContentChange={setContent}
          />
        )}
        {currentStep === 4 && (
          <StepSummary
            getValues={getValues}
            content={content}
            mainImageId={mainImageId}
            galleryIds={galleryIds}
            videoId={videoId}
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
          {currentStep < 4 ? (
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

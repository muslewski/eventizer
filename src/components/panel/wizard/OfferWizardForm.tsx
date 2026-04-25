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
import { WizardStepIndicator, type WizardStep } from './WizardStepIndicator'

function isLexicalContentEmpty(content: any): boolean {
  if (!content) return true
  if (typeof content === 'string') return content.trim() === ''
  const root = content?.root
  if (!root || !Array.isArray(root.children) || root.children.length === 0) return true
  const hasText = (node: any): boolean => {
    if (!node) return false
    if (typeof node.text === 'string' && node.text.trim() !== '') return true
    if (Array.isArray(node.children)) return node.children.some(hasText)
    return false
  }
  return !root.children.some(hasText)
}

const STEP_COUNT = 6
const STEP_LABELS = [
  'Podstawowe',
  'Treść oferty',
  'Cena i lokalizacja',
  'Media',
  'Kontakt',
  'Finalizacja',
]

// Polish phone: optional +48, then 9 digits (with optional spaces between triplets).
// Same shape as the zod rule in offerSchema.
const PHONE_RE = /^(?:\+48)?\s*\d{3}(?:\s*\d{3}){2}$/
const EMAIL_RE = /^\S+@\S+\.\S+$/
const LINK_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

/**
 * Pure sync per-step validity check. Reads the same sources as the legacy
 * validateCurrentStep() (form values + the out-of-RHF `content` and
 * `mainImage`) but never calls trigger(), so it can run on every render.
 */
function computeStepValidity(
  stepIndex: number,
  values: OfferFormData,
  content: unknown,
  mainImageId: number | null | undefined,
): boolean {
  switch (stepIndex) {
    case 0:
      return !!values.title?.trim() && !!values.category?.trim()
    case 1:
      return !isLexicalContentEmpty(content)
    case 2: {
      if (!values.address?.trim()) return false
      if (!values.serviceRadius) return false
      if (values.hasPriceRange) {
        return values.priceFrom != null || values.priceTo != null
      }
      return values.price != null && values.price > 0
    }
    case 3:
      return !!mainImageId
    case 4: {
      const phoneOk = !!values.phone && PHONE_RE.test(values.phone)
      const emailOk = !!values.email && EMAIL_RE.test(values.email)
      return phoneOk && emailOk
    }
    case 5: {
      // Finalizacja — slug must be present and well-formed. Uniqueness is
      // checked live in SlugField + enforced by the backend on submit.
      const link = values.link?.trim() ?? ''
      return link.length >= 2 && LINK_RE.test(link)
    }
    default:
      return true
  }
}

interface OfferWizardFormProps {
  mode: 'create' | 'edit'
  initialData?: any
  offerId?: number
  categories: any[]
  lang: string
  backgroundImageUrl?: string | null
  breadcrumbs?: { label: string; href?: string }[]
  userServiceCategory?: string | null
  userEmail?: string | null
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
  userEmail,
}: OfferWizardFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState(0)
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(() => new Set([0]))

  // Media state (managed separately from form as UploadedFile objects)
  interface UploadedFile {
    id: number
    url: string
    filename: string
    focalX?: number | null
    focalY?: number | null
    zoom?: number | null
  }

  const [mainImage, setMainImage] = useState<UploadedFile | null>(
    initialData?.mainImage && typeof initialData.mainImage === 'object'
      ? {
          id: initialData.mainImage.id,
          url: initialData.mainImage.url ?? '',
          filename: initialData.mainImage.filename ?? '',
          focalX: initialData.mainImage.focalX ?? null,
          focalY: initialData.mainImage.focalY ?? null,
          zoom: initialData.mainImage.zoom ?? null,
        }
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
      ? {
          id: initialData.backgroundImage.id,
          url: initialData.backgroundImage.url ?? '',
          filename: initialData.backgroundImage.filename ?? '',
          focalX: initialData.backgroundImage.focalX ?? null,
          focalY: initialData.backgroundImage.focalY ?? null,
          zoom: initialData.backgroundImage.zoom ?? null,
        }
      : null,
  )
  const [content, setContent] = useState<any>(initialData?.content ?? '')

  const {
    control,
    watch,
    setValue,
    setError,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema) as any,
    defaultValues: {
      title: initialData?.title ?? '',
      link: initialData?.link ?? '',
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
      email: initialData?.email ?? userEmail ?? '',
      website: initialData?.socialMedia?.website ?? '',
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
      return await trigger(['title', 'category'])
    }

    if (currentStep === 1) {
      // Treść oferty — Lexical content is separate state, not in RHF.
      // Enforce non-empty here so users see the error on this step rather
      // than a cryptic backend "Główna Treść > Treść" toast at publish time.
      if (isLexicalContentEmpty(content)) {
        toast.error('Dodaj treść oferty, aby przejść dalej')
        return false
      }
      return true
    }

    if (currentStep === 2) {
      // Cena i lokalizacja
      const fieldsToValidate: (keyof OfferFormData)[] = ['address', 'serviceRadius']
      if (values.hasPriceRange) {
        fieldsToValidate.push('priceFrom', 'priceTo')
      } else {
        fieldsToValidate.push('price')
      }
      return await trigger(fieldsToValidate)
    }

    if (currentStep === 3) {
      // Media — main image is required before moving on.
      if (!mainImage?.id) {
        toast.error('Dodaj zdjęcie główne, aby przejść dalej')
        return false
      }
      return true
    }

    if (currentStep === 4) {
      // Kontakt — phone and email are required with proper format.
      return await trigger(['phone', 'email'])
    }

    return true
  }

  const goToStep = (index: number) => {
    if (index < 0 || index >= STEP_COUNT || index === currentStep) return
    setCurrentStep(index)
    setVisitedSteps((prev) => {
      if (prev.has(index)) return prev
      const next = new Set(prev)
      next.add(index)
      return next
    })
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleNext = async () => {
    // Surface inline errors on the step being left, but don't block — dot
    // navigation can bypass validation anyway, so Dalej is consistent.
    await validateCurrentStep()
    if (currentStep < STEP_COUNT - 1) {
      goToStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1)
    }
  }

  const handleFormSubmit = (status: 'published' | 'draft') => {
    startTransition(async () => {
      const formData = getValues()

      // Publish-time: scan every step for validity and jump to the first
      // one that fails, so errors aren't hidden on a pane the user can't
      // see from Finalizacja.
      if (status === 'published') {
        for (let i = 0; i < STEP_COUNT; i++) {
          if (!computeStepValidity(i, formData, content, mainImage?.id)) {
            goToStep(i)
            // Surface every RHF inline error at once so the user sees
            // exactly what's wrong on the step we just landed on.
            await trigger()
            toast.error('Uzupełnij brakujące pola przed publikacją')
            return
          }
        }
      }

      // Client-side gate for publish-only required fields (Payload enforces
      // these on publish; surface them inline instead of through a backend
      // "To pole jest nieprawidłowe" toast).
      if (status === 'published' && isLexicalContentEmpty(content)) {
        toast.error('Dodaj treść oferty przed publikacją')
        return
      }
      if (status === 'published' && !formData.shortDescription?.trim()) {
        setError('shortDescription', {
          type: 'required',
          message: 'Krótki opis jest wymagany przed publikacją',
        })
        toast.error('Wypełnij krótki opis przed publikacją')
        return
      }

      const offerData = {
        title: formData.title,
        link: formData.link,
        // Tell Payload's slugField NOT to overwrite the slug we're sending —
        // the user's edit on Finalizacja step is the source of truth.
        generateSlug: false,
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
          website: formData.website,
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

  // Subscribe to every form value so the step indicator re-renders live
  // as the user types (title filled → step 0 flips from red to green).
  const watchedValues = watch() as OfferFormData
  const stepStatuses: readonly WizardStep[] = STEP_LABELS.map((label, index) => {
    if (index === currentStep) return { label, status: 'current' as const }
    const valid = computeStepValidity(index, watchedValues, content, mainImage?.id)
    if (!valid) return { label, status: 'invalid' as const }
    if (visitedSteps.has(index)) return { label, status: 'valid' as const }
    return { label, status: 'upcoming' as const }
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Header with progress */}
      <PanelPageHeader
        title={mode === 'create' ? 'Nowa oferta' : 'Edytuj ofertę'}
        description={`Krok ${currentStep + 1} z ${STEP_COUNT} — ${STEP_LABELS[currentStep]}`}
        breadcrumbs={breadcrumbs}
        lang={lang}
        backgroundImageUrl={backgroundImageUrl}
        progress={{
          value: ((currentStep + 1) / STEP_COUNT) * 100,
        }}
      />

      {/* Clickable step indicator — free navigation with live per-step validity */}
      <WizardStepIndicator steps={stepStatuses} onStepClick={goToStep} />

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
          <StepContent
            content={content}
            onContentChange={setContent}
            title={watch('title')}
            category={watch('category')}
          />
        )}
        {currentStep === 2 && (
          <StepPricing
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />
        )}
        {currentStep === 3 && (
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
        {currentStep === 4 && (
          <StepDescription
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />
        )}
        {currentStep === 5 && (
          <StepSummary
            control={control}
            errors={errors}
            getValues={getValues}
            setValue={setValue}
            content={content}
            mainImageId={mainImage?.id ?? null}
            galleryIds={galleryImages.map((g) => g.id)}
            videoId={video?.id ?? null}
            categories={categories}
            offerId={offerId}
            title={watchedValues.title}
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

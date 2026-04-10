import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'

export interface BreadcrumbSegment {
  label: string
  href?: string
}

interface PanelBreadcrumbProps {
  segments: BreadcrumbSegment[]
  lang: string
}

export function PanelBreadcrumb({ segments, lang }: PanelBreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/${lang}/panel/dashboard`}>Panel</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment) => (
          <span key={segment.label} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {segment.href ? (
                <BreadcrumbLink asChild>
                  <Link href={`/${lang}${segment.href}`}>{segment.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{segment.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

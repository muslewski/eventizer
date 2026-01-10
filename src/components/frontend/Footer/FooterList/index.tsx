import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ConstructionIcon } from 'lucide-react'
import Link from 'next/link'

export default function FooterList({
  header,
  linkItems,
}: {
  header: string
  linkItems: { href: string; label: string; todo?: boolean }[]
}) {
  return (
    <div>
      <h3 className="md:text-4xl text-3xl font-bebas max-w-7xl text-[#D4AF37]/85">{header}</h3>

      {/* Line */}
      <div className="w-16 h-1 bg-linear-to-r from-[#D4AF37]/50 to-transparent mt-2 mb-4" />

      <ul className="flex flex-col gap-2">
        {linkItems.map((item) => (
          <li key={item.href} className={cn(item.todo && 'opacity-50 cursor-not-allowed')}>
            <Button variant="link" className="h-fit" disabled={item.todo} asChild>
              <Link href={item.href} prefetch>
                {item.todo && <ConstructionIcon />}
                <span className="max-w-42 h-fit text-wrap">{item.label}</span>
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

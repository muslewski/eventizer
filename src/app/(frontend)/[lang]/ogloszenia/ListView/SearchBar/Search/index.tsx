import { SearchIcon } from 'lucide-react'

export default function Search() {
  return (
    <div className="flex items-center gap-6 h-full bg-linear-to-r bg-black/60 border px-6 py-4 rounded-2xl w-full">
      <SearchIcon size={22} className="text-foreground/50" />
      <p className="text-foreground/50">{'Szukaj wykonawców i atrakcji'}</p>
    </div>
  )
}

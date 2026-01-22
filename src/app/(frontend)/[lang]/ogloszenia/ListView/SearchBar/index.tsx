import { Search, Settings2Icon } from 'lucide-react'

export default function SearchBar() {
  return (
    <div className="flex gap-6 h-16 min-h-16">
      {/* Search */}
      <div className="flex items-center gap-6 h-full bg-linear-to-r bg-black/60 border px-6 py-4 rounded-2xl w-full">
        <Search size={32} className="text-foreground/50" />
        <p className="text-foreground/50">{'Szukaj wykonawców i atrakcji'}</p>
      </div>

      {/* Settings */}
      <div className="flex h-full px-6 py-4 items-center bg-black/60 border rounded-2xl">
        <Settings2Icon size={32} />
      </div>
    </div>
  )
}

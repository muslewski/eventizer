export const HorizontalLines: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-end justify-between pointer-events-none">
      <div className="h-[calc(100%-64px)] w-full bg-black/0 backdrop-blur-sm flex justify-end">
        <div className="h-full w-0.5 bg-linear-to-b from-black/35" />
      </div>

      <div className="h-[calc(100%-64px)] w-full bg-black/0 flex justify-end">
        <div className="h-full w-0.5 bg-linear-to-t from-black/35" />
      </div>

      <div className="h-[calc(100%-64px)] w-full bg-black/0 hidden md:flex justify-end">
        <div className="h-full w-0.5 bg-linear-to-b from-black/35 via-black/35" />
      </div>

      <div className="h-[calc(100%-64px)] w-full bg-black/0 backdrop-blur-sm hidden md:flex justify-end">
        <div className="h-full w-0.5 bg-linear-to-t from-black/35" />
      </div>

      <div className="h-[calc(100%-64px)] w-full bg-black/0 hidden md:flex justify-end">
        <div className="h-full w-0.5 bg-linear-to-b from-black/35" />
      </div>

      <div className="h-[calc(100%-64px)] w-full bg-black/0 hidden sm:flex justify-end">
        <div className="h-full w-0.5 bg-linear-to-b from-black/35 via-transparent" />
      </div>

      <div className="h-[calc(100%-64px)] w-full bg-black/0 flex justify-end">
        <div className="h-full w-0.5 bg-linear-to-b from-black/35 via-black/35" />
      </div>

      <div className="h-[calc(100%-64px)] w-full bg-black/0 backdrop-blur-sm flex justify-end">
        <div className="h-full w-0.5 bg-linear-to-b from-black/35 via-black/30" />
      </div>

      <div className="h-[calc(100%-64px)] w-full bg-black/0 hidden sm:flex justify-end">
        <div className="h-full w-0.5 bg-linear-to-t from-black/35 to-transparent" />
      </div>

      <div className="h-[calc(100%-64px)] w-full bg-black/0 hidden xl:flex justify-end">
        <div className="h-full w-0.5 bg-linear-to-t from-black/35 via-black/10" />
      </div>

      <div className="h-[calc(100%-64px)] w-full bg-black/0 hidden sm:flex justify-end backdrop-blur-sm">
        <div className="h-full w-0.5 bg-linear-to-b from-black/35 via-black/40" />
      </div>

      <div className="h-[calc(100%-64px)] w-full bg-black/0 hidden xl:flex justify-end">
        <div className="h-full w-0.5 bg-linear-to-b from-black/30 via-transparent" />
      </div>

      <div className="h-[calc(100%-64px)] w-full bg-black/0 flex justify-end">
        <div className="h-full w-0.5 bg-linear-to-t from-black/35 via-black/10" />
      </div>

      <div className="h-[calc(100%-64px)] w-full bg-black/0 flex justify-end">
        <div className="h-full w-0.5 bg-linear-to-t from-black/35 via-black/20" />
      </div>

      <div className="h-[calc(100%-64px)] w-full bg-black/0 hidden xl:flex justify-end">
        <div className="h-full w-0.5 bg-linear-to-b from-black/35 via-black/35" />
      </div>

      <div className="h-[calc(100%-64px)] w-full bg-black/0 hidden xl:flex justify-end">
        <div className="h-full w-0.5 bg-linear-to-b from-black/40 via-transparent" />
      </div>
    </div>
  )
}

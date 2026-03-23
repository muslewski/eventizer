/**
 * Maps a video aspect ratio string to a numeric ratio (for shadcn AspectRatio)
 * and wrapper classes (to constrain the player width for non-landscape videos).
 */
export function getVideoAspectConfig(ratio?: string | null): {
  ratio: number
  wrapperClass: string
} {
  switch (ratio) {
    case '9:16':
      return { ratio: 9 / 16, wrapperClass: 'max-w-xs sm:max-w-sm mx-auto' }
    case '1:1':
      return { ratio: 1, wrapperClass: 'max-w-lg mx-auto' }
    default:
      return { ratio: 16 / 9, wrapperClass: '' }
  }
}

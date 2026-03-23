/**
 * Maps a video aspect ratio value to Tailwind CSS classes
 * for the video container.
 */
export function getVideoAspectClasses(ratio?: string | null): string {
  switch (ratio) {
    case '9:16':
      return 'aspect-[9/16] max-h-[600px] max-w-sm mx-auto'
    case '1:1':
      return 'aspect-square max-h-[600px]'
    default:
      return 'aspect-video max-h-[600px]'
  }
}

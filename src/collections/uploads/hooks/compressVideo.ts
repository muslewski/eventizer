import type { CollectionBeforeChangeHook } from 'payload'
import { execFile } from 'child_process'
import { writeFile, readFile, unlink, stat } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'

/** Target CRF for H.264 encoding — lower = better quality, higher = smaller file */
const TARGET_CRF = '28'
/** Maximum resolution height — videos taller than this will be scaled down */
const MAX_HEIGHT = 1080

/**
 * Check whether ffmpeg is available on the system.
 */
function isFfmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    execFile('ffmpeg', ['-version'], (error) => {
      resolve(!error)
    })
  })
}

/**
 * Compress a video buffer using ffmpeg.
 * Returns the compressed buffer, or null if compression wasn't possible / beneficial.
 */
async function compressVideo(inputBuffer: Buffer, mimeType: string): Promise<Buffer | null> {
  const id = randomUUID()
  const ext = mimeType === 'video/webm' ? '.webm' : '.mp4'
  const inputPath = path.join(tmpdir(), `payload-video-in-${id}${ext}`)
  const outputPath = path.join(tmpdir(), `payload-video-out-${id}.mp4`)

  try {
    await writeFile(inputPath, inputBuffer)

    const args = [
      '-y', // overwrite output
      '-i',
      inputPath,
      '-vcodec',
      'libx264',
      '-crf',
      TARGET_CRF,
      '-preset',
      'medium',
      '-acodec',
      'aac',
      '-b:a',
      '128k',
      '-vf',
      `scale=-2:'min(${MAX_HEIGHT},ih)'`, // cap height, maintain aspect ratio
      '-movflags',
      '+faststart', // enable progressive download / streaming
      '-pix_fmt',
      'yuv420p', // broad compatibility
      outputPath,
    ]

    await new Promise<void>((resolve, reject) => {
      const proc = execFile('ffmpeg', args, { timeout: 5 * 60 * 1000 }, (error) => {
        if (error) reject(error)
        else resolve()
      })
      // pipe stderr for debugging (ffmpeg writes progress there)
      proc.stderr?.on('data', () => {
        /* intentionally silent */
      })
    })

    const outputBuffer = await readFile(outputPath)
    const inputStats = await stat(inputPath)

    // Only use compressed version if it's actually smaller
    if (outputBuffer.length < inputStats.size) {
      return outputBuffer
    }

    return null // compressed version is larger — keep original
  } finally {
    // Clean up temp files
    await unlink(inputPath).catch(() => {})
    await unlink(outputPath).catch(() => {})
  }
}

/**
 * Payload hook that compresses uploaded videos using ffmpeg when available.
 * If ffmpeg is not installed (e.g. Vercel serverless), the hook is silently skipped.
 */
export const compressVideoHook: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation !== 'create') return data

  const file = req.file
  if (!file?.data || !file.mimetype?.startsWith('video/')) return data

  const hasFfmpeg = await isFfmpegAvailable()
  if (!hasFfmpeg) {
    req.payload.logger.info(
      '[compressVideoHook] ffmpeg not found on system — skipping video compression.',
    )
    return data
  }

  try {
    req.payload.logger.info(
      `[compressVideoHook] Compressing video (${(file.data.length / (1024 * 1024)).toFixed(1)} MB)...`,
    )

    const compressed = await compressVideo(file.data, file.mimetype)

    if (compressed) {
      const savedMB = ((file.data.length - compressed.length) / (1024 * 1024)).toFixed(1)
      req.payload.logger.info(
        `[compressVideoHook] Compressed: ${(file.data.length / (1024 * 1024)).toFixed(1)} MB → ${(compressed.length / (1024 * 1024)).toFixed(1)} MB (saved ${savedMB} MB)`,
      )
      file.data = compressed
      file.size = compressed.length
      // compressed output is always mp4
      file.mimetype = 'video/mp4'
      if (file.name && !file.name.endsWith('.mp4')) {
        file.name = file.name.replace(/\.\w+$/, '.mp4')
      }
    } else {
      req.payload.logger.info('[compressVideoHook] Original video is already optimal — keeping as-is.')
    }
  } catch (err) {
    req.payload.logger.warn(
      `[compressVideoHook] Video compression failed, keeping original: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  return data
}

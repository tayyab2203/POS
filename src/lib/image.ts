export interface CompressImageOptions {
  maxWidth?: number
  quality?: number
  /** Prefer WebP when supported; falls back to JPEG */
  preferWebp?: boolean
}

/**
 * Compress an image file to a compact Base64 data URL for IndexedDB storage.
 * Target: typically under ~30KB for product/logo thumbnails.
 */
export async function compressImage(
  file: File,
  maxWidth = 250,
  quality = 0.7,
  options: CompressImageOptions = {},
): Promise<string> {
  const widthLimit = options.maxWidth ?? maxWidth
  const q = options.quality ?? quality
  const preferWebp = options.preferWebp ?? true

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, widthLimit / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Canvas not supported')
  }

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const tryWebp =
    preferWebp &&
    typeof canvas.toDataURL === 'function' &&
    canvas.toDataURL('image/webp').startsWith('data:image/webp')

  let dataUrl = canvas.toDataURL(tryWebp ? 'image/webp' : 'image/jpeg', q)

  // If still large, re-encode smaller / lower quality
  const approxBytes = Math.ceil((dataUrl.length * 3) / 4)
  if (approxBytes > 30_000) {
    const tighter = Math.min(1, 180 / Math.max(width, height))
    const w2 = Math.max(1, Math.round(width * tighter))
    const h2 = Math.max(1, Math.round(height * tighter))
    const c2 = document.createElement('canvas')
    c2.width = w2
    c2.height = h2
    const ctx2 = c2.getContext('2d')
    if (ctx2) {
      ctx2.fillStyle = '#ffffff'
      ctx2.fillRect(0, 0, w2, h2)
      ctx2.drawImage(canvas, 0, 0, w2, h2)
      dataUrl = c2.toDataURL(tryWebp ? 'image/webp' : 'image/jpeg', 0.55)
    }
  }

  return dataUrl
}

/** @deprecated Use compressImage — kept for existing call sites */
export async function compressImageToBase64(
  file: File,
  maxSize = 250,
  quality = 0.7,
): Promise<string> {
  return compressImage(file, maxSize, quality)
}

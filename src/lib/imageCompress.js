/**
 * Convierte un File de imagen a WebP comprimido usando Canvas.
 * Se ejecuta 100% en el navegador — reduce peso 30-60% sin dependencias ni costo.
 *
 * - Redimensiona a maxWidth manteniendo proporción
 * - Calidad 0.82 por defecto (buen trade-off para moda/lencería)
 * - Si la conversión falla, devuelve el archivo original
 */
export async function compressToWebp(file, { maxWidth = 1600, quality = 0.82 } = {}) {
  if (!(file instanceof File)) return file
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file

  try {
    const bitmap = await createImageBitmap(file)
    const ratio = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1
    const w = Math.round(bitmap.width * ratio)
    const h = Math.round(bitmap.height * ratio)

    const canvas = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(w, h)
      : Object.assign(document.createElement('canvas'), { width: w, height: h })

    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()

    const blob = canvas.convertToBlob
      ? await canvas.convertToBlob({ type: 'image/webp', quality })
      : await new Promise((res) => canvas.toBlob(res, 'image/webp', quality))

    if (!blob) return file
    if (blob.size >= file.size) return file  // no comprimió nada, mantener original

    const nombre = file.name.replace(/\.[^.]+$/, '') + '.webp'
    return new File([blob], nombre, { type: 'image/webp' })
  } catch (err) {
    console.warn('compressToWebp fallo, enviando original:', err)
    return file
  }
}

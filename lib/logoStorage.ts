export const LOGO_BUCKET = "logos"

export function buildLogoStoragePath(userId: string, timestamp: number, suffix: string) {
  return `${userId}/logo-${timestamp}-${suffix}.webp`
}

export function getOwnedLogoStoragePath(publicUrl: string, userId: string) {
  try {
    const url = new URL(publicUrl)
    const marker = `/${LOGO_BUCKET}/`
    const markerIndex = url.pathname.indexOf(marker)
    if (markerIndex === -1) return null
    const storagePath = decodeURIComponent(url.pathname.slice(markerIndex + marker.length))
    if (!storagePath.startsWith(`${userId}/`)) return null
    return storagePath
  } catch {
    return null
  }
}

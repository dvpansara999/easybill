export const LOGO_BUCKET = "logos";
export function buildLogoStoragePath(userId, timestamp, suffix) {
    return `${userId}/logo-${timestamp}-${suffix}.webp`;
}
export function getOwnedLogoStoragePath(source, userId) {
    const storagePath = extractLogoStoragePath(source);
    if (!storagePath)
        return null;
    return storagePath.startsWith(`${userId}/`) ? storagePath : null;
}
export function extractLogoStoragePath(source) {
    const trimmed = source.trim();
    if (!trimmed)
        return null;
    if (trimmed.includes("/") && !trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        return trimmed;
    }
    try {
        const url = new URL(trimmed);
        const marker = `/${LOGO_BUCKET}/`;
        const markerIndex = url.pathname.indexOf(marker);
        if (markerIndex === -1)
            return null;
        return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
    }
    catch {
        return null;
    }
}

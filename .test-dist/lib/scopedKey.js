export function scopedKey(key, userId) {
    return `${key}::${userId}`;
}

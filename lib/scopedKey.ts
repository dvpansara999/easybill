export function scopedKey(key: string, userId: string) {
  return `${key}::${userId}`
}


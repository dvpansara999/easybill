const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

export const DEFAULT_RESET_MONTH_DAY = "01-01"

export type ResetMonthDayOption = {
  value: string
  label: string
}

export function normalizeResetMonthDay(value: string | null | undefined) {
  if (!value) return DEFAULT_RESET_MONTH_DAY
  const match = /^(\d{2})-(\d{2})$/.exec(value)
  if (!match) return DEFAULT_RESET_MONTH_DAY

  const month = Number(match[1])
  const day = Number(match[2])

  if (month < 1 || month > 12) return DEFAULT_RESET_MONTH_DAY
  if (day !== 1) return DEFAULT_RESET_MONTH_DAY

  return `${String(month).padStart(2, "0")}-01`
}

export function formatResetMonthDayLabel(value: string) {
  const normalized = normalizeResetMonthDay(value)
  const [monthRaw, dayRaw] = normalized.split("-")
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  return `${MONTH_LABELS[month - 1]} ${String(day).padStart(2, "0")}`
}

export function formatResetMonthLabel(value: string) {
  const normalized = normalizeResetMonthDay(value)
  const [monthRaw] = normalized.split("-")
  const month = Number(monthRaw)
  return MONTH_LABELS[month - 1]
}

export function getResetMonthDayOptions(): ResetMonthDayOption[] {
  const options: ResetMonthDayOption[] = []

  for (let month = 1; month <= 12; month += 1) {
    const value = `${String(month).padStart(2, "0")}-01`
    options.push({
      value,
      label: `01 of ${MONTH_LABELS[month - 1]}`,
    })
  }

  return options
}

export const RESET_MONTH_DAY_OPTIONS = getResetMonthDayOptions()

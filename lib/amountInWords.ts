const ONES = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
]

const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

function belowHundred(value: number): string {
  if (value < 20) return ONES[value] || ""
  const tens = Math.trunc(value / 10)
  const rest = value % 10
  return rest ? `${TENS[tens]} ${ONES[rest]}` : TENS[tens]
}

function belowThousand(value: number): string {
  if (value < 100) return belowHundred(value)
  const hundreds = Math.trunc(value / 100)
  const rest = value % 100
  return rest ? `${ONES[hundreds]} Hundred ${belowHundred(rest)}` : `${ONES[hundreds]} Hundred`
}

function integerToIndianWords(value: number): string {
  if (value === 0) return ONES[0]

  const parts: string[] = []
  const crore = Math.trunc(value / 10000000)
  const lakh = Math.trunc((value % 10000000) / 100000)
  const thousand = Math.trunc((value % 100000) / 1000)
  const remainder = value % 1000

  if (crore) parts.push(`${belowThousand(crore)} Crore`)
  if (lakh) parts.push(`${belowThousand(lakh)} Lakh`)
  if (thousand) parts.push(`${belowThousand(thousand)} Thousand`)
  if (remainder) parts.push(belowThousand(remainder))

  return parts.join(" ").trim()
}

function resolveCurrencyNames(currencySymbol: string) {
  const normalized = String(currencySymbol || "").trim()
  if (normalized === "$") return { major: "Dollars", minor: "Cents" }
  if (normalized === "EUR") return { major: "Euros", minor: "Cents" }
  if (normalized === "GBP") return { major: "Pounds", minor: "Pence" }
  return { major: "Rupees", minor: "Paise" }
}

export function formatAmountInWordsIndian(
  value: number,
  options?: {
    currencySymbol?: string
    showDecimals?: boolean
  }
) {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0
  const normalized = options?.showDecimals === false
    ? Math.round(safeValue)
    : Math.round((safeValue + Number.EPSILON) * 100) / 100

  const integerPart = Math.trunc(normalized)
  const decimalPart = Math.round((normalized - integerPart) * 100)
  const currency = resolveCurrencyNames(options?.currencySymbol || "₹")

  const integerWords = integerToIndianWords(integerPart)
  if (!decimalPart) {
    return `${currency.major} ${integerWords} Only`
  }

  return `${currency.major} ${integerWords} and ${integerToIndianWords(decimalPart)} ${currency.minor} Only`
}

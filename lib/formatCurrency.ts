function trimFractionalZeros(value: string): string {
  const [intPart, fracPart] = value.split(".")
  if (fracPart === undefined) return value
  const trimmedFrac = fracPart.replace(/0+$/, "")
  if (trimmedFrac === "") return intPart
  return `${intPart}.${trimmedFrac}`
}

function formatIndianLakhCroreCore(absAmount: number, unit: "L" | "Cr"): string {
  const divisor = unit === "L" ? 100_000 : 10_000_000
  const v = absAmount / divisor
  let text: string
  if (v < 10) {
    text = trimFractionalZeros(v.toFixed(2))
  } else if (v < 100) {
    text = trimFractionalZeros(v.toFixed(1))
  } else {
    text = String(Math.round(v))
  }
  return `${text}${unit}`
}

/**
 * Dashboard Quick Stats (narrow viewports): full amount below ₹1L; ₹1L–<₹1Cr as X.XXL; ≥₹1Cr as X.XXCr.
 */
export function formatCurrencyQuickStatsMobile(
  amount: number,
  symbol: string,
  position: "before" | "after",
  showDecimals: boolean,
  amountFormat: string
): string {
  const n = Number(amount)
  if (!Number.isFinite(n)) {
    return formatCurrency(0, symbol, position, showDecimals, amountFormat)
  }

  const abs = Math.abs(n)
  if (abs < 100_000) {
    return formatCurrency(n, symbol, position, showDecimals, amountFormat)
  }

  const normalizedSymbol = symbol === "Rs" ? "₹" : symbol
  const sign = n < 0 ? "-" : ""
  const core = abs < 10_000_000 ? formatIndianLakhCroreCore(abs, "L") : formatIndianLakhCroreCore(abs, "Cr")

  if (position === "before") {
    return `${sign}${normalizedSymbol}${core}`
  }
  return `${sign}${core} ${normalizedSymbol}`
}

export function formatCurrency(
  amount: number,
  symbol: string,
  position: "before" | "after",
  showDecimals: boolean,
  amountFormat: string
) {

  // Backwards compatibility: older saved preference used "Rs" for Indian Rupee.
  // Normalize to the correct ₹ symbol so all places render consistently.
  const normalizedSymbol = symbol === "Rs" ? "₹" : symbol

  const formattedNumber = new Intl.NumberFormat(
    amountFormat === "indian" ? "en-IN" : "en-US",
    {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0
    }
  ).format(amount)

  if (position === "before") {
    return `${normalizedSymbol}${formattedNumber}`
  } else {
    return `${formattedNumber} ${normalizedSymbol}`
  }

}
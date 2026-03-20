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
export function formatCurrency(
  amount: number,
  symbol: string,
  position: "before" | "after",
  showDecimals: boolean,
  amountFormat: string
) {

  const formattedNumber = new Intl.NumberFormat(
    amountFormat === "indian" ? "en-IN" : "en-US",
    {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0
    }
  ).format(amount)

  if (position === "before") {
    return `${symbol}${formattedNumber}`
  } else {
    return `${formattedNumber} ${symbol}`
  }

}
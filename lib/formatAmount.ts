export function formatAmount(
value:number | null | undefined,
amountFormat:string,
showDecimals:boolean
){

if(value === null || value === undefined){
return "0"
}

const locale = amountFormat === "indian" ? "en-IN" : "en-US"

const formatted = new Intl.NumberFormat(locale,{
minimumFractionDigits: showDecimals ? 2 : 0,
maximumFractionDigits: showDecimals ? 2 : 0
}).format(value)

return formatted

}
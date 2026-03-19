export function generateInvoiceNumber(
  invoices:any[],
  prefix:string,
  padding:number,
  startNumber:number,
  resetYearly:boolean
){

  const currentYear = new Date().getFullYear()

  let filtered = invoices

  if(resetYearly){
    filtered = invoices.filter((inv:any)=>{
      const year = new Date(inv.date).getFullYear()
      return year === currentYear
    })
  }

  let maxNumber = startNumber - 1

  filtered.forEach((inv:any)=>{

    const num = Number(inv.invoiceNumber.replace(/\D/g,""))

    if(num > maxNumber){
      maxNumber = num
    }

  })

  const nextNumber = maxNumber + 1

  const padded = String(nextNumber).padStart(padding,"0")

  return `${prefix}${padded}`

}
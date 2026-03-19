import { NextResponse } from "next/server"
import { chromium } from "playwright"

export async function POST(req: Request){

const { invoice, template, settings, businessProfile, mode, typography } = await req.json()

const browser = await chromium.launch({
executablePath:"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
headless:true
})

const page = await browser.newPage()

await page.goto("http://localhost:3000/invoice-print")

await page.evaluate(({ invoiceData, templateId, exportSettings, businessData, typographySettings })=>{

localStorage.setItem("pdfInvoice",JSON.stringify(invoiceData))

if(templateId){
localStorage.setItem("invoiceTemplate",templateId)
}

if(businessData){
localStorage.setItem("businessProfile",businessData)
}

if(exportSettings){
if(exportSettings.dateFormat){
localStorage.setItem("dateFormat",exportSettings.dateFormat)
}

if(exportSettings.amountFormat){
localStorage.setItem("amountFormat",exportSettings.amountFormat)
}

if(typeof exportSettings.showDecimals === "boolean"){
localStorage.setItem("showDecimals",String(exportSettings.showDecimals))
}

if(exportSettings.currencySymbol){
localStorage.setItem("currencySymbol",exportSettings.currencySymbol)
}

if(exportSettings.currencyPosition){
localStorage.setItem("currencyPosition",exportSettings.currencyPosition)
}

if(exportSettings.invoiceVisibility){
try{
localStorage.setItem("invoiceVisibility",JSON.stringify(exportSettings.invoiceVisibility))
}catch{}
}
}

if(typographySettings?.fontId){
localStorage.setItem("invoiceTemplateFontId",typographySettings.fontId)
}

if(typographySettings?.fontSize){
localStorage.setItem("invoiceTemplateFontSize",String(typographySettings.fontSize))
}

},{
invoiceData: invoice,
templateId: template,
exportSettings: settings,
businessData: businessProfile,
typographySettings: typography
})

await page.reload()

await page.waitForSelector('#invoice-print-root[data-ready="true"]')
await page.waitForFunction(() => document.body.innerText.trim().length > 0)

const pdf = await page.pdf({
format:"A4",
printBackground:true
})

await browser.close()

const pdfBytes = new Uint8Array(pdf)

return new NextResponse(pdfBytes,{
headers:{
"Content-Type":"application/pdf",
"Content-Disposition": mode === "print"
? "inline"
: `attachment; filename=Invoice-${invoice.invoiceNumber}.pdf`,
"Cache-Control":"no-store"
}
})

}

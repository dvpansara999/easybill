"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getActiveOrGlobalItem, setActiveOrGlobalItem } from "@/lib/userStore"

type BusinessType = {
  businessName:string
  phone:string
  email:string
  gst:string
  address:string
  bankName:string
  accountNumber:string
  ifsc:string
  upi:string
  logo:string
  logoShape:"square" | "round"
}

const BusinessContext = createContext<any>(null)

export function BusinessProvider({children}:{children:React.ReactNode}){

const [business,setBusinessState] = useState<BusinessType>({
  businessName:"",
  phone:"",
  email:"",
  gst:"",
  address:"",
  bankName:"",
  accountNumber:"",
  ifsc:"",
  upi:"",
  logo:"",
  logoShape:"square"
})

/* LOAD FROM LOCAL STORAGE */

function loadBusiness() {
  const stored = getActiveOrGlobalItem("businessProfile")
  if (!stored) return
  try {
    const parsed = JSON.parse(stored)
    setBusinessState({
      businessName: parsed.businessName || "",
      phone: parsed.phone || "",
      email: parsed.email || "",
      gst: parsed.gst || "",
      address: parsed.address || "",
      bankName: parsed.bankName || "",
      accountNumber: parsed.accountNumber || "",
      ifsc: parsed.ifsc || "",
      upi: parsed.upi || "",
      logo: parsed.logo || "",
      logoShape: (parsed.logoShape === "round" ? "round" : "square") as "square" | "round",
    })
  } catch {
    // ignore invalid
  }
}

useEffect(()=>{
  loadBusiness()
  function onCloud() {
    loadBusiness()
  }
  window.addEventListener("easybill:cloud-sync", onCloud as EventListener)
  return () => window.removeEventListener("easybill:cloud-sync", onCloud as EventListener)
},[])

/* SAVE FUNCTION */

const setBusiness = (data:BusinessType)=>{

const normalizedBusiness: BusinessType = {
  ...data,
  logoShape: (data.logoShape === "round" ? "round" : "square") as "square" | "round"
}

setBusinessState(normalizedBusiness)

setActiveOrGlobalItem("businessProfile",JSON.stringify(normalizedBusiness))

}

return(

<BusinessContext.Provider value={{business,setBusiness}}>
{children}
</BusinessContext.Provider>

)

}

export function useBusiness(){

const context = useContext(BusinessContext)

if(!context){
throw new Error("useBusiness must be used inside BusinessProvider")
}

return context

}

"use client"

import { useState, useRef, useEffect } from "react"

export default function SoftSelect({
value,
options,
onChange
}:{
value:any
options:{label:string,value:any}[]
onChange:(v:any)=>void
}){

const [open,setOpen] = useState(false)
const ref = useRef<HTMLDivElement>(null)

useEffect(()=>{

function close(e:any){
if(ref.current && !ref.current.contains(e.target)){
setOpen(false)
}
}

document.addEventListener("mousedown",close)
return ()=>document.removeEventListener("mousedown",close)

},[])

const current = options.find(o=>o.value===value)

return(

<div className="relative w-44" ref={ref}>

<button
onClick={()=>setOpen(!open)}
className="w-full text-left px-3 py-2 rounded-lg bg-white/70 backdrop-blur border border-white/60 shadow-sm hover:bg-white/90 transition"
>
{current?.label}
</button>

{open && (

<div className="absolute mt-2 w-full rounded-xl backdrop-blur-xl bg-white/80 border border-white/60 shadow-xl overflow-hidden animate-[fadeIn_.15s_ease]">

{options.map(opt=>(

<div
key={opt.value}
onClick={()=>{
onChange(opt.value)
setOpen(false)
}}
className="px-3 py-2 hover:bg-white/60 cursor-pointer transition"
>
{opt.label}
</div>

))}

</div>

)}

</div>

)

}
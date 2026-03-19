"use client"

import { useState, useEffect } from "react"
import { useSettings } from "@/context/SettingsContext"
import { formatCurrency } from "@/lib/formatCurrency"
import { Box, PencilLine, Plus, Trash2 } from "lucide-react"
import { getActiveOrGlobalItem, setActiveOrGlobalItem } from "@/lib/userStore"
import { getMaxProducts } from "@/lib/plans"
import { useAppAlert } from "@/components/providers/AppAlertProvider"

export default function ProductsPage() {

  const {
    amountFormat,
    showDecimals,
    currencySymbol,
    currencyPosition
  } = useSettings()

  const [products,setProducts] = useState<any[]>([])
  const [name,setName] = useState("")
  const [hsn,setHsn] = useState("")
  const [unit,setUnit] = useState("")
  const [price,setPrice] = useState("")
  const [cgst,setCgst] = useState("")
  const [sgst,setSgst] = useState("")
  const [igst,setIgst] = useState("")
  const [editIndex,setEditIndex] = useState<number | null>(null)
  const { showAlert } = useAppAlert()

  useEffect(()=>{

    const saved = getActiveOrGlobalItem("products")

    if(saved){
      setProducts(JSON.parse(saved))
    }

  },[])

  const saveProduct = () => {
    const maxProducts = getMaxProducts()
    if (editIndex === null && typeof maxProducts === "number" && products.length >= maxProducts) {
      showAlert({
        tone: "warning",
        title: "Product limit reached (Free plan)",
        message: "You can save up to 3 products on Free. Delete one to add another, or upgrade to Plus.",
        primaryLabel: "OK",
      })
      return
    }

    const product = {
      name,
      hsn,
      unit,
      price,
      cgst,
      sgst,
      igst
    }

    const updated = [...products]

    if(editIndex !== null){
      updated[editIndex] = product
      setEditIndex(null)
    }else{
      updated.push(product)
    }

    setProducts(updated)
    setActiveOrGlobalItem("products",JSON.stringify(updated))

    setName("")
    setHsn("")
    setUnit("")
    setPrice("")
    setCgst("")
    setSgst("")
    setIgst("")
  }

  const editProduct = (index:number) => {

    const p = products[index]

    setName(p.name)
    setHsn(p.hsn)
    setUnit(p.unit)
    setPrice(p.price)
    setCgst(p.cgst)
    setSgst(p.sgst)
    setIgst(p.igst)
    setEditIndex(index)
  }

  const deleteProduct = (index:number) => {

    const updated = [...products]
    updated.splice(index,1)

    setProducts(updated)
    setActiveOrGlobalItem("products",JSON.stringify(updated))

  }

  function money(value:number){

    return formatCurrency(
      Number(value),
      currencySymbol,
      currencyPosition,
      showDecimals,
      amountFormat
    )

  }

  return (

    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-emerald-700">Products</p>
          <h1 className="font-display mt-3 text-4xl text-slate-950">Build your reusable product library.</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
            Save pricing, HSN, unit, and GST once so creating invoices in easyBILL stays fast and consistent.
          </p>
        </div>

        <div className="soft-card rounded-[28px] p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <Box className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-500">Saved Products</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{products.length}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="soft-card rounded-[28px] p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="section-title text-2xl">{editIndex !== null ? "Edit Product" : "Add Product"}</h2>
              <p className="mt-1 text-sm text-slate-500">Save invoice-ready product details with tax values.</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Plus className="h-5 w-5" />
            </div>
          </div>

          <div className="space-y-4">
            <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" placeholder="Product Name" value={name} onChange={(e)=>setName(e.target.value)} />
            <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" placeholder="HSN Code" value={hsn} onChange={(e)=>setHsn(e.target.value)} />
            <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" placeholder="Unit (Bag / Kg / Piece)" value={unit} onChange={(e)=>setUnit(e.target.value)} />
            <input type="number" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" placeholder="Price" value={price} onChange={(e)=>setPrice(e.target.value)} />

            <div className="grid gap-4 md:grid-cols-3">
              <input type="number" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" placeholder="CGST %" value={cgst} onChange={(e)=>setCgst(e.target.value)} />
              <input type="number" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" placeholder="SGST %" value={sgst} onChange={(e)=>setSgst(e.target.value)} />
              <input type="number" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" placeholder="IGST %" value={igst} onChange={(e)=>setIgst(e.target.value)} />
            </div>

            <button
              onClick={saveProduct}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              {editIndex !== null ? "Update Product" : "Save Product"}
            </button>
          </div>
        </div>

        <div className="soft-card rounded-[28px] p-6">
          <h2 className="section-title mb-5 text-2xl">Saved Products</h2>

          <div className="overflow-hidden rounded-[24px] border border-slate-200/70">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80">
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">HSN</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((p,index)=>(
                  <tr key={index} className="border-b border-slate-100">
                    <td className="px-4 py-4 font-medium text-slate-900">{p.name}</td>
                    <td className="px-4 py-4">{p.hsn}</td>
                    <td className="px-4 py-4">{p.unit}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">{money(p.price)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={()=>editProduct(index)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
                          <PencilLine className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        <button onClick={()=>deleteProduct(index)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100">
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>

  )

}

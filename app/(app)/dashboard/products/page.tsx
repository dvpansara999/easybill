"use client"

import { useMemo, useState } from "react"
import { useSettings } from "@/context/SettingsContext"
import { formatCurrency } from "@/lib/formatCurrency"
import { ChevronLeft, ChevronRight, PencilLine, Plus, Search, Trash2 } from "lucide-react"
import { getActiveOrGlobalItem, setActiveOrGlobalItem } from "@/lib/userStore"
import { getMaxProducts } from "@/lib/plans"
import { useAppAlert } from "@/components/providers/AppAlertProvider"

type ProductRecord = {
  name: string
  hsn: string
  unit: string
  price: string
  cgst: string
  sgst: string
  igst: string
}

const PRODUCTS_PER_PAGE = 10

function readProducts(): ProductRecord[] {
  const saved = getActiveOrGlobalItem("products")
  if (!saved) return []

  try {
    const parsed = JSON.parse(saved) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((product): product is ProductRecord => {
      return typeof product === "object" && product !== null && "name" in product
    })
  } catch {
    return []
  }
}

export default function ProductsPage() {

  const {
    amountFormat,
    showDecimals,
    currencySymbol,
    currencyPosition
  } = useSettings()

  const [products,setProducts] = useState<ProductRecord[]>(() => readProducts())
  const [name,setName] = useState("")
  const [hsn,setHsn] = useState("")
  const [unit,setUnit] = useState("")
  const [price,setPrice] = useState("")
  const [cgst,setCgst] = useState("")
  const [sgst,setSgst] = useState("")
  const [igst,setIgst] = useState("")
  const [editIndex,setEditIndex] = useState<number | null>(null)
  const [query,setQuery] = useState("")
  const [page,setPage] = useState(1)
  const { showAlert } = useAppAlert()
  const maxProducts = getMaxProducts()
  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const newestFirst = products
      .map((product, index) => ({ product, index }))
      .reverse()
    if (!normalized) return newestFirst
    return newestFirst.filter(({ product }) => {
      return (
        product.name.toLowerCase().includes(normalized) ||
        product.hsn.toLowerCase().includes(normalized)
      )
    })
  }, [products, query])
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE)
  }, [filteredProducts, currentPage])

  const saveProduct = () => {
    if (editIndex === null && typeof maxProducts === "number" && products.length >= maxProducts) {
      showAlert({
        tone: "warning",
        title: "Product limit reached (Free plan)",
        actionHint: "Delete an existing product or upgrade to Plus to add more.",
        message: "You can save up to 3 products on Free. Delete one to add another, or upgrade to Plus.",
      })
      return
    }

    const product: ProductRecord = {
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

  function money(value:number | string){

    return formatCurrency(
      Number(value),
      currencySymbol,
      currencyPosition,
      showDecimals,
      amountFormat
    )

  }

  return (

    <div className="space-y-6 pb-6 xl:space-y-8 xl:pb-0">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="app-kicker">Products</p>
          <h1 className="app-page-title mt-2 text-2xl sm:text-3xl xl:mt-3 xl:text-4xl">Products and pricing.</h1>
          <p className="app-page-copy mt-2 max-w-xl text-xs sm:mt-3 sm:text-sm">
            Save invoice-ready product details once, then reuse them while creating bills.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:min-w-[360px]">
          <div className="app-stat-card rounded-[20px] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Saved</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">{products.length}</p>
          </div>
          <div className="app-stat-card rounded-[20px] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Plan</p>
            <p className="mt-2 truncate text-xl font-semibold text-slate-950">{typeof maxProducts === "number" ? `${products.length}/${maxProducts}` : "Unlimited"}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(340px,0.82fr)_minmax(0,1.18fr)]">
        <div className="soft-card rounded-[24px] p-4 sm:p-6 xl:rounded-[28px]">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="app-kicker">{editIndex !== null ? "Editing" : "New Product"}</p>
              <h2 className="section-title mt-2 text-xl sm:text-2xl">{editIndex !== null ? "Update product." : "Add product."}</h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Plus className="h-5 w-5" />
            </div>
          </div>

          <div className="space-y-3.5">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Product Name</span>
              <input className="app-input h-[54px] w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition" placeholder="e.g. Website design" value={name} onChange={(e)=>setName(e.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">HSN</span>
                <input className="app-input h-[54px] w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition" placeholder="Code" value={hsn} onChange={(e)=>setHsn(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Unit</span>
                <input className="app-input h-[54px] w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition" placeholder="pcs, hr" value={unit} onChange={(e)=>setUnit(e.target.value)} />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Price</span>
              <input type="number" className="app-input h-[54px] w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition" placeholder="0.00" value={price} onChange={(e)=>setPrice(e.target.value)} />
            </label>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">CGST</span>
                <input type="number" className="app-input h-[54px] w-full rounded-2xl px-3 py-3.5 text-sm outline-none transition" placeholder="%" value={cgst} onChange={(e)=>setCgst(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">SGST</span>
                <input type="number" className="app-input h-[54px] w-full rounded-2xl px-3 py-3.5 text-sm outline-none transition" placeholder="%" value={sgst} onChange={(e)=>setSgst(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">IGST</span>
                <input type="number" className="app-input h-[54px] w-full rounded-2xl px-3 py-3.5 text-sm outline-none transition" placeholder="%" value={igst} onChange={(e)=>setIgst(e.target.value)} />
              </label>
            </div>

            <button
              type="button"
              onClick={saveProduct}
              className="app-primary-button mt-1 inline-flex w-full touch-manipulation items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold active:scale-[0.99] xl:mt-0 xl:w-auto xl:justify-start xl:py-3"
            >
              <Plus className="h-4 w-4 shrink-0" />
              {editIndex !== null ? "Update Product" : "Save Product"}
            </button>
          </div>
        </div>

        <div className="soft-card rounded-[24px] p-4 sm:p-6 xl:rounded-[28px]">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="app-kicker">Catalog</p>
              <h2 className="section-title mt-2 text-xl sm:text-2xl">Saved products.</h2>
            </div>
            <label className="app-subtle-panel flex h-12 items-center gap-2 rounded-2xl px-4 lg:w-[280px]">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                placeholder="Search name or HSN"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
              />
            </label>
          </div>

          {/* Mobile: card list */}
          <div className="space-y-3 lg:hidden">
            {filteredProducts.length === 0 ? (
              <div className="rounded-[24px] border border-slate-200/70 bg-white p-6 text-center text-sm text-slate-500">
                {products.length === 0 ? "No products saved" : "No products match your search"}
              </div>
            ) : (
              paginatedProducts.map(({ product: p, index }) => {
                return (
                <div key={index} className="app-mobile-card rounded-[22px] p-3.5 sm:rounded-[24px] sm:p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{p.name}</p>
                      <p className="mt-1 truncate text-xs text-slate-600 sm:text-sm">{p.hsn || "No HSN"} · {p.unit || "No unit"}</p>
                      <p className="mt-0.5 text-xs text-slate-500">GST {Number(p.cgst || 0) + Number(p.sgst || 0) + Number(p.igst || 0)}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Price</p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">{money(p.price)}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => editProduct(index)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
                      aria-label="Edit product"
                      title="Edit product"
                    >
                      <PencilLine className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteProduct(index)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
                      aria-label="Delete product"
                      title="Delete product"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                )
              })
            )}
          </div>

          {/* Desktop: keep existing table */}
          <div className="hidden lg:block">
            <div className="app-table-shell rounded-[24px]">
              <table className="w-full text-sm">
                <thead className="app-table-head">
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">HSN</th>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Tax</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                        {products.length === 0 ? "No products saved" : "No products match your search"}
                      </td>
                    </tr>
                  ) : null}
                  {paginatedProducts.map(({ product: p, index }) => {
                    return (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="px-4 py-4 font-medium text-slate-900">{p.name}</td>
                      <td className="px-4 py-4">{p.hsn}</td>
                      <td className="px-4 py-4">{p.unit}</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{money(p.price)}</td>
                      <td className="px-4 py-4">{Number(p.cgst || 0) + Number(p.sgst || 0) + Number(p.igst || 0)}%</td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => editProduct(index)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                          >
                            <PencilLine className="h-3.5 w-3.5" />
                            Edit
                          </button>

                          <button
                            onClick={() => deleteProduct(index)}
                            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filteredProducts.length > PRODUCTS_PER_PAGE ? (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing {(currentPage - 1) * PRODUCTS_PER_PAGE + 1}-{Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={currentPage === 1}
                  className="app-secondary-button inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <span className="text-sm font-semibold text-slate-600">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={currentPage === totalPages}
                  className="app-secondary-button inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>

  )

}

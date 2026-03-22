import { defaultTemplateTypography } from "@/lib/templateTypography"

export const previewBusiness = {
  businessName: "ABC BUSINESS",
  address: "Surat, Gujarat",
  phone: "1234567890",
  email: "abc@email.com",
  gst: "24ABCDE1234F1Z5",
  logo: "/logo.png",
  bankName: "HDFC Bank",
  accountNumber: "XXXX123456",
  ifsc: "HDFC0001234",
  upi: "abc@upi",
  terms: "Payment due within 7 days.",
}

export const previewInvoice = {
  isPreview: true,
  invoiceNumber: "INV-0001",
  date: "2026-01-01",
  clientName: "John Doe",
  clientPhone: "9876543210",
  clientEmail: "john@example.com",
  clientGST: "24AAAAA0000A1Z5",
  clientAddress: "Mumbai, India",
  customDetails: [
    { label: "Project", value: "Landscape Work" },
  ],
  items: [
    {
      product: "Product A",
      hsn: "9987",
      qty: 2,
      price: 500,
      cgst: 9,
      sgst: 9,
      igst: 0,
      total: 1180,
    },
    {
      product: "Product B",
      hsn: "9983",
      qty: 1,
      price: 300,
      cgst: 9,
      sgst: 9,
      igst: 0,
      total: 354,
    },
  ],
  grandTotal: 1534,
}

function previewMoney(value: number) {
  return `₹ ${value}`
}

function previewGstDisplay(rate: string | number | null | undefined, amount: number) {
  if (!rate || rate === "" || rate === "0") {
    return "-"
  }

  return `${previewMoney(amount)} (${rate}%)`
}

export const previewTemplateProps = {
  invoice: previewInvoice,
  business: previewBusiness,
  fontFamily: defaultTemplateTypography.fontFamily,
  fontSize: defaultTemplateTypography.fontSize,
  subtotal: 1300,
  totalCGST: 117,
  totalSGST: 117,
  totalIGST: 0,
  money: previewMoney,
  gstDisplay: previewGstDisplay,
  formatDate: (date: string) => date,
  dateFormat: "DD/MM/YYYY",
}

import { normalizeCustomerGstin, normalizeCustomerPhone } from "./customerIdentity";
export function valid() {
    return { ok: true };
}
export function invalid(message) {
    return { ok: false, message };
}
export function validateGstin(value) {
    const gstin = normalizeCustomerGstin(value);
    if (!gstin)
        return valid();
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)
        ? valid()
        : invalid("GSTIN must match the official 15-character format, for example 24ABCDE1234F1Z5.");
}
export function validateCustomerContact(input) {
    if (normalizeCustomerPhone(input.phone) || normalizeCustomerGstin(input.gst))
        return valid();
    return invalid("Add either phone number or GSTIN for this customer.");
}
export function validateInvoiceItem(item) {
    if (!item.product.trim())
        return invalid("Each invoice item needs a product name.");
    if (Number(item.qty || 0) <= 0)
        return invalid("Each invoice item needs a quantity greater than 0.");
    if (Number(item.price || 0) <= 0)
        return invalid("Each invoice item needs a price greater than 0.");
    if (Number(item.total || 0) < 0)
        return invalid("Invoice item totals cannot be negative.");
    return valid();
}
export function validateInvoiceForPersistence(invoice) {
    if (!invoice.invoiceNumber)
        return invalid("Invoice number is required.");
    if (!invoice.date)
        return invalid("Invoice date is required.");
    if (!invoice.clientName.trim())
        return invalid("Client name is required.");
    const contact = validateCustomerContact({ phone: invoice.clientPhone, gst: invoice.clientGST });
    if (!contact.ok)
        return contact;
    const gst = validateGstin(invoice.clientGST);
    if (!gst.ok)
        return gst;
    if (!invoice.items.length)
        return invalid("Add at least one invoice item.");
    for (const item of invoice.items) {
        const result = validateInvoiceItem(item);
        if (!result.ok)
            return result;
    }
    return valid();
}
export function validateProductForPersistence(product) {
    if (!String(product.name || "").trim())
        return invalid("Product name is required.");
    if (Number(product.price || 0) < 0)
        return invalid("Product price cannot be negative.");
    return valid();
}
export function validateCustomerForPersistence(customer) {
    if (!String(customer.name || "").trim())
        return invalid("Customer name is required.");
    const contact = validateCustomerContact({
        phone: typeof customer.phone === "string" ? customer.phone : "",
        gst: typeof customer.gst === "string" ? customer.gst : "",
    });
    if (!contact.ok)
        return contact;
    return validateGstin(typeof customer.gst === "string" ? customer.gst : "");
}

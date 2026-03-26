export const TEST_USER_ID = "user-e2e-001";
export const TEST_USER_EMAIL = "qa@easybill.test";
export function makeInvoiceSeed(overrides = {}) {
    return {
        id: "inv-e2e-001",
        invoiceNumber: "INV-0001",
        clientName: "Raj",
        clientPhone: "9999999999",
        clientEmail: "raj@example.com",
        clientGST: "24ABCDE1234F1Z5",
        clientAddress: "Raj Complex, Vadodara",
        date: "2026-03-01",
        customDetails: [],
        items: [
            {
                product: "Consultation",
                hsn: "9983",
                qty: 1,
                unit: "pcs",
                price: 1000,
                cgst: 0,
                sgst: 0,
                igst: 0,
                total: 1000,
            },
        ],
        grandTotal: 1000,
        ...overrides,
    };
}
export async function seedAuthenticatedWorkspace(page, state = {}) {
    const payload = {
        userId: TEST_USER_ID,
        email: TEST_USER_EMAIL,
        businessProfile: {
            businessName: "Dr.DOCTOR",
            address: "Vadodara, Gujarat",
            gst: "DOCTOR0001737",
            phone: "9911882233",
            email: "drdoctor@example.com",
            bankName: "HDFC Bank",
            accountNumber: "1234567890",
            ifsc: "HDFC0001234",
            upi: "doctor@upi",
            terms: "Payment due within 7 days.",
            logo: "",
            logoShape: "square",
            ...(state.businessProfile || {}),
        },
        settings: {
            dateFormat: "YYYY-MM-DD",
            amountFormat: "indian",
            showDecimals: "true",
            invoicePrefix: "INV-",
            invoicePadding: "4",
            invoiceStartNumber: "1",
            resetYearly: "true",
            invoiceResetMonthDay: "01-01",
            currencySymbol: "?",
            currencyPosition: "before",
            invoiceVisibility: JSON.stringify({
                showBusinessLogo: true,
                showBusinessName: true,
                showBusinessPhone: true,
                showBusinessEmail: true,
                showBusinessGst: true,
                showBusinessAddress: true,
                showBankDetails: true,
                showTerms: true,
                showClientPhone: true,
                showClientEmail: true,
                showClientGst: true,
                showClientAddress: true,
            }),
            ...(state.settings || {}),
        },
        invoices: state.invoices || [],
        products: state.products || [],
        invoiceTemplate: state.invoiceTemplate || "classic-default",
        invoiceTemplateFontId: state.invoiceTemplateFontId || "system",
        invoiceTemplateFontSize: String(state.invoiceTemplateFontSize || 10),
        subscriptionPlanId: state.subscriptionPlanId || "plus",
        invoiceUsageCount: String(state.invoiceUsageCount ?? state.invoices?.length ?? 0),
    };
    await page.addInitScript((seed) => {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem("authAccounts:v2", JSON.stringify([
            {
                userId: seed.userId,
                email: seed.email,
                salt: "seed",
                hash: "seed",
            },
        ]));
        localStorage.setItem("authLastUserId", seed.userId);
        sessionStorage.setItem("authActiveUserId", seed.userId);
        localStorage.setItem("businessProfile::" + seed.userId, JSON.stringify(seed.businessProfile));
        localStorage.setItem("invoices::" + seed.userId, JSON.stringify({ schemaVersion: 2, invoices: seed.invoices }));
        localStorage.setItem("products::" + seed.userId, JSON.stringify(seed.products));
        localStorage.setItem("invoiceTemplate::" + seed.userId, seed.invoiceTemplate);
        localStorage.setItem("invoiceTemplateFontId::" + seed.userId, seed.invoiceTemplateFontId);
        localStorage.setItem("invoiceTemplateFontSize::" + seed.userId, seed.invoiceTemplateFontSize);
        localStorage.setItem("subscriptionPlanId::" + seed.userId, seed.subscriptionPlanId);
        localStorage.setItem("invoiceUsageCount::" + seed.userId, seed.invoiceUsageCount);
        localStorage.setItem("invoiceUsageInitialized:v1::" + seed.userId, "1");
        for (const [key, value] of Object.entries(seed.settings)) {
            localStorage.setItem(key + "::" + seed.userId, String(value));
        }
    }, payload);
}
export async function getStoredInvoices(page) {
    return await page.evaluate((userId) => {
        const raw = localStorage.getItem(`invoices::${userId}`);
        if (!raw)
            return [];
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed))
                return parsed;
            return Array.isArray(parsed?.invoices) ? parsed.invoices : [];
        }
        catch {
            return [];
        }
    }, TEST_USER_ID);
}
export async function getBusinessProfile(page) {
    return await page.evaluate((userId) => {
        const raw = localStorage.getItem(`businessProfile::${userId}`);
        return raw ? JSON.parse(raw) : null;
    }, TEST_USER_ID);
}
export async function chooseDesktopSelectOption(page, triggerLabel, optionLabel) {
    await page.getByRole("button", { name: triggerLabel, exact: true }).click();
    await page.getByRole("option", { name: optionLabel, exact: true }).click();
}
export function createPngBuffer(base64) {
    return Buffer.from(base64, "base64");
}
export const RED_DOT_PNG = createPngBuffer("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnRkY4AAAAASUVORK5CYII=");
export const BLUE_DOT_PNG = createPngBuffer("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAusB9Y1x0uoAAAAASUVORK5CYII=");
export const PDF_BYTES = Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 72 120 Td (easyBILL test PDF) Tj ET
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF`, "utf-8");

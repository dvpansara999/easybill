import { expect, test } from "playwright/test";
import { BLUE_DOT_PNG, RED_DOT_PNG, getBusinessProfile, makeInvoiceSeed, seedAuthenticatedWorkspace, } from "./helpers";
test("business profile logo, terms, and identity apply through invoice view", async ({ page }) => {
    const seededInvoice = makeInvoiceSeed({ id: "inv-business-001", invoiceNumber: "DOC-001" });
    await seedAuthenticatedWorkspace(page, {
        settings: {
            invoicePrefix: "DOC-",
            invoicePadding: "3",
            invoiceStartNumber: "1",
            resetYearly: "true",
            invoiceResetMonthDay: "03-01",
        },
        invoices: [seededInvoice],
    });
    await page.goto("/dashboard/business");
    await page.getByPlaceholder("Business Name").fill("Dr.DOCTOR Labs");
    await page.getByPlaceholder("Email").fill("contact@drdoctor.test");
    await page.locator('input[type="file"]').first().setInputFiles({
        name: "logo-red.png",
        mimeType: "image/png",
        buffer: RED_DOT_PNG,
    });
    await page.getByRole("button", { name: "Save Business Profile" }).click();
    await expect(page.getByText("Business profile saved")).toBeVisible();
    await page.getByRole("button", { name: "Got it" }).click();
    let business = await getBusinessProfile(page);
    expect(String(business?.businessName)).toBe("Dr.DOCTOR Labs");
    const firstLogo = String(business?.logo || "");
    expect(firstLogo.startsWith("data:image/")).toBeTruthy();
    await page.goto(`/dashboard/invoices/view/${seededInvoice.id}`);
    await expect(page.getByText("Dr.DOCTOR Labs")).toBeVisible();
    await expect(page.getByText("Payment due within 7 days.")).toBeVisible();
    await expect(page.locator('img[src^="data:image/"]').first()).toBeVisible();
    await page.goto("/dashboard/business");
    await page.locator('input[type="file"]').first().setInputFiles({
        name: "logo-blue.png",
        mimeType: "image/png",
        buffer: BLUE_DOT_PNG,
    });
    await page.getByRole("button", { name: "Save Business Profile" }).click();
    await expect(page.getByText("Business profile saved")).toBeVisible();
    await page.getByRole("button", { name: "Got it" }).click();
    business = await getBusinessProfile(page);
    const secondLogo = String(business?.logo || "");
    expect(secondLogo.startsWith("data:image/")).toBeTruthy();
    expect(secondLogo).not.toBe(firstLogo);
    await page.getByRole("button", { name: "Remove" }).click();
    await page.getByRole("button", { name: "Save Business Profile" }).click();
    await expect(page.getByText("Business profile saved")).toBeVisible();
    await page.getByRole("button", { name: "Got it" }).click();
    business = await getBusinessProfile(page);
    expect(String(business?.logo || "")).toBe("");
});
test("setup wizard persists profile and settings into the workspace", async ({ page }) => {
    await seedAuthenticatedWorkspace(page, {
        businessProfile: {
            businessName: "",
            address: "",
            gst: "",
            phone: "",
            email: "",
            bankName: "",
            accountNumber: "",
            ifsc: "",
            upi: "",
            terms: "",
            logo: "",
            logoShape: "square",
        },
        settings: {
            invoicePrefix: "INV-",
            invoicePadding: "4",
            invoiceStartNumber: "1",
            resetYearly: "true",
            invoiceResetMonthDay: "01-01",
        },
        invoices: [],
    });
    await page.goto("/setup/profile?businessName=Setup Clinic&email=setup@easybill.test");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByPlaceholder("e.g. +91 98765 43210").fill("9876543210");
    await page.getByPlaceholder("e.g. 24ABCDE1234F1Z5").fill("24ABCDE1234F1Z5");
    await page.getByPlaceholder("Street, area, city, state, pincode").fill("Vadodara, Gujarat");
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByPlaceholder("e.g. HDFC Bank").fill("ICICI Bank");
    await page.getByPlaceholder("e.g. 1234 5678 9012").fill("123456789012");
    await page.getByPlaceholder("e.g. HDFC0001234").fill("ICIC0001234");
    await page.getByPlaceholder("e.g. abc@upi").fill("setup@upi");
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByPlaceholder(/Examples:/).fill("Setup term: payment due in 3 days.");
    await page.getByRole("button", { name: "Next" }).click();
    await page.locator('input[type="file"]').first().setInputFiles({
        name: "setup-logo.png",
        mimeType: "image/png",
        buffer: RED_DOT_PNG,
    });
    await page.getByRole("button", { name: "Save and continue" }).click();
    await page.getByDisplayValue("INV-").fill("SB-");
    await page.getByRole("button", { name: "Finish Setup" }).click();
    await page.waitForURL("**/dashboard");
    await expect(page.getByText("Setup Clinic")).toBeVisible();
    await page.goto("/dashboard/business");
    await expect(page.getByDisplayValue("Setup Clinic")).toBeVisible();
    await expect(page.getByDisplayValue("9876543210")).toBeVisible();
    await expect(page.getByDisplayValue("ICICI Bank")).toBeVisible();
    await expect(page.getByDisplayValue("Setup term: payment due in 3 days.")).toBeVisible();
    await page.goto("/dashboard/settings");
    await expect(page.getByDisplayValue("SB-")).toBeVisible();
    await page.goto("/dashboard/invoices/create");
    await expect(page.getByText("SB-0001").first()).toBeVisible();
});

import { expect, test } from "playwright/test";
import { PDF_BYTES, chooseDesktopSelectOption, getStoredInvoices, seedAuthenticatedWorkspace, } from "./helpers";
test("settings, invoice create/edit/view, and download flow stay stable", async ({ page }) => {
    await seedAuthenticatedWorkspace(page);
    let exportBody = null;
    await page.route("**/api/invoice-pdf-export", async (route) => {
        exportBody = route.request().postDataJSON();
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ url: "https://downloads.easybill.test/invoice.pdf" }),
        });
    });
    await page.route("https://downloads.easybill.test/invoice.pdf", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/pdf",
            body: PDF_BYTES,
        });
    });
    await page.goto("/dashboard/settings");
    await page.getByDisplayValue("INV-").fill("DOC-");
    await chooseDesktopSelectOption(page, "0001 (4 digits)", "001 (3 digits)");
    await chooseDesktopSelectOption(page, "01 of January", "01 of March");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Changes saved.")).toBeVisible();
    await page.goto("/dashboard/invoices/create");
    await page.getByPlaceholder("Client Name").fill("Raj");
    await page.getByPlaceholder("Client Phone").fill("9999999999");
    await page.locator('input[type="date"]').fill("2026-03-01");
    await page.getByPlaceholder("Product").fill("Consultation");
    await page.getByPlaceholder("HSN").fill("9983");
    await page.getByPlaceholder("Qty").fill("1");
    await page.getByPlaceholder("Price").fill("1000");
    await expect(page.getByText("DOC-001").first()).toBeVisible();
    await page.getByRole("button", { name: "Save Invoice" }).click();
    await expect(page.getByText("Invoice saved")).toBeVisible();
    await page.getByRole("button", { name: "Go to invoices" }).click();
    const invoiceRow = page.locator("tbody tr", { hasText: "DOC-001" }).first();
    await expect(invoiceRow).toBeVisible();
    const invoices = await getStoredInvoices(page);
    expect(invoices).toHaveLength(1);
    const invoiceId = String(invoices[0].id);
    await invoiceRow.click();
    await expect(page).toHaveURL(new RegExp(`/dashboard/invoices/view/${invoiceId.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}`));
    await expect(page.getByRole("button", { name: "Back to invoices" })).toBeVisible();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download PDF" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("Invoice-DOC-001.pdf");
    expect(exportBody?.["invoiceId"]).toBe(invoiceId);
    await page.getByRole("button", { name: "Back to invoices" }).click();
    await page.getByRole("button", { name: "Edit" }).first().click();
    await page.getByPlaceholder("Client Name").fill("Raj Updated");
    await page.getByRole("button", { name: "Update Invoice" }).click();
    await expect(page.getByText("Invoice updated")).toBeVisible();
    await page.getByRole("button", { name: "Back to invoices" }).click();
    await page.locator("tbody tr", { hasText: "DOC-001" }).first().click();
    await expect(page.getByText("Raj Updated")).toBeVisible();
});

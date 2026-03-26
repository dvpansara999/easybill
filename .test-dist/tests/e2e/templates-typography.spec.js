import { expect, test } from "playwright/test";
import { PDF_BYTES, chooseDesktopSelectOption, makeInvoiceSeed, seedAuthenticatedWorkspace, } from "./helpers";
test("templates and typography propagate into invoice view and PDF export requests", async ({ page }) => {
    const seededInvoice = makeInvoiceSeed({ id: "inv-template-001", invoiceNumber: "TMP-001" });
    await seedAuthenticatedWorkspace(page, {
        invoices: [seededInvoice],
        invoiceTemplate: "classic-default",
        invoiceTemplateFontId: "system",
        invoiceTemplateFontSize: 10,
    });
    let exportBody = null;
    await page.route("**/api/invoice-pdf-export", async (route) => {
        exportBody = route.request().postDataJSON();
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ url: "https://downloads.easybill.test/template.pdf" }),
        });
    });
    await page.route("https://downloads.easybill.test/template.pdf", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/pdf",
            body: PDF_BYTES,
        });
    });
    await page.goto("/dashboard/templates");
    await chooseDesktopSelectOption(page, "System Sans", "Mono");
    await chooseDesktopSelectOption(page, "10px", "14px");
    await page.getByText("Modern Atlas A").click();
    await page.getByRole("button", { name: "Use This Template" }).click();
    await expect(page.getByText("Template applied")).toBeVisible();
    await page.getByRole("button", { name: "Got it" }).click();
    await page.goto(`/dashboard/invoices/view/${seededInvoice.id}`);
    const captureFontFamily = await page.locator('[data-easybill-pdf-capture]').evaluate((node) => {
        const first = node.firstElementChild;
        return first ? getComputedStyle(first).fontFamily : "";
    });
    expect(captureFontFamily.toLowerCase()).toContain("courier");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download PDF" }).click();
    await downloadPromise;
    expect(exportBody?.["templateId"]).toBe("modern-v01");
    expect(exportBody?.["fontId"]).toBe("mono");
    expect(exportBody?.["fontSize"]).toBe(14);
});

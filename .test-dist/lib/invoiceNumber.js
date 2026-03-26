export function parseStoredDate(value) {
    if (!value)
        return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match)
        return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day))
        return null;
    if (month < 1 || month > 12)
        return null;
    if (day < 1 || day > 31)
        return null;
    return { year, month, day };
}
export function getTodayDateParts() {
    const today = new Date();
    return {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate(),
    };
}
export function compareDateParts(left, right) {
    if (left.year !== right.year)
        return left.year - right.year;
    if (left.month !== right.month)
        return left.month - right.month;
    return left.day - right.day;
}
export function getInvoiceCycleBounds(resetMonthDay, referenceDate) {
    const [resetMonthRaw, resetDayRaw] = resetMonthDay.split("-");
    const resetMonth = Number(resetMonthRaw);
    const resetDay = Number(resetDayRaw);
    const resetPointThisYear = {
        year: referenceDate.year,
        month: resetMonth,
        day: resetDay,
    };
    const startYear = compareDateParts(referenceDate, resetPointThisYear) >= 0 ? referenceDate.year : referenceDate.year - 1;
    return {
        start: { year: startYear, month: resetMonth, day: resetDay },
        end: { year: startYear + 1, month: resetMonth, day: resetDay },
    };
}
export function extractInvoiceNumericPart(invoiceNumber, prefix) {
    if (!invoiceNumber.startsWith(prefix))
        return null;
    const suffix = invoiceNumber.slice(prefix.length);
    if (!/^\d+$/.test(suffix))
        return null;
    return Number(suffix);
}
export function generateInvoiceNumber(invoices, prefix, padding, startNumber, resetYearly, resetMonthDay = "01-01", referenceDate = "") {
    const parsedReferenceDate = parseStoredDate(referenceDate) ?? getTodayDateParts();
    const cycle = getInvoiceCycleBounds(resetMonthDay, parsedReferenceDate);
    const filtered = resetYearly
        ? invoices.filter((invoice) => {
            const parsedDate = parseStoredDate(invoice.date);
            if (!parsedDate)
                return false;
            return compareDateParts(parsedDate, cycle.start) >= 0 && compareDateParts(parsedDate, cycle.end) < 0;
        })
        : invoices;
    let maxNumber = startNumber - 1;
    filtered.forEach((invoice) => {
        const numericPart = extractInvoiceNumericPart(String(invoice.invoiceNumber || ""), prefix);
        if (numericPart == null)
            return;
        if (numericPart > maxNumber) {
            maxNumber = numericPart;
        }
    });
    return `${prefix}${String(maxNumber + 1).padStart(padding, "0")}`;
}
export function formatDateParts(value) {
    return `${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;
}
export function generateInvoiceNumberForRules(invoices, rules, referenceDate = "") {
    return generateInvoiceNumber(invoices, rules.prefix, rules.padding, rules.startNumber, rules.resetYearly, rules.resetMonthDay || "01-01", referenceDate);
}
export function getInvoiceNumberingMetadata(rules, referenceDate = "") {
    if (!rules.resetYearly) {
        return {
            numberingModeAtCreation: "continuous",
            resetMonthDayAtCreation: null,
            sequenceWindowStart: null,
            sequenceWindowEnd: null,
        };
    }
    const parsedReferenceDate = parseStoredDate(referenceDate) ?? getTodayDateParts();
    const cycle = getInvoiceCycleBounds(rules.resetMonthDay || "01-01", parsedReferenceDate);
    return {
        numberingModeAtCreation: "financial-year-reset",
        resetMonthDayAtCreation: rules.resetMonthDay || "01-01",
        sequenceWindowStart: formatDateParts(cycle.start),
        sequenceWindowEnd: formatDateParts(cycle.end),
    };
}
export function getFirstRepeatedInvoiceNumberWarning(invoices, rules, referenceDate = "") {
    if (!rules.resetYearly)
        return null;
    const nextInvoiceNumber = generateInvoiceNumberForRules(invoices, rules, referenceDate);
    const firstCycleInvoiceNumber = `${rules.prefix}${String(rules.startNumber).padStart(rules.padding, "0")}`;
    if (nextInvoiceNumber !== firstCycleInvoiceNumber)
        return null;
    const hasHistoricalMatch = invoices.some((invoice) => String(invoice.invoiceNumber || "") === firstCycleInvoiceNumber);
    if (!hasHistoricalMatch)
        return null;
    return `Heads up: ${firstCycleInvoiceNumber} already exists in an older cycle. That is expected when yearly reset starts a new sequence.`;
}
export function buildInvoiceNumberPreviewSeries(invoices, rules, count = 3, referenceDate = "") {
    const previewCount = Math.max(1, Math.trunc(count));
    const firstInvoiceNumber = generateInvoiceNumberForRules(invoices, rules, referenceDate);
    const firstNumericPart = extractInvoiceNumericPart(firstInvoiceNumber, rules.prefix);
    if (firstNumericPart == null) {
        return [firstInvoiceNumber];
    }
    return Array.from({ length: previewCount }, (_, index) => `${rules.prefix}${String(firstNumericPart + index).padStart(rules.padding, "0")}`);
}

module.exports = [
"[project]/lib/formatCurrency.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "formatCurrency",
    ()=>formatCurrency,
    "formatCurrencyQuickStatsMobile",
    ()=>formatCurrencyQuickStatsMobile
]);
function trimFractionalZeros(value) {
    const [intPart, fracPart] = value.split(".");
    if (fracPart === undefined) return value;
    const trimmedFrac = fracPart.replace(/0+$/, "");
    if (trimmedFrac === "") return intPart;
    return `${intPart}.${trimmedFrac}`;
}
function formatIndianLakhCroreCore(absAmount, unit) {
    const divisor = unit === "L" ? 100_000 : 10_000_000;
    const v = absAmount / divisor;
    let text;
    if (v < 10) {
        text = trimFractionalZeros(v.toFixed(2));
    } else if (v < 100) {
        text = trimFractionalZeros(v.toFixed(1));
    } else {
        text = String(Math.round(v));
    }
    return `${text}${unit}`;
}
function formatCurrencyQuickStatsMobile(amount, symbol, position, showDecimals, amountFormat) {
    const n = Number(amount);
    if (!Number.isFinite(n)) {
        return formatCurrency(0, symbol, position, showDecimals, amountFormat);
    }
    const abs = Math.abs(n);
    if (abs < 100_000) {
        return formatCurrency(n, symbol, position, showDecimals, amountFormat);
    }
    const normalizedSymbol = symbol === "Rs" ? "₹" : symbol;
    const sign = n < 0 ? "-" : "";
    const core = abs < 10_000_000 ? formatIndianLakhCroreCore(abs, "L") : formatIndianLakhCroreCore(abs, "Cr");
    if (position === "before") {
        return `${sign}${normalizedSymbol}${core}`;
    }
    return `${sign}${core} ${normalizedSymbol}`;
}
function formatCurrency(amount, symbol, position, showDecimals, amountFormat) {
    // Backwards compatibility: older saved preference used "Rs" for Indian Rupee.
    // Normalize to the correct ₹ symbol so all places render consistently.
    const normalizedSymbol = symbol === "Rs" ? "₹" : symbol;
    const formattedNumber = new Intl.NumberFormat(amountFormat === "indian" ? "en-IN" : "en-US", {
        minimumFractionDigits: showDecimals ? 2 : 0,
        maximumFractionDigits: showDecimals ? 2 : 0
    }).format(amount);
    if (position === "before") {
        return `${normalizedSymbol}${formattedNumber}`;
    } else {
        return `${formattedNumber} ${normalizedSymbol}`;
    }
}
}),
"[project]/lib/invoiceNumber.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "compareDateParts",
    ()=>compareDateParts,
    "extractInvoiceNumericPart",
    ()=>extractInvoiceNumericPart,
    "generateInvoiceNumber",
    ()=>generateInvoiceNumber,
    "generateInvoiceNumberForRules",
    ()=>generateInvoiceNumberForRules,
    "getInvoiceCycleBounds",
    ()=>getInvoiceCycleBounds,
    "getTodayDateParts",
    ()=>getTodayDateParts,
    "parseStoredDate",
    ()=>parseStoredDate
]);
function parseStoredDate(value) {
    if (!value) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    return {
        year,
        month,
        day
    };
}
function getTodayDateParts() {
    const today = new Date();
    return {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate()
    };
}
function compareDateParts(left, right) {
    if (left.year !== right.year) return left.year - right.year;
    if (left.month !== right.month) return left.month - right.month;
    return left.day - right.day;
}
function getInvoiceCycleBounds(resetMonthDay, referenceDate) {
    const [resetMonthRaw, resetDayRaw] = resetMonthDay.split("-");
    const resetMonth = Number(resetMonthRaw);
    const resetDay = Number(resetDayRaw);
    const resetPointThisYear = {
        year: referenceDate.year,
        month: resetMonth,
        day: resetDay
    };
    const startYear = compareDateParts(referenceDate, resetPointThisYear) >= 0 ? referenceDate.year : referenceDate.year - 1;
    return {
        start: {
            year: startYear,
            month: resetMonth,
            day: resetDay
        },
        end: {
            year: startYear + 1,
            month: resetMonth,
            day: resetDay
        }
    };
}
function extractInvoiceNumericPart(invoiceNumber, prefix) {
    if (!invoiceNumber.startsWith(prefix)) return null;
    const suffix = invoiceNumber.slice(prefix.length);
    if (!/^\d+$/.test(suffix)) return null;
    return Number(suffix);
}
function generateInvoiceNumber(invoices, prefix, padding, startNumber, resetYearly, resetMonthDay = "01-01", referenceDate = "") {
    const parsedReferenceDate = parseStoredDate(referenceDate) ?? getTodayDateParts();
    const cycle = getInvoiceCycleBounds(resetMonthDay, parsedReferenceDate);
    const filtered = resetYearly ? invoices.filter((invoice)=>{
        const parsedDate = parseStoredDate(invoice.date);
        if (!parsedDate) return false;
        return compareDateParts(parsedDate, cycle.start) >= 0 && compareDateParts(parsedDate, cycle.end) < 0;
    }) : invoices;
    let maxNumber = startNumber - 1;
    filtered.forEach((invoice)=>{
        const numericPart = extractInvoiceNumericPart(String(invoice.invoiceNumber || ""), prefix);
        if (numericPart == null) return;
        if (numericPart > maxNumber) {
            maxNumber = numericPart;
        }
    });
    return `${prefix}${String(maxNumber + 1).padStart(padding, "0")}`;
}
function generateInvoiceNumberForRules(invoices, rules, referenceDate = "") {
    return generateInvoiceNumber(invoices, rules.prefix, rules.padding, rules.startNumber, rules.resetYearly, rules.resetMonthDay || "01-01", referenceDate);
}
}),
"[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CreateInvoiceClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$context$2f$SettingsContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/context/SettingsContext.tsx [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$formatCurrency$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/formatCurrency.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoiceNumber$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/invoiceNumber.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/userStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$plans$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/plans.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$providers$2f$AppAlertProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/providers/AppAlertProvider.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/runtimeMode.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/invoice.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.js [app-ssr] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CirclePlus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-plus.js [app-ssr] (ecmascript) <export default as CirclePlus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Package2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/package-2.js [app-ssr] (ecmascript) <export default as Package2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.js [app-ssr] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/save.js [app-ssr] (ecmascript) <export default as Save>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-ssr] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$round$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__UserRound$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user-round.js [app-ssr] (ecmascript) <export default as UserRound>");
"use client";
;
;
;
;
;
;
;
;
;
;
;
;
function getTodayLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
function readCreateInvoiceState() {
    const savedProducts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getActiveOrGlobalItem"])("products");
    const products = savedProducts ? JSON.parse(savedProducts) : [];
    const invoices = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["readStoredInvoices"])();
    const customerMap = {};
    invoices.forEach((invoice)=>{
        if (!invoice.clientPhone) return;
        customerMap[invoice.clientPhone] = {
            name: invoice.clientName || "",
            phone: invoice.clientPhone || "",
            email: invoice.clientEmail || "",
            gst: invoice.clientGST || "",
            address: invoice.clientAddress || ""
        };
    });
    return {
        products,
        items: [
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createEmptyInvoiceItem"])()
        ],
        customers: Object.values(customerMap)
    };
}
function CreateInvoiceClient() {
    const { invoicePrefix, invoicePadding, invoiceStartNumber, resetYearly, invoiceResetMonthDay, amountFormat, showDecimals, currencySymbol, currencyPosition } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$context$2f$SettingsContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["useSettings"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const { showAlert } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$providers$2f$AppAlertProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppAlert"])();
    const dropdownRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const initialState = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>readCreateInvoiceState(), []);
    const [products] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(initialState.products);
    const [customers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(initialState.customers);
    const [items, setItems] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(initialState.items);
    const [clientName, setClientName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(searchParams.get("name") || "");
    const [clientPhone, setClientPhone] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(searchParams.get("phone") || "");
    const [clientEmail, setClientEmail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(searchParams.get("email") || "");
    const [clientGST, setClientGST] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(searchParams.get("gstin") || "");
    const [clientAddress, setClientAddress] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(searchParams.get("address") || "");
    const [date, setDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>getTodayLocalDate());
    const [customDetails, setCustomDetails] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [suggestions, setSuggestions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [activeRow, setActiveRow] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [clientSuggestions, setClientSuggestions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [clientField, setClientField] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setSuggestions([]);
                setClientSuggestions([]);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return ()=>document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    function money(value) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$formatCurrency$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCurrency"])(value, currencySymbol, currencyPosition, showDecimals, amountFormat);
    }
    function toNumber(value) {
        const normalized = String(value ?? "").trim().replace(",", ".");
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    function updateTotals(updated, index) {
        const row = updated[index];
        const qty = toNumber(row.qty);
        const price = toNumber(row.price);
        const base = qty * price;
        const cgst = base * (toNumber(row.cgst) / 100);
        const sgst = base * (toNumber(row.sgst) / 100);
        const igst = base * (toNumber(row.igst) / 100);
        updated[index] = {
            ...row,
            total: base + cgst + sgst + igst
        };
        return updated;
    }
    function handleItemChange(index, field, value) {
        const updated = [
            ...items
        ];
        updated[index] = {
            ...updated[index],
            [field]: value
        };
        setItems(updateTotals(updated, index));
    }
    function searchClientName(value) {
        setClientName(value);
        setClientField("name");
        setClientSuggestions(customers.filter((customer)=>customer.name.toLowerCase().includes(value.toLowerCase())));
    }
    function searchClientPhone(value) {
        setClientPhone(value);
        setClientField("phone");
        setClientSuggestions(customers.filter((customer)=>String(customer.phone).includes(value)));
    }
    function selectClient(customer) {
        setClientName(customer.name || "");
        setClientPhone(customer.phone || "");
        setClientEmail(customer.email || "");
        setClientGST(customer.gst || "");
        setClientAddress(customer.address || "");
        setClientSuggestions([]);
    }
    function searchProduct(index, value) {
        setActiveRow(index);
        setSuggestions(products.filter((product)=>product.name.toLowerCase().includes(value.toLowerCase())));
        handleItemChange(index, "product", value);
    }
    function searchHSN(index, value) {
        setActiveRow(index);
        setSuggestions(products.filter((product)=>String(product.hsn).includes(value)));
        handleItemChange(index, "hsn", value);
    }
    function selectSuggestion(product) {
        if (activeRow === null) return;
        const updated = [
            ...items
        ];
        updated[activeRow] = {
            ...updated[activeRow],
            product: product.name,
            hsn: product.hsn,
            unit: product.unit,
            price: product.price,
            cgst: product.cgst,
            sgst: product.sgst,
            igst: product.igst
        };
        setItems(updateTotals(updated, activeRow));
        setSuggestions([]);
    }
    function addProduct() {
        setItems((prev)=>[
                ...prev,
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createEmptyInvoiceItem"])()
            ]);
    }
    function removeProduct(index) {
        setItems((prev)=>prev.filter((_, currentIndex)=>currentIndex !== index));
    }
    function addCustomDetail() {
        setCustomDetails((prev)=>[
                ...prev,
                {
                    label: "",
                    value: ""
                }
            ]);
    }
    function removeCustomDetail(index) {
        setCustomDetails((prev)=>prev.filter((_, currentIndex)=>currentIndex !== index));
    }
    const subtotal = items.reduce((sum, item)=>sum + Number(item.qty || 0) * Number(item.price || 0), 0);
    const cgstTotal = items.reduce((sum, item)=>sum + Number(item.qty || 0) * Number(item.price || 0) * (Number(item.cgst || 0) / 100), 0);
    const sgstTotal = items.reduce((sum, item)=>sum + Number(item.qty || 0) * Number(item.price || 0) * (Number(item.sgst || 0) / 100), 0);
    const igstTotal = items.reduce((sum, item)=>sum + Number(item.qty || 0) * Number(item.price || 0) * (Number(item.igst || 0) / 100), 0);
    const grandTotal = subtotal + cgstTotal + sgstTotal + igstTotal;
    const invoiceNumber = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const invoices = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["readStoredInvoices"])();
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoiceNumber$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateInvoiceNumber"])(invoices, invoicePrefix, invoicePadding, invoiceStartNumber, resetYearly, invoiceResetMonthDay, date);
    }, [
        date,
        invoicePadding,
        invoicePrefix,
        invoiceResetMonthDay,
        invoiceStartNumber,
        resetYearly
    ]);
    function saveInvoice() {
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAuthMode"])() === "supabase" && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isActiveUserKvHydrated"])()) {
            showAlert({
                tone: "info",
                title: "Syncing your account…",
                actionHint: "Wait a few seconds, then try your action again.",
                message: "easyBILL is still loading your saved data from the cloud."
            });
            return;
        }
        const allowance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$plans$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["canCreateAnotherInvoice"])();
        if (!allowance.ok) {
            showAlert({
                tone: "warning",
                title: "Invoice limit reached (Free plan)",
                actionHint: "Upgrade for unlimited invoices, or free up space by removing old drafts.",
                message: "You’ve reached the Free plan limit of 10 invoices. Upgrade to Plus to create more invoices.",
                primaryLabel: "Upgrade to Plus",
                secondaryLabel: "Not now",
                onPrimary: ()=>router.push("/dashboard/upgrade")
            });
            return;
        }
        const businessError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateBusinessRecord"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStoredBusinessRecord"])());
        if (businessError) {
            showAlert({
                tone: "danger",
                title: "Business profile needs attention",
                actionHint: "Open Business Profile, complete the required details, then try creating the invoice again.",
                message: businessError
            });
            return;
        }
        const invoices = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["readStoredInvoices"])();
        const nextInvoiceNumber = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoiceNumber$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateInvoiceNumber"])(invoices, invoicePrefix, invoicePadding, invoiceStartNumber, resetYearly, invoiceResetMonthDay, date);
        const invoiceRecord = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeInvoiceRecord"])({
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createInvoiceId"])(),
            invoiceNumber: nextInvoiceNumber,
            clientName,
            clientPhone,
            clientEmail,
            clientGST,
            clientAddress,
            date,
            customDetails,
            items,
            grandTotal
        });
        const invoiceError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateInvoiceRecord"])(invoiceRecord);
        if (invoiceError) {
            showAlert({
                tone: "danger",
                title: "Missing or invalid invoice details",
                actionHint: "Check required fields (including invoice date), fix any issues, then save again.",
                message: invoiceError
            });
            return;
        }
        if (invoices.length > 0) {
            const lastInvoice = invoices[invoices.length - 1];
            if (new Date(invoiceRecord.date) < new Date(lastInvoice.date)) {
                showAlert({
                    tone: "warning",
                    title: "Check the invoice date",
                    actionHint: "Pick a date on or after your last invoice, then save again.",
                    message: "Invoice date can’t be earlier than the previous invoice date."
                });
                return;
            }
        }
        invoices.push(invoiceRecord);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["writeStoredInvoices"])(invoices);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$plans$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["bumpInvoiceUsageCount"])(1);
        showAlert({
            tone: "success",
            title: "Invoice saved",
            actionHint: "Open your list to view, print, or share the PDF.",
            message: "Your invoice is saved and ready to view, print, or download as PDF.",
            primaryLabel: "Go to invoices",
            onPrimary: ()=>router.push("/dashboard/invoices")
        });
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6 pb-24 xl:space-y-8 xl:pb-0",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>router.push("/dashboard/invoices"),
                            className: "mb-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 sm:mb-5 sm:w-auto sm:justify-start sm:rounded-full sm:py-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                                    className: "h-4 w-4"
                                }, void 0, false, {
                                    fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                    lineNumber: 355,
                                    columnNumber: 13
                                }, this),
                                "Back"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                            lineNumber: 351,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs uppercase tracking-[0.34em] text-emerald-700",
                            children: "Create Invoice"
                        }, void 0, false, {
                            fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                            lineNumber: 358,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                    lineNumber: 350,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                lineNumber: 349,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "soft-card rounded-[24px] px-4 py-3 sm:px-5 sm:py-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs uppercase tracking-[0.28em] text-slate-400",
                                children: "Invoice Number"
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 364,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1.5 text-lg font-semibold text-slate-950 sm:mt-2 sm:text-2xl",
                                children: invoiceNumber
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 365,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                        lineNumber: 363,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "soft-card rounded-[24px] px-4 py-3 sm:px-5 sm:py-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs uppercase tracking-[0.28em] text-slate-400",
                                children: "Subtotal"
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 368,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1.5 text-lg font-semibold text-slate-950 sm:mt-2 sm:text-2xl",
                                children: money(subtotal)
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 369,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                        lineNumber: 367,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "soft-card rounded-[24px] px-4 py-3 sm:px-5 sm:py-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs uppercase tracking-[0.28em] text-slate-400",
                                children: "Taxes"
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 372,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1.5 text-lg font-semibold text-slate-950 sm:mt-2 sm:text-2xl",
                                children: money(cgstTotal + sgstTotal + igstTotal)
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 373,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                        lineNumber: 371,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-[24px] bg-slate-950 px-4 py-3 text-white sm:px-5 sm:py-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs uppercase tracking-[0.28em] text-slate-400",
                                children: "Grand Total"
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 376,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1.5 text-lg font-semibold sm:mt-2 sm:text-2xl",
                                children: money(grandTotal)
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 377,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                        lineNumber: 375,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                lineNumber: 362,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "soft-card rounded-[24px] p-4 sm:p-6 xl:rounded-[28px]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-6 flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$round$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__UserRound$3e$__["UserRound"], {
                                    className: "h-5 w-5"
                                }, void 0, false, {
                                    fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                    lineNumber: 384,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 383,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "section-title text-xl sm:text-2xl",
                                        children: "Client Details"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 387,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-slate-500 sm:text-sm",
                                        children: "Search existing clients quickly or add fresh billing details."
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 388,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 386,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                        lineNumber: 382,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid min-w-0 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-[1.15fr_0.8fr_1.25fr_1fr_220px] [&>*]:min-w-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative min-w-0",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400",
                                        children: "Client Name *"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 394,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        placeholder: "Client Name",
                                        className: "h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-5 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100",
                                        value: clientName,
                                        onChange: (e)=>searchClientName(e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 395,
                                        columnNumber: 13
                                    }, this),
                                    clientField === "name" && clientSuggestions.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        ref: dropdownRef,
                                        className: "absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl",
                                        children: clientSuggestions.map((customer, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                onClick: ()=>selectClient(customer),
                                                className: "cursor-pointer px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50",
                                                children: [
                                                    customer.name,
                                                    " (",
                                                    customer.phone,
                                                    ")"
                                                ]
                                            }, `${customer.phone}-${index}`, true, {
                                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                lineNumber: 404,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 402,
                                        columnNumber: 15
                                    }, this) : null
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 393,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative min-w-0",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400",
                                        children: "Client Phone"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 413,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        placeholder: "Client Phone",
                                        className: "h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-5 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100",
                                        value: clientPhone,
                                        onChange: (e)=>searchClientPhone(e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 414,
                                        columnNumber: 13
                                    }, this),
                                    clientField === "phone" && clientSuggestions.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        ref: dropdownRef,
                                        className: "absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl",
                                        children: clientSuggestions.map((customer, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                onClick: ()=>selectClient(customer),
                                                className: "cursor-pointer px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50",
                                                children: [
                                                    customer.name,
                                                    " (",
                                                    customer.phone,
                                                    ")"
                                                ]
                                            }, `${customer.phone}-${index}`, true, {
                                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                lineNumber: 423,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 421,
                                        columnNumber: 15
                                    }, this) : null
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 412,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "min-w-0",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400",
                                        children: "Client Email"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 432,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        placeholder: "Client Email",
                                        className: "h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-5 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100",
                                        value: clientEmail,
                                        onChange: (e)=>setClientEmail(e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 433,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 431,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "min-w-0",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400",
                                        children: "Client GSTIN"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 436,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        placeholder: "Client GSTIN",
                                        className: "h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-5 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100",
                                        value: clientGST,
                                        onChange: (e)=>setClientGST(e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 437,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 435,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "min-w-0",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400",
                                        children: "Invoice Date *"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 440,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "date",
                                        className: "box-border h-[54px] w-full max-w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-5 outline-none transition [appearance:textfield] focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100",
                                        value: date,
                                        onChange: (e)=>setDate(e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 441,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 439,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                        lineNumber: 392,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-4 grid gap-3 sm:gap-4 xl:grid-cols-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400",
                                        children: "Client Address"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 452,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "rounded-[24px] border border-slate-200 bg-white p-4",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                            placeholder: "Client Address",
                                            className: "min-h-[148px] w-full resize-none bg-transparent px-0 py-0 text-sm outline-none transition placeholder:text-slate-400 focus:border-transparent focus:ring-0",
                                            value: clientAddress,
                                            onChange: (e)=>setClientAddress(e.target.value)
                                        }, void 0, false, {
                                            fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                            lineNumber: 454,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 453,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 451,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400",
                                        children: "Custom Details"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 459,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "rounded-[24px] border border-slate-200 bg-white p-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mb-3 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-sm text-slate-500",
                                                        children: "Optional details like project name or work type."
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                        lineNumber: 462,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: addCustomDetail,
                                                        className: "inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 sm:w-auto sm:rounded-full sm:py-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CirclePlus$3e$__["CirclePlus"], {
                                                                className: "h-4 w-4"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                                lineNumber: 464,
                                                                columnNumber: 19
                                                            }, this),
                                                            "Add Detail"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                        lineNumber: 463,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                lineNumber: 461,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "space-y-3",
                                                children: customDetails.map((detail, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "grid gap-3 md:grid-cols-[0.35fr_1fr_auto]",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                placeholder: "Label",
                                                                className: "h-[54px] rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-5 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100",
                                                                value: detail.label,
                                                                onChange: (e)=>setCustomDetails((prev)=>prev.map((row, current)=>current === index ? {
                                                                                ...row,
                                                                                label: e.target.value
                                                                            } : row))
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                                lineNumber: 472,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                placeholder: "Value",
                                                                className: "h-[54px] rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-5 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100",
                                                                value: detail.value,
                                                                onChange: (e)=>setCustomDetails((prev)=>prev.map((row, current)=>current === index ? {
                                                                                ...row,
                                                                                value: e.target.value
                                                                            } : row))
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                                lineNumber: 478,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                onClick: ()=>removeCustomDetail(index),
                                                                className: "inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-600 transition hover:bg-rose-100",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                                    className: "h-4 w-4"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                                    lineNumber: 485,
                                                                    columnNumber: 23
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                                lineNumber: 484,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, index, true, {
                                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                        lineNumber: 471,
                                                        columnNumber: 19
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                lineNumber: 469,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 460,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 458,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                        lineNumber: 450,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                lineNumber: 381,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "soft-card rounded-[24px] p-4 sm:p-6 xl:rounded-[28px]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-6 flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Package2$3e$__["Package2"], {
                                    className: "h-5 w-5"
                                }, void 0, false, {
                                    fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                    lineNumber: 498,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 497,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "section-title text-xl sm:text-2xl",
                                        children: "Invoice Items"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 501,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-slate-500 sm:text-sm",
                                        children: "Fast mobile entry for products, tax, and totals."
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 502,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 500,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                        lineNumber: 496,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-4",
                        children: items.map((item, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-[24px] border border-slate-200 bg-white p-3 sm:rounded-[26px] sm:p-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mb-3 flex items-center justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs font-semibold uppercase tracking-[0.24em] text-slate-400",
                                                children: [
                                                    "Item ",
                                                    index + 1
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                lineNumber: 510,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>removeProduct(index),
                                                className: "inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100",
                                                "aria-label": `Remove item ${index + 1}`,
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                    className: "h-4 w-4"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                    lineNumber: 512,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                lineNumber: 511,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 509,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-[1.7fr_0.95fr_0.62fr_0.7fr_0.9fr_0.68fr_0.68fr_0.68fr_1fr_auto]",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "relative col-span-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400",
                                                        children: "Product *"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                        lineNumber: 518,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        value: item.product,
                                                        onChange: (e)=>searchProduct(index, e.target.value),
                                                        placeholder: "Product",
                                                        className: "h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-5 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                        lineNumber: 519,
                                                        columnNumber: 19
                                                    }, this),
                                                    activeRow === index && suggestions.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        ref: dropdownRef,
                                                        className: "absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl",
                                                        children: suggestions.map((product, suggestionIndex)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                onClick: ()=>selectSuggestion(product),
                                                                className: "cursor-pointer px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50",
                                                                children: [
                                                                    product.name,
                                                                    " (",
                                                                    product.hsn,
                                                                    ")"
                                                                ]
                                                            }, `${product.hsn}-${suggestionIndex}`, true, {
                                                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                                lineNumber: 523,
                                                                columnNumber: 25
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                        lineNumber: 521,
                                                        columnNumber: 21
                                                    }, this) : null
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                lineNumber: 517,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "col-span-2 sm:col-span-1",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400",
                                                        children: "HSN"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                        lineNumber: 532,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        value: item.hsn,
                                                        onChange: (e)=>searchHSN(index, e.target.value),
                                                        placeholder: "HSN",
                                                        className: "h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-5 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                        lineNumber: 533,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                lineNumber: 531,
                                                columnNumber: 17
                                            }, this),
                                            [
                                                "qty",
                                                "unit",
                                                "price",
                                                "cgst",
                                                "sgst",
                                                "igst"
                                            ].map((field)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            className: "mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400",
                                                            children: field === "qty" ? "Qty *" : field === "unit" ? "Unit" : `${field.toUpperCase()}${field === "price" ? " *" : " %"}`
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                            lineNumber: 538,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: field === "unit" ? "text" : "text",
                                                            inputMode: field === "unit" ? undefined : "decimal",
                                                            value: String(item[field] ?? ""),
                                                            onChange: (e)=>{
                                                                const next = e.target.value;
                                                                if (field === "unit") {
                                                                    handleItemChange(index, field, next);
                                                                    return;
                                                                }
                                                                // Keep numeric typing smooth (e.g. "1.", "0.5", "0,5") while blocking invalid characters.
                                                                if (!/^\d*([.,]?\d*)$/.test(next)) return;
                                                                handleItemChange(index, field, next);
                                                            },
                                                            placeholder: field === "unit" ? "Unit" : field.toUpperCase(),
                                                            className: "h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-5 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                            lineNumber: 539,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, field, true, {
                                                    fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                    lineNumber: 537,
                                                    columnNumber: 19
                                                }, this)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "col-span-2 sm:col-span-1",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400",
                                                        children: "Total"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                        lineNumber: 560,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900",
                                                        children: money(Number(item.total || 0))
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                        lineNumber: 561,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                lineNumber: 559,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 516,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, index, true, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 508,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                        lineNumber: 506,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: addProduct,
                        className: "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 sm:w-auto",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                className: "h-4 w-4"
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 569,
                                columnNumber: 11
                            }, this),
                            "Add Product"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                        lineNumber: 568,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                lineNumber: 495,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "soft-card rounded-[24px] p-4 sm:p-6 xl:rounded-[28px]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "section-title text-xl sm:text-2xl",
                        children: "Invoice Summary"
                    }, void 0, false, {
                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                        lineNumber: 575,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-5 grid gap-4 lg:grid-cols-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-3 rounded-[24px] border border-slate-200 bg-white p-5 text-sm text-slate-600",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Subtotal"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                lineNumber: 578,
                                                columnNumber: 51
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-semibold text-slate-900",
                                                children: money(subtotal)
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                lineNumber: 578,
                                                columnNumber: 72
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 578,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "CGST Total"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                lineNumber: 579,
                                                columnNumber: 51
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-semibold text-slate-900",
                                                children: money(cgstTotal)
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                lineNumber: 579,
                                                columnNumber: 74
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 579,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "SGST Total"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                lineNumber: 580,
                                                columnNumber: 51
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-semibold text-slate-900",
                                                children: money(sgstTotal)
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                lineNumber: 580,
                                                columnNumber: 74
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 580,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "IGST Total"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                lineNumber: 581,
                                                columnNumber: 51
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-semibold text-slate-900",
                                                children: money(igstTotal)
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                                lineNumber: 581,
                                                columnNumber: 74
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 581,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 577,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-[24px] bg-slate-950 p-6 text-white",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs uppercase tracking-[0.28em] text-slate-400",
                                        children: "Grand Total"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 584,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-3 text-3xl font-semibold sm:text-4xl",
                                        children: money(grandTotal)
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                        lineNumber: 585,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 583,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                        lineNumber: 576,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: saveInvoice,
                        className: "mt-5 hidden items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 xl:inline-flex",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
                                className: "h-4 w-4"
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                                lineNumber: 590,
                                columnNumber: 11
                            }, this),
                            "Save Invoice"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                        lineNumber: 589,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                lineNumber: 574,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(15,23,42,0.08)] backdrop-blur-md xl:hidden",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: saveInvoice,
                    className: "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
                            className: "h-4 w-4"
                        }, void 0, false, {
                            fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                            lineNumber: 597,
                            columnNumber: 11
                        }, this),
                        "Save Invoice"
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                    lineNumber: 596,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
                lineNumber: 595,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
        lineNumber: 348,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=_f888c72c._.js.map
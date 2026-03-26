(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/invoiceNumber.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/invoicePrefixValidation.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getInvoicePrefixError",
    ()=>getInvoicePrefixError
]);
const SAFE_INVOICE_PREFIX_PATTERN = /^[A-Za-z0-9._,:;()\-]*$/;
function getInvoicePrefixError(prefix) {
    if (prefix !== prefix.trim()) {
        return "Invoice prefix cannot start or end with a space.";
    }
    if (/\s/.test(prefix)) {
        return "Invoice prefix cannot contain spaces. Use letters, numbers, or symbols like -, _, ., (, ).";
    }
    if (!SAFE_INVOICE_PREFIX_PATTERN.test(prefix)) {
        return "Invoice prefix contains unsupported characters. Use only letters, numbers, and these symbols: - _ . , : ; ( )";
    }
    return "";
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/ui/SelectMenu.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SelectMenu
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-client] (ecmascript) <export default as Check>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function SelectMenu({ value, onChange, options, placeholder = "Select…", disabled = false, className = "" }) {
    _s();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [useNativeMobile, setUseNativeMobile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const wrapRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const buttonRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const selected = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SelectMenu.useMemo[selected]": ()=>options.find({
                "SelectMenu.useMemo[selected]": (o)=>o.value === value
            }["SelectMenu.useMemo[selected]"]) || null
    }["SelectMenu.useMemo[selected]"], [
        options,
        value
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SelectMenu.useEffect": ()=>{
            const coarse = window.matchMedia("(pointer: coarse)");
            const small = window.matchMedia("(max-width: 767px)");
            const apply = {
                "SelectMenu.useEffect.apply": ()=>setUseNativeMobile(coarse.matches || small.matches)
            }["SelectMenu.useEffect.apply"];
            apply();
            coarse.addEventListener("change", apply);
            small.addEventListener("change", apply);
            return ({
                "SelectMenu.useEffect": ()=>{
                    coarse.removeEventListener("change", apply);
                    small.removeEventListener("change", apply);
                }
            })["SelectMenu.useEffect"];
        }
    }["SelectMenu.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SelectMenu.useEffect": ()=>{
            function onDocDown(e) {
                const target = e.target;
                if (!target) return;
                if (wrapRef.current && !wrapRef.current.contains(target)) {
                    setOpen(false);
                }
            }
            function onDocTouch(e) {
                const target = e.target;
                if (!target) return;
                if (wrapRef.current && !wrapRef.current.contains(target)) {
                    setOpen(false);
                }
            }
            document.addEventListener("mousedown", onDocDown);
            document.addEventListener("touchstart", onDocTouch);
            return ({
                "SelectMenu.useEffect": ()=>{
                    document.removeEventListener("mousedown", onDocDown);
                    document.removeEventListener("touchstart", onDocTouch);
                }
            })["SelectMenu.useEffect"];
        }
    }["SelectMenu.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SelectMenu.useEffect": ()=>{
            function onKey(e) {
                if (!open) return;
                if (e.key === "Escape") {
                    e.preventDefault();
                    setOpen(false);
                    buttonRef.current?.focus();
                }
            }
            window.addEventListener("keydown", onKey);
            return ({
                "SelectMenu.useEffect": ()=>window.removeEventListener("keydown", onKey)
            })["SelectMenu.useEffect"];
        }
    }["SelectMenu.useEffect"], [
        open
    ]);
    if (useNativeMobile) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            ref: wrapRef,
            className: `relative ${className}`,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                    value: value,
                    onChange: (e)=>onChange(e.target.value),
                    disabled: disabled,
                    className: `w-full appearance-none rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition-[border-color,box-shadow,background-color,color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${disabled ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400" : "border-slate-200 bg-white text-slate-900 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"}`,
                    children: options.map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                            value: opt.value,
                            children: opt.label
                        }, opt.value, false, {
                            fileName: "[project]/components/ui/SelectMenu.tsx",
                            lineNumber: 96,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/components/ui/SelectMenu.tsx",
                    lineNumber: 85,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                    className: `pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 ${disabled ? "text-slate-300" : "text-slate-400"}`
                }, void 0, false, {
                    fileName: "[project]/components/ui/SelectMenu.tsx",
                    lineNumber: 101,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/ui/SelectMenu.tsx",
            lineNumber: 84,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: wrapRef,
        className: `relative ${className}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                ref: buttonRef,
                type: "button",
                disabled: disabled,
                onClick: ()=>setOpen((p)=>!p),
                className: `flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm shadow-sm transition ${disabled ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400" : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"}`,
                "aria-haspopup": "listbox",
                "aria-expanded": open,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `${selected ? "text-slate-900" : "text-slate-400"}`,
                        children: selected ? selected.label : placeholder
                    }, void 0, false, {
                        fileName: "[project]/components/ui/SelectMenu.tsx",
                        lineNumber: 121,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                        className: `h-4 w-4 ${disabled ? "text-slate-300" : "text-slate-400"}`
                    }, void 0, false, {
                        fileName: "[project]/components/ui/SelectMenu.tsx",
                        lineNumber: 124,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ui/SelectMenu.tsx",
                lineNumber: 108,
                columnNumber: 7
            }, this),
            open ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                role: "listbox",
                className: "absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)]",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-h-64 overflow-auto py-1",
                    children: options.map((opt)=>{
                        const isSelected = opt.value === value;
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            role: "option",
                            "aria-selected": isSelected,
                            onClick: ()=>{
                                onChange(opt.value);
                                setOpen(false);
                                buttonRef.current?.focus();
                            },
                            className: `flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-[background-color,color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSelected ? "bg-emerald-50 text-slate-900" : "text-slate-700 hover:bg-slate-50"}`,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: opt.label
                                }, void 0, false, {
                                    fileName: "[project]/components/ui/SelectMenu.tsx",
                                    lineNumber: 150,
                                    columnNumber: 19
                                }, this),
                                isSelected ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                    className: "h-4 w-4 text-emerald-600"
                                }, void 0, false, {
                                    fileName: "[project]/components/ui/SelectMenu.tsx",
                                    lineNumber: 151,
                                    columnNumber: 33
                                }, this) : null
                            ]
                        }, opt.value, true, {
                            fileName: "[project]/components/ui/SelectMenu.tsx",
                            lineNumber: 136,
                            columnNumber: 17
                        }, this);
                    })
                }, void 0, false, {
                    fileName: "[project]/components/ui/SelectMenu.tsx",
                    lineNumber: 132,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/ui/SelectMenu.tsx",
                lineNumber: 128,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/components/ui/SelectMenu.tsx",
        lineNumber: 107,
        columnNumber: 5
    }, this);
}
_s(SelectMenu, "1T2CuGiSv3OmN42jkkHDs4QJ7dM=");
_c = SelectMenu;
var _c;
__turbopack_context__.k.register(_c, "SelectMenu");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/(app)/dashboard/settings/SettingsClient.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SettingsClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$context$2f$SettingsContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/context/SettingsContext.tsx [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoiceNumber$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/invoiceNumber.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoicePrefixValidation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/invoicePrefixValidation.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoiceResetDate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/invoiceResetDate.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/userStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/browser.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$SelectMenu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/SelectMenu.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/invoice.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$providers$2f$AppAlertProvider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/providers/AppAlertProvider.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
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
function SettingsClient() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const setupMode = searchParams.get("setup") === "1";
    const { showAlert } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$providers$2f$AppAlertProvider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppAlert"])();
    const { dateFormat, updateDateFormat, amountFormat, updateAmountFormat, showDecimals, updateShowDecimals, invoicePrefix, updateInvoicePrefix, invoicePadding, updateInvoicePadding, invoiceStartNumber, updateInvoiceStartNumber, resetYearly, updateResetYearly, invoiceResetMonthDay, updateInvoiceResetMonthDay, currencySymbol, updateCurrencySymbol, currencyPosition, updateCurrencyPosition } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$context$2f$SettingsContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["useSettings"])();
    const [draftDateFormat, setDraftDateFormat] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(dateFormat);
    const [draftAmountFormat, setDraftAmountFormat] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(amountFormat);
    const [draftShowDecimals, setDraftShowDecimals] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(showDecimals);
    const [draftInvoicePrefix, setDraftInvoicePrefix] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(invoicePrefix);
    const [draftInvoicePadding, setDraftInvoicePadding] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(invoicePadding);
    const [draftInvoiceStartNumber, setDraftInvoiceStartNumber] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(invoiceStartNumber);
    const [draftResetYearly, setDraftResetYearly] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(resetYearly);
    const [draftInvoiceResetMonthDay, setDraftInvoiceResetMonthDay] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(invoiceResetMonthDay);
    const [draftCurrencySymbol, setDraftCurrencySymbol] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(currencySymbol);
    const [draftCurrencyPosition, setDraftCurrencyPosition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(currencyPosition);
    const [ready, setReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [saveMessage, setSaveMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [invoiceHistory, setInvoiceHistory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [accountEmail, setAccountEmail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [accountUserId, setAccountUserId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [currentPassword, setCurrentPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [newEmail, setNewEmail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [newPassword, setNewPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [confirmNewPassword, setConfirmNewPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [showCurrentPassword, setShowCurrentPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showNewPassword, setShowNewPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [accountMessage, setAccountMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [accountError, setAccountError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [showEmailEditor, setShowEmailEditor] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showPasswordEditor, setShowPasswordEditor] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [emailChangeStep, setEmailChangeStep] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("password");
    const [emailOtpCode, setEmailOtpCode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [emailChangeBusy, setEmailChangeBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [passwordOtpBusy, setPasswordOtpBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [updatePasswordBusy, setUpdatePasswordBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [passwordOtpSent, setPasswordOtpSent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [passwordOtpCode, setPasswordOtpCode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [passwordOtpVerified, setPasswordOtpVerified] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [emailPolicy, setEmailPolicy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [emailPolicyLoading, setEmailPolicyLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [prefixErrorMessage, setPrefixErrorMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    async function refreshEmailPolicy() {
        setEmailPolicyLoading(true);
        try {
            const res = await fetch("/api/account/email-change-policy", {
                method: "GET",
                cache: "no-store"
            });
            if (!res.ok) throw new Error("policy-fetch-failed");
            const data = await res.json();
            setEmailPolicy(data);
            return data;
        } catch  {
            setEmailPolicy(null);
            return null;
        } finally{
            setEmailPolicyLoading(false);
        }
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SettingsClient.useEffect": ()=>{
            setDraftDateFormat(dateFormat);
            setDraftAmountFormat(amountFormat);
            setDraftShowDecimals(showDecimals);
            setDraftInvoicePrefix(invoicePrefix);
            setDraftInvoicePadding(invoicePadding);
            setDraftInvoiceStartNumber(invoiceStartNumber);
            setDraftResetYearly(resetYearly);
            setDraftInvoiceResetMonthDay(invoiceResetMonthDay);
            setDraftCurrencySymbol(currencySymbol);
            setDraftCurrencyPosition(currencyPosition);
            setInvoiceHistory((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["readStoredInvoices"])());
            const auth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveAuthRecord"])();
            if (auth) {
                setAccountEmail(auth.email || "");
                setAccountUserId(auth.userId);
                setNewEmail(auth.email || "");
                void refreshEmailPolicy();
                void ({
                    "SettingsClient.useEffect": async ()=>{
                        try {
                            const { data } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseUser"])();
                            const supabaseEmail = data.user?.email || "";
                            if (supabaseEmail) {
                                setAccountEmail(supabaseEmail);
                                setNewEmail(supabaseEmail);
                            }
                        } catch  {
                        // ignore
                        }
                    }
                })["SettingsClient.useEffect"]();
            }
            setReady(true);
        }
    }["SettingsClient.useEffect"], [
        dateFormat,
        amountFormat,
        showDecimals,
        invoicePrefix,
        invoicePadding,
        invoiceStartNumber,
        resetYearly,
        invoiceResetMonthDay,
        currencySymbol,
        currencyPosition
    ]);
    const selectStyle = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";
    const invoicePreview = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SettingsClient.useMemo[invoicePreview]": ()=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoiceNumber$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateInvoiceNumber"])(invoiceHistory, draftInvoicePrefix, draftInvoicePadding, Math.max(1, Number.isFinite(draftInvoiceStartNumber) ? draftInvoiceStartNumber : 1), draftResetYearly, draftInvoiceResetMonthDay);
        }
    }["SettingsClient.useMemo[invoicePreview]"], [
        invoiceHistory,
        draftInvoicePrefix,
        draftInvoicePadding,
        draftInvoiceStartNumber,
        draftResetYearly,
        draftInvoiceResetMonthDay
    ]);
    const invoicePrefixError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoicePrefixValidation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getInvoicePrefixError"])(draftInvoicePrefix);
    const hasPendingChanges = draftDateFormat !== dateFormat || draftAmountFormat !== amountFormat || draftShowDecimals !== showDecimals || draftInvoicePrefix !== invoicePrefix || draftInvoicePadding !== invoicePadding || draftInvoiceStartNumber !== invoiceStartNumber || draftResetYearly !== resetYearly || draftInvoiceResetMonthDay !== invoiceResetMonthDay || draftCurrencySymbol !== currencySymbol || draftCurrencyPosition !== currencyPosition;
    const passwordIsValid = /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) && /\d/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword) && newPassword.length >= 7 && newPassword.length <= 20;
    const newEmailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim());
    function saveChanges() {
        if (invoicePrefixError) {
            setPrefixErrorMessage(invoicePrefixError);
            showAlert({
                tone: "danger",
                title: "Invalid invoice prefix",
                actionHint: "Use only supported characters, then save again.",
                message: invoicePrefixError
            });
            return;
        }
        setPrefixErrorMessage("");
        updateDateFormat(draftDateFormat);
        updateAmountFormat(draftAmountFormat);
        updateShowDecimals(draftShowDecimals);
        updateInvoicePrefix(draftInvoicePrefix);
        updateInvoicePadding(draftInvoicePadding);
        updateInvoiceStartNumber(Math.max(1, draftInvoiceStartNumber || 1));
        updateResetYearly(draftResetYearly);
        updateInvoiceResetMonthDay(draftInvoiceResetMonthDay);
        updateCurrencySymbol(draftCurrencySymbol);
        updateCurrencyPosition(draftCurrencyPosition);
        if (setupMode) {
            router.push("/dashboard");
            return;
        }
        setSaveMessage("Changes saved.");
        window.setTimeout(()=>setSaveMessage(""), 2000);
    }
    async function updateEmailOnly() {
        setAccountMessage("");
        setAccountError("");
        const auth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveAuthRecord"])();
        if (!auth) {
            setAccountError("No account credentials found yet. Create an account first.");
            return;
        }
        if (!currentPassword) {
            setAccountError("Enter your current password to continue.");
            return;
        }
        let sourceEmail = (accountEmail || auth.email || "").trim().toLowerCase();
        try {
            const { data } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseUser"])();
            const supabaseEmail = (data.user?.email || "").trim().toLowerCase();
            if (supabaseEmail) {
                sourceEmail = supabaseEmail;
                setAccountEmail(data.user?.email || "");
            }
        } catch  {
        // Keep local fallback when network check fails.
        }
        const wantsEmailChange = newEmail.trim().toLowerCase() !== sourceEmail;
        if (!wantsEmailChange) {
            setAccountError("New login email cannot be same as current login email.");
            return;
        }
        if (emailChangeStep === "password") {
            if (!newEmailIsValid) {
                setAccountError("Enter a valid email address.");
                return;
            }
            const policy = await refreshEmailPolicy();
            if (!policy?.canChange) {
                setAccountError(policy ? `Email can be changed once every ${policy.cooldownDays} days. Try again in ${policy.remainingDays} day(s).` : "Error occurred, try again.");
                return;
            }
            setEmailChangeBusy(true);
            const { error } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requestEmailChangeOtp"])({
                currentPassword,
                newEmail: newEmail.trim()
            });
            setEmailChangeBusy(false);
            if (error) {
                setAccountError(error);
                return;
            }
            setEmailChangeStep("otp");
            setEmailOtpCode("");
            setAccountMessage("OTP sent to your new email. Enter OTP to verify.");
            return;
        }
        if (emailOtpCode.trim().length < 6) {
            setAccountError("Enter 6-digit OTP.");
            return;
        }
        setEmailChangeBusy(true);
        const { record, error } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["verifyEmailChangeOtp"])(newEmail.trim(), emailOtpCode.trim());
        setEmailChangeBusy(false);
        if (error || !record) {
            setAccountError(error || "Unable to verify OTP.");
            return;
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setActiveOrGlobalItem"])("emailChangeAudit", "1");
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["flushCloudKeyNow"])("emailChangeAudit");
        } catch  {
        // Non-blocking
        }
        await refreshEmailPolicy();
        setAccountEmail(record.email);
        setAccountUserId(record.userId);
        setNewEmail(record.email);
        setCurrentPassword("");
        setEmailChangeStep("password");
        setEmailOtpCode("");
        setShowEmailEditor(false);
        setAccountMessage("Login email updated.");
        window.setTimeout(()=>setAccountMessage(""), 2000);
    }
    async function updatePasswordOnly() {
        setAccountMessage("");
        setAccountError("");
        const auth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveAuthRecord"])();
        if (!auth) {
            setAccountError("No account credentials found yet. Create an account first.");
            return;
        }
        if (!passwordOtpVerified) {
            setAccountError("Verify OTP first.");
            return;
        }
        if (!newPassword) {
            setAccountError("New password is required.");
            return;
        }
        if (!passwordIsValid) {
            setAccountError("Use 7-20 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character.");
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setAccountError("New passwords must match exactly.");
            return;
        }
        setUpdatePasswordBusy(true);
        const { record, error } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["updatePasswordAfterOtp"])(newPassword);
        setUpdatePasswordBusy(false);
        if (error || !record) {
            setAccountError(error || "Unable to update password.");
            return;
        }
        setAccountEmail(record.email);
        setAccountUserId(record.userId);
        setPasswordOtpCode("");
        setPasswordOtpSent(false);
        setPasswordOtpVerified(false);
        setNewPassword("");
        setConfirmNewPassword("");
        setAccountMessage("Password updated.");
        window.setTimeout(()=>setAccountMessage(""), 2000);
    }
    async function sendPasswordOtp() {
        setAccountError("");
        setAccountMessage("");
        if (!accountEmail.trim()) {
            setAccountError("Current login email is required.");
            return;
        }
        setPasswordOtpBusy(true);
        const { error } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["signInWithOtp"])(accountEmail.trim(), {
            shouldCreateUser: false
        });
        setPasswordOtpBusy(false);
        if (error) {
            setAccountError(error);
            return;
        }
        setPasswordOtpSent(true);
        setPasswordOtpVerified(false);
        setPasswordOtpCode("");
        setAccountMessage("OTP sent to your current email.");
    }
    async function verifyPasswordOtpNow() {
        setAccountError("");
        setAccountMessage("");
        if (passwordOtpCode.trim().length < 6) {
            setAccountError("Enter 6-digit OTP.");
            return;
        }
        setPasswordOtpBusy(true);
        const { error } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["verifyEmailOtp"])(accountEmail.trim(), passwordOtpCode.trim(), "email");
        setPasswordOtpBusy(false);
        if (error) {
            setAccountError(error);
            return;
        }
        setPasswordOtpVerified(true);
        setAccountMessage("OTP verified. You can now set a new password.");
    }
    if (!ready) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6 pb-24 lg:space-y-8 lg:pb-0",
        children: [
            setupMode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "rounded-[24px] border border-emerald-200 bg-emerald-50/80 p-5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700",
                        children: "Setup Step 2"
                    }, void 0, false, {
                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                        lineNumber: 423,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-2 text-sm leading-7 text-slate-600",
                        children: "Your business profile is saved. Now finish setup by choosing how invoice dates, decimals, currency, and invoice numbers should behave. When you save here, your workspace is ready."
                    }, void 0, false, {
                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                        lineNumber: 424,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                lineNumber: 422,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs uppercase tracking-[0.34em] text-emerald-700",
                        children: "Settings"
                    }, void 0, false, {
                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                        lineNumber: 432,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "font-display mt-3 text-3xl text-slate-950 sm:text-4xl",
                        children: "Fine-tune how easyBILL formats your invoices."
                    }, void 0, false, {
                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                        lineNumber: 433,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-3 max-w-2xl text-sm leading-7 text-slate-500",
                        children: "Control formatting, currency display, and numbering preferences — without changing your invoice workflow."
                    }, void 0, false, {
                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                        lineNumber: 434,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                lineNumber: 431,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap items-start justify-between gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "section-title text-2xl",
                                        children: "Account"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 442,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-1 text-sm text-slate-500",
                                        children: "Update your login email and password. Your account ID never changes."
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 443,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 441,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700",
                                children: [
                                    "ID: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-mono",
                                        children: accountUserId || "-"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 447,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 446,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                        lineNumber: 440,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-6 grid gap-4 md:grid-cols-[1.35fr_0.65fr] md:items-start",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-[24px] border border-slate-200 bg-slate-50/70 p-5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs font-semibold uppercase tracking-[0.28em] text-slate-500",
                                        children: "Login"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 453,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-2 text-sm text-slate-700",
                                        children: [
                                            "Current login email: ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-semibold text-slate-950",
                                                children: accountEmail || "-"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 455,
                                                columnNumber: 36
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 454,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-2 text-xs leading-5 text-slate-500",
                                        children: "This is used only for signing in, not invoice emails."
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 457,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 452,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        disabled: emailPolicyLoading || !emailPolicy?.canChange,
                                        onClick: ()=>{
                                            if (emailPolicyLoading || !emailPolicy?.canChange) return;
                                            setAccountError("");
                                            setAccountMessage("");
                                            setShowEmailEditor((prev)=>{
                                                const next = !prev;
                                                if (next) {
                                                    setEmailChangeStep("password");
                                                    setEmailOtpCode("");
                                                } else {
                                                    setEmailChangeStep("password");
                                                    setEmailOtpCode("");
                                                    setCurrentPassword("");
                                                }
                                                return next;
                                            });
                                            setShowPasswordEditor(false);
                                        },
                                        className: `rounded-[24px] border px-5 py-4 text-left text-sm font-semibold transition ${showEmailEditor ? "border-slate-300 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.06)]" : emailPolicyLoading || !emailPolicy?.canChange ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-slate-950",
                                                children: "Change email"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 492,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mt-1 text-xs font-medium text-slate-500",
                                                children: emailPolicyLoading ? "Checking 90-day policy..." : emailPolicy?.canChange ? showEmailEditor ? "Hide options" : "Show options" : `Locked for ${emailPolicy?.remainingDays ?? 0} more day(s)`
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 493,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 463,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>{
                                            setAccountError("");
                                            setAccountMessage("");
                                            setShowPasswordEditor((prev)=>{
                                                const next = !prev;
                                                if (!next) {
                                                    setPasswordOtpSent(false);
                                                    setPasswordOtpVerified(false);
                                                    setPasswordOtpCode("");
                                                    setNewPassword("");
                                                    setConfirmNewPassword("");
                                                }
                                                return next;
                                            });
                                            setShowEmailEditor(false);
                                        },
                                        className: `rounded-[24px] border px-5 py-4 text-left text-sm font-semibold transition ${showPasswordEditor ? "border-slate-300 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.06)]" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-slate-950",
                                                children: "Change password"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 528,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mt-1 text-xs font-medium text-slate-500",
                                                children: showPasswordEditor ? "Hide options" : "Show options"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 529,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 504,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 462,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                        lineNumber: 451,
                        columnNumber: 9
                    }, this),
                    showEmailEditor ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-6 grid gap-5 md:grid-cols-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mb-2 text-sm font-medium text-slate-900",
                                                children: "Current password"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 538,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: showCurrentPassword ? "text" : "password",
                                                value: currentPassword,
                                                onChange: (e)=>setCurrentPassword(e.target.value),
                                                placeholder: "Enter current password",
                                                className: selectStyle,
                                                disabled: emailChangeStep === "otp"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 539,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "mt-2 inline-flex items-center gap-2 text-sm text-slate-600",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "checkbox",
                                                        checked: showCurrentPassword,
                                                        onChange: (e)=>setShowCurrentPassword(e.target.checked),
                                                        className: "h-4 w-4 rounded border-slate-300",
                                                        disabled: emailChangeStep === "otp"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                        lineNumber: 548,
                                                        columnNumber: 19
                                                    }, this),
                                                    "Show password"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 547,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 537,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mb-2 text-sm font-medium text-slate-900",
                                                children: "New login email"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 560,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                value: newEmail,
                                                onChange: (e)=>setNewEmail(e.target.value),
                                                placeholder: "you@business.com",
                                                className: selectStyle,
                                                disabled: emailChangeStep === "otp"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 561,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 559,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 536,
                                columnNumber: 13
                            }, this),
                            emailChangeStep === "otp" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-5 grid gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-slate-600",
                                        children: "Enter OTP sent to your new email."
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 573,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        value: emailOtpCode,
                                        onChange: (e)=>setEmailOtpCode(e.target.value),
                                        inputMode: "numeric",
                                        placeholder: "Enter 6-digit OTP",
                                        className: selectStyle
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 574,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 572,
                                columnNumber: 15
                            }, this) : null,
                            accountError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-4 text-sm text-rose-600",
                                children: accountError
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 584,
                                columnNumber: 29
                            }, this) : null,
                            accountMessage ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-4 text-sm text-emerald-700",
                                children: accountMessage
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 585,
                                columnNumber: 31
                            }, this) : null,
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-slate-500",
                                        children: emailChangeStep === "password" ? "Enter current password and continue to OTP verification." : "Verify OTP to finish changing your login email."
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 588,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: updateEmailOnly,
                                        disabled: emailChangeBusy,
                                        className: "rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60",
                                        children: emailChangeBusy ? "Processing..." : emailChangeStep === "password" ? "Continue" : "Verify with OTP"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 593,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 587,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true) : null,
                    showPasswordEditor ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-6 grid gap-5 md:grid-cols-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mb-2 text-sm font-medium text-slate-900",
                                                children: "Change with OTP"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 612,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: sendPasswordOtp,
                                                disabled: passwordOtpBusy || !accountEmail.trim(),
                                                className: `rounded-2xl px-5 py-3 text-sm font-semibold transition ${passwordOtpBusy || !accountEmail.trim() ? "cursor-not-allowed bg-slate-200 text-slate-500" : "bg-slate-950 text-white hover:bg-slate-800"}`,
                                                children: passwordOtpBusy ? "Sending OTP..." : "Send OTP to current email"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 613,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mt-2 text-xs leading-5 text-slate-500",
                                                children: [
                                                    "OTP will be sent to ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "font-semibold text-slate-700",
                                                        children: accountEmail || "your current login email"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                        lineNumber: 626,
                                                        columnNumber: 39
                                                    }, this),
                                                    "."
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 625,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 611,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mb-2 text-sm font-medium text-slate-900",
                                                children: "Enter 6-digit OTP"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 631,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                value: passwordOtpCode,
                                                onChange: (e)=>setPasswordOtpCode(e.target.value),
                                                placeholder: "000000",
                                                className: selectStyle,
                                                disabled: !passwordOtpSent || passwordOtpVerified
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 632,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: verifyPasswordOtpNow,
                                                disabled: !passwordOtpSent || passwordOtpVerified || passwordOtpBusy || passwordOtpCode.trim().length < 6,
                                                className: `mt-3 rounded-2xl px-4 py-2 text-sm font-semibold transition ${!passwordOtpSent || passwordOtpVerified || passwordOtpBusy || passwordOtpCode.trim().length < 6 ? "cursor-not-allowed bg-slate-200 text-slate-500" : "bg-slate-950 text-white hover:bg-slate-800"}`,
                                                children: passwordOtpVerified ? "OTP Verified" : passwordOtpBusy ? "Verifying..." : "Verify OTP"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 639,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 630,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "md:col-span-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "grid gap-5 md:grid-cols-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "mb-2 text-sm font-medium text-slate-900",
                                                                children: "New password"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                                lineNumber: 656,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: showNewPassword ? "text" : "password",
                                                                value: newPassword,
                                                                onChange: (e)=>setNewPassword(e.target.value),
                                                                placeholder: "New password",
                                                                className: selectStyle,
                                                                disabled: !passwordOtpVerified
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                                lineNumber: 657,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "mt-2 text-xs leading-5 text-slate-500",
                                                                children: "Use 7–20 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character."
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                                lineNumber: 665,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                        lineNumber: 655,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "mb-2 text-sm font-medium text-slate-900",
                                                                children: "Confirm new password"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                                lineNumber: 670,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: showConfirmNewPassword ? "text" : "password",
                                                                value: confirmNewPassword,
                                                                onChange: (e)=>setConfirmNewPassword(e.target.value),
                                                                placeholder: "Re-enter new password",
                                                                className: selectStyle,
                                                                disabled: !passwordOtpVerified
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                                lineNumber: 671,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                        lineNumber: 669,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 654,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "mt-2 inline-flex items-center gap-2 text-sm text-slate-600",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "checkbox",
                                                        checked: showNewPassword && showConfirmNewPassword,
                                                        onChange: (e)=>{
                                                            setShowNewPassword(e.target.checked);
                                                            setShowConfirmNewPassword(e.target.checked);
                                                        },
                                                        className: "h-4 w-4 rounded border-slate-300",
                                                        disabled: !passwordOtpVerified
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                        lineNumber: 682,
                                                        columnNumber: 19
                                                    }, this),
                                                    "Show password"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 681,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 653,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 610,
                                columnNumber: 13
                            }, this),
                            accountError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-4 text-sm text-rose-600",
                                children: accountError
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 697,
                                columnNumber: 29
                            }, this) : null,
                            accountMessage ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-4 text-sm text-emerald-700",
                                children: accountMessage
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 698,
                                columnNumber: 31
                            }, this) : null,
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-slate-500",
                                        children: "Verify OTP first, then set and confirm your new password."
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 701,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: updatePasswordOnly,
                                        disabled: !passwordOtpVerified || updatePasswordBusy,
                                        className: `rounded-2xl px-5 py-3 text-sm font-semibold transition ${passwordOtpVerified && !updatePasswordBusy ? "bg-slate-950 text-white hover:bg-slate-800" : "cursor-not-allowed bg-slate-200 text-slate-500"}`,
                                        children: updatePasswordBusy ? "Updating..." : "Update Password"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 704,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 700,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true) : null
                ]
            }, void 0, true, {
                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                lineNumber: 439,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-wrap items-start justify-between gap-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "section-title text-2xl",
                                    children: "Invoice visibility"
                                }, void 0, false, {
                                    fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                    lineNumber: 723,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "mt-1 text-sm text-slate-500",
                                    children: "Choose what business/client details should appear on invoices across templates, view, print, and PDF."
                                }, void 0, false, {
                                    fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                    lineNumber: 724,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                            lineNumber: 722,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: ()=>router.push("/dashboard/settings/invoice-visibility"),
                            className: "w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto",
                            children: "Manage invoice visibility"
                        }, void 0, false, {
                            fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                            lineNumber: 728,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                    lineNumber: 721,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                lineNumber: 720,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid gap-6 xl:grid-cols-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "section-title text-2xl",
                                children: "Formatting"
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 740,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-sm text-slate-500",
                                children: "How date and amount information appears across the app."
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 741,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-6 space-y-5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mb-2 text-sm font-medium text-slate-900",
                                                children: "Date Format"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 745,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$SelectMenu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                value: draftDateFormat,
                                                onChange: setDraftDateFormat,
                                                options: [
                                                    {
                                                        value: "YYYY-MM-DD",
                                                        label: "YYYY-MM-DD"
                                                    },
                                                    {
                                                        value: "DD-MM-YYYY",
                                                        label: "DD-MM-YYYY"
                                                    },
                                                    {
                                                        value: "DD/MM/YYYY",
                                                        label: "DD/MM/YYYY"
                                                    },
                                                    {
                                                        value: "MM-DD-YYYY",
                                                        label: "MM-DD-YYYY"
                                                    }
                                                ]
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 746,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 744,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mb-2 text-sm font-medium text-slate-900",
                                                children: "Amount Format"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 759,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$SelectMenu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                value: draftAmountFormat,
                                                onChange: setDraftAmountFormat,
                                                options: [
                                                    {
                                                        value: "indian",
                                                        label: "Indian (1,23,456)"
                                                    },
                                                    {
                                                        value: "international",
                                                        label: "International (123,456)"
                                                    }
                                                ]
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 760,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 758,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mb-2 text-sm font-medium text-slate-900",
                                                children: "Decimal Setting"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 771,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$SelectMenu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                value: draftShowDecimals ? "yes" : "no",
                                                onChange: (v)=>setDraftShowDecimals(v === "yes"),
                                                options: [
                                                    {
                                                        value: "yes",
                                                        label: "Show Decimals (1,250.00)"
                                                    },
                                                    {
                                                        value: "no",
                                                        label: "Round Off (1,250)"
                                                    }
                                                ]
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 772,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 770,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 743,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                        lineNumber: 739,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "section-title text-2xl",
                                children: "Currency"
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 785,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-sm text-slate-500",
                                children: "Choose how currency appears on every invoice."
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 786,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-6 space-y-5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mb-2 text-sm font-medium text-slate-900",
                                                children: "Currency Symbol"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 790,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$SelectMenu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                value: draftCurrencySymbol,
                                                onChange: setDraftCurrencySymbol,
                                                options: [
                                                    {
                                                        value: "₹",
                                                        label: "₹ Indian Rupee"
                                                    },
                                                    {
                                                        value: "$",
                                                        label: "$ US Dollar"
                                                    },
                                                    {
                                                        value: "EUR",
                                                        label: "EUR Euro"
                                                    },
                                                    {
                                                        value: "GBP",
                                                        label: "GBP Pound"
                                                    }
                                                ]
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 791,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 789,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mb-2 text-sm font-medium text-slate-900",
                                                children: "Currency Position"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 804,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$SelectMenu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                value: draftCurrencyPosition,
                                                onChange: (v)=>setDraftCurrencyPosition(v),
                                                options: [
                                                    {
                                                        value: "before",
                                                        label: "₹ 1,250"
                                                    },
                                                    {
                                                        value: "after",
                                                        label: "1,250 ₹"
                                                    }
                                                ]
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                                lineNumber: 805,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 803,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 788,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                        lineNumber: 784,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                lineNumber: 738,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "section-title text-2xl",
                        children: "Invoice Numbering"
                    }, void 0, false, {
                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                        lineNumber: 819,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-1 text-sm text-slate-500",
                        children: "Define the structure of invoice numbers generated in your workspace."
                    }, void 0, false, {
                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                        lineNumber: 820,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-6 grid gap-5 md:grid-cols-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mb-2 text-sm font-medium text-slate-900",
                                        children: "Invoice Prefix"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 824,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        value: draftInvoicePrefix,
                                        onChange: (e)=>{
                                            setDraftInvoicePrefix(e.target.value);
                                            setPrefixErrorMessage("");
                                        },
                                        className: `${selectStyle} ${invoicePrefixError ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100" : ""}`
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 825,
                                        columnNumber: 13
                                    }, this),
                                    invoicePrefixError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-2 text-xs leading-5 text-rose-600",
                                        children: prefixErrorMessage || invoicePrefixError
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 834,
                                        columnNumber: 15
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-2 text-xs leading-5 text-slate-500",
                                        children: "Examples: INV-, DOC_, BILL(2026)-"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 838,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 823,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mb-2 text-sm font-medium text-slate-900",
                                        children: "Number Format"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 843,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$SelectMenu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        value: String(draftInvoicePadding),
                                        onChange: (v)=>setDraftInvoicePadding(Number(v)),
                                        options: [
                                            {
                                                value: "2",
                                                label: "01 (2 digits)"
                                            },
                                            {
                                                value: "3",
                                                label: "001 (3 digits)"
                                            },
                                            {
                                                value: "4",
                                                label: "0001 (4 digits)"
                                            },
                                            {
                                                value: "5",
                                                label: "00001 (5 digits)"
                                            }
                                        ]
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 844,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 842,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mb-2 text-sm font-medium text-slate-900",
                                        children: "Starting Number"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 857,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        min: 1,
                                        value: draftInvoiceStartNumber,
                                        onChange: (e)=>setDraftInvoiceStartNumber(Number(e.target.value)),
                                        className: selectStyle
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 858,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 856,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mb-2 text-sm font-medium text-slate-900",
                                        children: "Yearly Reset"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 868,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$SelectMenu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        value: draftResetYearly ? "yes" : "no",
                                        onChange: (v)=>setDraftResetYearly(v === "yes"),
                                        options: [
                                            {
                                                value: "yes",
                                                label: "Reset Every Financial Year"
                                            },
                                            {
                                                value: "no",
                                                label: "Continuous Numbering"
                                            }
                                        ]
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 869,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 867,
                                columnNumber: 11
                            }, this),
                            draftResetYearly ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "md:col-span-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mb-2 text-sm font-medium text-slate-900",
                                        children: "Reset Date"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 881,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$SelectMenu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        value: draftInvoiceResetMonthDay,
                                        onChange: setDraftInvoiceResetMonthDay,
                                        options: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoiceResetDate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RESET_MONTH_DAY_OPTIONS"]
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 882,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-2 text-xs leading-5 text-slate-500",
                                        children: [
                                            "Invoices dated on or after the 1st of ",
                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoiceResetDate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatResetMonthLabel"])(draftInvoiceResetMonthDay),
                                            " start again from your starting number."
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                        lineNumber: 887,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 880,
                                columnNumber: 13
                            }, this) : null
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                        lineNumber: 822,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs uppercase tracking-[0.28em] text-slate-400",
                                children: "Preview"
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 895,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-3 text-3xl font-semibold text-slate-950",
                                children: invoicePreview
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 896,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-2 text-sm text-slate-500",
                                children: "This is how the next generated invoice number will look with your current selections."
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 897,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                        lineNumber: 894,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                lineNumber: 818,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap items-start justify-between gap-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "section-title text-2xl",
                                    children: "Report bug and feedback"
                                }, void 0, false, {
                                    fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                    lineNumber: 906,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "mt-1 text-sm text-slate-500",
                                    children: "Share issues and ideas with full context so improvements can be shipped faster."
                                }, void 0, false, {
                                    fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                    lineNumber: 907,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                            lineNumber: 905,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                        lineNumber: 904,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-slate-500",
                                children: "Open the report page to submit complete bug or feedback details."
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 914,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>router.push("/dashboard/settings/report"),
                                className: "w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto",
                                children: "Report bug and feedback"
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 917,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                        lineNumber: 913,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                lineNumber: 903,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm font-semibold text-slate-900",
                                children: hasPendingChanges ? "Unsaved changes" : "All changes saved"
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 929,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-slate-500",
                                children: hasPendingChanges ? "Your invoice settings will apply only after you save." : saveMessage || "No pending updates right now."
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                                lineNumber: 930,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                        lineNumber: 928,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: saveChanges,
                        disabled: !hasPendingChanges,
                        className: `rounded-2xl px-5 py-3 text-sm font-semibold transition ${hasPendingChanges ? "bg-slate-950 text-white hover:bg-slate-800" : "bg-slate-200 text-slate-500"}`,
                        children: setupMode ? "Finish Setup" : "Save Changes"
                    }, void 0, false, {
                        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                        lineNumber: 935,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
                lineNumber: 927,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/(app)/dashboard/settings/SettingsClient.tsx",
        lineNumber: 420,
        columnNumber: 5
    }, this);
}
_s(SettingsClient, "8q2lOaP5hkcVMDEtc/hzbEk1pR0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$providers$2f$AppAlertProvider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppAlert"],
        __TURBOPACK__imported__module__$5b$project$5d2f$context$2f$SettingsContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["useSettings"]
    ];
});
_c = SettingsClient;
var _c;
__turbopack_context__.k.register(_c, "SettingsClient");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_e4567013._.js.map
export function parseStoredDate(dateString) {
    const value = String(dateString || "").trim();
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
    const candidate = new Date(year, month - 1, day);
    if (candidate.getFullYear() !== year ||
        candidate.getMonth() !== month - 1 ||
        candidate.getDate() !== day) {
        return null;
    }
    return { year, month, day };
}
export function getStoredDateParts(dateString) {
    return parseStoredDate(dateString);
}
export function storedDatePartsToDate(parts) {
    return new Date(parts.year, parts.month - 1, parts.day);
}
export function compareStoredDates(left, right) {
    const leftParts = parseStoredDate(left);
    const rightParts = parseStoredDate(right);
    if (!leftParts && !rightParts)
        return 0;
    if (!leftParts)
        return -1;
    if (!rightParts)
        return 1;
    if (leftParts.year !== rightParts.year)
        return leftParts.year - rightParts.year;
    if (leftParts.month !== rightParts.month)
        return leftParts.month - rightParts.month;
    return leftParts.day - rightParts.day;
}
export function formatDate(dateString, format) {
    if (!dateString)
        return "";
    const parts = parseStoredDate(dateString);
    if (!parts)
        return "";
    const day = String(parts.day).padStart(2, "0");
    const month = String(parts.month).padStart(2, "0");
    const year = parts.year;
    switch (format) {
        case "DD-MM-YYYY":
            return `${day}-${month}-${year}`;
        case "DD/MM/YYYY":
            return `${day}/${month}/${year}`;
        case "MM-DD-YYYY":
            return `${month}-${day}-${year}`;
        default:
            return `${year}-${month}-${day}`;
    }
}

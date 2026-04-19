export function parseConsumptionValue(rawValue) {
    const normalized = rawValue.trim().replace(",", ".");

    if (!normalized) {
        return { valid: false, reason: "empty" };
    }

    const value = Number(normalized);

    if (!Number.isFinite(value) || value <= 0) {
        return { valid: false, reason: "invalid" };
    }

    return { valid: true, value: value };
}
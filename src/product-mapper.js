export function normalizeUnitType(type) {
  return String(type ?? "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/–/g, "-");
}

export function getProductType(type) {
  const normalized = normalizeUnitType(type);

  if (!normalized) return "Other";

  if (normalized.startsWith("LTH")) return "Townhouse";
  if (normalized.startsWith("LVD")) return "Villa";
  if (normalized.startsWith("LV")) return "Villa";

  // Portofino BL rules
  if (normalized.startsWith("BL")) {
    if (normalized.includes("V")) return "Villa";
    return "Townhouse";
  }

  // Santorini legacy villa codes
  if (/^V\d+/.test(normalized)) return "Villa";

  return "Other";
}

export function getProductTypeRank(type) {
  const productType = getProductType(type);

  return {
    Townhouse: 1,
    Villa: 2,
    "Signature Villa": 3,
    Other: 4,
  }[productType] ?? 99;
}
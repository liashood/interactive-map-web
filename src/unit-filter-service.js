export function normalizeFilterValue(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function isAvailableForSale(unit) {
  return Boolean(unit);
}

const VILLA_BEDROOM_BY_CODE = {
  "LV-3": "6",
  "LV4": "6",
  "LV-3B": "5",
  "LV-3C": "5",
  "LVD-1B": "6",
  "LV-55K": "5",
  "55E": "5",
  "LV-1000K": "6",
  "1000E": "6",
  "3E": "6",
  "4E": "6",
  "LV-75K": "7",
  "75E": "7",
  "D1E": "7",
  "BL-VD1": "7",
};


export function getUnitBedroomCount(unit) {
  const directValue =
    unit?.bedrooms ||
    unit?.bedroomCount ||
    unit?.beds ||
    unit?.br;

  const directBedrooms = Number.parseInt(directValue, 10);

  if (Number.isFinite(directBedrooms)) return String(directBedrooms);

  const type = String(unit?.type || unit?.unitType || "").toUpperCase().trim();

  // Townhouse codes usually carry the bedroom count directly.
  // Examples: LTH - 3A - M, LTH - 4A - M, LTH - 5A - E
  const townhouseMatch = type.match(/^LTH\s*-\s*(3|4|5)[A-Z]?/);
  if (townhouseMatch) return townhouseMatch[1];

  // Portofino BL townhouse codes: BL - 3 - M, BL - 4 - M, BL - 5 - E
  // Do not treat BL - V01 / BL - V75 villa codes as bedroom counts.
  const blTownhouseMatch = type.match(/^BL\s*-\s*(3|4|5)\s*-/);
  if (blTownhouseMatch) return blTownhouseMatch[1];

    const normalizedType = type.replace(/\s+/g, "").replace(/–/g, "-");

  const mappedBedroomCount = VILLA_BEDROOM_BY_CODE[normalizedType];

  if (mappedBedroomCount) return mappedBedroomCount;

  return "";
}

export function getUnitProductCode(unit) {
  const rawType = String(unit?.type || unit?.unitType || "");
  const code = rawType.split("-")[0]?.trim().toUpperCase();

  return code || "";
}

export function getAvailableFilterOptions(units) {
  const bedrooms = new Set();
  const productCodes = new Set();

  (units || []).forEach((unit) => {
    const bedroom = getUnitBedroomCount(unit);
    const productCode = getUnitProductCode(unit);

    if (bedroom) bedrooms.add(bedroom);
    if (productCode) productCodes.add(productCode);
  });

  return {
    bedrooms: Array.from(bedrooms).sort((a, b) => Number(a) - Number(b)),
    productCodes: Array.from(productCodes).sort(),
  };
}

export function matchesUnitFilters(unit, filters = {}) {
  const availableForSaleOnly = filters.availableForSaleOnly === true;
  const bedroomFilter = filters.bedroomFilter || "all";
  const productCodeFilter = filters.productCodeFilter || "all";

  const availabilityMatches = !availableForSaleOnly || isAvailableForSale(unit);
  const bedroomMatches =
    bedroomFilter === "all" || getUnitBedroomCount(unit) === String(bedroomFilter);
  const productCodeMatches =
    productCodeFilter === "all" || getUnitProductCode(unit) === productCodeFilter;

  return availabilityMatches && bedroomMatches && productCodeMatches;
}

export function filterUnits(units, filters = {}) {
  return (units || []).filter((unit) => matchesUnitFilters(unit, filters));
}

export function hasActiveUnitFilters(filters = {}) {
  return (
    filters.availableForSaleOnly === true ||
    (filters.bedroomFilter || "all") !== "all" ||
    (filters.productCodeFilter || "all") !== "all"
  );
}

export function getFilteredSaleUnitsByCluster(units, clusterName, filters = {}) {
  const targetCluster = normalizeFilterValue(clusterName);

  return filterUnits(units, filters).filter((unit) => {
    return normalizeFilterValue(unit.cluster) === targetCluster;
  });
}
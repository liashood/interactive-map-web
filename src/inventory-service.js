function normalizeInventoryName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function findClusterInventory(inventoryItems, clusterName) {
  const normalizedName = normalizeInventoryName(clusterName);

  return (inventoryItems || []).find((item) => {
    const name = item.cluster || item.name || item.clusterName;
    return normalizeInventoryName(name) === normalizedName;
  });
}

export function getPrimaryCategory(inventory) {
  if (!inventory?.categories) return "Community";

  return Object.entries(inventory.categories)
    .sort(([, countA], [, countB]) => countB - countA)[0]?.[0] || "Community";
}

export function getBedroomLabel(inventory) {
  const counts = Object.keys(inventory?.bedrooms || {})
    .map((label) => Number.parseInt(label, 10))
    .filter(Number.isFinite);

  if (!counts.length) return "Mixed";
  if (counts.length === 1) return `${counts[0]} BR`;
  return `${Math.min(...counts)}-${Math.max(...counts)} BR`;
}

export function getTotalResidences(inventoryItems) {
  return (inventoryItems || []).reduce(
    (sum, item) => sum + (Number(item.totalUnits) || 0),
    0
  );
}
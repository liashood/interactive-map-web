import { getProductType } from "./product-mapper.js";
import { findClusterInventory } from "./inventory-service.js";

function normalizeSearchToken(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getSearchTokens(value) {
  return String(value ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(normalizeSearchToken);
}

export function matchesSearchValue(value, rawQuery) {
  const queryTokens = getSearchTokens(rawQuery);
  const valueTokens = getSearchTokens(value);

  if (!queryTokens.length) return true;
  if (!valueTokens.length) return false;

  let searchFromIndex = 0;

  return queryTokens.every((queryToken) => {
    const matchedIndex = valueTokens.findIndex((valueToken, index) => {
      return index >= searchFromIndex && valueToken.startsWith(queryToken);
    });

    if (matchedIndex === -1) return false;

    searchFromIndex = matchedIndex + 1;
    return true;
  });
}

export function getFilteredClusters({ clusters, inventoryItems, query, propertyFilter }) {
  const rawQuery = String(query || "").trim();

  return (clusters || []).filter((cluster) => {
    const inventory = findClusterInventory(inventoryItems, cluster.name);
    const typeCodes = Object.keys(inventory?.typeBreakdown || {});
    const productCategories = typeCodes.map((type) => getProductType(type));
    const bedrooms = Object.keys(inventory?.bedrooms || {}).map((bedroom) => `${bedroom} BR`);

    const hasPropertyType =
      propertyFilter === "all" || productCategories.includes(propertyFilter);

    if (!rawQuery) return hasPropertyType;

    return (
      hasPropertyType &&
      (matchesSearchValue(cluster.name, rawQuery) ||
        typeCodes.some((type) => matchesSearchValue(type, rawQuery)) ||
        productCategories.some((category) => matchesSearchValue(category, rawQuery)) ||
        bedrooms.some((bedroom) => matchesSearchValue(bedroom, rawQuery)))
    );
  });
}

export function getSearchSuggestions({ clusters, inventoryItems, query }) {
  const rawQuery = String(query || "").trim();

  if (!rawQuery) return [];

  const suggestions = [];

  (clusters || []).forEach((cluster) => {
    if (matchesSearchValue(cluster.name, rawQuery)) {
      suggestions.push({
        label: cluster.name,
        meta: "Community",
        value: cluster.name,
      });
    }

    const inventory = findClusterInventory(inventoryItems, cluster.name);

    Object.keys(inventory?.typeBreakdown || {}).forEach((type) => {
      if (matchesSearchValue(type, rawQuery)) {
        suggestions.push({
          label: type,
          meta: cluster.name,
          value: type,
        });
      }
    });
  });

  return Array.from(
    new Map(suggestions.map((item) => [`${item.label}-${item.meta}`, item])).values()
  ).slice(0, 8);
}
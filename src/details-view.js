import { getProductType } from "./product-mapper.js";
import { getBedroomLabel } from "./inventory-service.js";
import { matchesSearchValue } from "./search-service.js";

function escapeHtml(value) {
  const replacements = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return String(value ?? "").replace(/[&<>"']/g, (character) => replacements[character]);
}

export function renderDetailsContent({ cluster, inventory, availability, query, formatNumber }) {
  const categoryTotals = {};

  Object.entries(inventory?.typeBreakdown || {}).forEach(([type, count]) => {
    const productType = getProductType(type);
    categoryTotals[productType] = (categoryTotals[productType] || 0) + Number(count || 0);
  });

  const categoryEntries = Object.entries(categoryTotals).sort(([, countA], [, countB]) => countB - countA);

  const styleEntries = Object.entries(inventory?.typeBreakdown || {})
    .filter(([type]) => {
      if (!String(query || "").trim()) return true;
      return matchesSearchValue(type, query);
    })
    .sort(([, countA], [, countB]) => countB - countA);

    const saleUnits = availability?.sale || [];
const rentUnits = availability?.rent || [];
const salePrices = saleUnits
  .map((unit) => Number(unit.lowestSalesListingPrice))
  .filter((price) => Number.isFinite(price) && price > 0);

const lowestSalePrice = salePrices.length ? Math.min(...salePrices) : null;

const availabilityRows = [
  saleUnits.length ? ["Available for sale", `${formatNumber(saleUnits.length)} units`] : null,
  lowestSalePrice ? ["Lowest sale listing", `AED ${formatNumber(lowestSalePrice)}`] : null,
  rentUnits.length ? ["Available for rent", `${formatNumber(rentUnits.length)} units`] : null,
].filter(Boolean);

  const listRows = [
  ...availabilityRows,
  ...categoryEntries.map(([label, value]) => [label, `${formatNumber(value)} residences`]),
  ...styleEntries.map(([label, value]) => [label, formatNumber(value)]),
];

  return `
    <p class="details-kicker">Community ${escapeHtml(cluster.number)}</p>
    <h2 class="details-title">${escapeHtml(cluster.name)}</h2>
    <p class="details-description">${escapeHtml(cluster.description)}</p>

    <div class="details-highlight">
      <div class="highlight-cell">
        <strong>${escapeHtml(formatNumber(inventory?.totalUnits))}</strong>
        <span>Residences</span>
      </div>
      <div class="highlight-cell">
        <strong>${escapeHtml(Object.keys(inventory?.typeBreakdown || {}).length)}</strong>
        <span>Home types</span>
      </div>
      <div class="highlight-cell">
        <strong>${escapeHtml(getBedroomLabel(inventory))}</strong>
        <span>Bedroom mix</span>
      </div>
    </div>

    <div class="details-list">
      ${listRows
        .slice(0, 20)
        .map(
          ([label, value]) => `
            <div class="details-row">
              <span class="details-label">${escapeHtml(label)}</span>
              <span class="details-value">${escapeHtml(value)}</span>
            </div>
          `
        )
        .join("")}
    </div>

    <button class="details-action" id="details-reset-view" type="button">
      Return to full masterplan
    </button>
  `;
}
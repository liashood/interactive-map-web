import { getUnitBedroomCount, getUnitProductCode } from "./unit-filter-service.js";

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

function formatPrice(unit, formatNumber) {
  const price = Number(unit?.lowestSalesListingPrice);

  if (!Number.isFinite(price) || price <= 0) return "Price on request";

  return `AED ${formatNumber(price)}`;
}

function formatPlotSize(unit, formatNumber) {
  const plotSize = Number(unit?.plotSize);

  if (!Number.isFinite(plotSize) || plotSize <= 0) return "Plot size TBC";

  return `${formatNumber(plotSize)} sq ft`;
}

export function renderSaleUnitsContent({ cluster, saleUnits, formatNumber }) {
  const units = saleUnits || [];

  return `
    <p class="details-kicker">Available for sale</p>
    <h2 class="details-title">${escapeHtml(cluster.name)}</h2>
    <p class="details-description">
      ${escapeHtml(formatNumber(units.length))} available sale ${units.length === 1 ? "unit" : "units"} in this community.
    </p>

    <div class="sale-unit-list">
      ${units
        .map((unit) => {
          const bedrooms = getUnitBedroomCount(unit);
          const productCode = getUnitProductCode(unit);

          return `
            <article class="sale-unit-card">
              <div>
                <strong>${escapeHtml(unit.unit || "Unit")}</strong>
                <span>${escapeHtml(unit.type || productCode || "Sale unit")}</span>
              </div>
              <dl>
                ${bedrooms ? `<div><dt>Bedrooms</dt><dd>${escapeHtml(bedrooms)} BR</dd></div>` : ""}
                <div><dt>Plot</dt><dd>${escapeHtml(formatPlotSize(unit, formatNumber))}</dd></div>
                <div><dt>Price</dt><dd>${escapeHtml(formatPrice(unit, formatNumber))}</dd></div>
              </dl>
            </article>
          `;
        })
        .join("")}
    </div>

    <button class="details-action" id="details-reset-view" type="button">
      Return to full masterplan
    </button>
  `;
}
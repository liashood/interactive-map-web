import assert from "node:assert/strict";
import test from "node:test";

import {
  filterUnits,
  getAvailableFilterOptions,
  getFilteredSaleUnitsByCluster,
  getUnitBedroomCount,
  getUnitProductCode,
  hasActiveUnitFilters,
  isAvailableForSale,
} from "../src/unit-filter-service.js";

const units = [
  {
    unit: "A104",
    type: "LTH - 3A - M",
    cluster: "Santorini",
    lowestSalesListingPrice: 3200000,
  },
  {
    unit: "B201",
    type: "BL - V01",
    cluster: "Portofino",
  },
  {
    unit: "C301",
    type: "LVD - 1D",
    cluster: "Venice",
  },
  {
    unit: "D401",
    type: "75E",
    cluster: "Venice",
  },
  {
    unit: "E501",
    type: "LV - 55K",
    cluster: "Morocco",
  },
];

test("derives sale-unit filter values from current sale data fields", () => {
  assert.equal(isAvailableForSale(units[0]), true);
  assert.equal(getUnitBedroomCount(units[3]), "7");
  assert.equal(getUnitBedroomCount(units[4]), "5");
  assert.equal(getUnitBedroomCount(units[0]), "3");
  assert.equal(getUnitBedroomCount(units[1]), "");
  assert.equal(getUnitBedroomCount(units[2]), "");
  assert.equal(getUnitProductCode(units[0]), "LTH");
  assert.equal(getUnitProductCode(units[1]), "BL");
});

test("builds bedroom and product-code options from sale units", () => {
  assert.deepEqual(getAvailableFilterOptions(units), {
    bedrooms: ["3", "5", "7"],
    productCodes: ["75E", "BL", "LTH", "LV", "LVD"],
  });
});

test("filters units by available-for-sale flag, bedroom count, and product code", () => {
  assert.deepEqual(
    filterUnits(units, {
      availableForSaleOnly: true,
      bedroomFilter: "3",
      productCodeFilter: "LTH",
    }).map((unit) => unit.unit),
    ["A104"]
  );

  assert.deepEqual(
    filterUnits(units, {
      availableForSaleOnly: true,
      bedroomFilter: "all",
      productCodeFilter: "LVD",
    }).map((unit) => unit.unit),
    ["C301"]
  );
});

test("filters sale units by normalized community name", () => {
  assert.deepEqual(
    getFilteredSaleUnitsByCluster(units, "santorini", {
      availableForSaleOnly: true,
    }).map((unit) => unit.unit),
    ["A104"]
  );
});

test("detects when a unit filter is active", () => {
  assert.equal(hasActiveUnitFilters({ availableForSaleOnly: false }), false);
  assert.equal(hasActiveUnitFilters({ availableForSaleOnly: true }), true);
  assert.equal(hasActiveUnitFilters({ bedroomFilter: "3" }), true);
});
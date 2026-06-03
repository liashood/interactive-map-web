import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getProductType } from "../src/product-mapper.js";

describe("product mapper", () => {
  
  it("classifies LTH products as townhouses", () => {
    assert.equal(getProductType("LTH - 5A - E"), "Townhouse");
  });

  it("classifies LV and LVD products as villas", () => {
    assert.equal(getProductType("LV - 4E"), "Villa");
    assert.equal(getProductType("LVD - 1D"), "Villa");
  });

  it("classifies BL products without V as townhouses", () => {
    assert.equal(getProductType("BL - 3 - M"), "Townhouse");
    assert.equal(getProductType("BL - 4 - M"), "Townhouse");
  });

  it("classifies BL products containing V as villas", () => {
    assert.equal(getProductType("BL - V01"), "Villa");
    assert.equal(getProductType("BL - V75"), "Villa");
  });

  it("classifies legacy V-prefixed products as villas", () => {
    assert.equal(getProductType("V75"), "Villa");
  });
});
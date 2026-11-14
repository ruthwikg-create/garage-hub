(function () {
  "use strict";

  const MAX_QUANTITY = 99;
  const CATEGORY_CODES = Object.freeze({
    "Engine": "ENG",
    "Brakes": "BRK",
    "Exterior": "EXT",
    "Electrical": "ELE",
    "AC & Cabin": "CAB"
  });

  // Based only on the stable catalogue ID. Never use array indexes or random numbers:
  // filtering, sorting and page reloads must not change a part's SKU.
  function skuFor(part) {
    if (!part || typeof part.id !== "string" ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(part.id)) {
      throw new TypeError("Part ID must be a stable lowercase slug");
    }
    const code = CATEGORY_CODES[part.category] || "GEN";
    return "GH-" + code + "-" + part.id.toUpperCase();
  }

  function clampQuantity(value) {
    if (!Number.isSafeInteger(value)) return 1;
    return Math.min(MAX_QUANTITY, Math.max(1, value));
  }

  function changeQuantity(current, delta) {
    if (!Number.isSafeInteger(delta)) throw new TypeError("Invalid quantity change");
    return clampQuantity(clampQuantity(current) + delta);
  }

  function estimate(part, quantity) {
    if (!part || !Number.isSafeInteger(part.minPrice) ||
        !Number.isSafeInteger(part.maxPrice) || part.minPrice < 0 ||
        part.maxPrice < part.minPrice) {
      throw new TypeError("Invalid parts price");
    }
    const qty = clampQuantity(quantity);
    const min = part.minPrice * qty;
    const max = part.maxPrice * qty;
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)) {
      throw new RangeError("Estimated total exceeds the safe limit");
    }
    return { min, max };
  }

  const api = Object.freeze({ MAX_QUANTITY, skuFor, clampQuantity, changeQuantity, estimate });
  if (typeof window !== "undefined") window.GarageCatalogue = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();

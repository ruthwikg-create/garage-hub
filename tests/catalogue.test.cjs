const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const window = {};
const dataSource = fs.readFileSync("parts-data.js", "utf8");
vm.runInNewContext(dataSource, { window }, { timeout: 2000 });
const parts = window.GARAGE_PARTS;

test("catalogue contains the six requested car spare parts", () => {
  assert.equal(parts.length, 6);
  assert.deepEqual(
    [...parts.map(p => p.name)].sort(),
    [
      "Engine Oil Filter", "Engine Air Filter", "Front Brake Pads",
      "Windshield Wiper Blade", "Headlight Bulb", "Cabin AC Filter"
    ].sort()
  );
});

test("every part has unique id, reasonable estimated INR price and compatibility warning", () => {
  assert.equal(new Set(parts.map(p => p.id)).size, parts.length);
  for (const p of parts) {
    assert.match(p.id, /^[a-z0-9-]+$/);
    assert.ok(p.category.length > 0);
    assert.ok(Number.isSafeInteger(p.minPrice) && p.minPrice > 0);
    assert.ok(Number.isSafeInteger(p.maxPrice) && p.maxPrice >= p.minPrice);
    assert.ok(p.fitment.length > 12);
  }
});

test("every reference photo includes author, source filename and valid license URL", () => {
  for (const p of parts) {
    assert.match(p.imageFile, /\.(jpe?g|png)$/i);
    assert.ok(p.imageAuthor);
    assert.ok(p.imageLicense);
    assert.match(p.imageLicenseUrl, /^https:\/\//);
  }
});

test("catalogue markup has matching search, filter, grid and attribution elements", () => {
  const html = fs.readFileSync("index.html", "utf8");
  for (const id of ["partsGrid","categoryFilters","partSearch","sortBy","resultCount","emptyState","imageCredits"]) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  assert.match(html, /parts-data\.js/);
  assert.match(html, /app\.js/);
  assert.match(html, /styles\.css/);
});

const helpers = require("../catalogue-utils.js");

test("SKUs are deterministic, unique, readable and independent of sorting", () => {
  const skus = parts.map(helpers.skuFor);
  assert.equal(new Set(skus).size, parts.length);
  assert.deepEqual(parts.slice().reverse().map(helpers.skuFor), skus.slice().reverse());
  assert.equal(helpers.skuFor(parts[0]), "GH-ENG-OIL-FILTER");
  for (const sku of skus) assert.match(sku, /^GH-[A-Z]{3}-[A-Z0-9-]+$/);
  assert.throws(() => helpers.skuFor({ id: "../bad", category: "Engine" }), TypeError);
});

test("quantity controls clamp to 1–99 and totals use safe integer arithmetic", () => {
  assert.equal(helpers.clampQuantity(0), 1);
  assert.equal(helpers.clampQuantity(999), 99);
  assert.equal(helpers.clampQuantity(1.1), 1);
  assert.equal(helpers.changeQuantity(1, -1), 1);
  assert.equal(helpers.changeQuantity(99, 1), 99);
  assert.equal(helpers.changeQuantity(1, 1), 2);
  assert.deepEqual(helpers.estimate(parts[0], 2), { min: 200, max: 1000 });
  assert.deepEqual(helpers.estimate(parts[0], 999), { min: 9900, max: 49500 });
  assert.throws(() => helpers.estimate({ minPrice: -1, maxPrice: 10 }, 1), TypeError);
  assert.throws(() => helpers.changeQuantity(3, 1.5), TypeError);
});

test("quantity UI, estimate controls and restrictive CSP are present", () => {
  const html = fs.readFileSync("index.html", "utf8");
  for (const id of ["estimatePanel", "estimateItems", "estimateCount",
    "estimateTotal", "estimateNavCount", "clearEstimate", "selectionStatus"]) {
    assert.ok(html.includes('id="' + id + '"'));
  }
  assert.match(html, /catalogue-utils\.js/);
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /script-src 'self'/);
  assert.match(html, /object-src 'none'/);
  const app = fs.readFileSync("app.js", "utf8");
  assert.match(app, /changeQuantity/);
  assert.match(app, /renderEstimate/);
  assert.doesNotMatch(app, /innerHTML\s*=|eval\s*\(|new Function\s*\(/);
});

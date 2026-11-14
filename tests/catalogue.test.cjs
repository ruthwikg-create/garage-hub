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

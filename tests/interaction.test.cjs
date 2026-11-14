const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

class Element {
  constructor(tag = "div") {
    this.tagName = tag;
    this.className = "";
    this.children = [];
    this.listeners = {};
    this.attributes = {};
    this.textContent = "";
    this.style = {};
    this.value = "";
    this.disabled = false;
    this.hidden = false;
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  addEventListener(type, callback) { this.listeners[type] = callback; }
  setAttribute(key, value) { this.attributes[key] = value; }
  click() { assert.equal(this.disabled, false); assert.ok(this.listeners.click); this.listeners.click(); }
  focus() {}
}

function find(root, predicate) {
  if (predicate(root)) return root;
  for (const child of root.children || []) {
    const found = find(child, predicate);
    if (found) return found;
  }
  return null;
}
function setup() {
  const ids = {};
  for (const id of ["partsGrid", "categoryFilters", "partSearch", "sortBy",
    "resultCount", "emptyState", "imageCredits", "estimateItems", "estimateCount",
    "estimateTotal", "clearEstimate", "estimateNavCount", "selectionStatus",
    "clearFilters", "printButton"]) ids[id] = new Element();
  ids.sortBy.value = "featured";
  const document = {
    getElementById: id => ids[id],
    createElement: tag => new Element(tag),
    createTextNode: value => ({ textContent: value, children: [] })
  };
  const window = { print() {} };
  const sandbox = { document, window, Intl, encodeURIComponent };
  for (const path of ["parts-data.js", "catalogue-utils.js", "app.js"]) {
    vm.runInNewContext(fs.readFileSync(path, "utf8"), sandbox, { timeout: 1500 });
  }
  return ids;
}

test("clicking plus/minus updates quantity and estimate without going below 1", () => {
  const ids = setup();
  const card = ids.partsGrid.children[0];
  const qty = find(card, x => x.className === "quantity-value");
  const minus = find(card, x => x.attributes?.["aria-label"]?.startsWith("Decrease quantity"));
  const plus = find(card, x => x.attributes?.["aria-label"]?.startsWith("Increase quantity"));
  assert.equal(qty.textContent, "1");
  assert.equal(minus.disabled, true);
  plus.click();
  assert.equal(qty.textContent, "2");
  assert.equal(minus.disabled, false);
  assert.match(find(card, x => x.className === "part-quantity-total").textContent, /₹200/);
  minus.click();
  assert.equal(qty.textContent, "1");
  assert.equal(minus.disabled, true);
});

test("items can be added and removed, estimated INR totals recompute", () => {
  const ids = setup();
  const card = ids.partsGrid.children[0];
  find(card, x => x.className === "quantity-button" && x.textContent === "+").click();
  find(card, x => x.className === "add-estimate").click();
  assert.equal(ids.estimateCount.textContent, "2 items");
  assert.match(ids.estimateTotal.textContent, /₹200/);
  assert.match(ids.estimateTotal.textContent, /₹1,000/);
  assert.equal(ids.clearEstimate.disabled, false);
  assert.equal(ids.estimateItems.children.length, 1);
  find(ids.estimateItems.children[0], x => x.className === "estimate-remove").click();
  assert.equal(ids.estimateCount.textContent, "0 items");
  assert.equal(ids.clearEstimate.disabled, true);
});

test("SKU search works and quantities survive filter and sort rerenders", () => {
  const ids = setup();
  const card = ids.partsGrid.children[0];
  find(card, x => x.className === "quantity-button" && x.textContent === "+").click();
  ids.partSearch.value = "GH-ENG-OIL-FILTER";
  ids.partSearch.listeners.input();
  assert.equal(ids.partsGrid.children.length, 1);
  assert.equal(find(ids.partsGrid.children[0], x => x.className === "quantity-value").textContent, "2");
  ids.partSearch.value = "no match";
  ids.partSearch.listeners.input();
  assert.equal(ids.partsGrid.children.length, 0);
  assert.equal(ids.emptyState.hidden, false);
  ids.partSearch.value = "";
  ids.partSearch.listeners.input();
  assert.equal(find(ids.partsGrid.children[0], x => x.className === "quantity-value").textContent, "2");
});

test("quantity cannot exceed 99 including repeated adds", () => {
  const ids = setup();
  const card = ids.partsGrid.children[0];
  const plus = find(card, x => x.className === "quantity-button" && x.textContent === "+");
  const qty = find(card, x => x.className === "quantity-value");
  const add = find(card, x => x.className === "add-estimate");
  for (let i = 0; i < 110; i++) if (!plus.disabled) plus.click();
  assert.equal(qty.textContent, "99");
  assert.equal(plus.disabled, true);
  add.click();
  add.click();
  assert.equal(ids.estimateCount.textContent, "99 items");
  assert.match(ids.selectionStatus.textContent, /Maximum of 99/);
});

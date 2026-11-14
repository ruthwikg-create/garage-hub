(() => {
  "use strict";

  const tools = window.GarageCatalogue;
  const sourceParts = Array.isArray(window.GARAGE_PARTS) ? window.GARAGE_PARTS : [];
  const parts = sourceParts.filter(part => {
    try {
      tools.skuFor(part);
      tools.estimate(part, 1);
      return typeof part.name === "string" && typeof part.description === "string" &&
        typeof part.category === "string" && typeof part.fitment === "string" &&
        typeof part.imageFile === "string" && /\.(?:jpe?g|png)$/i.test(part.imageFile);
    } catch {
      return false;
    }
  });
  const skuSet = new Set();
  for (const part of parts) {
    const sku = tools.skuFor(part);
    if (skuSet.has(sku)) throw new Error("Duplicate part SKU: " + sku);
    skuSet.add(sku);
  }

  const grid = document.getElementById("partsGrid");
  const filters = document.getElementById("categoryFilters");
  const search = document.getElementById("partSearch");
  const sort = document.getElementById("sortBy");
  const count = document.getElementById("resultCount");
  const empty = document.getElementById("emptyState");
  const creditList = document.getElementById("imageCredits");
  const estimateItems = document.getElementById("estimateItems");
  const estimateCount = document.getElementById("estimateCount");
  const estimateTotal = document.getElementById("estimateTotal");
  const clearEstimate = document.getElementById("clearEstimate");
  const navCount = document.getElementById("estimateNavCount");
  const feedback = document.getElementById("selectionStatus");

  const currency = new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0
  });
  const selections = new Map(); // In-memory only: no credentials, payment or storage.
  const quantities = new Map();
  let activeCategory = "All";

  const categories = ["All", ...new Set(parts.map(part => part.category))];
  const fileUrl = file => "https://commons.wikimedia.org/wiki/Special:FilePath/" +
    encodeURIComponent(file) + "?width=640";
  const sourceUrl = file => "https://commons.wikimedia.org/wiki/File:" +
    encodeURIComponent(file.replaceAll(" ", "_"));
  const priceRange = result => currency.format(result.min) + "–" + currency.format(result.max);
  const make = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = String(value);
    return node;
  };

  function renderFilters() {
    filters.replaceChildren();
    categories.forEach(category => {
      const button = make("button", "filter-chip", category);
      button.type = "button";
      button.setAttribute("aria-pressed", String(category === activeCategory));
      button.addEventListener("click", () => {
        activeCategory = category;
        renderFilters();
        renderParts();
      });
      filters.append(button);
    });
  }

  function renderEstimate() {
    estimateItems.replaceChildren();
    let totalMin = 0;
    let totalMax = 0;
    let totalQuantity = 0;
    for (const part of parts) {
      const qty = selections.get(part.id);
      if (!qty) continue;
      const total = tools.estimate(part, qty);
      totalMin += total.min;
      totalMax += total.max;
      totalQuantity += qty;
      const item = make("div", "estimate-item");
      const title = make("div", "estimate-item-title");
      title.append(
        make("strong", "", part.name),
        make("span", "estimate-item-sku", tools.skuFor(part))
      );
      const cost = make("span", "estimate-item-price", qty + " × " + priceRange({
        min: part.minPrice, max: part.maxPrice
      }) + " = " + priceRange(total));
      const remove = make("button", "estimate-remove", "Remove");
      remove.type = "button";
      remove.setAttribute("aria-label", "Remove " + part.name + " from estimate");
      remove.addEventListener("click", () => {
        selections.delete(part.id);
        renderEstimate();
        feedback.textContent = part.name + " removed from estimate";
      });
      item.append(title, cost, remove);
      estimateItems.append(item);
    }

    if (totalQuantity === 0) {
      estimateItems.append(make("p", "estimate-empty",
        "No parts added yet. Choose a quantity and select “Add to estimate” on a part."));
    }
    estimateCount.textContent = totalQuantity + (totalQuantity === 1 ? " item" : " items");
    estimateTotal.textContent = totalQuantity ? priceRange({ min: totalMin, max: totalMax }) : "₹0";
    navCount.textContent = String(totalQuantity);
    clearEstimate.disabled = totalQuantity === 0;
  }

  function addPart(part) {
    const requested = quantities.get(part.id) || 1;
    const current = selections.get(part.id) || 0;
    const allowed = tools.MAX_QUANTITY - current;
    if (allowed <= 0) {
      feedback.textContent = "Maximum of " + tools.MAX_QUANTITY +
        " units already selected for " + part.name;
      return;
    }
    const added = Math.min(requested, allowed);
    selections.set(part.id, current + added);
    renderEstimate();
    feedback.textContent = "Added " + added + " " + part.name +
      (added === requested ? " to your estimate" : "; the 99-unit limit was reached");
  }

  function createCard(part, index) {
    const card = make("article", "part-card");
    card.style.animationDelay = Math.min(index * 50, 300) + "ms";

    const media = make("div", "part-media");
    const picture = document.createElement("img");
    picture.loading = "lazy";
    picture.decoding = "async";
    picture.referrerPolicy = "no-referrer";
    picture.src = fileUrl(part.imageFile);
    picture.alt = "Reference photo of " + part.name.toLowerCase();
    const fallback = make("div", "image-fallback");
    fallback.setAttribute("aria-hidden", "true");
    fallback.append(make("span", "", "◈"), make("div", "", "Photo temporarily unavailable"));
    picture.addEventListener("error", () => {
      picture.hidden = true;
      fallback.style.display = "flex";
    }, { once: true });
    media.append(picture, fallback, make("span", "part-picture-label", "REFERENCE PHOTO"));

    const body = make("div", "part-body");
    const meta = make("div", "part-meta");
    meta.append(
      make("span", "part-category", part.category),
      make("code", "part-sku", tools.skuFor(part))
    );
    body.append(meta);
    body.append(make("h3", "part-title", part.name));
    body.append(make("p", "part-description", part.description));
    body.append(make("div", "part-divider"));

    const footer = make("div", "part-footer");
    const price = make("div");
    price.append(make("span", "price-label", "Estimated parts price"));
    price.append(make("span", "price-value", priceRange({
      min: part.minPrice, max: part.maxPrice
    })));
    price.append(make("span", "price-unit", "per " + part.unit));
    const detailButton = make("button", "part-detail", "View details +");
    detailButton.type = "button";
    detailButton.setAttribute("aria-expanded", "false");
    const detailId = "detail-" + part.id;
    detailButton.setAttribute("aria-controls", detailId);
    footer.append(price, detailButton);
    body.append(footer);

    const actions = make("div", "part-actions");
    const chooser = make("div", "quantity-stepper");
    chooser.setAttribute("role", "group");
    chooser.setAttribute("aria-label", "Quantity for " + part.name);
    const minus = make("button", "quantity-button", "−");
    minus.type = "button";
    minus.setAttribute("aria-label", "Decrease quantity of " + part.name);
    const quantity = make("output", "quantity-value");
    quantity.setAttribute("aria-label", "Selected quantity");
    const plus = make("button", "quantity-button", "+");
    plus.type = "button";
    plus.setAttribute("aria-label", "Increase quantity of " + part.name);
    const add = make("button", "add-estimate", "Add to estimate");
    add.type = "button";
    chooser.append(minus, quantity, plus);
    actions.append(chooser, add);
    const subtotal = make("p", "part-quantity-total");
    body.append(actions, subtotal);

    function updateDisplayedQuantity() {
      const qty = quantities.get(part.id) || 1;
      quantity.textContent = String(qty);
      minus.disabled = qty <= 1;
      plus.disabled = qty >= tools.MAX_QUANTITY;
      subtotal.textContent = "Selected " + qty + " ×: " +
        priceRange(tools.estimate(part, qty));
    }
    minus.addEventListener("click", () => {
      quantities.set(part.id, tools.changeQuantity(quantities.get(part.id) || 1, -1));
      updateDisplayedQuantity();
    });
    plus.addEventListener("click", () => {
      quantities.set(part.id, tools.changeQuantity(quantities.get(part.id) || 1, 1));
      updateDisplayedQuantity();
    });
    add.addEventListener("click", () => addPart(part));
    updateDisplayedQuantity();

    const details = make("div", "part-more");
    details.id = detailId;
    details.hidden = true;
    details.append(make("strong", "", "Compatibility check"));
    details.append(make("p", "", part.fitment));
    const credit = make("a", "", "Photo & licence information ↗");
    credit.href = sourceUrl(part.imageFile);
    credit.target = "_blank";
    credit.rel = "noopener noreferrer";
    details.append(credit);
    detailButton.addEventListener("click", () => {
      details.hidden = !details.hidden;
      const expanded = !details.hidden;
      detailButton.setAttribute("aria-expanded", String(expanded));
      detailButton.textContent = expanded ? "Hide details −" : "View details +";
    });
    body.append(details);
    card.append(media, body);
    return card;
  }

  function renderParts() {
    const term = search.value.toLocaleLowerCase("en-IN").trim();
    const visible = parts.filter(part => {
      const matchesCategory = activeCategory === "All" || part.category === activeCategory;
      const searchable = (part.name + " " + part.category + " " + part.description +
        " " + tools.skuFor(part)).toLocaleLowerCase("en-IN");
      return matchesCategory && searchable.includes(term);
    });
    switch (sort.value) {
      case "priceLow": visible.sort((a, b) => a.minPrice - b.minPrice); break;
      case "priceHigh": visible.sort((a, b) => b.minPrice - a.minPrice); break;
      case "name": visible.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    const cards = visible.map((part, i) => createCard(part, i));
    grid.replaceChildren(...cards);
    count.textContent = "Showing " + visible.length + " of " + parts.length + " parts";
    empty.hidden = visible.length !== 0;
  }

  function renderCredits() {
    creditList.replaceChildren();
    parts.forEach(part => {
      const item = make("li");
      const source = make("a", "", part.name + " photo");
      source.href = sourceUrl(part.imageFile);
      source.target = "_blank";
      source.rel = "noopener noreferrer";
      item.append(source);
      if (/^https:\/\/creativecommons\.org\//.test(part.imageLicenseUrl)) {
        const licence = make("a", "", part.imageLicense);
        licence.href = part.imageLicenseUrl;
        licence.target = "_blank";
        licence.rel = "noopener noreferrer";
        item.append(document.createTextNode(" by " + part.imageAuthor + ", "), licence);
      }
      creditList.append(item);
    });
  }

  search.addEventListener("input", renderParts);
  sort.addEventListener("change", renderParts);
  document.getElementById("clearFilters").addEventListener("click", () => {
    search.value = "";
    sort.value = "featured";
    activeCategory = "All";
    renderFilters();
    renderParts();
    search.focus();
  });
  clearEstimate.addEventListener("click", () => {
    selections.clear();
    renderEstimate();
    feedback.textContent = "Estimate cleared";
  });
  document.getElementById("printButton").addEventListener("click", () => window.print());

  renderFilters();
  renderParts();
  renderEstimate();
  renderCredits();
})();

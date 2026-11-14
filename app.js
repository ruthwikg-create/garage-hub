(() => {
  "use strict";
  const parts = Array.isArray(window.GARAGE_PARTS) ? window.GARAGE_PARTS : [];
  const grid = document.getElementById("partsGrid");
  const filters = document.getElementById("categoryFilters");
  const search = document.getElementById("partSearch");
  const sort = document.getElementById("sortBy");
  const count = document.getElementById("resultCount");
  const empty = document.getElementById("emptyState");
  const creditList = document.getElementById("imageCredits");
  const currency = new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0
  });
  let activeCategory = "All";

  const categories = ["All", ...new Set(parts.map(part => part.category))];
  const fileUrl = file => "https://commons.wikimedia.org/wiki/Special:FilePath/" +
    encodeURIComponent(file) + "?width=640";
  const sourceUrl = file => "https://commons.wikimedia.org/wiki/File:" +
    encodeURIComponent(file.replaceAll(" ", "_"));
  const make = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
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

  function createCard(part, index) {
    const card = make("article", "part-card");
    card.style.animationDelay = Math.min(index * 50, 300) + "ms";
    const media = make("div", "part-media");
    const picture = document.createElement("img");
    picture.loading = "lazy";
    picture.decoding = "async";
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
    body.append(make("span", "part-category", part.category));
    body.append(make("h3", "part-title", part.name));
    body.append(make("p", "part-description", part.description));
    body.append(make("div", "part-divider"));
    const footer = make("div", "part-footer");
    const price = make("div");
    price.append(make("span", "price-label", "Estimated parts price"));
    price.append(make("span", "price-value",
      currency.format(part.minPrice) + "–" + currency.format(part.maxPrice)));
    price.append(make("span", "price-unit", "per " + part.unit));
    const detailButton = make("button", "part-detail", "View details +");
    detailButton.type = "button";
    detailButton.setAttribute("aria-expanded", "false");
    const detailId = "detail-" + part.id;
    detailButton.setAttribute("aria-controls", detailId);
    footer.append(price, detailButton);
    body.append(footer);

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
      const searchable = (part.name + " " + part.category + " " + part.description)
        .toLocaleLowerCase("en-IN");
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
      const licence = make("a", "", part.imageLicense);
      licence.href = part.imageLicenseUrl;
      licence.target = "_blank";
      licence.rel = "noopener noreferrer";
      item.append(source, document.createTextNode(" by " + part.imageAuthor + ", "), licence);
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
  document.getElementById("printButton").addEventListener("click", () => window.print());

  renderFilters();
  renderParts();
  renderCredits();
})();

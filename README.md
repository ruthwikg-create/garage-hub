# Garage Hub

Garage Hub's **car spare-parts catalogue** displays representative images, part names, approximate Indian Rupee prices, and categories.

> Note: The GitHub repository was empty when this catalogue was introduced. This is a self-contained starter interface, not yet merged into the full application from the separate ZIP backup.

## Features

- Six common car spare parts with real representative Wikimedia Commons photos
- Estimated price ranges in INR (not live quotes, no installation costs)
- Automatically generated, stable GH-category-part SKUs (catalogue reference IDs, not OEM part numbers)
- Accessible − 1 + quantity selectors (range 1–99) that retain values across search and sorting
- Add/remove parts in an in-memory estimate list with quantity-based INR price ranges
- Category filters, SKU/name search, sort, responsive product cards, image attribution
- Client-side safe DOM construction, restrictive CSP, no third-party scripts, no checkout or sensitive-data collection
- Works as a static website without dependencies

## Run

Open `index.html` in a browser. If deploying to GitHub Pages, publish from the repository root. No `npm install` is needed for the standalone catalogue.

## Data disclaimer

Prices are illustrative ranges for general aftermarket/service replacement parts in India. Confirm the vehicle make, model, year, engine and OEM part number before purchasing.

## Source code

- `index.html`: Accessible markup and page structure
- `styles.css`: Responsive style and animations
- `parts-data.js`: Parts, estimates, photo credits
- `catalogue-utils.js`: Deterministic SKUs, validated quantities and pricing helpers
- `app.js`: Catalogue browsing, quantity controls and estimate list

Photos are credited to their individual Wikimedia Commons authors in the page's image credits section. They are examples of spare-part types, not guaranteed compatible products or seller listings.

## Security and scope

This is a static example catalogue. Item quantities and estimates are calculated only in the browser and are **not** a purchase, supplier quotation, payment, order, or stock reservation. No user account, server-side authorization, transaction processing, database, or persistent inventory exists here. The site uses a restrictive Content Security Policy (CSP), safe text-node DOM updates, no third-party JavaScript, and bounded arithmetic. For an eventual real garage-management backend, enforce SKU uniqueness, prices, quantities, inventory, access control and payment totals again on the server.

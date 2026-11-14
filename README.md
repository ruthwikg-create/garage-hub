# Garage Hub

Garage Hub's **car spare-parts catalogue** displays representative images, part names, approximate Indian Rupee prices, and categories.

> Note: The GitHub repository was empty when this catalogue was introduced. This is a self-contained starter interface, not yet merged into the full application from the separate ZIP backup.

## Features

- Six common car spare parts with real representative Wikimedia Commons photos
- Estimated price ranges in INR (not live quotes, no installation costs)
- Category filters, search, sort, responsive product cards, image attribution
- Works as a static website without dependencies

## Run

Open `index.html` in a browser. If deploying to GitHub Pages, publish from the repository root. No `npm install` is needed for the standalone catalogue.

## Data disclaimer

Prices are illustrative ranges for general aftermarket/service replacement parts in India. Confirm the vehicle make, model, year, engine and OEM part number before purchasing.

## Source code

- `index.html`: Accessible markup and page structure
- `styles.css`: Responsive style and animations
- `parts-data.js`: Parts, estimates, photo credits
- `app.js`: Catalogue filtering, searching and sorting

Photos are credited to their individual Wikimedia Commons authors in the page's image credits section. They are examples of spare-part types, not guaranteed compatible products or seller listings.

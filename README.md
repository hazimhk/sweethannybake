# Sushi? Mochi? Calculator for Swee Hanny Bake 🍡

Simple web app for calculating mochi dough batches (`adunan`) based on order size and optional piece size.

This project is a **mobile-first, glassmorphism, multi-step wizard** interface with card-based input and easy order-to-cost conversion.

## ✨ Features

- **Mobile-first multi-step wizard**
  1. **Order**: Add different order lines by piece weight (contoh: 100 pcs × 30g, 100 pcs × 20g, etc.).
  2. **Harga**: Set ingredient unit prices.
  3. **Ringkasan**: See total order, dough requirement, recommended dough batches and ingredient costs.

- **No tables** in UI (card-first layout)
- **Logo integration** from project asset (`logo.jpeg`)
- **Dark glass UI** for a modern look on mobile and desktop
- **Auto calculations**
  - Total grams needed
  - Dough count (`adunan`) required (rounded up)
  - Ingredient quantity per batch set
  - Total estimated cost

## 🧮 Formula

### Base dough (1 adunan)

- Tepung pulut: `130g`
- Tepung jagung: `8g`
- Tepung susu: `30g`
- Air: `180g`
- Garam: `1 secubit`
- Minyak jagung: `2 sudu`

Total: `370g` per adunan

### Core calculations

Given all order lines:

- `total_dough_needed = Σ (pieces × grams_per_piece)`
- `adunan_exact = total_dough_needed / 370`
- `adunan_recommended = ceil(adunan_exact)`

## 💰 Cost model

Harga setiap bahan boleh diubah pada langkah **Harga**.

Each ingredient has a unit basis:

- `per100g` for flours and water (`RM / 100g`)
- `perUnit` for garam/secubit and minyak/sudu (`RM / unit`)

Cost per ingredient:

- `cost = (required_amount / 100) * unit_price` (for `per100g`)
- `cost = required_amount * unit_price` (for `perUnit`)

`total_cost = Σ cost`

## 🚀 Run locally

Just open `index.html` in browser:

1. Double click `index.html`, or
2. Serve with any static file server.

Example:

```bash
python3 -m http.server
```

Then open: `http://localhost:8000`

## 📥 Save Orders To Google Sheets

This project can save customer checkout orders into a Google Sheet through Google Apps Script.
The free payment flow uses a static QR image and manual payment verification.

Setup:

1. Open [Google Apps Script](https://script.google.com/).
2. Create a new project.
3. Paste the code from `google-apps-script.js`.
4. Run the `setup()` function once and approve Google permissions.
   This also installs the receipt trigger.
5. Deploy the project:
   - Click **Deploy** → **New deployment**
   - Select **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the Web App URL.
7. Open `index.html` and set:

```js
const GOOGLE_SCRIPT_URL = "YOUR_WEB_APP_URL_HERE";
```

Orders will be saved into a Google Sheet named:

```text
Swee Hanny Bake Orders
```

The sheet will contain:

- `Orders`
- `Order Items`

### Static QR Payment

Upload your payment QR image to the project root as:

```text
payment-qr.jpeg
```

Customer flow:

- Customer selects mochi.
- Customer opens checkout.
- Customer scans your static QR and pays manually.
- Customer submits the order.
- Order is saved with `Payment Status = Pending Payment`.

Owner flow:

- Open the Google Sheet.
- Verify payment in your bank/e-wallet account.
- Change the order's `Payment Status` cell to `Paid`.
- Apps Script will update `Order Status` to `Paid`.
- If the customer provided email, Apps Script sends a receipt email.
- The Sheet also contains a `WhatsApp Receipt Link` for manual receipt sending.

Important limitation:

- Static QR payment cannot be verified automatically for free.
- WhatsApp cannot be sent automatically for free without WhatsApp Business API.

## 📁 Project files

- `index.html` — App UI and all logic
- `logo.jpeg` — Branding image used in app header
- `google-apps-script.js` — Google Apps Script backend for saving orders to Google Sheets
- `README.md` — Documentation

## 📌 Notes

- Default prices are dummy values for Malaysian market estimates.
- You can edit prices in step 2 (Harga) to match your current supplier rates.

## 🔒 GitHub

The project is available at:

- https://github.com/hazimhk/sweethannybake

## ✅ Next improvements (optional)

- Save progress in `localStorage`
- Add shareable order link
- Export summary to CSV/WhatsApp format
- Add edit-lock/restrictions per step for stronger UX

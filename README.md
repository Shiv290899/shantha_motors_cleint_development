# Shantha Motors

[![Netlify Status](https://api.netlify.com/api/v1/badges/7f8f4458-fa90-4558-90d2-66c8159b9c24/deploy-status)](https://app.netlify.com/projects/shanthamotors/deploys)

## WhatsApp Business – Send From Standard Number

Quotations and Job Cards now attempt to send messages via the WhatsApp Business Cloud API, so messages originate from the company’s standard WhatsApp Business number. If the API is not configured or fails, the app falls back to opening the device’s WhatsApp (wa.me) or SMS.

Server setup (server/.env):
- `WHATSAPP_ACCESS_TOKEN` – Permanent token from Meta
- `WHATSAPP_PHONE_NUMBER_ID` – Phone number ID from Meta
- `WHATSAPP_DEFAULT_CC` – Default country code (e.g. 91)

API route:
- `POST /api/whatsapp/send` { to, text }

Client uses this route automatically in Job Card and Quotation flows.

Note: Mobile apps do not allow choosing the sender account from the browser. Using the Business API is the reliable way to ensure messages are sent from the official number.

## Booking Form → Google Sheet

The booking form can save submissions into a Google Sheet via a linked Google Form (no credentials required).

Steps:
- Create a Google Form whose response destination is your target Google Sheet.
- For each question, copy its `entry.<id>` identifier (inspect the HTML or use prefill links) and set them as Vite env vars.

Client env (vite):
- `VITE_BOOKING_GFORM_ID` – The Google Form ID (between `/d/e/` and `/viewform`).
- Field mappings (set only those you added in the form):
  - `VITE_BOOKING_ENTRY_CUSTOMER_NAME`
  - `VITE_BOOKING_ENTRY_MOBILE`
  - `VITE_BOOKING_ENTRY_COMPANY`
  - `VITE_BOOKING_ENTRY_MODEL`
  - `VITE_BOOKING_ENTRY_VARIANT`
  - `VITE_BOOKING_ENTRY_ONROAD`
  - `VITE_BOOKING_ENTRY_ADDRESS`
  - `VITE_BOOKING_ENTRY_RTO`
  - `VITE_BOOKING_ENTRY_PURCHASE_TYPE`
  - `VITE_BOOKING_ENTRY_FINANCIER`
  - `VITE_BOOKING_ENTRY_EXECUTIVE`
  - `VITE_BOOKING_ENTRY_BRANCH`
  - `VITE_BOOKING_ENTRY_ONLINE_METHOD`
  - `VITE_BOOKING_ENTRY_UTR`
  - `VITE_BOOKING_ENTRY_ONLINE_BANK`
  - `VITE_BOOKING_ENTRY_ONLINE_DATE`
  - `VITE_BOOKING_ENTRY_CARD_TYPE`
  - `VITE_BOOKING_ENTRY_CARD_BANK`
  - `VITE_BOOKING_ENTRY_CARD_LAST4`
  - `VITE_BOOKING_ENTRY_POS_TXN`
  - `VITE_BOOKING_ENTRY_CARD_DATE`
  - `VITE_BOOKING_ENTRY_PAYLOAD` (optional free-text/paragraph item to store JSON payload)

Server route:
- `POST /api/forms/booking` – used by the client to submit entries to the Google Form.

Notes:
- File uploads in the booking form are not sent to Google Forms (Forms file upload requires Google Workspace auth). They are only used locally in the UI. If you need to store files, integrate a storage service and add server-side upload handling.

## Stock Movements → MongoDB

Bike stock movements (Transfer / Return / Invoice) are stored in MongoDB and filtered per staff branch (Source branch). No Google Sheets is required for stocks.

What you get:
- Stock page at `/stock` with fields: Chassis No (manual), Company / Model / Variant / Color (from vehicle catalog CSV), Action (Transfer / Return / Invoice) with dynamic fields, optional Notes.
- For staff/mechanic/employees, Source Branch is auto‑locked to their own branch. Admin/owner can view all or switch to source/target filters.

Server API:
- `GET /api/stocks?branch=Name&mode=source|target|any` – list movements (staff default: source)
- `POST /api/stocks` – create movement (locks Source Branch to staff’s branch on the server)
- `PATCH /api/stocks/:movementId` – update movement by ID

Vehicle catalog (for Company/Model/Variant/Color dropdowns):
- Set `VITE_VEHICLE_SHEET_CSV_URL` to a published CSV (or keep the default sample). This affects only dropdowns, not storage.

## Users (CRUD) – Admin UI and Public List

- Admin-only API routes (default):
  - `GET /api/users` – list with filters `q, role, status, branch`
  - `PUT /api/users/:id` – update (no password by default)
  - `DELETE /api/users/:id` – delete
- Public read-only route:
  - `GET /api/users/public` – same filters, no auth. Password/reset fields are never returned.
- Optional override: set `USER_CRUD_OPEN=true` in `server/.env` to allow non-admin roles to edit/delete (use with caution).


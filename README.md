# CE RMS Battery Usage GUI V1.6 — LIVE

## Purpose

V1.6 is the live Battery Usage page connected to the existing CE RMS Supabase RPC.

The GUI architecture remains modular. The key V1.6 change is a dedicated, explicit API-to-GUI mapping layer so the page is no longer dependent on the raw Supabase JSON field names or positional array structures.

## Backend

- Supabase: `https://aynbticohhzgktonsxud.supabase.co`
- RPC: `POST /rest/v1/rpc/get_battery_usage_stretches`
- SQL API version consumed: V3.1
- Default test period: 1 July 2026 through 31 July 2026 inclusive
- Default site: All Sites

## API -> GUI mapping

`js/services/batteryUsageMapper.js` explicitly maps every field returned by the V3.1 management response:

- `api_version` -> `apiVersion`
- `calculation` -> `calculation`
- `filters.site_id/start_utc/end_utc` -> `filters.siteId/startUtc/endUtc`
- all `grand_total` fields -> `grandTotal`
- all `site_summary` fields -> `sites`
- `duration_slabs` -> named `slab`, `startHours`, `endHours`, `partial`, `full` objects
- all `data_quality` fields -> named quality objects

The raw API response is also retained as `rawApi` for diagnostics.

## Frontend-only presentation metrics

The cycle table uses the existing dashboard presentation basis:

- SLA energy basis: 32 kWh
- SLA target: 1.60 cycles/site/day
- Achieved cycles/day = site battery energy / 32 / reporting days
- Excess/(Deficit) = Achieved - 1.60

These are presentation metrics; Battery Usage business logic remains in PostgreSQL.

## Temperature

The current Battery Usage RPC does not return temperature data. V1.6 therefore keeps the existing dummy temperature placeholder in the mapping layer. This is clearly isolated and can be replaced when the Temperature API is implemented.

## Run

Serve this folder through a local HTTP server. Do not open `index.html` directly using `file://` because ES modules and fetch require an HTTP origin in normal browser security contexts.

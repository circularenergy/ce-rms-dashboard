# CE RMS Management Dashboard V1.7

V1.7 preserves the working V1.6 Battery Usage page and adds a new **Uptime & Backup SLA** page in the same application shell.

## Pages
- Battery Usage — existing V1.6 implementation preserved.
- Uptime & Backup SLA — new V1.7 page combining Uptime/SLA, Battery Usage, Battery SLA Cycle Tracking and temporary BMS placeholder sections.

## APIs
- `/rest/v1/rpc/get_battery_usage_stretches`
- `/rest/v1/rpc/get_rms_uptime_sla`

## Important
The Uptime/SLA and Battery Usage business calculations remain authoritative in Supabase/PostgreSQL. The frontend only retrieves, maps and presents API output.

Temperature, SOC trend and SOH trend sections are placeholders until the required DB fields and formulas are supplied and validated.

Never place service-role keys or database passwords in frontend code.


## V2.0 (2026-10-12) — Executive Summary and Energy Analysis
- Baseline: CE_RMS_Battery_Usage_GUI_V1.8.zip. Existing Battery Usage and Uptime SLA components and services preserved byte-for-byte.
- New: Executive Summary and Energy Analysis pages, Energy V1.22 and Load Profile V1.0 RPC integration, 12 monthly requests, site/date filters and navigation shortcuts.
- V2.0 changes in existing files: index.html (navigation/version/cache), js/app.js (shared navigation/request routing only), css/app.css (new v2-prefixed styles appended). No legacy page/service files modified.
- Energy V1.22 has no site parameter; all-site result is filtered by site in frontend.
- Load profile shows 12 complete calendar months ending in the month of the selected End Date. These months are deliberately independent of the selected main date-range length.
- Unavailable BMS data is N/A; unfinished management status/alerts are Under Development.
- KPI aggregation: additive per-day energy and runtime across selected sites; solar share from summed numerator and denominator; portfolio CE SLA and site uptime displayed as unweighted site averages and labeled accordingly.
- Browser live data requires network access to configured Supabase instance; no live network test was possible during packaging.


## V2.1 — Energy Analysis presentation update (2026-10-12)
- All five Energy Analysis charts now have explicit axes, numeric tick labels, data labels and mockup-aligned legends.
- Solar Performance: green percentage bars with left 0–100% efficiency axis; red PSH line with separate right PSH axis; two-line solar kWh/site x-axis.
- Energy Source Profile: 100% stacked DG/Grid and solar bars, segment percentages, two-line total energy kWh/site x-axis.
- Battery Run Hours & Cycles: dual-axis combination chart.
- Existing API calculations, site/calendar filters, other pages and service files unchanged.

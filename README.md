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
